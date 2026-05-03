import { getPool } from "../config/db.js";
import { dbStore } from "../models/dbStore.js";
import { AppError } from "../utils/appError.js";
import { paymentService } from "./paymentService.js";

const FREE_DELIVERY_THRESHOLD = 60;
const DEFAULT_DELIVERY_FEE = 4.9;
const ESTIMATED_DELIVERY_DAYS = 3;
const STATUS_PENDING = 1;
const STATUS_DELIVERED = 2;
const STATUS_CANCELLED = 4;
const PAYMENT_METHOD_IDS = {
  card: 1,
  paypal: 4
};

const createInClause = (items) => items.map(() => "?").join(", ");

const calculateDeliveryFee = (subtotal) =>
  Number(subtotal) >= FREE_DELIVERY_THRESHOLD ? 0 : DEFAULT_DELIVERY_FEE;

const parseJsonColumn = (value, fallback) => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    return JSON.parse(value);
  }

  if (typeof value === "object") {
    return value;
  }

  return fallback;
};

const normalizeCartItems = (items) => {
  const aggregated = new Map();

  for (const item of items) {
    const key = Number(item.productId);
    const quantity = Number(item.quantity || 0);

    if (!key || quantity <= 0) {
      continue;
    }

    aggregated.set(key, (aggregated.get(key) || 0) + quantity);
  }

  return Array.from(aggregated.entries()).map(([productId, quantity]) => ({
    productId,
    quantity
  }));
};

const buildOrderPreview = ({ sessionId, items, subtotal, deliveryFee, total, payment }) => ({
  checkoutSessionId: sessionId,
  items,
  subtotal,
  deliveryFee,
  total,
  payment
});

const loadCheckoutProducts = async (items) => {
  const products = await Promise.all(items.map((item) => dbStore.getProductById(item.productId)));
  return new Map(products.map((product) => [Number(product.id), product]));
};

const withStockMessage = (productName) =>
  `Sem stock suficiente para "${productName}". Ajuste a quantidade antes de concluir a compra.`;

const refundCompletedPayment = async ({ paymentProvider, paymentReference, amount, currency, reason }) => {
  if (!paymentReference) {
    return null;
  }

  if (paymentProvider === "stripe") {
    return paymentService.refundCardPayment({
      paymentIntentId: paymentReference,
      amount,
      reason
    });
  }

  if (paymentProvider === "paypal") {
    return paymentService.refundPayPalCapture({
      captureId: paymentReference,
      amount,
      currency,
      reason
    });
  }

  return null;
};

