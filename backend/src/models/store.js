import slugify from "slugify";
import { seedState } from "../data/seed.js";
import { AppError } from "../utils/appError.js";
import { calculateCartTotals } from "../utils/formatters.js";

let customerId = seedState.customers.length + 1;
let orderId = 1;
let invoiceId = 1;

const withCategory = (product) => {
  const category = seedState.categories.find((item) => item.id === product.categoryId);
  const campaigns = seedState.campaigns.filter((campaign) =>
    product.campaignIds.includes(campaign.id)
  );

  return { ...product, category, campaigns };
};

export const storeModel = {
  listCategories() {
    return seedState.categories;
  },
  listCampaigns() {
    return seedState.campaigns;
  },
  listProducts({ categorySlug, search, promotionsOnly }) {
    return seedState.products
      .filter((product) => {
        const category = seedState.categories.find((item) => item.id === product.categoryId);
        const matchesCategory = categorySlug ? category?.slug === categorySlug : true;
        const haystack = `${product.name} ${product.description} ${product.brand}`.toLowerCase();
        const matchesSearch = search ? haystack.includes(search.toLowerCase()) : true;
        const matchesPromotion = promotionsOnly ? product.campaignIds.length > 0 : true;
        return matchesCategory && matchesSearch && matchesPromotion;
      })
      .map(withCategory);
  },
  getFeaturedProducts() {
    return seedState.products.filter((product) => product.featured).map(withCategory);
  },
  getProductBySlug(slug) {
    const product = seedState.products.find((item) => item.slug === slug);
    if (!product) {
      throw new AppError("Product not found", 404);
    }
    return withCategory(product);
  },
  getProductById(id) {
    const product = seedState.products.find((item) => item.id === id);
    if (!product) {
      throw new AppError("Product not found", 404);
    }
    return withCategory(product);
  },
  createCustomer(input) {
    const existing = seedState.customers.find((customer) => customer.email === input.email);
    if (existing) {
      throw new AppError("Email already registered", 409);
    }

    const customer = {
      id: customerId++,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      postalCode: input.postalCode,
      passwordHash: input.passwordHash,
      role: input.role || "customer",
      createdAt: new Date().toISOString()
    };

    seedState.customers.push(customer);
    return customer;
  },
  findCustomerByEmail(email) {
    return seedState.customers.find((customer) => customer.email === email) || null;
  },
  findCustomerById(id) {
    return seedState.customers.find((customer) => customer.id === id) || null;
  },
  savePasswordResetToken({ customerId: targetCustomerId, tokenHash, expiresAt }) {
    const customer = this.findCustomerById(targetCustomerId);
    if (!customer) {
      return;
    }

    customer.resetPasswordTokenHash = tokenHash;
    customer.resetPasswordExpiresAt = expiresAt.toISOString();
  },
  findCustomerByResetTokenHash(tokenHash) {
    return (
      seedState.customers.find((customer) => customer.resetPasswordTokenHash === tokenHash) || null
    );
  },
  updateCustomerPassword({ customerId: targetCustomerId, passwordHash }) {
    const customer = this.findCustomerById(targetCustomerId);
    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    customer.passwordHash = passwordHash;
    customer.resetPasswordTokenHash = null;
    customer.resetPasswordExpiresAt = null;
    return customer;
  },
  createOrder({ customerId: ownerId, customer, items, stripePaymentIntentId }) {
    const nextOrderId = orderId++;
    const enrichedItems = items.map(({ productId, quantity }) => {
      const product = this.getProductById(productId);
      return {
        productId: product.id,
        name: product.name,
        quantity,
        price: product.price,
        discountPrice: product.discountPrice
      };
    });

    const totals = calculateCartTotals(enrichedItems);
    const order = {
      id: nextOrderId,
      customerId: ownerId,
      orderNumber: `FM-${String(nextOrderId).padStart(6, "0")}`,
      status: "pending_payment",
      paymentStatus: "requires_confirmation",
      stripePaymentIntentId,
      customer,
      items: enrichedItems,
      totals,
      createdAt: new Date().toISOString()
    };

    seedState.orders.push(order);
    return order;
  },
  updateOrderPayment(orderIdValue, updates) {
    const order = seedState.orders.find((item) => item.id === orderIdValue);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    Object.assign(order, updates);
    return order;
  },
  findOrderById(orderIdValue) {
    return seedState.orders.find((item) => item.id === Number(orderIdValue)) || null;
  },
  createInvoice(order) {
    const nextInvoiceId = invoiceId++;
    const invoice = {
      id: nextInvoiceId,
      orderId: order.id,
      invoiceNumber: `INV-${String(nextInvoiceId).padStart(6, "0")}`,
      total: order.totals.grandTotal,
      issuedAt: new Date().toISOString(),
      paymentProvider: "stripe"
    };

    seedState.invoices.push(invoice);
    return invoice;
  },
  getOrdersByCustomer(customerIdValue) {
    return seedState.orders.filter((order) => order.customerId === customerIdValue);
  },
  getOrderById(orderIdValue, customerIdValue) {
    const order = seedState.orders.find((item) => item.id === Number(orderIdValue));
    if (!order || order.customerId !== customerIdValue) {
      throw new AppError("Order not found", 404);
    }
    const invoice = seedState.invoices.find((item) => item.orderId === order.id) || null;
    return { ...order, invoice };
  },
  createCategory(name, description = "") {
    const slug = slugify(name, { lower: true, strict: true });
    return { id: Date.now(), name, slug, description, subcategories: [] };
  }
};
