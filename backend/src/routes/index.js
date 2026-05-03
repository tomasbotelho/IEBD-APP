import { Router } from "express";
import accountRoutes from "./accountRoutes.js";
import adminRoutes from "./adminRoutes.js";
import authRoutes from "./authRoutes.js";
import catalogRoutes from "./catalogRoutes.js";
import orderRoutes from "./orderRoutes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

router.use("/admin", adminRoutes);
router.use("/auth", authRoutes);
router.use("/account", accountRoutes);
router.use("/", catalogRoutes);
router.use("/orders", orderRoutes);

export default router;