const finalizeOrderFromSession = async ({
  sessionId,
  customerId,
  paymentProvider,
  paymentReference,
  paymentStatus
}) => {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [sessionRows] = await connection.query(
      `
        SELECT *
        FROM checkout_sessoes
        WHERE idCheckoutSessao = ? AND idCliente = ?
        LIMIT 1
        FOR UPDATE
      `,
      [sessionId, customerId]
    );
    const session = sessionRows[0];

    if (!session) {
      throw new AppError("Sessão de checkout não encontrada.", 404);
    }

    if (session.estado === "concluida" && session.idEncomenda) {
      await connection.commit();
      return dbStore.getOrderById({
        customerId,
        orderId: Number(session.idEncomenda)
      });
    }

    if (session.estado !== "pendente") {
      throw new AppError("Esta sessão de checkout já não está disponível.", 409);
    }

    const items = parseJsonColumn(session.itensJson, []);
    const shipping = parseJsonColumn(session.moradaJson, {});

    if (!items.length) {
      throw new AppError("Não existem produtos válidos nesta sessão de checkout.", 400);
    }

    const productIds = items.map((item) => Number(item.productId));
    const [productRows] = await connection.query(
      `
        SELECT idProd, nomeProd, stock_loja, stock_armazem
        FROM produtos
        WHERE idProd IN (${createInClause(productIds)})
        FOR UPDATE
      `,
      productIds
    );

    if (productRows.length !== productIds.length) {
      throw new AppError("Um ou mais produtos deixaram de estar disponíveis.", 409);
    }

    const productsById = new Map(productRows.map((row) => [Number(row.idProd), row]));

    for (const item of items) {
      const product = productsById.get(Number(item.productId));
      const available = Number(product.stock_loja || 0) + Number(product.stock_armazem || 0);

      if (!product || available < Number(item.quantity)) {
        throw new AppError(withStockMessage(product?.nomeProd || "produto"), 409);
      }
    }

    for (const item of items) {
      const product = productsById.get(Number(item.productId));
      const requestedQuantity = Number(item.quantity);
      const stockStore = Number(product.stock_loja || 0);
      const stockWarehouse = Number(product.stock_armazem || 0);
      const takeFromStore = Math.min(stockStore, requestedQuantity);
      const remaining = requestedQuantity - takeFromStore;

      await connection.query(
        `
          UPDATE produtos
          SET stock_loja = ?, stock_armazem = ?
          WHERE idProd = ?
        `,
        [stockStore - takeFromStore, stockWarehouse - remaining, item.productId]
      );
    }

    const [orderResult] = await connection.query(
      `
        INSERT INTO encomendas (
          idCliente,
          DataPedido,
          DataHoraPedido,
          DataEntrega,
          isValid,
          idEstado,
          moradaRua,
          distritoIlha,
          municipio,
          freguesia,
          codigoPostal,
          observacoes
        )
        VALUES (
          ?,
          CURRENT_DATE(),
          NOW(),
          DATE_ADD(CURRENT_DATE(), INTERVAL ? DAY),
          1,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?
        )
      `,
      [
        customerId,
        ESTIMATED_DELIVERY_DAYS,
        STATUS_PENDING,
        shipping.street || "",
        shipping.district || "",
        shipping.municipality || "",
        shipping.parish || "",
        shipping.postalCode || "",
        shipping.notes || null
      ]
    );

    const orderId = Number(orderResult.insertId);

    for (const item of items) {
      await connection.query(
        `
          INSERT INTO detalhesencomenda (idProd, idEnc, qntd, PrecoLi, PrecoIli)
          VALUES (?, ?, ?, ?, ?)
        `,
        [item.productId, orderId, item.quantity, item.lineTotal, item.unitPrice]
      );
    }

    await connection.query(
      `
        INSERT INTO faturasencomendas (
          IDEncomenda,
          PrecoTotal,
          DataFatura,
          DataHoraFatura,
          idMetPag,
          idCliente,
          paymentProvider,
          paymentReference,
          paymentStatus
        )
        VALUES (?, ?, CURRENT_DATE(), NOW(), ?, ?, ?, ?, ?)
      `,
      [
        orderId,
        Number(session.valorTotal || 0),
        PAYMENT_METHOD_IDS[session.metodoPagamento] || PAYMENT_METHOD_IDS.card,
        customerId,
        paymentProvider,
        paymentReference,
        paymentStatus
      ]
    );

    await connection.query(
      `
        UPDATE checkout_sessoes
        SET estado = 'concluida', idEncomenda = ?, referenciaPagamento = ?
        WHERE idCheckoutSessao = ?
      `,
      [orderId, paymentReference, sessionId]
    );

    await connection.commit();

    return dbStore.getOrderById({
      customerId,
      orderId
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const mapCheckoutItems = (items, productsById) =>
  items.map((item) => {
    const product = productsById.get(Number(item.productId));

    if (!product) {
      throw new AppError("Produto não encontrado.", 404);
    }

    if (product.stock < Number(item.quantity)) {
      throw new AppError(withStockMessage(product.name), 409);
    }

    return {
      productId: Number(product.id),
      quantity: Number(item.quantity),
      unitPrice: Number(product.price),
      lineTotal: Number((Number(product.price) * Number(item.quantity)).toFixed(2)),
      product: {
        id: Number(product.id),
        name: product.name,
        slug: product.slug,
        image: product.image,
        stock: Number(product.stock)
      }
    };
  });

export const orderService = {
  async getCheckoutOptions({ district, municipalityCode } = {}) {
    const [districts, availability] = await Promise.all([
      dbStore.listDistricts(),
      Promise.resolve(paymentService.getAvailability())
    ]);

    const municipalities = district ? await dbStore.listMunicipalities(district) : [];
    const parishes = municipalityCode ? await dbStore.listParishes(municipalityCode) : [];

    return {
      districts,
      municipalities,
      parishes,
      paymentOptions: [
        {
          id: "card",
          label: "Cartão de crédito ou débito",
          description: availability.card.enabled
            ? "Pagamento seguro com Stripe."
            : "Indisponível enquanto as credenciais Stripe não forem configuradas.",
          enabled: availability.card.enabled
        },
        {
          id: "paypal",
          label: "PayPal",
          description: availability.paypal.enabled
            ? "Pagamento e aprovação através do PayPal."
            : "Indisponível enquanto as credenciais PayPal não forem configuradas.",
          enabled: availability.paypal.enabled
        }
      ]
    };
  },

  async createCheckoutSession({ customerId, paymentMethod, items, shipping }) {
    const normalizedItems = normalizeCartItems(items);

    if (!normalizedItems.length) {
      throw new AppError("Adicione pelo menos um produto ao carrinho.", 400);
    }

    const availability = paymentService.getAvailability();
    if (paymentMethod === "card" && !availability.card.enabled) {
      throw new AppError("O pagamento por cartão não está disponível.", 400);
    }
    if (paymentMethod === "paypal" && !availability.paypal.enabled) {
      throw new AppError("O PayPal não está disponível.", 400);
    }

    const [productsById, resolvedLocation] = await Promise.all([
      loadCheckoutProducts(normalizedItems),
      dbStore.resolveShippingLocation({
        district: shipping.district,
        municipalityCode: shipping.municipalityCode,
        parishCode: shipping.parishCode
      })
    ]);

    const checkoutItems = mapCheckoutItems(normalizedItems, productsById);
    const subtotal = Number(
      checkoutItems.reduce((sum, item) => sum + Number(item.lineTotal), 0).toFixed(2)
    );
    const deliveryFee = Number(calculateDeliveryFee(subtotal).toFixed(2));
    const total = Number((subtotal + deliveryFee).toFixed(2));
    const paymentProvider = paymentMethod === "paypal" ? "paypal" : "stripe";
    const persistedShipping = {
      ...shipping,
      municipality: resolvedLocation.municipality,
      parish: resolvedLocation.parish
    };

    const sessionId = await dbStore.createCheckoutSession({
      customerId,
      paymentMethod,
      paymentProvider,
      currency: "eur",
      subtotal,
      deliveryFee,
      total,
      items: checkoutItems,
      shipping: persistedShipping
    });

    if (paymentMethod === "card") {
      const paymentIntent = await paymentService.createCardPaymentIntent({
        amount: Math.round(total * 100),
        currency: "eur",
        customerEmail: shipping.email,
        metadata: {
          checkoutSessionId: String(sessionId),
          customerId: String(customerId),
          paymentMethod
        }
      });

      await dbStore.updateCheckoutSessionReference({
        sessionId,
        providerReference: paymentIntent.id
      });

      return {
        checkoutSession: {
          id: sessionId,
          paymentMethod,
          paymentProvider,
          total,
          subtotal,
          deliveryFee
        },
        orderPreview: buildOrderPreview({
          sessionId,
          items: checkoutItems,
          subtotal,
          deliveryFee,
          total,
          payment: {
            provider: "stripe"
          }
        }),
        payment: {
          provider: "stripe",
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret
        }
      };
    }

    const paypalOrder = await paymentService.createPayPalOrder({
      amount: total,
      currency: "eur",
      referenceId: String(sessionId),
      description: `Sports Club - checkout ${sessionId}`
    });

    await dbStore.updateCheckoutSessionReference({
      sessionId,
      providerReference: paypalOrder.id
    });

    return {
      checkoutSession: {
        id: sessionId,
        paymentMethod,
        paymentProvider,
        total,
        subtotal,
        deliveryFee
      },
      orderPreview: buildOrderPreview({
        sessionId,
        items: checkoutItems,
        subtotal,
        deliveryFee,
        total,
        payment: {
          provider: "paypal"
        }
      }),
      payment: {
        provider: "paypal",
        orderId: paypalOrder.id
      }
    };
  },

  async confirmCardPayment({ sessionId, customerId, paymentIntentId }) {
    const session = await dbStore.getCheckoutSession(sessionId, customerId);

    if (session.paymentMethod !== "card" || session.paymentProvider !== "stripe") {
      throw new AppError("Esta sessão não usa pagamento por cartão.", 400);
    }

    if (session.providerReference && session.providerReference !== paymentIntentId) {
      throw new AppError("O pagamento recebido não corresponde à sessão atual.", 400);
    }

    const paymentIntent = await paymentService.retrieveCardPaymentIntent(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      throw new AppError("O pagamento por cartão ainda não foi concluído.", 400);
    }

    if (paymentIntent.metadata?.checkoutSessionId !== String(sessionId)) {
      throw new AppError("O pagamento não corresponde à sessão de checkout.", 400);
    }

    try {
      const order = await finalizeOrderFromSession({
        sessionId,
        customerId,
        paymentProvider: "stripe",
        paymentReference: paymentIntent.id,
        paymentStatus: paymentIntent.status
      });

      return {
        order
      };
    } catch (error) {
      await refundCompletedPayment({
        paymentProvider: "stripe",
        paymentReference: paymentIntent.id,
        amount: session.total,
        currency: session.currency,
        reason: error.message
      }).catch(() => null);

      throw error;
    }
  },

  async capturePayPalPayment({ sessionId, customerId, orderId }) {
    const session = await dbStore.getCheckoutSession(sessionId, customerId);

    if (session.paymentMethod !== "paypal" || session.paymentProvider !== "paypal") {
      throw new AppError("Esta sessão não usa PayPal.", 400);
    }

    if (session.providerReference && session.providerReference !== orderId) {
      throw new AppError("A aprovação PayPal não corresponde à sessão atual.", 400);
    }

    const captureResult = await paymentService.capturePayPalOrder(orderId);
    const capture =
      captureResult?.purchase_units?.[0]?.payments?.captures?.[0] || null;

    if (captureResult?.status !== "COMPLETED" || !capture?.id) {
      throw new AppError("O PayPal não confirmou o pagamento.", 400);
    }

    try {
      const order = await finalizeOrderFromSession({
        sessionId,
        customerId,
        paymentProvider: "paypal",
        paymentReference: capture.id,
        paymentStatus: capture.status || captureResult.status
      });

      return {
        order
      };
    } catch (error) {
      await refundCompletedPayment({
        paymentProvider: "paypal",
        paymentReference: capture.id,
        amount: session.total,
        currency: session.currency,
        reason: error.message
      }).catch(() => null);

      throw error;
    }
  },

  async listOrders({ customerId, sort, status }) {
    return dbStore.listOrdersByCustomer({ customerId, sort, status });
  },

  async getOrder({ customerId, orderId }) {
    return dbStore.getOrderById({ customerId, orderId });
  },

  async cancelOrder({ customerId, orderId, reason }) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [orderRows] = await connection.query(
        `
          SELECT
            e.idEncomenda,
            e.idEstado,
            e.isValid,
            f.PrecoTotal,
            f.paymentProvider,
            f.paymentReference
          FROM encomendas e
          JOIN faturasencomendas f ON f.IDEncomenda = e.idEncomenda
          WHERE e.idEncomenda = ? AND f.idCliente = ?
          LIMIT 1
          FOR UPDATE
        `,
        [orderId, customerId]
      );
      const order = orderRows[0];

      if (!order) {
        throw new AppError("Encomenda não encontrada.", 404);
      }

      if (Number(order.idEstado) === STATUS_CANCELLED) {
        throw new AppError("Esta encomenda já foi cancelada.", 409);
      }

      if (Number(order.idEstado) === STATUS_DELIVERED) {
        throw new AppError("Não é possível cancelar uma encomenda já entregue.", 409);
      }

      const [itemRows] = await connection.query(
        `
          SELECT de.idProd, de.qntd
          FROM detalhesencomenda de
          WHERE de.idEnc = ?
          FOR UPDATE
        `,
        [orderId]
      );

      if (order.paymentReference) {
        if (order.paymentProvider === "stripe") {
          await paymentService.refundCardPayment({
            paymentIntentId: order.paymentReference,
            amount: Number(order.PrecoTotal || 0),
            reason
          });
        } else if (order.paymentProvider === "paypal") {
          await paymentService.refundPayPalCapture({
            captureId: order.paymentReference,
            amount: Number(order.PrecoTotal || 0),
            currency: "eur",
            reason
          });
        }
      }

      for (const item of itemRows) {
        await connection.query(
          `
            UPDATE produtos
            SET stock_armazem = stock_armazem + ?
            WHERE idProd = ?
          `,
          [item.qntd, item.idProd]
        );
      }

      await connection.query(
        `
          UPDATE encomendas
          SET idEstado = ?, isValid = 0, dataCancelamento = NOW(), motivoCancelamento = ?
          WHERE idEncomenda = ?
        `,
        [STATUS_CANCELLED, reason, orderId]
      );

      await connection.query(
        `
          UPDATE faturasencomendas
          SET
            paymentStatus = 'refunded',
            refundReference = COALESCE(refundReference, paymentReference),
            refundStatus = 'completed',
            refundAmount = ?,
            refundCreatedAt = NOW()
          WHERE IDEncomenda = ?
        `,
        [Number(order.PrecoTotal || 0), orderId]
      );

      await connection.commit();

      return dbStore.getOrderById({ customerId, orderId });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};
