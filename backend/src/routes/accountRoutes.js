import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getDashboard,
  getOrder,
  getOrders,
  getProfile,
  updateProfile
} from "../controllers/accountController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);
router.get("/profile", asyncHandler(getProfile));
router.put("/profile", asyncHandler(updateProfile));
router.get("/dashboard", asyncHandler(getDashboard));
router.get("/orders", asyncHandler(getOrders));
router.get("/orders/:id", asyncHandler(getOrder));

export default router;
