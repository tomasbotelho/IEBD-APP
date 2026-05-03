import crypto from "crypto";
import slugify from "slugify";
import { env } from "../config/env.js";
import { getPool } from "../config/db.js";
import { AppError } from "../utils/appError.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const buildMediaUrl = (value = "") => {
  const source = String(value || "").trim();
  if (!source) return "";
  if (/^https?:\/\//i.test(source)) return source;
  const normalized = source.replace(/\\/g, "/").replace(/^\/+/, "").replace(/^fotos\//, "");
  return `http://localhost:${env.port}/media/${normalized}`;
};

const toSlug = (value = "") =>
  slugify(String(value || "").trim(), { lower: true, strict: true, locale: "pt" });

const requirePool = () => {
  const pool = getPool();
  if (!pool) throw new AppError("O painel de administração requer USE_FAKE_DB=false no .env.", 503);
  return pool;
};

const getPeriodInterval = (period) => {
  if (period === "7d") return "7 DAY";
  if (period === "12m") return "12 MONTH";
  return "30 DAY";
};

const getDateGroupExpr = (period, column) =>
  period === "12m"
    ? `DATE_FORMAT(${column}, '%Y-%m')`
    : `DATE(${column})`;

// Auto-translate using MyMemory free API (no key required for moderate usage)
const autoTranslate = async (text, from = "pt", to = "en") => {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.responseData?.translatedText || null;
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Dashboard analytics
// ---------------------------------------------------------------------------

const getDashboardStats = async (period = "30d") => {
  const pool = requirePool();
  const interval = getPeriodInterval(period);

  const [[pendingRow]] = await pool.query(`
    SELECT COUNT(*) AS count FROM encomendas WHERE idEstado NOT IN (2, 4)
  `);

  const [[todayRow]] = await pool.query(`
    SELECT
      COALESCE(SUM(f.PrecoTotal), 0) AS revenue,
      COALESCE(SUM(de.qntd * COALESCE(p.precoImport, 0)), 0) AS cost
    FROM faturasencomendas f
    JOIN encomendas e ON e.idEncomenda = f.IDEncomenda
    JOIN detalhesencomenda de ON de.idEnc = e.idEncomenda
    JOIN produtos p ON p.idProd = de.idProd
    WHERE DATE(f.DataHoraFatura) = CURDATE() AND e.idEstado != 4
  `);

  const [[periodRow]] = await pool.query(`
    SELECT
      COALESCE(SUM(f.PrecoTotal), 0) AS total_revenue,
      COALESCE(SUM(de.qntd * COALESCE(p.precoImport, 0)), 0) AS total_cost,
      COUNT(DISTINCT e.idEncomenda) AS total_orders
    FROM faturasencomendas f
    JOIN encomendas e ON e.idEncomenda = f.IDEncomenda
    JOIN detalhesencomenda de ON de.idEnc = e.idEncomenda
    JOIN produtos p ON p.idProd = de.idProd
    WHERE f.DataHoraFatura >= DATE_SUB(NOW(), INTERVAL ${interval}) AND e.idEstado != 4
  `);

  let productOfDay = null;
  try {
    const [[podRow]] = await pool.query(`
      SELECT pv.produto_id, p.nomeProd AS name, p.URL_Foto AS image_url,
             COUNT(*) AS views
      FROM produto_vistas pv
      JOIN produtos p ON p.idProd = pv.produto_id
      WHERE DATE(pv.viewed_at) = CURDATE()
      GROUP BY pv.produto_id, p.nomeProd, p.URL_Foto
      ORDER BY views DESC LIMIT 1
    `);
    if (podRow) {
      productOfDay = {
        id: Number(podRow.produto_id),
        name: podRow.name,
        image: buildMediaUrl(podRow.image_url),
        views: Number(podRow.views)
      };
    }
  } catch {
    // produto_vistas table may not exist yet — silently skip
  }

  const todayRevenue = Number(todayRow.revenue || 0);
  const todayCost = Number(todayRow.cost || 0);
  const totalRevenue = Number(periodRow.total_revenue || 0);
  const totalCost = Number(periodRow.total_cost || 0);

  return {
    pendingOrders: Number(pendingRow.count || 0),
    todayRevenue,
    todayProfit: todayRevenue - todayCost,
    productOfDay,
    period: {
      totalRevenue,
      totalProfit: totalRevenue - totalCost,
      totalOrders: Number(periodRow.total_orders || 0)
    }
  };
};

const getBestSellers = async (period = "30d") => {
  const pool = requirePool();
  const interval = getPeriodInterval(period);

  const [rows] = await pool.query(`
    SELECT
      p.idProd AS id,
      p.nomeProd AS name,
      p.URL_Foto AS image_url,
      SUM(de.qntd) AS units_sold,
      SUM(de.PrecoLi) AS revenue
    FROM detalhesencomenda de
    JOIN encomendas e ON e.idEncomenda = de.idEnc
    JOIN produtos p ON p.idProd = de.idProd
    WHERE e.DataHoraPedido >= DATE_SUB(NOW(), INTERVAL ${interval})
      AND e.idEstado != 4
    GROUP BY p.idProd, p.nomeProd, p.URL_Foto
    ORDER BY units_sold DESC
    LIMIT 10
  `);

  return rows.map((r) => ({
    id: Number(r.id),
    name: r.name,
    image: buildMediaUrl(r.image_url),
    unitsSold: Number(r.units_sold || 0),
    revenue: Number(r.revenue || 0)
  }));
};

const getRevenueChart = async (period = "30d") => {
  const pool = requirePool();
  const interval = getPeriodInterval(period);
  const groupExpr = getDateGroupExpr(period, "f.DataHoraFatura");

  const [rows] = await pool.query(`
    SELECT
      ${groupExpr} AS date_label,
      COALESCE(SUM(f.PrecoTotal), 0) AS revenue,
      COALESCE(SUM(de.qntd * COALESCE(p.precoImport, 0)), 0) AS cost
    FROM faturasencomendas f
    JOIN encomendas e ON e.idEncomenda = f.IDEncomenda
    JOIN detalhesencomenda de ON de.idEnc = e.idEncomenda
    JOIN produtos p ON p.idProd = de.idProd
    WHERE f.DataHoraFatura >= DATE_SUB(NOW(), INTERVAL ${interval})
      AND e.idEstado != 4
    GROUP BY date_label
    ORDER BY date_label ASC
  `);

  return rows.map((r) => ({
    date: r.date_label,
    revenue: Number(r.revenue || 0),
    profit: Number(r.revenue || 0) - Number(r.cost || 0)
  }));
};

const getOrdersChart = async (period = "30d") => {
  const pool = requirePool();
  const interval = getPeriodInterval(period);
  const groupExpr = getDateGroupExpr(period, "e.DataHoraPedido");

  const [rows] = await pool.query(`
    SELECT
      ${groupExpr} AS date_label,
      COUNT(*) AS orders
    FROM encomendas e
    WHERE e.DataHoraPedido >= DATE_SUB(NOW(), INTERVAL ${interval})
      AND e.idEstado != 4
    GROUP BY date_label
    ORDER BY date_label ASC
  `);

  return rows.map((r) => ({
    date: r.date_label,
    orders: Number(r.orders || 0)
  }));
};

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const listAdminProducts = async ({ search = "", categoryId = null, page = 1, limit = 50 } = {}) => {
  const pool = requirePool();
  const offset = (Number(page) - 1) * Number(limit);
  const params = [];
  const where = ["1=1"];

  if (search) {
    where.push("(p.nomeProd LIKE ? OR p.descricao LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (categoryId) {
    where.push("p.IDDesporto = ?");
    params.push(Number(categoryId));
  }

  const [rows] = await pool.query(
    `
    SELECT
      p.idProd AS id,
      p.nomeProd AS name,
      p.descricao AS description,
      p.precoVenda AS price,
      p.precoImport AS cost_price,
      p.stock_loja AS stock_store,
      p.stock_armazem AS stock_warehouse,
      p.URL_Foto AS image_url,
      p.IDDesporto AS category_id,
      d.Nome AS category_name,
      f.nome AS supplier_name,
      EXISTS(SELECT 1 FROM destaques ds WHERE ds.IDProduto = p.idProd) AS featured,
      EXISTS(SELECT 1 FROM produto_highlight ph WHERE ph.produto_id = p.idProd AND ph.active = 1) AS highlighted
    FROM produtos p
    LEFT JOIN desportos d ON d.IDDesporto = p.IDDesporto
    LEFT JOIN fornecedor f ON f.idForn = p.idForn
    WHERE ${where.join(" AND ")}
    ORDER BY p.idProd DESC
    LIMIT ? OFFSET ?
    `,
    [...params, Number(limit), offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM produtos p WHERE ${where.join(" AND ")}`,
    params
  );

  return {
    products: rows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      description: r.description,
      price: Number(r.price || 0),
      costPrice: Number(r.cost_price || 0),
      stockStore: Number(r.stock_store || 0),
      stockWarehouse: Number(r.stock_warehouse || 0),
      stock: Number(r.stock_store || 0) + Number(r.stock_warehouse || 0),
      image: buildMediaUrl(r.image_url),
      imageUrl: r.image_url || "",
      categoryId: Number(r.category_id || 0),
      categoryName: r.category_name || "",
      supplierName: r.supplier_name || "",
      featured: Boolean(r.featured),
      highlighted: Boolean(r.highlighted)
    })),
    total: Number(total || 0),
    page: Number(page),
    pages: Math.ceil(Number(total || 0) / Number(limit))
  };
};

const getAdminProduct = async (id) => {
  const pool = requirePool();

  const [[row]] = await pool.query(
    `
    SELECT
      p.idProd AS id, p.nomeProd AS name, p.descricao AS description,
      p.precoVenda AS price, p.precoImport AS cost_price,
      p.stock_loja AS stock_store, p.stock_armazem AS stock_warehouse,
      p.URL_Foto AS image_url, p.IDDesporto AS category_id,
      d.Nome AS category_name, f.nome AS supplier_name,
      ph.highlight_title, ph.highlight_subtitle,
      ph.active AS highlight_active, ph.sort_order AS highlight_order,
      EXISTS(SELECT 1 FROM destaques ds WHERE ds.IDProduto = p.idProd) AS featured
    FROM produtos p
    LEFT JOIN desportos d ON d.IDDesporto = p.IDDesporto
    LEFT JOIN fornecedor f ON f.idForn = p.idForn
    LEFT JOIN produto_highlight ph ON ph.produto_id = p.idProd
    WHERE p.idProd = ?
    `,
    [Number(id)]
  );

  if (!row) throw new AppError("Produto não encontrado.", 404);

  const [campaigns] = await pool.query(
    `
    SELECT pc.IDCampanha AS campaign_id, c.nome AS campaign_name
    FROM prod_campanha pc
    JOIN campanha c ON c.idCamp = pc.IDCampanha
    WHERE pc.IDProd = ?
    `,
    [Number(id)]
  );

  return {
    id: Number(row.id),
    name: row.name,
    description: row.description,
    price: Number(row.price || 0),
    costPrice: Number(row.cost_price || 0),
    stockStore: Number(row.stock_store || 0),
    stockWarehouse: Number(row.stock_warehouse || 0),
    image: buildMediaUrl(row.image_url),
    imageUrl: row.image_url || "",
    categoryId: Number(row.category_id || 0),
    categoryName: row.category_name || "",
    featured: Boolean(row.featured),
    highlight: row.highlight_title != null
      ? {
          title: row.highlight_title,
          subtitle: row.highlight_subtitle,
          active: Boolean(row.highlight_active),
          sortOrder: Number(row.highlight_order || 0)
        }
      : null,
    campaignIds: campaigns.map((c) => Number(c.campaign_id))
  };
};

const createProduct = async (data) => {
  const pool = requirePool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `
      INSERT INTO produtos (nomeProd, descricao, precoVenda, precoImport, stock_loja, stock_armazem, URL_Foto, IDDesporto)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.name,
        data.description || "",
        Number(data.price),
        Number(data.costPrice || 0),
        Number(data.stockStore || 0),
        Number(data.stockWarehouse || 0),
        data.imageUrl || "",
        Number(data.categoryId)
      ]
    );

    const productId = Number(result.insertId);

    if (data.campaignId) {
      await conn.query(
        `INSERT IGNORE INTO prod_campanha (IDProd, IDCampanha) VALUES (?, ?)`,
        [productId, Number(data.campaignId)]
      );
    }

    if (data.highlight) {
      await conn.query(
        `
        INSERT INTO produto_highlight (produto_id, highlight_title, highlight_subtitle, active, sort_order)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE highlight_title=VALUES(highlight_title), highlight_subtitle=VALUES(highlight_subtitle),
          active=VALUES(active), sort_order=VALUES(sort_order)
        `,
        [
          productId,
          data.highlight.title || "",
          data.highlight.subtitle || "",
          data.highlight.active ? 1 : 0,
          Number(data.highlight.sortOrder || 0)
        ]
      );
    }

    await conn.commit();
    return getAdminProduct(productId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const updateProduct = async (id, data) => {
  const pool = requirePool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `
      UPDATE produtos
      SET nomeProd = ?, descricao = ?, precoVenda = ?, precoImport = ?,
          stock_loja = ?, stock_armazem = ?, URL_Foto = ?, IDDesporto = ?
      WHERE idProd = ?
      `,
      [
        data.name,
        data.description || "",
        Number(data.price),
        Number(data.costPrice || 0),
        Number(data.stockStore || 0),
        Number(data.stockWarehouse || 0),
        data.imageUrl || "",
        Number(data.categoryId),
        Number(id)
      ]
    );

    // Sync campaign
    await conn.query(`DELETE FROM prod_campanha WHERE IDProd = ?`, [Number(id)]);
    if (data.campaignId) {
      await conn.query(
        `INSERT IGNORE INTO prod_campanha (IDProd, IDCampanha) VALUES (?, ?)`,
        [Number(id), Number(data.campaignId)]
      );
    }

    // Sync highlight
    if (data.highlight) {
      await conn.query(
        `
        INSERT INTO produto_highlight (produto_id, highlight_title, highlight_subtitle, active, sort_order)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE highlight_title=VALUES(highlight_title), highlight_subtitle=VALUES(highlight_subtitle),
          active=VALUES(active), sort_order=VALUES(sort_order)
        `,
        [
          Number(id),
          data.highlight.title || "",
          data.highlight.subtitle || "",
          data.highlight.active ? 1 : 0,
          Number(data.highlight.sortOrder || 0)
        ]
      );
    } else {
      await conn.query(`DELETE FROM produto_highlight WHERE produto_id = ?`, [Number(id)]);
    }

    await conn.commit();
    return getAdminProduct(id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const deleteProduct = async (id) => {
  const pool = requirePool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`DELETE FROM produto_highlight WHERE produto_id = ?`, [Number(id)]);
    await conn.query(`DELETE FROM prod_campanha WHERE IDProd = ?`, [Number(id)]);
    await conn.query(`DELETE FROM produto_vistas WHERE produto_id = ?`, [Number(id)]);
    await conn.query(`DELETE FROM destaques WHERE IDProduto = ?`, [Number(id)]);
    await conn.query(`DELETE FROM produtos WHERE idProd = ?`, [Number(id)]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const listCategories = async () => {
  const pool = requirePool();
  const [rows] = await pool.query(
    `SELECT IDDesporto AS id, Nome AS name FROM desportos ORDER BY Nome`
  );
  return rows.map((r) => ({ id: Number(r.id), name: r.name }));
};

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

const listAdminCampaigns = async () => {
  const pool = requirePool();
  const [rows] = await pool.query(`
    SELECT
      c.idCamp AS id, c.nome AS name, c.desconto AS discount, c.data_inicio AS start_date,
      c.data_fim AS end_date, c.bannerTitle AS banner_title, c.bannerCopy AS banner_description,
      c.descricao AS description,
      COUNT(pc.IDProd) AS product_count
    FROM campanha c
    LEFT JOIN prod_campanha pc ON pc.IDCampanha = c.idCamp
    GROUP BY c.idCamp
    ORDER BY c.idCamp DESC
  `);

  return rows.map((r) => ({
    id: Number(r.id),
    name: r.name,
    discount: Number(r.discount || 0),
    discountType: "percentage",
    startDate: r.start_date ? new Date(r.start_date).toISOString() : null,
    endDate: r.end_date ? new Date(r.end_date).toISOString() : null,
    bannerTitle: r.banner_title || "",
    bannerDescription: r.banner_description || "",
    description: r.description || "",
    productCount: Number(r.product_count || 0),
    active: true
  }));
};

const getAdminCampaign = async (id) => {
  const pool = requirePool();
  const [[row]] = await pool.query(
    `SELECT * FROM campanha WHERE idCamp = ?`,
    [Number(id)]
  );
  if (!row) throw new AppError("Campanha não encontrada.", 404);

  const [products] = await pool.query(
    `
    SELECT p.idProd AS id, p.nomeProd AS name
    FROM prod_campanha pc
    JOIN produtos p ON p.idProd = pc.IDProd
    WHERE pc.IDCampanha = ?
    `,
    [Number(id)]
  );

  return {
    id: Number(row.idCamp),
    name: row.nome,
    discount: Number(row.desconto || 0),
    discountType: "percentage",
    startDate: row.data_inicio ? new Date(row.data_inicio).toISOString() : null,
    endDate: row.data_fim ? new Date(row.data_fim).toISOString() : null,
    bannerTitle: row.bannerTitle || "",
    bannerDescription: row.bannerCopy || "",
    description: row.descricao || "",
    products: products.map((p) => ({ id: Number(p.id), name: p.name }))
  };
};

const createCampaign = async (data) => {
  const pool = requirePool();
  const [result] = await pool.query(
    `
    INSERT INTO campanha (nome, desconto, data_inicio, data_fim, bannerTitle, bannerCopy, descricao)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.name,
      Number(data.discountValue || 0),
      data.startDate || null,
      data.endDate || null,
      data.bannerTitle || "",
      data.bannerDescription || "",
      data.description || ""
    ]
  );
  return getAdminCampaign(result.insertId);
};

const updateCampaign = async (id, data) => {
  const pool = requirePool();
  await pool.query(
    `
    UPDATE campanha
    SET nome = ?, desconto = ?, data_inicio = ?, data_fim = ?,
        bannerTitle = ?, bannerCopy = ?, descricao = ?
    WHERE idCamp = ?
    `,
    [
      data.name,
      Number(data.discountValue || 0),
      data.startDate || null,
      data.endDate || null,
      data.bannerTitle || "",
      data.bannerDescription || "",
      data.description || "",
      Number(id)
    ]
  );
  return getAdminCampaign(id);
};

const deleteCampaign = async (id) => {
  const pool = requirePool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`DELETE FROM prod_campanha WHERE IDCampanha = ?`, [Number(id)]);
    await conn.query(`DELETE FROM campanha WHERE idCamp = ?`, [Number(id)]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ---------------------------------------------------------------------------
// Site Texts
// ---------------------------------------------------------------------------

const listSiteTexts = async () => {
  const pool = requirePool();
  const [rows] = await pool.query(
    `SELECT id, section_key, content_key, lang, content, updated_at
     FROM site_texts ORDER BY section_key, content_key, lang`
  );
  return rows.map((r) => ({
    id: Number(r.id),
    sectionKey: r.section_key,
    contentKey: r.content_key,
    lang: r.lang,
    content: r.content,
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null
  }));
};

const createSiteText = async ({ sectionKey, contentKey, lang = "pt", content }) => {
  const pool = requirePool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `
      INSERT INTO site_texts (section_key, content_key, lang, content)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE content = VALUES(content), updated_at = NOW()
      `,
      [sectionKey, contentKey, lang, content]
    );

    // Auto-translate to opposite language
    const otherLang = lang === "pt" ? "en" : "pt";
    const translated = await autoTranslate(content, lang, otherLang);
    if (translated) {
      await conn.query(
        `
        INSERT INTO site_texts (section_key, content_key, lang, content)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE content = VALUES(content), updated_at = NOW()
        `,
        [sectionKey, contentKey, otherLang, translated]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  const [rows] = await pool.query(
    `SELECT id, section_key, content_key, lang, content FROM site_texts WHERE section_key=? AND content_key=?`,
    [sectionKey, contentKey]
  );
  return rows.map((r) => ({ id: Number(r.id), sectionKey: r.section_key, contentKey: r.content_key, lang: r.lang, content: r.content }));
};

const updateSiteText = async (id, { content }) => {
  const pool = requirePool();
  const [[row]] = await pool.query(`SELECT * FROM site_texts WHERE id = ?`, [Number(id)]);
  if (!row) throw new AppError("Texto não encontrado.", 404);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`UPDATE site_texts SET content = ?, updated_at = NOW() WHERE id = ?`, [content, Number(id)]);

    const otherLang = row.lang === "pt" ? "en" : "pt";
    const translated = await autoTranslate(content, row.lang, otherLang);
    if (translated) {
      await conn.query(
        `INSERT INTO site_texts (section_key, content_key, lang, content) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE content = VALUES(content), updated_at = NOW()`,
        [row.section_key, row.content_key, otherLang, translated]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  const [[updated]] = await pool.query(`SELECT * FROM site_texts WHERE id = ?`, [Number(id)]);
  return { id: Number(updated.id), sectionKey: updated.section_key, contentKey: updated.content_key, lang: updated.lang, content: updated.content };
};

const deleteSiteText = async (id) => {
  const pool = requirePool();
  const [[row]] = await pool.query(`SELECT section_key, content_key FROM site_texts WHERE id = ?`, [Number(id)]);
  if (!row) throw new AppError("Texto não encontrado.", 404);
  await pool.query(`DELETE FROM site_texts WHERE section_key = ? AND content_key = ?`, [row.section_key, row.content_key]);
};

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------

const listBanners = async () => {
  const pool = requirePool();
  const [rows] = await pool.query(
    `SELECT id, page_slug, title, subtitle, image_url, active, sort_order FROM banners ORDER BY page_slug, sort_order`
  );
  return rows.map((r) => ({
    id: Number(r.id),
    pageSlug: r.page_slug,
    title: r.title || "",
    subtitle: r.subtitle || "",
    imageUrl: r.image_url || "",
    active: Boolean(r.active),
    sortOrder: Number(r.sort_order || 0)
  }));
};

const createBanner = async (data) => {
  const pool = requirePool();
  const [result] = await pool.query(
    `INSERT INTO banners (page_slug, title, subtitle, image_url, active, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
    [data.pageSlug, data.title || "", data.subtitle || "", data.imageUrl || "", data.active ? 1 : 0, Number(data.sortOrder || 0)]
  );
  const [[row]] = await pool.query(`SELECT * FROM banners WHERE id = ?`, [result.insertId]);
  return { id: Number(row.id), pageSlug: row.page_slug, title: row.title, subtitle: row.subtitle, imageUrl: row.image_url, active: Boolean(row.active), sortOrder: Number(row.sort_order) };
};

const updateBanner = async (id, data) => {
  const pool = requirePool();
  await pool.query(
    `UPDATE banners SET page_slug = ?, title = ?, subtitle = ?, image_url = ?, active = ?, sort_order = ? WHERE id = ?`,
    [data.pageSlug, data.title || "", data.subtitle || "", data.imageUrl || "", data.active ? 1 : 0, Number(data.sortOrder || 0), Number(id)]
  );
  const [[row]] = await pool.query(`SELECT * FROM banners WHERE id = ?`, [Number(id)]);
  if (!row) throw new AppError("Banner não encontrado.", 404);
  return { id: Number(row.id), pageSlug: row.page_slug, title: row.title, subtitle: row.subtitle, imageUrl: row.image_url, active: Boolean(row.active), sortOrder: Number(row.sort_order) };
};

const deleteBanner = async (id) => {
  const pool = requirePool();
  const [result] = await pool.query(`DELETE FROM banners WHERE id = ?`, [Number(id)]);
  if (result.affectedRows === 0) throw new AppError("Banner não encontrado.", 404);
};

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

const buildDateRange = (period, customFrom, customTo) => {
  if (customFrom && customTo) return { from: new Date(customFrom), to: new Date(customTo) };
  const to = new Date();
  const from = new Date();
  if (period === "7d") from.setDate(from.getDate() - 7);
  else if (period === "12m") from.setFullYear(from.getFullYear() - 1);
  else from.setDate(from.getDate() - 30);
  return { from, to };
};

const getSalesReport = async ({ period, from: customFrom, to: customTo }) => {
  const pool = requirePool();
  const { from, to } = buildDateRange(period, customFrom, customTo);

  const [rows] = await pool.query(
    `
    SELECT
      DATE(f.DataHoraFatura) AS date,
      e.idEncomenda AS order_id,
      c.nome AS customer_name,
      c.email AS customer_email,
      f.PrecoTotal AS total,
      st.estado AS status
    FROM faturasencomendas f
    JOIN encomendas e ON e.idEncomenda = f.IDEncomenda
    JOIN cliente c ON c.idCliente = f.idCliente
    JOIN estados st ON st.idEstado = e.idEstado
    WHERE f.DataHoraFatura BETWEEN ? AND ?
    ORDER BY f.DataHoraFatura DESC
    `,
    [from, to]
  );

  return rows.map((r) => ({
    date: r.date ? new Date(r.date).toLocaleDateString("pt-PT") : "",
    orderId: Number(r.order_id),
    customer: r.customer_name,
    email: r.customer_email,
    total: Number(r.total || 0),
    status: r.status
  }));
};

const getRevenueReport = async ({ period, from: customFrom, to: customTo }) => {
  const pool = requirePool();
  const { from, to } = buildDateRange(period, customFrom, customTo);

  const [rows] = await pool.query(
    `
    SELECT
      DATE(f.DataHoraFatura) AS date,
      SUM(f.PrecoTotal) AS revenue,
      SUM(de.qntd * COALESCE(p.precoImport, 0)) AS cost,
      COUNT(DISTINCT e.idEncomenda) AS orders
    FROM faturasencomendas f
    JOIN encomendas e ON e.idEncomenda = f.IDEncomenda
    JOIN detalhesencomenda de ON de.idEnc = e.idEncomenda
    JOIN produtos p ON p.idProd = de.idProd
    WHERE f.DataHoraFatura BETWEEN ? AND ? AND e.idEstado != 4
    GROUP BY DATE(f.DataHoraFatura)
    ORDER BY date ASC
    `,
    [from, to]
  );

  return rows.map((r) => ({
    date: r.date ? new Date(r.date).toLocaleDateString("pt-PT") : "",
    revenue: Number(r.revenue || 0),
    cost: Number(r.cost || 0),
    profit: Number(r.revenue || 0) - Number(r.cost || 0),
    orders: Number(r.orders || 0)
  }));
};

const getOrdersReport = async ({ period, from: customFrom, to: customTo }) => {
  const pool = requirePool();
  const { from, to } = buildDateRange(period, customFrom, customTo);

  const [rows] = await pool.query(
    `
    SELECT
      e.idEncomenda AS order_id,
      DATE(e.DataHoraPedido) AS date,
      c.nome AS customer,
      c.email,
      f.PrecoTotal AS total,
      st.estado AS status,
      mp.metodo AS payment_method
    FROM encomendas e
    JOIN faturasencomendas f ON f.IDEncomenda = e.idEncomenda
    JOIN cliente c ON c.idCliente = f.idCliente
    JOIN estados st ON st.idEstado = e.idEstado
    LEFT JOIN metpag mp ON mp.idMet = f.idMetPag
    WHERE e.DataHoraPedido BETWEEN ? AND ?
    ORDER BY e.DataHoraPedido DESC
    `,
    [from, to]
  );

  return rows.map((r) => ({
    orderId: Number(r.order_id),
    date: r.date ? new Date(r.date).toLocaleDateString("pt-PT") : "",
    customer: r.customer,
    email: r.email,
    total: Number(r.total || 0),
    status: r.status,
    paymentMethod: r.payment_method || ""
  }));
};

const getProductsReport = async ({ period, from: customFrom, to: customTo }) => {
  const pool = requirePool();
  const { from, to } = buildDateRange(period, customFrom, customTo);

  const [rows] = await pool.query(
    `
    SELECT
      p.idProd AS id,
      p.nomeProd AS name,
      d.Nome AS category,
      SUM(de.qntd) AS units_sold,
      SUM(de.PrecoLi) AS revenue,
      SUM(de.qntd * COALESCE(p.precoImport, 0)) AS cost,
      p.stock_loja + p.stock_armazem AS current_stock
    FROM detalhesencomenda de
    JOIN encomendas e ON e.idEncomenda = de.idEnc
    JOIN produtos p ON p.idProd = de.idProd
    LEFT JOIN desportos d ON d.IDDesporto = p.IDDesporto
    WHERE e.DataHoraPedido BETWEEN ? AND ? AND e.idEstado != 4
    GROUP BY p.idProd, p.nomeProd, d.Nome, p.stock_loja, p.stock_armazem
    ORDER BY units_sold DESC
    `,
    [from, to]
  );

  return rows.map((r) => ({
    id: Number(r.id),
    name: r.name,
    category: r.category || "",
    unitsSold: Number(r.units_sold || 0),
    revenue: Number(r.revenue || 0),
    cost: Number(r.cost || 0),
    profit: Number(r.revenue || 0) - Number(r.cost || 0),
    currentStock: Number(r.current_stock || 0)
  }));
};

const getCampaignsReport = async ({ period, from: customFrom, to: customTo }) => {
  const pool = requirePool();
  const { from, to } = buildDateRange(period, customFrom, customTo);

  const [rows] = await pool.query(
    `
    SELECT
      c.idCamp AS id,
      c.nome AS name,
      c.desconto AS discount,
      COUNT(DISTINCT de.idDetalheEnc) AS line_items,
      SUM(de.qntd) AS units_sold,
      SUM(de.PrecoLi) AS revenue,
      COUNT(DISTINCT pc.IDProd) AS products_in_campaign
    FROM campanha c
    JOIN prod_campanha pc ON pc.IDCampanha = c.idCamp
    LEFT JOIN detalhesencomenda de ON de.idProd = pc.IDProd
    LEFT JOIN encomendas e ON e.idEncomenda = de.idEnc AND e.DataHoraPedido BETWEEN ? AND ? AND e.idEstado != 4
    GROUP BY c.idCamp, c.nome, c.desconto
    ORDER BY revenue DESC
    `,
    [from, to]
  );

  return rows.map((r) => ({
    id: Number(r.id),
    name: r.name,
    discount: Number(r.discount || 0),
    productsInCampaign: Number(r.products_in_campaign || 0),
    unitsSold: Number(r.units_sold || 0),
    revenue: Number(r.revenue || 0)
  }));
};

// ---------------------------------------------------------------------------
// View tracking
// ---------------------------------------------------------------------------

const trackProductView = async (productId) => {
  try {
    const pool = requirePool();
    await pool.query(
      `INSERT INTO produto_vistas (produto_id) VALUES (?)`,
      [Number(productId)]
    );
  } catch {
    // Silently ignore if table doesn't exist yet
  }
};

// ---------------------------------------------------------------------------
// Highlights (homepage carousel)
// ---------------------------------------------------------------------------

const listHighlights = async () => {
  const pool = requirePool();
  const [rows] = await pool.query(`
    SELECT ph.id, ph.produto_id, ph.highlight_title, ph.highlight_subtitle, ph.active, ph.sort_order,
           p.nomeProd AS name, p.URL_Foto AS image_url, p.precoVenda AS price
    FROM produto_highlight ph
    JOIN produtos p ON p.idProd = ph.produto_id
    ORDER BY ph.sort_order ASC, ph.id ASC
  `);
  return rows.map((r) => ({
    id: Number(r.id),
    productId: Number(r.produto_id),
    name: r.name,
    slug: toSlug(r.name),
    image: buildMediaUrl(r.image_url),
    price: Number(r.price || 0),
    highlightTitle: r.highlight_title || r.name,
    highlightSubtitle: r.highlight_subtitle || "",
    active: Boolean(r.active),
    sortOrder: Number(r.sort_order || 0)
  }));
};

// ---------------------------------------------------------------------------
// Public site texts (no auth required, graceful fallback when pool unavailable)
// ---------------------------------------------------------------------------

const getPublicSiteTexts = async (lang = "pt") => {
  try {
    const pool = getPool();
    if (!pool) return {};
    const [rows] = await pool.query(
      `SELECT section_key, content_key, content FROM site_texts WHERE lang = ? ORDER BY section_key, content_key`,
      [lang]
    );
    const map = {};
    for (const r of rows) {
      if (!map[r.section_key]) map[r.section_key] = {};
      map[r.section_key][r.content_key] = r.content;
    }
    return map;
  } catch {
    return {};
  }
};

// ---------------------------------------------------------------------------
// Placement — Highlights (carousel)
// ---------------------------------------------------------------------------

const addHighlight = async ({ productId, title, subtitle }) => {
  const pool = requirePool();
  const [[{ cnt }]] = await pool.query(`SELECT COUNT(*) AS cnt FROM produto_highlight`);
  if (Number(cnt) >= 4) throw new AppError("Máximo de 4 produtos no carrossel.", 400);
  const [[{ nextOrder }]] = await pool.query(
    `SELECT COALESCE(MAX(sort_order), 0) + 1 AS nextOrder FROM produto_highlight`
  );
  await pool.query(
    `INSERT INTO produto_highlight (produto_id, highlight_title, highlight_subtitle, active, sort_order)
     VALUES (?, ?, ?, 1, ?)
     ON DUPLICATE KEY UPDATE highlight_title = VALUES(highlight_title), highlight_subtitle = VALUES(highlight_subtitle)`,
    [Number(productId), title || "", subtitle || "", nextOrder]
  );
  return listHighlights();
};

const removeHighlight = async (id) => {
  const pool = requirePool();
  await pool.query(`DELETE FROM produto_highlight WHERE id = ?`, [Number(id)]);
  return listHighlights();
};

const updateHighlight = async (id, { title, subtitle, active }) => {
  const pool = requirePool();
  await pool.query(
    `UPDATE produto_highlight SET highlight_title = ?, highlight_subtitle = ?, active = ? WHERE id = ?`,
    [title || "", subtitle || "", active !== false ? 1 : 0, Number(id)]
  );
  return listHighlights();
};

const reorderHighlights = async (orderedIds) => {
  const pool = requirePool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (let i = 0; i < orderedIds.length; i++) {
      await conn.query(`UPDATE produto_highlight SET sort_order = ? WHERE id = ?`, [i + 1, Number(orderedIds[i])]);
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  return listHighlights();
};

// ---------------------------------------------------------------------------
// Placement — Featured (destaques)
// ---------------------------------------------------------------------------

const listFeaturedSlots = async () => {
  const pool = requirePool();
  const [rows] = await pool.query(`
    SELECT ds.IDDestaque AS id, ds.IDProduto AS product_id,
           ds.descricaoDestaque AS description,
           p.nomeProd AS name, p.URL_Foto AS image_url, p.precoVenda AS price
    FROM destaques ds
    JOIN produtos p ON p.idProd = ds.IDProduto
    ORDER BY ds.IDDestaque ASC
  `);
  return rows.map((r) => ({
    id: Number(r.id),
    productId: Number(r.product_id),
    name: r.name,
    description: r.description || "",
    image: buildMediaUrl(r.image_url),
    price: Number(r.price || 0)
  }));
};

const addFeaturedSlot = async ({ productId }) => {
  const pool = requirePool();
  const [[exists]] = await pool.query(
    `SELECT IDDestaque FROM destaques WHERE IDProduto = ?`, [Number(productId)]
  );
  if (exists) throw new AppError("Produto já está em destaque.", 409);
  await pool.query(
    `INSERT INTO destaques (IDProduto, descricaoDestaque) VALUES (?, '')`,
    [Number(productId)]
  );
  return listFeaturedSlots();
};

const removeFeaturedSlot = async (id) => {
  const pool = requirePool();
  await pool.query(`DELETE FROM destaques WHERE IDDestaque = ?`, [Number(id)]);
  return listFeaturedSlots();
};

// ---------------------------------------------------------------------------
// Placement — Campaign products
// ---------------------------------------------------------------------------

const listCampaignsWithProducts = async () => {
  const pool = requirePool();
  const [campaigns] = await pool.query(
    `SELECT idCamp, nome, bannerTitle, bannerCopy, desconto, data_inicio, data_fim
     FROM campanha ORDER BY idCamp ASC`
  );
  const [products] = await pool.query(`
    SELECT pc.IDCampanha, pc.IDProd,
           p.nomeProd AS name, p.URL_Foto AS image_url, p.precoVenda AS price
    FROM prod_campanha pc
    JOIN produtos p ON p.idProd = pc.IDProd
    ORDER BY pc.IDCampanha, pc.IDProd
  `);

  const byId = {};
  for (const p of products) {
    const k = Number(p.IDCampanha);
    if (!byId[k]) byId[k] = [];
    byId[k].push({
      productId: Number(p.IDProd),
      name: p.name,
      image: buildMediaUrl(p.image_url),
      price: Number(p.price || 0)
    });
  }
  return campaigns.map((c) => ({
    id: Number(c.idCamp),
    name: c.nome,
    bannerTitle: c.bannerTitle || "",
    bannerCopy: c.bannerCopy || "",
    discount: Number(c.desconto || 0),
    startDate: c.data_inicio || null,
    endDate: c.data_fim || null,
    products: byId[Number(c.idCamp)] || []
  }));
};

const updateCampaignBannerFields = async (id, { bannerTitle, bannerCopy }) => {
  const pool = requirePool();
  await pool.query(
    `UPDATE campanha SET bannerTitle = ?, bannerCopy = ? WHERE idCamp = ?`,
    [bannerTitle || "", bannerCopy || "", Number(id)]
  );
};

const addProductToCampaign = async (campaignId, { productId }) => {
  const pool = requirePool();
  const [[exists]] = await pool.query(
    `SELECT IDProd FROM prod_campanha WHERE IDProd = ? AND IDCampanha = ?`,
    [Number(productId), Number(campaignId)]
  );
  if (exists) throw new AppError("Produto já nesta campanha.", 409);
  await pool.query(
    `INSERT INTO prod_campanha (IDProd, IDCampanha, descricao) VALUES (?, ?, '')`,
    [Number(productId), Number(campaignId)]
  );
  return listCampaignsWithProducts();
};

const removeProductFromCampaign = async (campaignId, productId) => {
  const pool = requirePool();
  await pool.query(
    `DELETE FROM prod_campanha WHERE IDProd = ? AND IDCampanha = ?`,
    [Number(productId), Number(campaignId)]
  );
};

// ---------------------------------------------------------------------------
// Admin Orders Management
// ---------------------------------------------------------------------------

const ORDER_STATUSES = [
  { id: 1, label: "Pendente" },
  { id: 2, label: "Entregue" },
  { id: 3, label: "Em preparação" },
  { id: 4, label: "Cancelada" },
  { id: 5, label: "Aprovada" },
  { id: 6, label: "Pronta para levantamento" }
];

const listAdminOrders = async ({ status = "", search = "", page = 1, limit = 40 } = {}) => {
  const pool = requirePool();
  const offset = (Number(page) - 1) * Number(limit);
  const where = ["1=1"];
  const params = [];

  if (status) {
    where.push("e.idEstado = ?");
    params.push(Number(status));
  }
  if (search) {
    where.push("(c.nome LIKE ? OR c.email LIKE ? OR CAST(e.idEncomenda AS CHAR) LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const [rows] = await pool.query(
    `
    SELECT
      e.idEncomenda AS id,
      e.idEstado AS status_id,
      st.estado AS status_label,
      e.DataHoraPedido AS created_at,
      e.moradaRua AS address_street,
      e.distritoIlha AS address_district,
      e.municipio AS address_municipality,
      e.codigoPostal AS postal_code,
      e.observacoes AS notes,
      f.PrecoTotal AS total,
      mp.metodo AS payment_method,
      f.paymentStatus AS payment_status,
      c.idCliente AS customer_id,
      c.nome AS customer_name,
      c.email AS customer_email,
      c.telefone AS customer_phone
    FROM encomendas e
    LEFT JOIN estados st ON st.idEstado = e.idEstado
    LEFT JOIN faturasencomendas f ON f.IDEncomenda = e.idEncomenda
    LEFT JOIN metpag mp ON mp.idMet = f.idMetPag
    LEFT JOIN cliente c ON c.idCliente = e.idCliente
    WHERE ${where.join(" AND ")}
    ORDER BY e.DataHoraPedido DESC, e.idEncomenda DESC
    LIMIT ? OFFSET ?
    `,
    [...params, Number(limit), offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM encomendas e
     LEFT JOIN cliente c ON c.idCliente = e.idCliente
     WHERE ${where.join(" AND ")}`,
    params
  );

  return {
    orders: rows.map((r) => ({
      id: Number(r.id),
      statusId: Number(r.status_id),
      statusLabel: r.status_label || "Desconhecido",
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
      total: Number(r.total || 0),
      paymentMethod: r.payment_method || "",
      paymentStatus: r.payment_status || "",
      notes: r.notes || "",
      address: {
        street: r.address_street || "",
        district: r.address_district || "",
        municipality: r.address_municipality || "",
        postalCode: r.postal_code || ""
      },
      customer: {
        id: Number(r.customer_id || 0),
        name: r.customer_name || "—",
        email: r.customer_email || "",
        phone: r.customer_phone ? String(r.customer_phone) : ""
      }
    })),
    total: Number(total || 0),
    statuses: ORDER_STATUSES,
    page: Number(page),
    pages: Math.ceil(Number(total || 0) / Number(limit))
  };
};

const getAdminOrder = async (id) => {
  const pool = requirePool();

  const [[row]] = await pool.query(
    `
    SELECT
      e.idEncomenda AS id,
      e.idEstado AS status_id,
      st.estado AS status_label,
      e.DataHoraPedido AS created_at,
      e.DataEntrega AS delivered_at,
      e.moradaRua AS address_street,
      e.distritoIlha AS address_district,
      e.municipio AS address_municipality,
      e.freguesia AS address_parish,
      e.codigoPostal AS postal_code,
      e.observacoes AS notes,
      e.dataCancelamento AS cancelled_at,
      e.motivoCancelamento AS cancel_reason,
      f.PrecoTotal AS total,
      f.paymentProvider AS payment_provider,
      f.paymentStatus AS payment_status,
      mp.metodo AS payment_method,
      c.idCliente AS customer_id,
      c.nome AS customer_name,
      c.email AS customer_email,
      c.telefone AS customer_phone,
      c.codigoPostal AS customer_postal
    FROM encomendas e
    LEFT JOIN estados st ON st.idEstado = e.idEstado
    LEFT JOIN faturasencomendas f ON f.IDEncomenda = e.idEncomenda
    LEFT JOIN metpag mp ON mp.idMet = f.idMetPag
    LEFT JOIN cliente c ON c.idCliente = e.idCliente
    WHERE e.idEncomenda = ?
    `,
    [Number(id)]
  );

  if (!row) throw new AppError("Encomenda não encontrada.", 404);

  const [items] = await pool.query(
    `
    SELECT
      de.idDetalheEnc AS line_id,
      de.idProd AS product_id,
      p.nomeProd AS product_name,
      p.URL_Foto AS product_image,
      de.qntd AS quantity,
      de.PrecoLi AS unit_price
    FROM detalhesencomenda de
    JOIN produtos p ON p.idProd = de.idProd
    WHERE de.idEnc = ?
    ORDER BY de.idDetalheEnc
    `,
    [Number(id)]
  );

  return {
    id: Number(row.id),
    statusId: Number(row.status_id),
    statusLabel: row.status_label || "Desconhecido",
    statuses: ORDER_STATUSES,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    deliveredAt: row.delivered_at ? new Date(row.delivered_at).toISOString() : null,
    cancelledAt: row.cancelled_at ? new Date(row.cancelled_at).toISOString() : null,
    cancelReason: row.cancel_reason || "",
    total: Number(row.total || 0),
    paymentMethod: row.payment_method || "",
    paymentProvider: row.payment_provider || "",
    paymentStatus: row.payment_status || "",
    notes: row.notes || "",
    address: {
      street: row.address_street || "",
      district: row.address_district || "",
      municipality: row.address_municipality || "",
      parish: row.address_parish || "",
      postalCode: row.postal_code || ""
    },
    customer: {
      id: Number(row.customer_id || 0),
      name: row.customer_name || "—",
      email: row.customer_email || "",
      phone: row.customer_phone ? String(row.customer_phone) : "",
      postalCode: row.customer_postal || ""
    },
    items: items.map((i) => ({
      lineId: Number(i.line_id),
      productId: Number(i.product_id),
      productName: i.product_name || "",
      productImage: buildMediaUrl(i.product_image),
      quantity: Number(i.quantity || 1),
      unitPrice: Number(i.unit_price || 0)
    }))
  };
};

const updateAdminOrderStatus = async (id, { statusId, cancelReason }) => {
  const pool = requirePool();
  const validIds = ORDER_STATUSES.map((s) => s.id);
  if (!validIds.includes(Number(statusId))) throw new AppError("Estado inválido.", 400);

  const isCancelled = Number(statusId) === 4;
  const isDelivered = Number(statusId) === 2;

  await pool.query(
    `UPDATE encomendas
     SET idEstado = ?,
         DataEntrega = ${isDelivered ? "NOW()" : "DataEntrega"},
         dataCancelamento = ${isCancelled ? "NOW()" : "dataCancelamento"},
         motivoCancelamento = ${isCancelled ? "?" : "motivoCancelamento"}
     WHERE idEncomenda = ?`,
    isCancelled
      ? [Number(statusId), cancelReason || "", Number(id)]
      : [Number(statusId), Number(id)]
  );

  return getAdminOrder(id);
};

// ---------------------------------------------------------------------------
// Reviews Management
// ---------------------------------------------------------------------------

const listAdminReviews = async ({ productId = "", page = 1, limit = 40, filter = "all" } = {}) => {
  const pool = requirePool();
  const offset = (Number(page) - 1) * Number(limit);
  const where = ["1=1"];
  const params = [];

  if (productId) { where.push("r.produto_id = ?"); params.push(Number(productId)); }
  if (filter === "offensive") { where.push("r.is_offensive = 1"); }
  if (filter === "hidden") { where.push("r.is_visible = 0"); }
  if (filter === "unanswered") { where.push("r.reply IS NULL"); }

  const [rows] = await pool.query(
    `SELECT r.id, r.produto_id, r.user_name, r.user_email, r.rating, r.comment,
            r.reply, r.replied_at, r.is_offensive, r.is_visible, r.created_at,
            p.nomeProd AS product_name
     FROM product_reviews r
     LEFT JOIN produtos p ON p.idProd = r.produto_id
     WHERE ${where.join(" AND ")}
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM product_reviews r WHERE ${where.join(" AND ")}`,
    params
  );

  return {
    reviews: rows.map((r) => ({
      id: Number(r.id),
      productId: Number(r.produto_id),
      productName: r.product_name || "",
      userName: r.user_name,
      userEmail: r.user_email || "",
      rating: Number(r.rating),
      comment: r.comment,
      reply: r.reply || null,
      repliedAt: r.replied_at ? new Date(r.replied_at).toISOString() : null,
      isOffensive: Boolean(r.is_offensive),
      isVisible: Boolean(r.is_visible),
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : null
    })),
    total: Number(total || 0),
    page: Number(page),
    pages: Math.ceil(Number(total || 0) / Number(limit))
  };
};

const replyToReview = async (id, { reply }) => {
  const pool = requirePool();
  const [[row]] = await pool.query(`SELECT id FROM product_reviews WHERE id = ?`, [Number(id)]);
  if (!row) throw new AppError("Avaliação não encontrada.", 404);
  await pool.query(
    `UPDATE product_reviews SET reply = ?, replied_at = NOW() WHERE id = ?`,
    [reply, Number(id)]
  );
  const [[updated]] = await pool.query(`SELECT * FROM product_reviews WHERE id = ?`, [Number(id)]);
  return updated;
};

const moderateReview = async (id, { isOffensive, isVisible }) => {
  const pool = requirePool();
  const [[row]] = await pool.query(`SELECT id FROM product_reviews WHERE id = ?`, [Number(id)]);
  if (!row) throw new AppError("Avaliação não encontrada.", 404);

  const updates = [];
  const vals = [];
  if (isOffensive !== undefined) { updates.push("is_offensive = ?"); vals.push(isOffensive ? 1 : 0); }
  if (isVisible !== undefined) { updates.push("is_visible = ?"); vals.push(isVisible ? 1 : 0); }
  if (!updates.length) throw new AppError("Nenhum campo para atualizar.", 400);

  vals.push(Number(id));
  await pool.query(`UPDATE product_reviews SET ${updates.join(", ")} WHERE id = ?`, vals);
  const [[updated]] = await pool.query(`SELECT * FROM product_reviews WHERE id = ?`, [Number(id)]);
  return updated;
};

const deleteReview = async (id) => {
  const pool = requirePool();
  const [result] = await pool.query(`DELETE FROM product_reviews WHERE id = ?`, [Number(id)]);
  if (result.affectedRows === 0) throw new AppError("Avaliação não encontrada.", 404);
};

// ---------------------------------------------------------------------------
// Contact Messages Management
// ---------------------------------------------------------------------------

const listContacts = async ({ filter = "all", page = 1, limit = 40 } = {}) => {
  const pool = requirePool();
  const offset = (Number(page) - 1) * Number(limit);
  const where = ["is_archived = 0"];
  const params = [];

  if (filter === "unread") { where.push("is_read = 0"); }
  if (filter === "replied") { where.push("reply IS NOT NULL"); }
  if (filter === "archived") { where[0] = "is_archived = 1"; }

  const [rows] = await pool.query(
    `SELECT id, name, email, phone, subject, message, reply, replied_at, is_read, is_archived, created_at
     FROM contact_messages
     WHERE ${where.join(" AND ")}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM contact_messages WHERE ${where.join(" AND ")}`,
    params
  );

  return {
    messages: rows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      email: r.email,
      phone: r.phone || "",
      subject: r.subject || "",
      message: r.message,
      reply: r.reply || null,
      repliedAt: r.replied_at ? new Date(r.replied_at).toISOString() : null,
      isRead: Boolean(r.is_read),
      isArchived: Boolean(r.is_archived),
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : null
    })),
    total: Number(total || 0),
    page: Number(page),
    pages: Math.ceil(Number(total || 0) / Number(limit))
  };
};

const getContact = async (id) => {
  const pool = requirePool();
  const [[row]] = await pool.query(`SELECT * FROM contact_messages WHERE id = ?`, [Number(id)]);
  if (!row) throw new AppError("Mensagem não encontrada.", 404);
  // Auto-mark as read when opened
  if (!row.is_read) {
    await pool.query(`UPDATE contact_messages SET is_read = 1 WHERE id = ?`, [Number(id)]);
  }
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    subject: row.subject || "",
    message: row.message,
    reply: row.reply || null,
    repliedAt: row.replied_at ? new Date(row.replied_at).toISOString() : null,
    isRead: true,
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null
  };
};

const markContactRead = async (id) => {
  const pool = requirePool();
  await pool.query(`UPDATE contact_messages SET is_read = 1 WHERE id = ?`, [Number(id)]);
};

const replyToContact = async (id, { reply }) => {
  const pool = requirePool();
  const [[row]] = await pool.query(`SELECT id FROM contact_messages WHERE id = ?`, [Number(id)]);
  if (!row) throw new AppError("Mensagem não encontrada.", 404);
  await pool.query(
    `UPDATE contact_messages SET reply = ?, replied_at = NOW(), is_read = 1 WHERE id = ?`,
    [reply, Number(id)]
  );
  return getContact(id);
};

const archiveContact = async (id, { archived }) => {
  const pool = requirePool();
  await pool.query(
    `UPDATE contact_messages SET is_archived = ? WHERE id = ?`,
    [archived ? 1 : 0, Number(id)]
  );
};

const deleteContact = async (id) => {
  const pool = requirePool();
  const [result] = await pool.query(`DELETE FROM contact_messages WHERE id = ?`, [Number(id)]);
  if (result.affectedRows === 0) throw new AppError("Mensagem não encontrada.", 404);
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const adminService = {
  getDashboardStats,
  getBestSellers,
  getRevenueChart,
  getOrdersChart,
  listAdminProducts,
  getAdminProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  listCategories,
  listAdminCampaigns,
  getAdminCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  listSiteTexts,
  createSiteText,
  updateSiteText,
  deleteSiteText,
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getSalesReport,
  getRevenueReport,
  getOrdersReport,
  getProductsReport,
  getCampaignsReport,
  trackProductView,
  listHighlights,
  getPublicSiteTexts,
  // Orders (admin)
  listAdminOrders,
  getAdminOrder,
  updateAdminOrderStatus,
  // Reviews
  listAdminReviews,
  replyToReview,
  moderateReview,
  deleteReview,
  // Contacts
  listContacts,
  getContact,
  markContactRead,
  replyToContact,
  archiveContact,
  deleteContact,
  // Placement — highlights
  addHighlight,
  removeHighlight,
  updateHighlight,
  reorderHighlights,
  // Placement — featured (destaques)
  listFeaturedSlots,
  addFeaturedSlot,
  removeFeaturedSlot,
  // Placement — campaigns
  listCampaignsWithProducts,
  updateCampaignBannerFields,
  addProductToCampaign,
  removeProductFromCampaign
};
