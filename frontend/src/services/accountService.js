import { api } from "../lib/api.js";

export const accountService = {
  async getProfile() {
    const { data } = await api.get("/account/profile");
    return data.user;
  },

  async getDashboard(sort = "date_desc") {
    const { data } = await api.get("/account/dashboard", {
      params: {
        sort
      }
    });
    return data;
  },

  async getOrders({ sort = "date_desc", status = "all" } = {}) {
    const { data } = await api.get("/account/orders", {
      params: {
        sort,
        status
      }
    });
    return data.items;
  },

  async getOrder(id) {
    const { data } = await api.get(`/account/orders/${id}`);
    return data;
  },

  async cancelOrder(id, reason) {
    const { data } = await api.post(`/orders/${id}/cancel`, {
      reason
    });
    return data.order;
  },

  async updateNickname(nome) {
    const { data } = await api.put("/account/profile", { nome });
    return data.user;
  }
};
