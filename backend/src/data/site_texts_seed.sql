-- =============================================================================
-- SITE TEXTS SEED
-- Run after admin_migration.sql.
-- INSERT IGNORE is safe to run multiple times — skips rows that already exist.
-- Edit content directly in the admin panel after seeding.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- section: hero  (homepage hero banner)
-- ---------------------------------------------------------------------------

INSERT IGNORE INTO site_texts (section_key, content_key, lang, content) VALUES
('hero', 'eyebrow',          'pt', 'Nova época Sports Club'),
('hero', 'eyebrow',          'en', 'New Sports Club Season'),
('hero', 'title',            'pt', 'Treino, competição e outdoor no mesmo storefront.'),
('hero', 'title',            'en', 'Training, competition and outdoor in one storefront.'),
('hero', 'description',      'pt', 'A nossa dedicação para lhe dar os melhores produtos, sempre aos preços mais baixos.'),
('hero', 'description',      'en', 'Our dedication to give you the best products, always at the lowest prices.'),
('hero', 'action_primary',   'pt', 'Explorar catálogo'),
('hero', 'action_primary',   'en', 'Explore catalogue'),
('hero', 'action_secondary', 'pt', 'Ver promoções'),
('hero', 'action_secondary', 'en', 'View promotions'),
('hero', 'label_featured',   'pt', 'Destaque'),
('hero', 'label_featured',   'en', 'Featured'),
('hero', 'label_spotlight',  'pt', 'Campanha em foco'),
('hero', 'label_spotlight',  'en', 'Campaign spotlight');

-- ---------------------------------------------------------------------------
-- section: services  (three service cards below the hero)
-- ---------------------------------------------------------------------------

INSERT IGNORE INTO site_texts (section_key, content_key, lang, content) VALUES
('services', 'delivery_eyebrow', 'pt', 'Entrega'),
('services', 'delivery_eyebrow', 'en', 'Delivery'),
('services', 'delivery_title',   'pt', '24/48h em Portugal'),
('services', 'delivery_title',   'en', '24/48h in Portugal'),
('services', 'delivery_desc',    'pt', 'Fluxo rápido de compra para artigos com alta rotação.'),
('services', 'delivery_desc',    'en', 'Fast purchase flow for high-turnover items.'),

('services', 'pickup_eyebrow',   'pt', 'Levantamento'),
('services', 'pickup_eyebrow',   'en', 'Collection'),
('services', 'pickup_title',     'pt', 'Click & collect'),
('services', 'pickup_title',     'en', 'Click & collect'),
('services', 'pickup_desc',      'pt', 'Espaço preparado para recolha rápida e expedição local.'),
('services', 'pickup_desc',      'en', 'Space prepared for fast pickup and local dispatch.'),

('services', 'trust_eyebrow',    'pt', 'Confiança'),
('services', 'trust_eyebrow',    'en', 'Trust'),
('services', 'trust_title',      'pt', 'Checkout seguro'),
('services', 'trust_title',      'en', 'Secure checkout'),
('services', 'trust_desc',       'pt', 'Carrinho e pagamento com leitura comercial clara.'),
('services', 'trust_desc',       'en', 'Cart and payment with clear commercial reading.');

-- ---------------------------------------------------------------------------
-- section: homepage  (section headings and actions on the home page)
-- ---------------------------------------------------------------------------

INSERT IGNORE INTO site_texts (section_key, content_key, lang, content) VALUES
('homepage', 'highlights_eyebrow', 'pt', 'Destaques'),
('homepage', 'highlights_eyebrow', 'en', 'Highlights'),
('homepage', 'highlights_title',   'pt', 'Produtos em destaque'),
('homepage', 'highlights_title',   'en', 'Featured products'),
('homepage', 'highlights_desc',    'pt', 'Seleção comercial para abrir a homepage com produtos de entrada rápida e forte intenção de compra.'),
('homepage', 'highlights_desc',    'en', 'Commercial selection to open the homepage with fast-entry, high purchase-intent products.'),
('homepage', 'highlights_action',  'pt', 'Ver catálogo'),
('homepage', 'highlights_action',  'en', 'View catalogue'),

('homepage', 'campaigns_eyebrow',  'pt', 'Promoções'),
('homepage', 'campaigns_eyebrow',  'en', 'Promotions'),
('homepage', 'campaigns_title',    'pt', 'Escolhas da campanha'),
('homepage', 'campaigns_title',    'en', 'Campaign picks'),
('homepage', 'campaigns_desc',     'pt', 'Artigos com melhor tração promocional, ideais para campanhas de performance e sessões sazonais.'),
('homepage', 'campaigns_desc',     'en', 'Best performing promotional items, ideal for performance campaigns and seasonal sessions.');

-- ---------------------------------------------------------------------------
-- section: seo  (meta title + description for each page)
-- ---------------------------------------------------------------------------

INSERT IGNORE INTO site_texts (section_key, content_key, lang, content) VALUES
('seo', 'home_title',            'pt', 'Sports Club | Loja de desporto online'),
('seo', 'home_title',            'en', 'Sports Club | Online Sports Store'),
('seo', 'home_description',      'pt', 'Sports Club: storefront de desporto com pesquisa central, categorias fortes e layout inspirado nos grandes retalhistas desportivos.'),
('seo', 'home_description',      'en', 'Sports Club: sports storefront with central search, strong categories and layout inspired by the biggest sports retailers.'),

('seo', 'catalog_title',         'pt', 'Catálogo | Sports Club'),
('seo', 'catalog_title',         'en', 'Catalogue | Sports Club'),
('seo', 'catalog_description',   'pt', 'Explore todo o catálogo de equipamento desportivo Sports Club.'),
('seo', 'catalog_description',   'en', 'Explore the full Sports Club sporting equipment catalogue.'),

('seo', 'promotions_title',      'pt', 'Promoções | Sports Club'),
('seo', 'promotions_title',      'en', 'Promotions | Sports Club'),
('seo', 'promotions_description','pt', 'As melhores promoções em equipamento desportivo. Aproveite os descontos Sports Club.'),
('seo', 'promotions_description','en', 'The best deals on sporting equipment. Take advantage of Sports Club discounts.');
