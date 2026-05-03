import { api } from "../lib/api.js";

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const adminService = {
  async getDashboardStats(period = "30d") {
    const { data } = await api.get(`/admin/dashboard/stats?period=${period}`);
    return data.data;
  },
  async getBestSellers(period = "30d") {
    const { data } = await api.get(`/admin/dashboard/best-sellers?period=${period}`);
    return data.data;
  },
  async getRevenueChart(period = "30d") {
    const { data } = await api.get(`/admin/dashboard/revenue?period=${period}`);
    return data.data;
  },
  async getOrdersChart(period = "30d") {
    const { data } = await api.get(`/admin/dashboard/orders?period=${period}`);
    return data.data;
  },
  async getHighlights() {
    const { data } = await api.get("/admin/dashboard/highlights");
    return data.data;
  },

  // ---------------------------------------------------------------------------
  // Products
  // ---------------------------------------------------------------------------
  async listProducts({ search = "", categoryId = "", page = 1, limit = 50 } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (search) params.set("search", search);
    if (categoryId) params.set("category", categoryId);
    const { data } = await api.get(`/admin/products?${params}`);
    return data;
  },
  async getProduct(id) {
    const { data } = await api.get(`/admin/products/${id}`);
    return data.data;
  },
  async createProduct(payload) {
    const { data } = await api.post("/admin/products", payload);
    return data.data;
  },
  async updateProduct(id, payload) {
    const { data } = await api.put(`/admin/products/${id}`, payload);
    return data.data;
  },
  async deleteProduct(id) {
    await api.delete(`/admin/products/${id}`);
  },
  async listCategories() {
    const { data } = await api.get("/admin/products/categories");
    return data.data;
  },

  // ---------------------------------------------------------------------------
  // Campaigns
  // ---------------------------------------------------------------------------
  async listCampaigns() {
    const { data } = await api.get("/admin/campaigns");
    return data.data;
  },
  async getCampaign(id) {
    const { data } = await api.get(`/admin/campaigns/${id}`);
    return data.data;
  },
  async createCampaign(payload) {
    const { data } = await api.post("/admin/campaigns", payload);
    return data.data;
  },
  async updateCampaign(id, payload) {
    const { data } = await api.put(`/admin/campaigns/${id}`, payload);
    return data.data;
  },
  async deleteCampaign(id) {
    await api.delete(`/admin/campaigns/${id}`);
  },

  // ---------------------------------------------------------------------------
  // Site Texts
  // ---------------------------------------------------------------------------
  async listSiteTexts() {
    const { data } = await api.get("/admin/site-texts");
    return data.data;
  },
  async createSiteText(payload) {
    const { data } = await api.post("/admin/site-texts", payload);
    return data.data;
  },
  async updateSiteText(id, payload) {
    const { data } = await api.put(`/admin/site-texts/${id}`, payload);
    return data.data;
  },
  async deleteSiteText(id) {
    await api.delete(`/admin/site-texts/${id}`);
  },

  // ---------------------------------------------------------------------------
  // Banners
  // ---------------------------------------------------------------------------
  async listBanners() {
    const { data } = await api.get("/admin/banners");
    return data.data;
  },
  async createBanner(payload) {
    const { data } = await api.post("/admin/banners", payload);
    return data.data;
  },
  async updateBanner(id, payload) {
    const { data } = await api.put(`/admin/banners/${id}`, payload);
    return data.data;
  },
  async deleteBanner(id) {
    await api.delete(`/admin/banners/${id}`);
  },

  // ---------------------------------------------------------------------------
  // Media upload
  // ---------------------------------------------------------------------------
  async uploadMedia(file) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post("/admin/upload", form, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return data.url;
  },

  // ---------------------------------------------------------------------------
  // Reports
  // ---------------------------------------------------------------------------
  async getReportData(type, { period, from, to } = {}) {
    const params = new URLSearchParams({ format: "json" });
    if (period) params.set("period", period);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const { data } = await api.get(`/admin/reports/${type}?${params}`);
    return data;
  },
  downloadReportCSV(type, { period, from, to } = {}) {
    const token = localStorage.getItem("appiebd_access_token");
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
    const params = new URLSearchParams({ format: "csv" });
    if (period) params.set("period", period);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const url = `${base}/admin/reports/${type}?${params}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = `relatorio-${type}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
      });
  },

  // ---------------------------------------------------------------------------
  // Orders management
  // ---------------------------------------------------------------------------
  async listOrders({ status = "", search = "", page = 1, limit = 40 } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    const { data } = await api.get(`/admin/orders?${params}`);
    return data;
  },
  async getOrder(id) {
    const { data } = await api.get(`/admin/orders/${id}`);
    return data.data;
  },
  async updateOrderStatus(id, statusId, cancelReason = "") {
    const { data } = await api.put(`/admin/orders/${id}/status`, { statusId, cancelReason });
    return data.data;
  },

  // ---------------------------------------------------------------------------
  // Reviews management
  // ---------------------------------------------------------------------------
  async listReviews({ productId = "", page = 1, limit = 40, filter = "all" } = {}) {
    const params = new URLSearchParams({ page, limit, filter });
    if (productId) params.set("productId", productId);
    const { data } = await api.get(`/admin/reviews?${params}`);
    return data;
  },
  async replyToReview(id, reply) {
    const { data } = await api.put(`/admin/reviews/${id}/reply`, { reply });
    return data.data;
  },
  async moderateReview(id, { isOffensive, isVisible }) {
    const { data } = await api.put(`/admin/reviews/${id}/moderate`, { isOffensive, isVisible });
    return data.data;
  },
  async deleteReview(id) {
    await api.delete(`/admin/reviews/${id}`);
  },

  // ---------------------------------------------------------------------------
  // Contact messages management
  // ---------------------------------------------------------------------------
  async listContacts({ filter = "all", page = 1, limit = 40 } = {}) {
    const params = new URLSearchParams({ filter, page, limit });
    const { data } = await api.get(`/admin/contacts?${params}`);
    return data;
  },
  async getContact(id) {
    const { data } = await api.get(`/admin/contacts/${id}`);
    return data.data;
  },
  async replyToContact(id, reply) {
    const { data } = await api.put(`/admin/contacts/${id}/reply`, { reply });
    return data.data;
  },
  async archiveContact(id, archived) {
    await api.put(`/admin/contacts/${id}/archive`, { archived });
  },
  async deleteContact(id) {
    await api.delete(`/admin/contacts/${id}`);
  },

  // ---------------------------------------------------------------------------
  // View tracking
  // ---------------------------------------------------------------------------
  async trackProductView(productId) {
    try {
      await api.post(`/products/${productId}/view`);
    } catch {
      // Non-critical — silently ignore
    }
  },

  // ---------------------------------------------------------------------------
  // Placement — highlights (hero carousel)
  // ---------------------------------------------------------------------------
  async getPlacementHighlights() {
    const { data } = await api.get("/admin/placement/highlights");
    return data.data;
  },
  async addPlacementHighlight(payload) {
    const { data } = await api.post("/admin/placement/highlights", payload);
    return data.data;
  },
  async updatePlacementHighlight(id, payload) {
    const { data } = await api.put(`/admin/placement/highlights/${id}`, payload);
    return data.data;
  },
  async removePlacementHighlight(id) {
    const { data } = await api.delete(`/admin/placement/highlights/${id}`);
    return data.data;
  },
  async reorderPlacementHighlights(orderedIds) {
    const { data } = await api.put("/admin/placement/highlights/reorder", { orderedIds });
    return data.data;
  },

  // ---------------------------------------------------------------------------
  // Placement — featured products (destaques)
  // ---------------------------------------------------------------------------
  async getPlacementFeatured() {
    const { data } = await api.get("/admin/placement/featured");
    return data.data;
  },
  async addPlacementFeatured(payload) {
    const { data } = await api.post("/admin/placement/featured", payload);
    return data.data;
  },
  async removePlacementFeatured(id) {
    const { data } = await api.delete(`/admin/placement/featured/${id}`);
    return data.data;
  },

  // ---------------------------------------------------------------------------
  // Placement — campaign products
  // ---------------------------------------------------------------------------
  async getPlacementCampaigns() {
    const { data } = await api.get("/admin/placement/campaigns");
    return data.data;
  },
  async updatePlacementCampaignBanner(id, payload) {
    await api.put(`/admin/placement/campaigns/${id}/banner`, payload);
  },
  async addPlacementCampaignProduct(campaignId, payload) {
    const { data } = await api.post(`/admin/placement/campaigns/${campaignId}/products`, payload);
    return data.data;
  },
  async removePlacementCampaignProduct(campaignId, productId) {
    await api.delete(`/admin/placement/campaigns/${campaignId}/products/${productId}`);
  }
};
