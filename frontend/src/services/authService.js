import { api } from "../lib/api.js";

const normalizeSession = (payload) => ({
  ...payload,
  accessToken: payload?.accessToken || payload?.token || null
});

export const authService = {
  async login(values) {
    const { data } = await api.post("/auth/login", values);
    return normalizeSession(data);
  },

  async register(values) {
    const { data } = await api.post("/auth/register", values);
    return normalizeSession(data);
  },

  async forgotPassword(values) {
    const { data } = await api.post("/auth/forgot-password", values);
    return data;
  },

  async resetPassword(values) {
    const { data } = await api.post("/auth/reset-password", values);
    return data;
  },

  async session() {
    const { data } = await api.get("/auth/session");
    return normalizeSession(data);
  },

  async me() {
    const { data } = await api.get("/auth/me");
    return data;
  },

  async logout() {
    await api.post("/auth/logout");
  },

  getOAuthStartUrl(provider, { intent = "login", returnTo = "/conta" } = {}) {
    const baseURL = api.defaults.baseURL?.replace(/\/$/, "") || "";
    const url = new URL(`${baseURL}/auth/oauth/${provider}/start`);
    url.searchParams.set("intent", intent);
    url.searchParams.set("returnTo", returnTo);
    return url.toString();
  }
};
