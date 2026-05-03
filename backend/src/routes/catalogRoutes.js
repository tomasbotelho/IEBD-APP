import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createProductReview,
  deleteProductReview,
  getProduct,
  getSiteTexts,
  homepage,
  listCampaigns,
  listCategories,
  listProductReviews,
  listProducts,
  submitContact,
  updateProductReview
} from "../controllers/catalogController.js";
import { trackView } from "../controllers/adminController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/homepage", asyncHandler(homepage));
router.get("/site-texts", asyncHandler(getSiteTexts));
router.get("/categories", asyncHandler(listCategories));
router.get("/campaigns", asyncHandler(listCampaigns));
router.get("/products", asyncHandler(listProducts));
router.get("/products/:slug", asyncHandler(getProduct));
router.get("/products/:slug/reviews", asyncHandler(listProductReviews));
router.post("/products/:slug/reviews", requireAuth, asyncHandler(createProductReview));
router.put("/reviews/:id", requireAuth, asyncHandler(updateProductReview));
router.delete("/reviews/:id", requireAuth, asyncHandler(deleteProductReview));
// Track product views for "Product of the Day" dashboard widget
router.post("/products/:id/view", asyncHandler(trackView));
// Public contact form submission
router.post("/contact", asyncHandler(submitContact));

export default router;

