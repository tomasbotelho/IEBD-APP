import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  forgotPassword,
  login,
  logout,
  me,
  oauthCallback,
  oauthStart,
  register,
  resetPassword,
  session
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.post("/register", authLimiter, asyncHandler(register));
router.post("/login", authLimiter, asyncHandler(login));
router.post("/forgot-password", authLimiter, asyncHandler(forgotPassword));
router.post("/reset-password", authLimiter, asyncHandler(resetPassword));
router.post("/logout", asyncHandler(logout));
router.get("/me", requireAuth, asyncHandler(me));
router.get("/session", requireAuth, asyncHandler(session));
router.get("/oauth/:provider/start", asyncHandler(oauthStart));
router.get("/oauth/:provider/callback", asyncHandler(oauthCallback));

export default router;
