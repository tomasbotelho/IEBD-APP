import { z } from "zod";
import { adminService } from "../services/adminService.js";
import { AppError } from "../utils/appError.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const parsePeriod = (query) => {
  const p = String(query.period || "30d");
  return ["7d", "30d", "12m"].includes(p) ? p : "30d";
};

const parseId = (params) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) throw new AppError("ID inválido.", 400);
  return id;
};

// CSV generation
const toCSV = (rows, columns) => {
  const header = columns.map((c) => `"${c.label}"`).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const val = row[c.key] ?? "";
          return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val;
        })
        .join(",")
    )
    .join("\n");
  return `${header}\n${body}`;
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const getDashboardStats = async (req, res) => {
  const period = parsePeriod(req.query);
  const data = await adminService.getDashboardStats(period);
  res.json({ ok: true, data });
};

export const getBestSellers = async (req, res) => {
  const period = parsePeriod(req.query);
  const data = await adminService.getBestSellers(period);
  res.json({ ok: true, data });
};

export const getRevenueChart = async (req, res) => {
  const period = parsePeriod(req.query);
  const data = await adminService.getRevenueChart(period);
  res.json({ ok: true, data });
};

export const getOrdersChart = async (req, res) => {
  const period = parsePeriod(req.query);
  const data = await adminService.getOrdersChart(period);
  res.json({ ok: true, data });
};

export const getHighlights = async (_req, res) => {
  const data = await adminService.listHighlights();
  res.json({ ok: true, data });
};

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const productSchema = z.object({
  name: z.string().min(2, "O nome é obrigatório."),
  description: z.string().optional().default(""),
  price: z.coerce.number().positive("O preço deve ser positivo."),
  costPrice: z.coerce.number().min(0).optional().default(0),
  stockStore: z.coerce.number().int().min(0).optional().default(0),
  stockWarehouse: z.coerce.number().int().min(0).optional().default(0),
  imageUrl: z.string().optional().default(""),
  categoryId: z.coerce.number().int().positive("Escolha uma categoria."),
  campaignId: z.coerce.number().int().positive().optional().nullable(),
  highlight: z
    .object({
      title: z.string().optional().default(""),
      subtitle: z.string().optional().default(""),
      active: z.boolean().optional().default(true),
      sortOrder: z.coerce.number().int().optional().default(0)
    })
    .optional()
    .nullable()
});

export const listProducts = async (req, res) => {
  const data = await adminService.listAdminProducts({
    search: req.query.search || "",
    categoryId: req.query.category || null,
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 50)
  });
  res.json({ ok: true, ...data });
};

export const getProduct = async (req, res) => {
  const id = parseId(req.params);
  const data = await adminService.getAdminProduct(id);
  res.json({ ok: true, data });
};

export const createProduct = async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Dados inválidos.", 400, parsed.error.flatten().fieldErrors);
  }
  const data = await adminService.createProduct(parsed.data);
  res.status(201).json({ ok: true, data });
};

export const updateProduct = async (req, res) => {
  const id = parseId(req.params);
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Dados inválidos.", 400, parsed.error.flatten().fieldErrors);
  }
  const data = await adminService.updateProduct(id, parsed.data);
  res.json({ ok: true, data });
};

export const deleteProduct = async (req, res) => {
  const id = parseId(req.params);
  await adminService.deleteProduct(id);
  res.json({ ok: true, message: "Produto eliminado." });
};

export const listCategories = async (_req, res) => {
  const data = await adminService.listCategories();
  res.json({ ok: true, data });
};

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

const campaignSchema = z.object({
  name: z.string().min(2, "O nome é obrigatório."),
  discountType: z.enum(["percentage", "fixed"]).default("percentage"),
  discountValue: z.coerce.number().min(0, "O desconto não pode ser negativo."),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  bannerTitle: z.string().optional().default(""),
  bannerDescription: z.string().optional().default(""),
  description: z.string().optional().default(""),
  active: z.boolean().optional().default(true)
});

export const listCampaigns = async (_req, res) => {
  const data = await adminService.listAdminCampaigns();
  res.json({ ok: true, data });
};

export const getCampaign = async (req, res) => {
  const id = parseId(req.params);
  const data = await adminService.getAdminCampaign(id);
  res.json({ ok: true, data });
};

