import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  cancelOrder,
  capturePayPalPayment,
  confirmCardPayment,
  createCheckout,
  getCheckoutOptions,
  getOrder,
  listOrders
} from "../controllers/orderController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { checkoutLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.use(requireAuth);

router.get("/checkout/options", asyncHandler(getCheckoutOptions));
router.post("/checkout", checkoutLimiter, asyncHandler(createCheckout));
router.post(
  "/checkout/:sessionId/confirm-card",
  checkoutLimiter,
  asyncHandler(confirmCardPayment)
);
router.post(
  "/checkout/:sessionId/capture-paypal",
  checkoutLimiter,
  asyncHandler(capturePayPalPayment)
);
router.get("/", asyncHandler(listOrders));
router.get("/:id", asyncHandler(getOrder));
router.post("/:id/cancel", checkoutLimiter, asyncHandler(cancelOrder));

export default router;
