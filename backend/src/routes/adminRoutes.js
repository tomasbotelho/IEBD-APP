import path from "path";
import { fileURLToPath } from "url";
import { Router } from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  // Dashboard
  getDashboardStats, getBestSellers, getRevenueChart, getOrdersChart, getHighlights,
  // Products
  listProducts, getProduct, createProduct, updateProduct, deleteProduct, listCategories,
  // Campaigns
  listCampaigns, getCampaign, createCampaign, updateCampaign, deleteCampaign,
  // Site Texts
  listSiteTexts, createSiteText, updateSiteText, deleteSiteText,
  // Banners
  listBanners, createBanner, updateBanner, deleteBanner,
  // Reports
  downloadReport,
  // Orders
  listOrders, getOrder, updateOrderStatus,
  // Reviews
  listReviews, replyToReview, moderateReview, deleteReview,
  // Contacts
  listContacts, getContactMsg, replyToContact, archiveContact, deleteContactMsg,
  // Placement
  listPlacementHighlights, addPlacementHighlight, updatePlacementHighlight,
  removePlacementHighlight, reorderPlacementHighlights,
  listPlacementFeatured, addPlacementFeatured, removePlacementFeatured,
  listPlacementCampaigns, updatePlacementCampaignBanner,
  addPlacementCampaignProduct, removePlacementCampaignProduct
} from "../controllers/adminController.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, "../../../../fotos/uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, /^image\/(jpeg|png|webp|gif|svg\+xml)$/.test(file.mimetype));
  }
});

const router = Router();

// All admin routes require authentication and admin role
router.use(requireAuth, requireRole("admin"));

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
router.get("/dashboard/stats",        asyncHandler(getDashboardStats));
router.get("/dashboard/best-sellers", asyncHandler(getBestSellers));
router.get("/dashboard/revenue",      asyncHandler(getRevenueChart));
router.get("/dashboard/orders",       asyncHandler(getOrdersChart));
router.get("/dashboard/highlights",   asyncHandler(getHighlights));

// ---------------------------------------------------------------------------
// Products — IMPORTANT: /categories must be registered BEFORE /:id
// ---------------------------------------------------------------------------
router.get("/products",            asyncHandler(listProducts));
router.post("/products",           asyncHandler(createProduct));
router.get("/products/categories", asyncHandler(listCategories)); // literal before wildcard
router.get("/products/:id",        asyncHandler(getProduct));
router.put("/products/:id",        asyncHandler(updateProduct));
router.delete("/products/:id",     asyncHandler(deleteProduct));

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------
router.get("/campaigns",      asyncHandler(listCampaigns));
router.post("/campaigns",     asyncHandler(createCampaign));
router.get("/campaigns/:id",  asyncHandler(getCampaign));
router.put("/campaigns/:id",  asyncHandler(updateCampaign));
router.delete("/campaigns/:id", asyncHandler(deleteCampaign));

// ---------------------------------------------------------------------------
// Site Texts
// ---------------------------------------------------------------------------
router.get("/site-texts",       asyncHandler(listSiteTexts));
router.post("/site-texts",      asyncHandler(createSiteText));
router.put("/site-texts/:id",   asyncHandler(updateSiteText));
router.delete("/site-texts/:id", asyncHandler(deleteSiteText));

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------
router.get("/banners",       asyncHandler(listBanners));
router.post("/banners",      asyncHandler(createBanner));
router.put("/banners/:id",   asyncHandler(updateBanner));
router.delete("/banners/:id", asyncHandler(deleteBanner));

// ---------------------------------------------------------------------------
// Media upload  POST /api/admin/upload  → { url: "/media/uploads/filename.jpg" }
// ---------------------------------------------------------------------------
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Ficheiro inválido ou demasiado grande (máx 5 MB)." });
  }
  res.json({ url: `/media/uploads/${req.file.filename}` });
});

// ---------------------------------------------------------------------------
// Reports  (/api/admin/reports/:type?period=30d&format=csv|json)
// ---------------------------------------------------------------------------
router.get("/reports/:type", asyncHandler(downloadReport));

// ---------------------------------------------------------------------------
// Orders management
// ---------------------------------------------------------------------------
router.get("/orders",              asyncHandler(listOrders));
router.get("/orders/:id",          asyncHandler(getOrder));
router.put("/orders/:id/status",   asyncHandler(updateOrderStatus));

// ---------------------------------------------------------------------------
// Reviews management
// ---------------------------------------------------------------------------
router.get("/reviews",                  asyncHandler(listReviews));
router.put("/reviews/:id/reply",        asyncHandler(replyToReview));
router.put("/reviews/:id/moderate",     asyncHandler(moderateReview));
router.delete("/reviews/:id",           asyncHandler(deleteReview));

// ---------------------------------------------------------------------------
// Contact messages management
// ---------------------------------------------------------------------------
router.get("/contacts",                 asyncHandler(listContacts));
router.get("/contacts/:id",             asyncHandler(getContactMsg));
router.put("/contacts/:id/reply",       asyncHandler(replyToContact));
router.put("/contacts/:id/archive",     asyncHandler(archiveContact));
router.delete("/contacts/:id",          asyncHandler(deleteContactMsg));

// ---------------------------------------------------------------------------
// Placement management
// ---------------------------------------------------------------------------

// Highlights (carousel) — reorder must be before /:id to avoid route conflict
router.get("/placement/highlights",              asyncHandler(listPlacementHighlights));
router.post("/placement/highlights",             asyncHandler(addPlacementHighlight));
router.put("/placement/highlights/reorder",      asyncHandler(reorderPlacementHighlights));
router.put("/placement/highlights/:id",          asyncHandler(updatePlacementHighlight));
router.delete("/placement/highlights/:id",       asyncHandler(removePlacementHighlight));

// Featured products (destaques)
router.get("/placement/featured",                asyncHandler(listPlacementFeatured));
router.post("/placement/featured",               asyncHandler(addPlacementFeatured));
router.delete("/placement/featured/:id",         asyncHandler(removePlacementFeatured));

// Campaign products
router.get("/placement/campaigns",               asyncHandler(listPlacementCampaigns));
router.put("/placement/campaigns/:id/banner",    asyncHandler(updatePlacementCampaignBanner));
router.post("/placement/campaigns/:id/products", asyncHandler(addPlacementCampaignProduct));
router.delete("/placement/campaigns/:id/products/:productId", asyncHandler(removePlacementCampaignProduct));

export default router;
