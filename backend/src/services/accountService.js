import { getPool } from "../config/db.js";
import { dbStore } from "../models/dbStore.js";
import { AppError } from "../utils/appError.js";

const sanitizeUser = (user) => ({
  id: user.id,
  name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone || "",
  postalCode: user.postalCode || "",
  role: user.role
});

export const accountService = {
  async getProfile(customerId) {
    const user = await dbStore.findCustomerById(customerId);

    if (!user) {
      throw new AppError("Utilizador não encontrado.", 404);
    }

    return sanitizeUser(user);
  },

  async getDashboard(customerId, sort = "date_desc") {
    const [profile, activeOrders, deliveredOrders, cancelledOrders] = await Promise.all([
      this.getProfile(customerId),
      dbStore.listOrdersByCustomer({ customerId, sort, status: "active" }),
      dbStore.listOrdersByCustomer({ customerId, sort, status: "delivered" }),
      dbStore.listOrdersByCustomer({ customerId, sort, status: "cancelled" })
    ]);

    return {
      profile,
      activeOrders,
      deliveredOrders,
      cancelledOrders
    };
  },

  async getOrders(customerId, { sort = "date_desc", status = "all" } = {}) {
    return dbStore.listOrdersByCustomer({ customerId, sort, status });
  },

  async getOrder(customerId, orderId) {
    return dbStore.getOrderById({ customerId, orderId });
  },

  async updateNickname(customerId, nome) {
    const trimmed = String(nome || "").trim();
    if (!trimmed || trimmed.length < 2) throw new AppError("O nome deve ter pelo menos 2 caracteres.", 400);
    if (trimmed.length > 50) throw new AppError("O nome não pode ter mais de 50 caracteres.", 400);
    const pool = getPool();
    await pool.query(`UPDATE cliente SET nome = ? WHERE idCliente = ?`, [trimmed, Number(customerId)]);
    return this.getProfile(customerId);
  }
};
