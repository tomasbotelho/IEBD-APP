import { api } from "../lib/api.js";

export const checkoutService = {
  async getOptions(params = {}) {
    const { data } = await api.get("/orders/checkout/options", {
      params: {
        district: params.district || undefined,
        municipalityCode: params.municipalityCode || undefined
      }
    });

    return data;
  },

  async createCheckoutSession(payload) {
    const { data } = await api.post("/orders/checkout", payload);
    return data;
  },

  async confirmCardPayment(sessionId, paymentIntentId) {
    const { data } = await api.post(`/orders/checkout/${sessionId}/confirm-card`, {
      paymentIntentId
    });
    return data;
  },

  async capturePayPalPayment(sessionId, orderId) {
    const { data } = await api.post(`/orders/checkout/${sessionId}/capture-paypal`, {
      orderId
    });
    return data;
  }
};
