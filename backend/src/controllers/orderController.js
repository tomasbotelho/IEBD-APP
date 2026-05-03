import {
  cancelOrderSchema,
  capturePayPalSchema,
  checkoutCreateSchema,
  confirmCardPaymentSchema,
  orderListQuerySchema
} from "../utils/validators.js";
import { orderService } from "../services/orderService.js";

export const getCheckoutOptions = async (req, res) => {
  const payload = await orderService.getCheckoutOptions({
    district: typeof req.query.district === "string" ? req.query.district : "",
    municipalityCode:
      typeof req.query.municipalityCode === "string" ? req.query.municipalityCode : ""
  });

  res.json(payload);
};

export const createCheckout = async (req, res) => {
  const input = checkoutCreateSchema.parse(req.body);
  const payload = await orderService.createCheckoutSession({
    customerId: req.user.id,
    paymentMethod: input.paymentMethod,
    items: input.items,
    shipping: input.shipping
  });

  res.status(201).json(payload);
};

export const confirmCardPayment = async (req, res) => {
  const input = confirmCardPaymentSchema.parse(req.body);
  const payload = await orderService.confirmCardPayment({
    sessionId: Number(req.params.sessionId),
    customerId: req.user.id,
    paymentIntentId: input.paymentIntentId
  });

  res.json(payload);
};

export const capturePayPalPayment = async (req, res) => {
  const input = capturePayPalSchema.parse(req.body);
  const payload = await orderService.capturePayPalPayment({
    sessionId: Number(req.params.sessionId),
    customerId: req.user.id,
    orderId: input.orderId
  });

  res.json(payload);
};

export const listOrders = async (req, res) => {
  const query = orderListQuerySchema.parse(req.query);
  const items = await orderService.listOrders({
    customerId: req.user.id,
    sort: query.sort,
    status: query.status
  });

  res.json({ items });
};

export const getOrder = async (req, res) => {
  const order = await orderService.getOrder({
    customerId: req.user.id,
    orderId: Number(req.params.id)
  });

  res.json(order);
};

export const cancelOrder = async (req, res) => {
  const input = cancelOrderSchema.parse(req.body);
  const order = await orderService.cancelOrder({
    customerId: req.user.id,
    orderId: Number(req.params.id),
    reason: input.reason
  });

  res.json({ order });
};
