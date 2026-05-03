import { z } from "zod";
import { catalogService } from "../services/catalogService.js";
import { adminService } from "../services/adminService.js";
import { AppError } from "../utils/appError.js";
import { getPool } from "../config/db.js";

export const homepage = async (_req, res) => {
  res.json(await catalogService.getHomepage());
};

export const listCategories = async (_req, res) => {
  res.json(await catalogService.listCategories());
};

export const listCampaigns = async (_req, res) => {
  res.json(await catalogService.listCampaigns());
};

export const listProducts = async (req, res) => {
  res.json(
    await catalogService.listProducts({
      categorySlug: req.query.category,
      search: req.query.search,
      promotionsOnly: req.query.promotions === "true"
    })
  );
};

export const getProduct = async (req, res) => {
  res.json(await catalogService.getProduct(req.params.slug));
};

export const getSiteTexts = async (req, res) => {
  const lang = ["pt", "en"].includes(req.query.lang) ? req.query.lang : "pt";
  res.json(await adminService.getPublicSiteTexts(lang));
};

const contactSchema = z.object({
  name: z.string().min(2, "O nome é obrigatório."),
  email: z.string().email("Email inválido."),
  phone: z.string().optional().default(""),
  subject: z.string().optional().default(""),
  message: z.string().min(10, "A mensagem deve ter pelo menos 10 caracteres.")
});

export const submitContact = async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Dados inválidos.", 400, parsed.error.flatten().fieldErrors);
  }
  const { name, email, phone, subject, message } = parsed.data;
  const pool = getPool();
  if (pool) {
    await pool.query(
      `INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)`,
      [name, email, phone || "", subject || "", message]
    );
  }
  res.status(201).json({ ok: true, message: "Mensagem enviada com sucesso." });
};

// ---------------------------------------------------------------------------
// Product reviews
// ---------------------------------------------------------------------------

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(3, "O comentário deve ter pelo menos 3 caracteres.").max(1000)
});

export const listProductReviews = async (req, res) => {
  const product = await catalogService.getProduct(req.params.slug);
  const reviews = await catalogService.listReviews(product.product.id);
  res.json({ ok: true, reviews });
};

export const createProductReview = async (req, res) => {
  const product = await catalogService.getProduct(req.params.slug);
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Dados inválidos.", 400, parsed.error.flatten().fieldErrors);

  const user = await (await import("../models/dbStore.js")).dbStore.findCustomerById(req.user.id);
  const result = await catalogService.createReview(product.product.id, {
    userId: req.user.id,
    userName: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : (user?.email || "Cliente"),
    userEmail: user?.email || null,
    rating: parsed.data.rating,
    comment: parsed.data.comment
  });
  res.status(201).json({ ok: true, id: result.id });
};

export const updateProductReview = async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Dados inválidos.", 400, parsed.error.flatten().fieldErrors);
  await catalogService.updateOwnReview(Number(req.params.id), req.user.id, parsed.data);
  res.json({ ok: true });
};

export const deleteProductReview = async (req, res) => {
  await catalogService.deleteOwnReview(Number(req.params.id), req.user.id);
  res.json({ ok: true });
};

