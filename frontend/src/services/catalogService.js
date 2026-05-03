import { api } from "../lib/api.js";

const fallbackImage =
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80";

const toSlug = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getItems = (payload) => payload?.items ?? payload ?? [];

const normalizeSubcategory = (subcategory) => {
  if (typeof subcategory === "string") {
    return { name: subcategory, slug: toSlug(subcategory) };
  }

  const name = subcategory?.name || subcategory?.label || subcategory?.slug || "Linha";
  return {
    ...subcategory,
    name,
    slug: subcategory?.slug || toSlug(name)
  };
};

const normalizeCategory = (category) => ({
  ...category,
  name: category?.name || "Categoria",
  description: category?.description || "Equipamento e acessórios para treinar melhor.",
  subcategories: Array.isArray(category?.subcategories)
    ? category.subcategories.map(normalizeSubcategory)
    : []
});

const normalizeCampaignMeta = (campaign) => ({
  ...campaign,
  title: campaign?.title || campaign?.bannerTitle || campaign?.name || "Campanha",
  description:
    campaign?.bannerCopy || campaign?.description || "Descubra oportunidades em destaque.",
  badge: campaign?.badge || "Oferta"
});

const normalizeProduct = (product) => {
  const originalPrice = Number(product?.originalPrice ?? product?.price ?? 0);
  const finalPrice = Number(product?.discountPrice ?? product?.price ?? 0);
  const savingsAmount = originalPrice > finalPrice ? originalPrice - finalPrice : 0;
  const discountPercent =
    product?.discountPercent ??
    (originalPrice > finalPrice && finalPrice > 0
      ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
      : 0);

  return {
    ...product,
    brand: product?.brand || "Sports Club",
    description:
      product?.description || "Equipamento técnico preparado para treino e performance.",
    image: product?.image || fallbackImage,
    price: finalPrice,
    originalPrice,
    savingsAmount,
    discountPercent,
    rating: typeof product?.rating === "number" ? product.rating : null,
    stock: Number(product?.stock ?? 0),
    unit: product?.unit || "un.",
    category: product?.category ? normalizeCategory(product.category) : null,
    campaigns: Array.isArray(product?.campaigns)
      ? product.campaigns.map(normalizeCampaignMeta)
      : []
  };
};

const sortProducts = (products, sort = "relevance") => {
  const next = [...products];

  switch (sort) {
    case "price_asc":
      next.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      next.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      next.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
      break;
    default:
      next.sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0));
      break;
  }

  return next;
};

const normalizeCampaignsWithProducts = (campaigns, products) =>
  campaigns.map((campaign) => {
    const meta = normalizeCampaignMeta(campaign);
    return {
      ...meta,
      products: products.filter((product) =>
        product.campaigns.some((linkedCampaign) => linkedCampaign.slug === meta.slug)
      )
    };
  });

export const catalogService = {
  async getHome() {
    const { data } = await api.get("/homepage");

    const categories = (data?.categories ?? []).map(normalizeCategory);
    const campaigns = (data?.campaigns ?? []).map(normalizeCampaignMeta);
    const featuredProducts = (data?.featuredProducts ?? []).map(normalizeProduct);
    const spotlightProducts = (data?.spotlightProducts ?? []).map(normalizeProduct);
    const carouselHighlights = (data?.carouselHighlights ?? []).filter((h) => h.active);
    const siteTexts = data?.siteTexts ?? {};

    const t = (section, key, fallback = "") => siteTexts?.[section]?.[key] || fallback;

    return {
      hero: {
        eyebrow: data?.hero?.eyebrow || t("hero", "eyebrow", "Nova época Sports Club"),
        title: data?.hero?.title || t("hero", "title", "Treino, competição e outdoor no mesmo storefront."),
        description: data?.hero?.description || t("hero", "description", "A nossa dedicação para lhe dar os melhores produtos, sempre aos preços mais baixos."),
        primaryAction: { label: t("hero", "action_primary", "Explorar catálogo"), href: "/produtos" },
        secondaryAction: { label: t("hero", "action_secondary", "Ver promoções"), href: "/promocoes" }
      },
      siteTexts,
      campaigns,
      categories,
      carouselHighlights,
      collections: {
        highlights: featuredProducts,
        campaignPicks: spotlightProducts
      }
    };
  },

  async getProducts(params = {}) {
    const { data } = await api.get("/products", {
      params: {
        search: params.search || undefined,
        category: params.category || undefined,
        promotions: params.promotions ? "true" : undefined
      }
    });

    return sortProducts(getItems(data).map(normalizeProduct), params.sort);
  },

  async getProduct(slug) {
    const { data } = await api.get(`/products/${slug}`);
    const product = normalizeProduct(data);

    const relatedProducts = product.category?.slug
      ? await this.getProducts({ category: product.category.slug })
      : [];

    return {
      product,
      relatedProducts: relatedProducts.filter((item) => item.slug !== slug).slice(0, 4)
    };
  },

  async getCategories() {
    const { data } = await api.get("/categories");
    return getItems(data).map(normalizeCategory);
  },

  async getCategory(slug) {
    const [categories, products] = await Promise.all([
      this.getCategories(),
      this.getProducts({ category: slug })
    ]);

    const category = categories.find((item) => item.slug === slug);
    if (!category) {
      throw new Error("Categoria não encontrada");
    }

    return {
      category,
      products
    };
  },

  async getCampaigns() {
    const [{ data: campaignsData }, promoProducts] = await Promise.all([
      api.get("/campaigns"),
      this.getProducts({ promotions: true })
    ]);

    return normalizeCampaignsWithProducts(getItems(campaignsData), promoProducts);
  },

  async getReviews(slug) {
    const { data } = await api.get(`/products/${slug}/reviews`);
    return data.reviews ?? [];
  },

  async createReview(slug, { rating, comment }) {
    const { data } = await api.post(`/products/${slug}/reviews`, { rating, comment });
    return data;
  },

  async updateReview(id, { rating, comment }) {
    const { data } = await api.put(`/reviews/${id}`, { rating, comment });
    return data;
  },

  async deleteReview(id) {
    const { data } = await api.delete(`/reviews/${id}`);
    return data;
  }
};