export const createCampaign = async (req, res) => {
  const parsed = campaignSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Dados inválidos.", 400, parsed.error.flatten().fieldErrors);
  }
  const data = await adminService.createCampaign(parsed.data);
  res.status(201).json({ ok: true, data });
};

export const updateCampaign = async (req, res) => {
  const id = parseId(req.params);
  const parsed = campaignSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Dados inválidos.", 400, parsed.error.flatten().fieldErrors);
  }
  const data = await adminService.updateCampaign(id, parsed.data);
  res.json({ ok: true, data });
};

export const deleteCampaign = async (req, res) => {
  const id = parseId(req.params);
  await adminService.deleteCampaign(id);
  res.json({ ok: true, message: "Campanha eliminada." });
};

// ---------------------------------------------------------------------------
// Site Texts
// ---------------------------------------------------------------------------

const siteTextSchema = z.object({
  sectionKey: z.string().min(1),
  contentKey: z.string().min(1),
  lang: z.enum(["pt", "en"]).default("pt"),
  content: z.string().min(1, "O conteúdo não pode estar vazio.")
});

export const listSiteTexts = async (_req, res) => {
  const data = await adminService.listSiteTexts();
  res.json({ ok: true, data });
};

export const createSiteText = async (req, res) => {
  const parsed = siteTextSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Dados inválidos.", 400, parsed.error.flatten().fieldErrors);
  }
  const data = await adminService.createSiteText(parsed.data);
  res.status(201).json({ ok: true, data });
};

export const updateSiteText = async (req, res) => {
  const id = parseId(req.params);
  const { content } = req.body;
  if (!content || typeof content !== "string") {
    throw new AppError("O conteúdo não pode estar vazio.", 400);
  }
  const data = await adminService.updateSiteText(id, { content });
  res.json({ ok: true, data });
};

export const deleteSiteText = async (req, res) => {
  const id = parseId(req.params);
  await adminService.deleteSiteText(id);
  res.json({ ok: true, message: "Texto eliminado (todas as línguas)." });
};

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------

const VALID_BANNER_PAGES = ["home", "produtos", "promocoes", "categoria", "pesquisa", "carrinho", "conta"];

const bannerSchema = z.object({
  pageSlug: z.enum(VALID_BANNER_PAGES, { message: "Página inválida." }),
  title: z.string().optional().default(""),
  subtitle: z.string().optional().default(""),
  imageUrl: z.string().refine(
    (url) => !url || url.startsWith("/media/uploads/"),
    "Imagem deve ser uma URL local de upload."
  ).optional().default(""),
  active: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int("Ordem deve ser um número inteiro.").min(1, "Ordem deve ser no mínimo 1.").optional().default(1)
});

export const listBanners = async (_req, res) => {
  const data = await adminService.listBanners();
  res.json({ ok: true, data });
};

export const createBanner = async (req, res) => {
  const parsed = bannerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Dados inválidos.", 400, parsed.error.flatten().fieldErrors);
  }
  const data = await adminService.createBanner(parsed.data);
  res.status(201).json({ ok: true, data });
};

export const updateBanner = async (req, res) => {
  const id = parseId(req.params);
  const parsed = bannerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Dados inválidos.", 400, parsed.error.flatten().fieldErrors);
  }
  const data = await adminService.updateBanner(id, parsed.data);
  res.json({ ok: true, data });
};

export const deleteBanner = async (req, res) => {
  const id = parseId(req.params);
  await adminService.deleteBanner(id);
  res.json({ ok: true, message: "Banner eliminado." });
};

export const getBannerPages = async (_req, res) => {
  const data = await adminService.getBannerPages();
  res.json({ ok: true, data });
};

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

