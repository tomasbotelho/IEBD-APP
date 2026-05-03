-- =============================================================================
-- ADMIN SYSTEM MIGRATION
-- Run this file once against your MySQL database after the main schema.
-- All new tables use IF NOT EXISTS for safety.
-- ALTER TABLE statements are commented out — uncomment and run once manually.
-- =============================================================================

-- Product view tracking (used for "Product of the Day" dashboard widget)
CREATE TABLE IF NOT EXISTS produto_vistas (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  produto_id  INT NOT NULL,
  viewed_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pv_produto (produto_id),
  INDEX idx_pv_date    (viewed_at)
);

-- Site content / CMS texts with multi-language support
CREATE TABLE IF NOT EXISTS site_texts (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  section_key  VARCHAR(100) NOT NULL,
  content_key  VARCHAR(100) NOT NULL,
  lang         VARCHAR(5)   NOT NULL DEFAULT 'pt',
  content      TEXT         NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_text (section_key, content_key, lang)
);

-- Page banners (all pages except homepage, which uses the product carousel)
CREATE TABLE IF NOT EXISTS banners (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  page_slug   VARCHAR(100) NOT NULL,
  title       VARCHAR(200) NULL,
  subtitle    VARCHAR(300) NULL,
  image_url   VARCHAR(500) NULL,
  active      TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_banner_page (page_slug)
);

-- Product highlights for homepage banner carousel
CREATE TABLE IF NOT EXISTS produto_highlight (
  id                 INT PRIMARY KEY AUTO_INCREMENT,
  produto_id         INT          NOT NULL UNIQUE,
  highlight_title    VARCHAR(200) NULL,
  highlight_subtitle VARCHAR(300) NULL,
  active             TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order         INT          NOT NULL DEFAULT 0,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ph_active (active, sort_order)
);

-- =============================================================================
-- OPTIONAL COLUMN ADDITIONS (uncomment & run once if columns do not yet exist)
-- =============================================================================

-- Add visibility flag to products table
-- ALTER TABLE produtos ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1;

-- Add discount_type to campaigns (percentage = existing desconto field, fixed = euro amount)
-- ALTER TABLE campanha ADD COLUMN discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage';

-- Add active flag to campaigns (so admin can deactivate without deleting)
-- ALTER TABLE campanha ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1;
