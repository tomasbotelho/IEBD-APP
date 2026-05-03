import Stripe from "stripe";
import { env } from "../config/env.js";
import { AppError } from "../utils/appError.js";

const looksConfigured = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();

  return (
    Boolean(normalized) &&
    !normalized.includes("replace_me") &&
    !normalized.includes("your_") &&
    !normalized.includes("example") &&
    normalized !== "changeme"
  );
};

const stripe = looksConfigured(env.stripeSecretKey) ? new Stripe(env.stripeSecretKey) : null;
const paypalBaseUrl =
  env.paypal.environment === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

let cachedPayPalToken = null;

const ensureStripeConfigured = () => {
  if (!stripe) {
    throw new AppError("O pagamento por cartão não está configurado no servidor.", 400);
  }

  return stripe;
};

const ensurePayPalConfigured = () => {
  if (!looksConfigured(env.paypal.clientId) || !looksConfigured(env.paypal.clientSecret)) {
    throw new AppError("O PayPal não está configurado no servidor.", 400);
  }
};

const getPayPalAccessToken = async () => {
  ensurePayPalConfigured();

  if (cachedPayPalToken && cachedPayPalToken.expiresAt > Date.now() + 30_000) {
    return cachedPayPalToken.token;
  }

  const auth = Buffer.from(`${env.paypal.clientId}:${env.paypal.clientSecret}`).toString("base64");
  const response = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  if (!response.ok) {
    throw new AppError("Não foi possível autenticar no PayPal.", 502);
  }

  const payload = await response.json();
  cachedPayPalToken = {
    token: payload.access_token,
    expiresAt: Date.now() + Number(payload.expires_in || 0) * 1000
  };

  return cachedPayPalToken.token;
};

const callPayPal = async (path, { method = "GET", body, headers = {} } = {}) => {
  const token = await getPayPalAccessToken();
  const response = await fetch(`${paypalBaseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new AppError(
      payload.message || payload.error_description || "O PayPal devolveu um erro.",
      502
    );
  }

  return response.status === 204 ? null : response.json();
};

export const paymentService = {
  getAvailability() {
    return {
      card: {
        enabled: Boolean(stripe)
      },
      paypal: {
        enabled:
          looksConfigured(env.paypal.clientId) && looksConfigured(env.paypal.clientSecret)
      }
    };
  },

  async createCardPaymentIntent({ amount, currency, metadata, customerEmail }) {
    const stripeClient = ensureStripeConfigured();

    return stripeClient.paymentIntents.create({
      amount,
      currency,
      metadata,
      receipt_email: customerEmail || undefined,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never"
      }
    });
  },

  async retrieveCardPaymentIntent(paymentIntentId) {
    const stripeClient = ensureStripeConfigured();

    try {
      return await stripeClient.paymentIntents.retrieve(paymentIntentId);
    } catch {
      throw new AppError("Não foi possível validar o pagamento por cartão.", 400);
    }
  },

  async refundCardPayment({ paymentIntentId, amount, reason }) {
    const stripeClient = ensureStripeConfigured();

    try {
      return await stripeClient.refunds.create({
        payment_intent: paymentIntentId,
        amount: Math.round(Number(amount || 0) * 100),
        reason: "requested_by_customer",
        metadata: {
          reason: reason || "Cancelamento solicitado pelo cliente"
        }
      });
    } catch {
      throw new AppError("Não foi possível emitir o reembolso do cartão.", 400);
    }
  },

  async createPayPalOrder({ amount, currency, referenceId, description }) {
    const payload = await callPayPal("/v2/checkout/orders", {
      method: "POST",
      body: {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: referenceId,
            description,
            amount: {
              currency_code: String(currency || "EUR").toUpperCase(),
              value: Number(amount || 0).toFixed(2)
            }
          }
        ]
      }
    });

    return payload;
  },

  async capturePayPalOrder(orderId) {
    return callPayPal(`/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      body: {}
    });
  },

  async refundPayPalCapture({ captureId, amount, currency, reason }) {
    return callPayPal(`/v2/payments/captures/${captureId}/refund`, {
      method: "POST",
      body: {
        amount: {
          currency_code: String(currency || "EUR").toUpperCase(),
          value: Number(amount || 0).toFixed(2)
        },
        note_to_payer: reason || "Cancelamento solicitado pelo cliente."
      }
    });
  }
};