const REPORT_COLUMNS = {
  sales: [
    { key: "date", label: "Data" },
    { key: "orderId", label: "Pedido Nº" },
    { key: "customer", label: "Cliente" },
    { key: "email", label: "Email" },
    { key: "total", label: "Total (€)" },
    { key: "status", label: "Estado" }
  ],
  revenue: [
    { key: "date", label: "Data" },
    { key: "revenue", label: "Receita (€)" },
    { key: "cost", label: "Custo (€)" },
    { key: "profit", label: "Lucro (€)" },
    { key: "orders", label: "Pedidos" }
  ],
  orders: [
    { key: "orderId", label: "Pedido Nº" },
    { key: "date", label: "Data" },
    { key: "customer", label: "Cliente" },
    { key: "total", label: "Total (€)" },
    { key: "status", label: "Estado" },
    { key: "paymentMethod", label: "Pagamento" }
  ],
  products: [
    { key: "name", label: "Produto" },
    { key: "category", label: "Categoria" },
    { key: "unitsSold", label: "Unidades Vendidas" },
    { key: "revenue", label: "Receita (€)" },
    { key: "profit", label: "Lucro (€)" },
    { key: "currentStock", label: "Stock Atual" }
  ],
  campaigns: [
    { key: "name", label: "Campanha" },
    { key: "discount", label: "Desconto (%)" },
    { key: "productsInCampaign", label: "Produtos" },
    { key: "unitsSold", label: "Unidades Vendidas" },
    { key: "revenue", label: "Receita (€)" }
  ]
};

const getReportData = async (type, query) => {
  const params = { period: parsePeriod(query), from: query.from, to: query.to };
  switch (type) {
    case "sales": return adminService.getSalesReport(params);
    case "revenue": return adminService.getRevenueReport(params);
    case "orders": return adminService.getOrdersReport(params);
    case "products": return adminService.getProductsReport(params);
    case "campaigns": return adminService.getCampaignsReport(params);
    default: throw new AppError("Tipo de relatório inválido.", 400);
  }
};

