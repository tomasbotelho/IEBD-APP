import slugify from "slugify";
import { env } from "../config/env.js";
import { getPool } from "../config/db.js";
import { AppError } from "../utils/appError.js";

const categoryDescriptions = {
  Corrida: "Sapatilhas, t-shirts técnicas e acessórios para ganhar ritmo.",
  Fitness: "Treino funcional, força e mobilidade para casa ou ginásio.",
  Futebol: "Equipamento para treino, jogo e preparação de equipas.",
  Outdoor: "Camadas, mochilas e material para aventura e trilho.",
  Ciclismo: "Capacetes, iluminação e acessórios para estrada e cidade.",
  Caminhada: "Botas, bastões e mochilas para percursos de curta e média duração."
};

const genericCategoryDescription = "Equipamento técnico preparado para treino, jogo e outdoor.";

const toSlug = (value = "") =>
  slugify(String(value || "").trim(), {
    lower: true,
    strict: true,
    locale: "pt"
  });

const buildMediaUrl = (value = "") => {
  const source = String(value || "").trim();
  if (!source) {
    return "";
  }

  if (/^https?:\/\//i.test(source)) {
    return source;
  }

  const normalized = source.replace(/\\/g, "/").replace(/^\/+/, "").replace(/^fotos\//, "");
  return `http://localhost:${env.port}/media/${normalized}`;
};

const parseStoredName = (name = "", email = "") => {
  const source = String(name || "").trim() || String(email || "").split("@")[0] || "Cliente";
  const [firstName, ...rest] = source.split(/\s+/);

  return {
    firstName: firstName || "Cliente",
    lastName: rest.join(" ")
  };
};

const mapRole = (roleId) => {
  if (Number(roleId) === 1) {
    return "admin";
  }

  if (Number(roleId) === 4) {
    return "customer";
  }

  return "user";
};

const normalizeDateTime = (value) => {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
};

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

const normalizeCampaignLabel = (value = "") => String(value || "").replace(/\bEpoca\b/g, "Época");

const mapCustomerRow = (row) => {
  if (!row) {
    return null;
  }

  const { firstName, lastName } = parseStoredName(row.nome, row.email);

  return {
    id: Number(row.idCliente),
    firstName,
    lastName,
    email: row.email,
    phone: row.telefone ? String(row.telefone) : "",
    postalCode: row.codigoPostal || "",
    passwordHash: row.Pass_hash || "",
    role: mapRole(row.IDtipoUser)
  };
};

const decorateCampaign = (row) => {
  const discount = Number(row.desconto || 0);
  const campaignName = normalizeCampaignLabel(row.nome);
  const slug = toSlug(campaignName);

  return {
    id: Number(row.idCamp),
    name: campaignName,
    slug,
    discount,
    badge: discount > 0 ? `-${discount}%` : "Campanha",
    description:
      row.bannerCopy ||
      row.descricao ||
      "Descubra oportunidades em destaque para melhorar o seu equipamento.",
    title: normalizeCampaignLabel(row.bannerTitle || campaignName),
    startsAt: normalizeDateTime(row.data_inicio),
    endsAt: normalizeDateTime(row.data_fim),
    active: true
  };
};

const computeDiscountedPrice = (basePrice, campaigns) => {
  const highestDiscount = campaigns.reduce(
    (maxDiscount, campaign) => Math.max(maxDiscount, Number(campaign.discount || 0)),
    0
  );

  if (!highestDiscount) {
    return null;
  }

  return Number((basePrice * (1 - highestDiscount / 100)).toFixed(2));
};

const mapProductRow = (row, { campaignsByProductId, photosByProductId }) => {
  const campaigns = campaignsByProductId.get(Number(row.idProd)) || [];
  const basePrice = Number(row.precoVenda || 0);
  const discountPrice = computeDiscountedPrice(basePrice, campaigns);
  const photos = photosByProductId.get(Number(row.idProd)) || [];
  const defaultPhoto = buildMediaUrl(row.URL_Foto);
  const normalizedPhotos =
    photos.length > 0
      ? photos.map((photo) => ({
          id: Number(photo.idFoto),
          url: buildMediaUrl(photo.fotoUrl),
          isPrimary: Boolean(photo.isPrimary)
        }))
      : defaultPhoto
        ? [{ id: 0, url: defaultPhoto, isPrimary: true }]
        : [];
  const primaryPhoto =
    normalizedPhotos.find((photo) => photo.isPrimary)?.url || normalizedPhotos[0]?.url || "";
  const categoryName = row.categoryName || "Categoria";
  const totalStock = Number(row.stock_loja || 0) + Number(row.stock_armazem || 0);

  return {
    id: Number(row.idProd),
    name: row.nomeProd,
    slug: toSlug(row.nomeProd),
    description:
      row.descricao || "Equipamento técnico preparado para treino regular, conforto e performance.",
    price: discountPrice ?? basePrice,
    originalPrice: basePrice,
    discountPrice,
    unit: row.tipoProduto && /sapatilhas|chuteiras|halteres|luvas|bastões/i.test(row.tipoProduto)
      ? "par"
      : "un.",
    stock: totalStock,
    stockLoja: Number(row.stock_loja || 0),
    stockArmazem: Number(row.stock_armazem || 0),
    image: primaryPhoto,
    photos: normalizedPhotos,
    category: {
      id: Number(row.IDDesporto),
      name: categoryName,
      slug: toSlug(categoryName),
      description: categoryDescriptions[categoryName] || genericCategoryDescription
    },
    brand: row.brand || "Sports Club",
    featured: Boolean(row.isFeatured),
    campaigns,
    color: row.color || "",
    size: row.tamanho || null,
    type: row.tipoProduto || ""
  };
};

const buildOrderSorting = (sort = "date_desc") => {
  switch (sort) {
    case "date_asc":
      return "orderDateTime ASC, e.idEncomenda ASC";
    case "cost_asc":
      return "f.PrecoTotal ASC, orderDateTime DESC";
    case "cost_desc":
      return "f.PrecoTotal DESC, orderDateTime DESC";
    case "date_desc":
    default:
      return "orderDateTime DESC, e.idEncomenda DESC";
  }
};

const mapOrderSummaryRow = (row) => ({
  id: Number(row.idEncomenda),
  statusId: Number(row.idEstado),
  status: row.estado,
  total: Number(row.PrecoTotal || 0),
  createdAt: normalizeDateTime(row.orderDateTime || row.DataPedido),
  deliveredAt: normalizeDateTime(row.DataEntrega),
  paymentMethod: row.metodo,
  paymentProvider: row.paymentProvider || null,
  paymentStatus: row.paymentStatus || "paid",
  canCancel: ![2, 4].includes(Number(row.idEstado)),
  shippingAddress: {
    street: row.moradaRua || "",
    district: row.distritoIlha || "",
    municipality: row.municipio || "",
    parish: row.freguesia || "",
    postalCode: row.codigoPostal || ""
  },
  cancellation: row.dataCancelamento
    ? {
        cancelledAt: normalizeDateTime(row.dataCancelamento),
        reason: row.motivoCancelamento || "",
        refundStatus: row.refundStatus || "",
        refundAmount: Number(row.refundAmount || 0)
      }
    : null
});

const createInClause = (items) => items.map(() => "?").join(", ");

const loadProductRows = async () => {
  const pool = getPool();
  const [rows] = await pool.query(`
    SELECT
      p.idProd,
      p.nomeProd,
      p.descricao,
      p.precoVenda,
      p.precoImport,
      p.qntd,
      p.stock_loja,
      p.stock_armazem,
      p.stockMinimo,
      p.URL_Foto,
      p.IDDesporto,
      d.Nome AS categoryName,
      f.nome AS brand,
      tp.tipoProduto,
      t.tamanho,
      c.Cor AS color,
      EXISTS(SELECT 1 FROM destaques ds WHERE ds.IDProduto = p.idProd) AS isFeatured
    FROM produtos p
    JOIN desportos d ON d.IDDesporto = p.IDDesporto
    LEFT JOIN fornecedor f ON f.idForn = p.idForn
    LEFT JOIN tipoproddesporto tp ON tp.idTipoProdDesporto = p.idTipoProdDesp
    LEFT JOIN tamanhoprod t ON t.idTamanProd = p.idTaman
    LEFT JOIN cor c ON c.IDCor = p.IDCor
    ORDER BY p.idProd DESC
  `);

  if (!rows.length) {
    return [];
  }

  const ids = rows.map((row) => Number(row.idProd));
  const inClause = createInClause(ids);
  const poolPhotos = getPool();
  const [photoRows] = await poolPhotos.query(
    `
      SELECT idFoto, idProd, fotoUrl, isPrimary, sortOrder
      FROM produto_fotos
      WHERE idProd IN (${inClause})
      ORDER BY idProd, sortOrder, idFoto
    `,
    ids
  );
  const [campaignRows] = await poolPhotos.query(
    `
      SELECT
        pc.IDProd,
        pc.descricao,
        c.idCamp,
        c.nome,
        c.desconto,
        c.data_inicio,
        c.data_fim
      FROM prod_campanha pc
      JOIN campanha c ON c.idCamp = pc.IDCampanha
      WHERE pc.IDProd IN (${inClause})
        AND (c.data_inicio IS NULL OR DATE(c.data_inicio) <= CURRENT_DATE())
        AND (c.data_fim IS NULL OR DATE(c.data_fim) >= CURRENT_DATE())
    `,
    ids
  );

  const photosByProductId = new Map();
  for (const photo of photoRows) {
    const key = Number(photo.idProd);
    const collection = photosByProductId.get(key) || [];
    collection.push(photo);
    photosByProductId.set(key, collection);
  }

  const campaignsByProductId = new Map();
  for (const campaign of campaignRows) {
    const key = Number(campaign.IDProd);
    const collection = campaignsByProductId.get(key) || [];
    collection.push(decorateCampaign(campaign));
    campaignsByProductId.set(key, collection);
  }

  return rows.map((row) => mapProductRow(row, { campaignsByProductId, photosByProductId }));
};

export const dbStore = {
  async listCategories() {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT
        d.IDDesporto AS id,
        d.Nome AS name,
        COUNT(p.idProd) AS productCount
      FROM desportos d
      LEFT JOIN produtos p ON p.IDDesporto = d.IDDesporto
      GROUP BY d.IDDesporto, d.Nome
      HAVING COUNT(p.idProd) > 0
      ORDER BY d.IDDesporto
    `);
    const [typeRows] = await pool.query(`
      SELECT idTipoProdDesporto AS id, IDDesporto AS sportId, tipoProduto
      FROM tipoproddesporto
      ORDER BY IDDesporto, tipoProduto
    `);

    return rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      slug: toSlug(row.name),
      description: categoryDescriptions[row.name] || genericCategoryDescription,
      productCount: Number(row.productCount || 0),
      subcategories: typeRows
        .filter((typeRow) => Number(typeRow.sportId) === Number(row.id))
        .map((typeRow) => ({
          id: Number(typeRow.id),
          name: typeRow.tipoProduto,
          slug: toSlug(typeRow.tipoProduto)
        }))
    }));
  },

  async listCampaigns() {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT idCamp, nome, desconto, data_inicio, data_fim
      FROM campanha
      WHERE data_inicio IS NULL OR DATE(data_inicio) <= CURRENT_DATE()
      ORDER BY data_inicio DESC, idCamp DESC
    `);

    return rows.map((row) => decorateCampaign(row));
  },

  async listProducts({ categorySlug, search, promotionsOnly, featuredOnly } = {}) {
    const products = await loadProductRows();

    return products.filter((product) => {
      const matchesCategory = categorySlug ? product.category.slug === categorySlug : true;
      const haystack = `${product.name} ${product.description} ${product.brand}`.toLowerCase();
      const matchesSearch = search ? haystack.includes(String(search).toLowerCase()) : true;
      const matchesPromotion = promotionsOnly ? product.campaigns.length > 0 : true;
      const matchesFeatured = featuredOnly ? product.featured : true;
      return matchesCategory && matchesSearch && matchesPromotion && matchesFeatured;
    });
  },

  async getFeaturedProducts() {
    return this.listProducts({ featuredOnly: true });
  },

  async getProductBySlug(slug) {
    const products = await loadProductRows();
    const product = products.find((item) => item.slug === slug);

    if (!product) {
      throw new AppError("Produto não encontrado.", 404);
    }

    return product;
  },

  async getProductById(id) {
    const products = await loadProductRows();
    const product = products.find((item) => Number(item.id) === Number(id));

    if (!product) {
      throw new AppError("Produto não encontrado.", 404);
    }

    return product;
  },

  async findCustomerByEmail(email) {
    const pool = getPool();
    const [rows] = await pool.query(
      `
        SELECT c.idCliente, c.nome, c.email, c.telefone, c.codigoPostal, l.Pass_hash, l.IDtipoUser
        FROM cliente c
        LEFT JOIN login l ON l.IDlogin = c.idCliente
        WHERE LOWER(c.email) = LOWER(?)
        LIMIT 1
      `,
      [email]
    );

    return mapCustomerRow(rows[0]);
  },

  async findCustomerById(id) {
    const pool = getPool();
    const [rows] = await pool.query(
      `
        SELECT c.idCliente, c.nome, c.email, c.telefone, c.codigoPostal, l.Pass_hash, l.IDtipoUser
        FROM cliente c
        LEFT JOIN login l ON l.IDlogin = c.idCliente
        WHERE c.idCliente = ?
        LIMIT 1
      `,
      [id]
    );

    return mapCustomerRow(rows[0]);
  },

  async savePasswordResetToken({ customerId, tokenHash, expiresAt }) {
    const pool = getPool();
    await pool.query(
      `
        UPDATE login
        SET resetPasswordTokenHash = ?, resetPasswordExpiresAt = ?
        WHERE IDlogin = ?
      `,
      [tokenHash, expiresAt, customerId]
    );
  },

  async findCustomerByResetTokenHash(tokenHash) {
    const pool = getPool();
    const [rows] = await pool.query(
      `
        SELECT
          c.idCliente,
          c.nome,
          c.email,
          c.telefone,
          c.codigoPostal,
          l.Pass_hash,
          l.IDtipoUser,
          l.resetPasswordTokenHash,
          l.resetPasswordExpiresAt
        FROM cliente c
        JOIN login l ON l.IDlogin = c.idCliente
        WHERE l.resetPasswordTokenHash = ?
        LIMIT 1
      `,
      [tokenHash]
    );
    const row = rows[0];

    if (!row) {
      return null;
    }

    return {
      ...mapCustomerRow(row),
      resetPasswordExpiresAt: row.resetPasswordExpiresAt || null
    };
  },

  async updateCustomerPassword({ customerId, passwordHash }) {
    const pool = getPool();
    await pool.query(
      `
        UPDATE login
        SET
          Pass_hash = ?,
          resetPasswordTokenHash = NULL,
          resetPasswordExpiresAt = NULL
        WHERE IDlogin = ?
      `,
      [passwordHash, customerId]
    );

    return this.findCustomerById(customerId);
  },

  async createCustomer({ firstName, lastName, email, phone, postalCode = "", passwordHash }) {
    const pool = getPool();
    const existing = await this.findCustomerByEmail(email);

    if (existing) {
      throw new AppError("a conta já existe", 409);
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const fullName = `${firstName} ${lastName}`.trim();
      const phoneNumber = Number.parseInt(String(phone || "").replace(/\D/g, ""), 10) || 0;

      const [customerResult] = await connection.query(
        `
          INSERT INTO cliente (nome, email, telefone, morada, codigoPostal)
          VALUES (?, ?, ?, '', ?)
        `,
        [fullName, email, phoneNumber, postalCode]
      );

      const customerId = Number(customerResult.insertId);
      const username = `cli${customerId}`;

      await connection.query(
        `
          INSERT INTO login (IDlogin, Pass_hash, username, IDtipoUser)
          VALUES (?, ?, ?, 4)
        `,
        [customerId, passwordHash, username]
      );

      await connection.commit();

      return {
        id: customerId,
        firstName,
        lastName,
        email,
        phone: String(phone || ""),
        postalCode,
        role: "customer",
        passwordHash
      };
    } catch (error) {
      await connection.rollback();
      if (error?.code === "ER_DUP_ENTRY") {
        throw new AppError("a conta já existe", 409);
      }
      throw error;
    } finally {
      connection.release();
    }
  },

  async listDistricts() {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT COD_ISO3166_2 AS code, NOM_SUBDIV AS name
      FROM distritos
      ORDER BY NOM_SUBDIV
    `);

    return rows.map((row) => ({ code: row.code, name: row.name }));
  },

  async listMunicipalities(district) {
    const pool = getPool();
    const [rows] = await pool.query(
      `
        SELECT COD_LAU1 AS code, MUNICIPIO AS name
        FROM concelhos
        WHERE DISTRITO_ILHA = ?
        ORDER BY MUNICIPIO
      `,
      [district]
    );

    return rows.map((row) => ({ code: row.code, name: row.name }));
  },

  async listParishes(municipalityCode) {
    const pool = getPool();
    const [rows] = await pool.query(
      `
        SELECT COD_LAU2 AS code, FREGUESIA AS name
        FROM freguesias
        WHERE COD_LAU1 = ?
        ORDER BY FREGUESIA
      `,
      [municipalityCode]
    );

    return rows.map((row) => ({ code: row.code, name: row.name }));
  },

  async resolveShippingLocation({ district, municipalityCode, parishCode }) {
    const pool = getPool();
    const [municipalityRows] = await pool.query(
      `
        SELECT COD_LAU1 AS code, MUNICIPIO AS name, DISTRITO_ILHA AS district
        FROM concelhos
        WHERE COD_LAU1 = ?
        LIMIT 1
      `,
      [municipalityCode]
    );
    const municipality = municipalityRows[0];

    if (!municipality || municipality.district !== district) {
      throw new AppError("Município inválido para o distrito selecionado.", 400);
    }

    const [parishRows] = await pool.query(
      `
        SELECT COD_LAU2 AS code, FREGUESIA AS name, COD_LAU1 AS municipalityCode
        FROM freguesias
        WHERE COD_LAU2 = ?
        LIMIT 1
      `,
      [parishCode]
    );
    const parish = parishRows[0];

    if (!parish || parish.municipalityCode !== municipalityCode) {
      throw new AppError("Freguesia inválida para o município selecionado.", 400);
    }

    return {
      district,
      municipalityCode,
      municipality: municipality.name,
      parishCode,
      parish: parish.name
    };
  },

  async createCheckoutSession({
    customerId,
    paymentMethod,
    paymentProvider,
    currency,
    subtotal,
    deliveryFee,
    total,
    items,
    shipping
  }) {
    const pool = getPool();
    const [result] = await pool.query(
      `
        INSERT INTO checkout_sessoes (
          idCliente,
          metodoPagamento,
          fornecedorPagamento,
          moeda,
          subtotal,
          custoEntrega,
          valorTotal,
          itensJson,
          moradaJson,
          estado,
          createdAt,
          expiresAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente', NOW(), DATE_ADD(NOW(), INTERVAL 30 MINUTE))
      `,
      [
        customerId,
        paymentMethod,
        paymentProvider,
        currency,
        subtotal,
        deliveryFee,
        total,
        JSON.stringify(items),
        JSON.stringify(shipping)
      ]
    );

    return Number(result.insertId);
  },

  async updateCheckoutSessionReference({ sessionId, providerReference }) {
    const pool = getPool();
    await pool.query(
      `
        UPDATE checkout_sessoes
        SET referenciaPagamento = ?
        WHERE idCheckoutSessao = ?
      `,
      [providerReference, sessionId]
    );
  },

  async getCheckoutSession(sessionId, customerId) {
    const pool = getPool();
    const [rows] = await pool.query(
      `
        SELECT *
        FROM checkout_sessoes
        WHERE idCheckoutSessao = ? AND idCliente = ?
        LIMIT 1
      `,
      [sessionId, customerId]
    );
    const row = rows[0];

    if (!row) {
      throw new AppError("Sessão de checkout não encontrada.", 404);
    }

    return {
      id: Number(row.idCheckoutSessao),
      customerId: Number(row.idCliente),
      paymentMethod: row.metodoPagamento,
      paymentProvider: row.fornecedorPagamento,
      currency: row.moeda,
      subtotal: Number(row.subtotal || 0),
      deliveryFee: Number(row.custoEntrega || 0),
      total: Number(row.valorTotal || 0),
      status: row.estado,
      providerReference: row.referenciaPagamento || null,
      items: parseJsonColumn(row.itensJson, []),
      shipping: parseJsonColumn(row.moradaJson, {}),
      orderId: row.idEncomenda ? Number(row.idEncomenda) : null
    };
  },

  async listOrdersByCustomer({ customerId, sort = "date_desc", status = "all" }) {
    const pool = getPool();
    const where = ["f.idCliente = ?"];
    const params = [customerId];

    if (status === "active") {
      where.push("e.idEstado NOT IN (2, 4)");
    } else if (status === "delivered") {
      where.push("e.idEstado = 2");
    } else if (status === "cancelled") {
      where.push("e.idEstado = 4");
    }

    const [rows] = await pool.query(
      `
        SELECT
          e.idEncomenda,
          e.idEstado,
          e.DataPedido,
          e.DataEntrega,
          e.DataHoraPedido AS orderDateTime,
          e.moradaRua,
          e.distritoIlha,
          e.municipio,
          e.freguesia,
          e.codigoPostal,
          e.dataCancelamento,
          e.motivoCancelamento,
          st.estado,
          f.idFaturaEnc,
          f.PrecoTotal,
          f.DataFatura,
          f.DataHoraFatura,
          f.paymentProvider,
          f.paymentReference,
          f.paymentStatus,
          f.refundReference,
          f.refundStatus,
          f.refundAmount,
          mp.metodo
        FROM encomendas e
        JOIN faturasencomendas f ON f.IDEncomenda = e.idEncomenda
        JOIN estados st ON st.idEstado = e.idEstado
        LEFT JOIN metpag mp ON mp.idMet = f.idMetPag
        WHERE ${where.join(" AND ")}
        ORDER BY ${buildOrderSorting(sort)}
      `,
      params
    );

    return rows.map((row) => mapOrderSummaryRow(row));
  },

  async getOrderById({ customerId, orderId }) {
    const pool = getPool();
    const [rows] = await pool.query(
      `
        SELECT
          e.idEncomenda,
          e.idEstado,
          e.DataPedido,
          e.DataEntrega,
          e.DataHoraPedido AS orderDateTime,
          e.moradaRua,
          e.distritoIlha,
          e.municipio,
          e.freguesia,
          e.codigoPostal,
          e.observacoes,
          e.dataCancelamento,
          e.motivoCancelamento,
          st.estado,
          f.idFaturaEnc,
          f.PrecoTotal,
          f.DataFatura,
          f.DataHoraFatura,
          f.paymentProvider,
          f.paymentReference,
          f.paymentStatus,
          f.refundReference,
          f.refundStatus,
          f.refundAmount,
          mp.metodo
        FROM encomendas e
        JOIN faturasencomendas f ON f.IDEncomenda = e.idEncomenda
        JOIN estados st ON st.idEstado = e.idEstado
        LEFT JOIN metpag mp ON mp.idMet = f.idMetPag
        WHERE e.idEncomenda = ? AND f.idCliente = ?
        LIMIT 1
      `,
      [orderId, customerId]
    );
    const row = rows[0];

    if (!row) {
      throw new AppError("Encomenda não encontrada.", 404);
    }

    const [itemRows] = await pool.query(
      `
        SELECT
          de.idDetalheEnc,
          de.idProd,
          de.qntd,
          de.PrecoLi,
          de.PrecoIli,
          p.nomeProd,
          p.URL_Foto
        FROM detalhesencomenda de
        JOIN produtos p ON p.idProd = de.idProd
        WHERE de.idEnc = ?
        ORDER BY de.idDetalheEnc
      `,
      [orderId]
    );

    return {
      ...mapOrderSummaryRow(row),
      notes: row.observacoes || "",
      items: itemRows.map((item) => ({
        id: Number(item.idDetalheEnc),
        productId: Number(item.idProd),
        quantity: Number(item.qntd),
        unitPrice: Number(item.PrecoIli || 0),
        total: Number(item.PrecoLi || 0),
        product: {
          id: Number(item.idProd),
          name: item.nomeProd,
          slug: toSlug(item.nomeProd),
          image: buildMediaUrl(item.URL_Foto)
        }
      }))
    };
  }
};
