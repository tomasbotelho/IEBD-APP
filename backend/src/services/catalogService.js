import { getPool } from "../config/db.js";
import { AppError } from "../utils/appError.js";
import { dbStore } from "../models/dbStore.js";
import { adminService } from "./adminService.js";

export const catalogService = {
  async getHomepage() {
    const [campaigns, categories, featuredProducts, spotlightProducts, siteTexts] =
      await Promise.all([
        dbStore.listCampaigns(),
        dbStore.listCategories(),
        dbStore.getFeaturedProducts(),
        dbStore.listProducts({ promotionsOnly: true }),
        adminService.getPublicSiteTexts("pt")
      ]);

    // Admin-configured carousel highlights (gracefully empty if table not yet migrated)
    let carouselHighlights = [];
    try {
      carouselHighlights = await adminService.listHighlights();
    } catch {
      // produto_highlight table may not exist yet — skip silently
    }

    const t = (section, key, fallback = "") => siteTexts?.[section]?.[key] || fallback;

    return {
      hero: {
        eyebrow: t("hero", "eyebrow", "Nova época Sports Club"),
        title: t("hero", "title", "Treino, competição e outdoor no mesmo storefront."),
        description: t(
          "hero",
          "description",
          "A nossa dedicação para lhe dar os melhores produtos, sempre aos preços mais baixos."
        )
      },
      siteTexts,
      campaigns,
      categories,
      featuredProducts,
      spotlightProducts,
      carouselHighlights
    };
  },

  async listCategories() {
    return {
      items: await dbStore.listCategories()
    };
  },

  async listCampaigns() {
    return {
      items: await dbStore.listCampaigns()
    };
  },

  async listProducts(query) {
    return {
      items: await dbStore.listProducts(query),
      categories: await dbStore.listCategories()
    };
  },

  async getProduct(slug) {
    return dbStore.getProductBySlug(slug);
  },

  // ---------------------------------------------------------------------------
  // Product reviews (public read, auth write)
  // ---------------------------------------------------------------------------

  async listReviews(productId) {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT id, user_id, user_name, rating, comment, reply, replied_at, created_at
       FROM product_reviews
       WHERE produto_id = ? AND is_visible = 1 AND is_offensive = 0
       ORDER BY created_at DESC`,
      [Number(productId)]
    );
    return rows.map((r) => ({
      id: Number(r.id),
      userId: r.user_id ? Number(r.user_id) : null,
      userName: r.user_name,
      rating: Number(r.rating),
      comment: r.comment,
      reply: r.reply || null,
      repliedAt: r.replied_at ? new Date(r.replied_at).toISOString() : null,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : null
    }));
  },

  async createReview(productId, { userId, userName, userEmail, rating, comment }) {
    const pool = getPool();
    const [[existing]] = await pool.query(
      `SELECT id FROM product_reviews WHERE produto_id = ? AND user_id = ?`,
      [Number(productId), Number(userId)]
    );
    if (existing) throw new AppError("Já avaliou este produto.", 409);

    const [result] = await pool.query(
      `INSERT INTO product_reviews (produto_id, user_id, user_name, user_email, rating, comment, is_visible)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [Number(productId), Number(userId), userName, userEmail || null, Number(rating), comment]
    );
    return { id: result.insertId };
  },

  async updateOwnReview(reviewId, userId, { rating, comment }) {
    const pool = getPool();
    const [[row]] = await pool.query(
      `SELECT id, user_id FROM product_reviews WHERE id = ?`, [Number(reviewId)]
    );
    if (!row) throw new AppError("Avaliação não encontrada.", 404);
    if (Number(row.user_id) !== Number(userId)) throw new AppError("Sem permissão.", 403);
    await pool.query(
      `UPDATE product_reviews SET rating = ?, comment = ? WHERE id = ?`,
      [Number(rating), comment, Number(reviewId)]
    );
  },

  async deleteOwnReview(reviewId, userId) {
    const pool = getPool();
    const [[row]] = await pool.query(
      `SELECT id, user_id FROM product_reviews WHERE id = ?`, [Number(reviewId)]
    );
    if (!row) throw new AppError("Avaliação não encontrada.", 404);
    if (Number(row.user_id) !== Number(userId)) throw new AppError("Sem permissão.", 403);
    await pool.query(`DELETE FROM product_reviews WHERE id = ?`, [Number(reviewId)]);
  }
};