export const downloadReport = async (req, res) => {
  const { type } = req.params;
  const { format = "csv" } = req.query;
  const validTypes = ["sales", "revenue", "orders", "products", "campaigns"];

  if (!validTypes.includes(type)) throw new AppError("Tipo de relatório inválido.", 400);

  const rows = await getReportData(type, req.query);
  const columns = REPORT_COLUMNS[type];

  if (format === "csv") {
    const csv = toCSV(rows, columns);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="relatorio-${type}-${Date.now()}.csv"`);
    return res.send("\uFEFF" + csv); // BOM for Excel UTF-8 detection
  }

  res.json({ ok: true, type, columns, rows, generatedAt: new Date().toISOString() });
};

// ---------------------------------------------------------------------------
// View tracking (called from product page, no auth required)
// ---------------------------------------------------------------------------

export const trackView = async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isInteger(id) && id > 0) {
    await adminService.trackProductView(id);
  }
  res.json({ ok: true });
};

// ---------------------------------------------------------------------------
// Admin Orders Management
// ---------------------------------------------------------------------------

export const listOrders = async (req, res) => {
  const data = await adminService.listAdminOrders({
    status: req.query.status || "",
    search: req.query.search || "",
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 40)
  });
  res.json({ ok: true, ...data });
};

export const getOrder = async (req, res) => {
  const id = parseId(req.params);
  const data = await adminService.getAdminOrder(id);
  res.json({ ok: true, data });
};

export const updateOrderStatus = async (req, res) => {
  const id = parseId(req.params);
  const { statusId, cancelReason } = req.body;
  if (!statusId) throw new AppError("statusId é obrigatório.", 400);
  const data = await adminService.updateAdminOrderStatus(id, { statusId, cancelReason });
  res.json({ ok: true, data });
};

// ---------------------------------------------------------------------------
// Reviews Management
// ---------------------------------------------------------------------------

export const listReviews = async (req, res) => {
  const data = await adminService.listAdminReviews({
    productId: req.query.productId || "",
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 40),
    filter: req.query.filter || "all"
  });
  res.json({ ok: true, ...data });
};

export const replyToReview = async (req, res) => {
  const id = parseId(req.params);
  const { reply } = req.body;
  if (!reply || typeof reply !== "string") throw new AppError("A resposta não pode estar vazia.", 400);
  const data = await adminService.replyToReview(id, { reply });
  res.json({ ok: true, data });
};

export const moderateReview = async (req, res) => {
  const id = parseId(req.params);
  const { isOffensive, isVisible } = req.body;
  const data = await adminService.moderateReview(id, { isOffensive, isVisible });
  res.json({ ok: true, data });
};

export const deleteReview = async (req, res) => {
  const id = parseId(req.params);
  await adminService.deleteReview(id);
  res.json({ ok: true, message: "Avaliação eliminada." });
};

// ---------------------------------------------------------------------------
// Contact Messages Management
// ---------------------------------------------------------------------------

export const listContacts = async (req, res) => {
  const data = await adminService.listContacts({
    filter: req.query.filter || "all",
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 40)
  });
  res.json({ ok: true, ...data });
};

export const getContactMsg = async (req, res) => {
  const id = parseId(req.params);
  const data = await adminService.getContact(id);
  res.json({ ok: true, data });
};

export const replyToContact = async (req, res) => {
  const id = parseId(req.params);
  const { reply } = req.body;
  if (!reply || typeof reply !== "string") throw new AppError("A resposta não pode estar vazia.", 400);
  const data = await adminService.replyToContact(id, { reply });
  res.json({ ok: true, data });
};

export const archiveContact = async (req, res) => {
  const id = parseId(req.params);
  const { archived } = req.body;
  await adminService.archiveContact(id, { archived: Boolean(archived) });
  res.json({ ok: true, message: archived ? "Arquivado." : "Restaurado." });
};

export const deleteContactMsg = async (req, res) => {
  const id = parseId(req.params);
  await adminService.deleteContact(id);
  res.json({ ok: true, message: "Mensagem eliminada." });
};

// ---------------------------------------------------------------------------
// Placement — Highlights (carousel)
// ---------------------------------------------------------------------------

export const listPlacementHighlights = async (_req, res) => {
  const data = await adminService.listHighlights();
  res.json({ ok: true, data });
};

export const addPlacementHighlight = async (req, res) => {
  const { productId, title, subtitle } = req.body;
  if (!productId) throw new AppError("productId é obrigatório.", 400);
  const data = await adminService.addHighlight({ productId, title, subtitle });
  res.json({ ok: true, data });
};

export const updatePlacementHighlight = async (req, res) => {
  const id = parseId(req.params);
  const { title, subtitle, active } = req.body;
  const data = await adminService.updateHighlight(id, { title, subtitle, active });
  res.json({ ok: true, data });
};

export const removePlacementHighlight = async (req, res) => {
  const id = parseId(req.params);
  const data = await adminService.removeHighlight(id);
  res.json({ ok: true, data });
};

export const reorderPlacementHighlights = async (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) throw new AppError("orderedIds deve ser um array.", 400);
  const data = await adminService.reorderHighlights(orderedIds);
  res.json({ ok: true, data });
};

// ---------------------------------------------------------------------------
// Placement — Featured (destaques)
// ---------------------------------------------------------------------------

export const listPlacementFeatured = async (_req, res) => {
  const data = await adminService.listFeaturedSlots();
  res.json({ ok: true, data });
};

export const addPlacementFeatured = async (req, res) => {
  const { productId } = req.body;
  if (!productId) throw new AppError("productId é obrigatório.", 400);
  const data = await adminService.addFeaturedSlot({ productId });
  res.json({ ok: true, data });
};

export const removePlacementFeatured = async (req, res) => {
  const id = parseId(req.params);
  const data = await adminService.removeFeaturedSlot(id);
  res.json({ ok: true, data });
};

// ---------------------------------------------------------------------------
// Placement — Campaign products
// ---------------------------------------------------------------------------

export const listPlacementCampaigns = async (_req, res) => {
  const data = await adminService.listCampaignsWithProducts();
  res.json({ ok: true, data });
};

export const updatePlacementCampaignBanner = async (req, res) => {
  const id = parseId(req.params);
  const { bannerTitle, bannerCopy } = req.body;
  await adminService.updateCampaignBannerFields(id, { bannerTitle, bannerCopy });
  res.json({ ok: true });
};

export const addPlacementCampaignProduct = async (req, res) => {
  const campaignId = parseId(req.params);
  const { productId } = req.body;
  if (!productId) throw new AppError("productId é obrigatório.", 400);
  const data = await adminService.addProductToCampaign(campaignId, { productId });
  res.json({ ok: true, data });
};

export const removePlacementCampaignProduct = async (req, res) => {
  const campaignId = parseId(req.params);
  const productId = Number(req.params.productId);
  if (!Number.isInteger(productId) || productId < 1) throw new AppError("ID de produto inválido.", 400);
  await adminService.removeProductFromCampaign(campaignId, productId);
  res.json({ ok: true });
};
