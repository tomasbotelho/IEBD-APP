import { z } from "zod";
import { accountService } from "../services/accountService.js";
import { orderListQuerySchema } from "../utils/validators.js";

const updateProfileSchema = z.object({
  nome: z.string().min(2).max(50)
});

export const getProfile = async (req, res) => {
  const profile = await accountService.getProfile(req.user.id);
  res.json({ user: profile });
};

export const getDashboard = async (req, res) => {
  const query = orderListQuerySchema.pick({ sort: true }).parse(req.query);
  const payload = await accountService.getDashboard(req.user.id, query.sort);
  res.json(payload);
};

export const getOrders = async (req, res) => {
  const query = orderListQuerySchema.parse(req.query);
  const items = await accountService.getOrders(req.user.id, query);
  res.json({ items });
};

export const getOrder = async (req, res) => {
  const order = await accountService.getOrder(req.user.id, Number(req.params.id));
  res.json(order);
};

export const updateProfile = async (req, res) => {
  const { nome } = updateProfileSchema.parse(req.body);
  const user = await accountService.updateNickname(req.user.id, nome);
  res.json({ user });
};
