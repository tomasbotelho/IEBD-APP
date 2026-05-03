import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getPool } from "../config/db.js";
import { env } from "../config/env.js";
import { catalogSeed } from "./catalogSeed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure uploads directory exists so multer never fails
const ensureUploadsDir = () => {
  const dir = path.resolve(__dirname, "../../../../fotos/uploads");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const columnExists = async (connection, table, column) => {
  const [rows] = await connection.query(
    `
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [table, column]
  );

  return rows.length > 0;
};

const indexExists = async (connection, table, indexName) => {
  const [rows] = await connection.query(
    `
      SELECT 1
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?
      LIMIT 1
    `,
    [table, indexName]
  );

  return rows.length > 0;
};

const foreignKeyExists = async (connection, table, constraintName) => {
  const [rows] = await connection.query(
    `
      SELECT 1
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND CONSTRAINT_NAME = ?
        AND CONSTRAINT_TYPE = 'FOREIGN KEY'
      LIMIT 1
    `,
    [table, constraintName]
  );

  return rows.length > 0;
};

const ensureColumn = async (connection, table, column, definition) => {
  if (!(await columnExists(connection, table, column))) {
    await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
};

const ensureIndex = async (connection, table, indexName, statement) => {
  if (!(await indexExists(connection, table, indexName))) {
    await connection.query(statement);
  }
};

const ensureForeignKey = async (connection, table, constraintName, statement) => {
  if (!(await foreignKeyExists(connection, table, constraintName))) {
    await connection.query(statement);
  }
};

const ensureCheckoutInfrastructure = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS checkout_sessoes (
      idCheckoutSessao INT NOT NULL AUTO_INCREMENT,
      idCliente INT NOT NULL,
      metodoPagamento VARCHAR(20) NOT NULL,
      fornecedorPagamento VARCHAR(20) NOT NULL,
      moeda VARCHAR(10) NOT NULL DEFAULT 'eur',
      subtotal DECIMAL(10,2) NOT NULL,
      custoEntrega DECIMAL(10,2) NOT NULL,
      valorTotal DECIMAL(10,2) NOT NULL,
      itensJson JSON NOT NULL,
      moradaJson JSON NOT NULL,
      referenciaPagamento VARCHAR(150) NULL,
      estado VARCHAR(20) NOT NULL DEFAULT 'pendente',
      idEncomenda INT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expiresAt DATETIME NOT NULL,
      PRIMARY KEY (idCheckoutSessao),
      KEY idx_checkout_sessoes_cliente (idCliente),
      KEY idx_checkout_sessoes_estado (estado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
  await ensureForeignKey(
    connection,
    "checkout_sessoes",
    "fk_checkout_sessoes_cliente",
    `
      ALTER TABLE checkout_sessoes
      ADD CONSTRAINT fk_checkout_sessoes_cliente
      FOREIGN KEY (idCliente) REFERENCES cliente (idCliente)
      ON DELETE CASCADE ON UPDATE RESTRICT
    `
  );

  await connection.query(`
    CREATE TABLE IF NOT EXISTS produto_fotos (
      idFoto INT NOT NULL AUTO_INCREMENT,
      idProd INT NOT NULL,
      fotoUrl VARCHAR(255) NOT NULL,
      isPrimary TINYINT(1) NOT NULL DEFAULT 0,
      sortOrder INT NOT NULL DEFAULT 0,
      PRIMARY KEY (idFoto),
      KEY idx_produto_fotos_produto (idProd)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
  await ensureForeignKey(
    connection,
    "produto_fotos",
    "fk_produto_fotos_produto",
    `
      ALTER TABLE produto_fotos
      ADD CONSTRAINT fk_produto_fotos_produto
      FOREIGN KEY (idProd) REFERENCES produtos (idProd)
      ON DELETE CASCADE ON UPDATE RESTRICT
    `
  );
};

const ensureOrderInfrastructure = async (connection) => {
  await ensureColumn(connection, "cliente", "codigoPostal", "VARCHAR(20) NOT NULL DEFAULT ''");
  await ensureIndex(
    connection,
    "cliente",
    "uk_cliente_email",
    "ALTER TABLE cliente ADD UNIQUE INDEX uk_cliente_email (email)"
  );

  await connection.query("ALTER TABLE estados MODIFY estado VARCHAR(30) NOT NULL");
  await connection.query(
    `
      INSERT INTO estados (idEstado, estado)
      VALUES (4, 'Cancelada')
      ON DUPLICATE KEY UPDATE estado = VALUES(estado)
    `
  );

  await connection.query("ALTER TABLE metpag MODIFY metodo VARCHAR(30) NOT NULL");
  await connection.query(
    `
      INSERT INTO metpag (idMet, metodo)
      VALUES (4, 'PayPal')
      ON DUPLICATE KEY UPDATE metodo = VALUES(metodo)
    `
  );

  await ensureColumn(connection, "encomendas", "idCliente", "INT NULL AFTER idEncomenda");
  await ensureColumn(connection, "encomendas", "DataHoraPedido", "DATETIME NULL AFTER DataPedido");
  await ensureColumn(connection, "encomendas", "moradaRua", "VARCHAR(150) NOT NULL DEFAULT ''");
  await ensureColumn(connection, "encomendas", "distritoIlha", "VARCHAR(60) NOT NULL DEFAULT ''");
  await ensureColumn(connection, "encomendas", "municipio", "VARCHAR(80) NOT NULL DEFAULT ''");
  await ensureColumn(connection, "encomendas", "freguesia", "VARCHAR(120) NOT NULL DEFAULT ''");
  await ensureColumn(connection, "encomendas", "codigoPostal", "VARCHAR(20) NOT NULL DEFAULT ''");
  await ensureColumn(connection, "encomendas", "observacoes", "TEXT NULL");
  await ensureColumn(connection, "encomendas", "dataCancelamento", "DATETIME NULL");
  await ensureColumn(connection, "encomendas", "motivoCancelamento", "TEXT NULL");
  await ensureIndex(
    connection,
    "encomendas",
    "idx_encomendas_cliente",
    "ALTER TABLE encomendas ADD INDEX idx_encomendas_cliente (idCliente)"
  );
  await ensureForeignKey(
    connection,
    "encomendas",
    "fk_encomendas_cliente",
    `
      ALTER TABLE encomendas
      ADD CONSTRAINT fk_encomendas_cliente
      FOREIGN KEY (idCliente) REFERENCES cliente (idCliente)
      ON DELETE RESTRICT ON UPDATE RESTRICT
    `
  );

  await connection.query("ALTER TABLE detalhesencomenda MODIFY PrecoLi DECIMAL(10,2) NOT NULL");
  await connection.query("ALTER TABLE detalhesencomenda MODIFY PrecoIli DECIMAL(10,2) NOT NULL");
  await connection.query("ALTER TABLE faturasencomendas MODIFY PrecoTotal DECIMAL(10,2) NOT NULL");
  await ensureColumn(connection, "faturasencomendas", "DataHoraFatura", "DATETIME NULL AFTER DataFatura");
  await ensureColumn(
    connection,
    "faturasencomendas",
    "paymentProvider",
    "VARCHAR(20) NOT NULL DEFAULT 'stripe'"
  );
  await ensureColumn(connection, "faturasencomendas", "paymentReference", "VARCHAR(150) NULL");
  await ensureColumn(connection, "faturasencomendas", "paymentStatus", "VARCHAR(40) NOT NULL DEFAULT 'paid'");
  await ensureColumn(connection, "faturasencomendas", "refundReference", "VARCHAR(150) NULL");
  await ensureColumn(connection, "faturasencomendas", "refundStatus", "VARCHAR(40) NULL");
  await ensureColumn(connection, "faturasencomendas", "refundAmount", "DECIMAL(10,2) NULL");
  await ensureColumn(connection, "faturasencomendas", "refundCreatedAt", "DATETIME NULL");
};

const ensureAuthInfrastructure = async (connection) => {
  await ensureColumn(
    connection,
    "login",
    "resetPasswordTokenHash",
    "CHAR(64) NULL AFTER Pass_hash"
  );
  await ensureColumn(
    connection,
    "login",
    "resetPasswordExpiresAt",
    "DATETIME NULL AFTER resetPasswordTokenHash"
  );
  await ensureIndex(
    connection,
    "login",
    "idx_login_reset_password_token",
    "ALTER TABLE login ADD INDEX idx_login_reset_password_token (resetPasswordTokenHash)"
  );
};

const ensureCampaignNaming = async (connection) => {
  await connection.query(`
    UPDATE campanha
    SET nome = REPLACE(nome, 'Epoca', 'Época')
    WHERE nome LIKE '%Epoca%'
  `);
};

const seedCatalogIfEmpty = async (connection) => {
  const [existingRows] = await connection.query("SELECT idProd FROM produtos");
  const existingIds = new Set(existingRows.map((row) => Number(row.idProd)));

  for (const product of catalogSeed) {
    if (!existingIds.has(Number(product.id))) {
      await connection.query(
        `
          INSERT INTO produtos (
            idProd,
            nomeProd,
            descricao,
            precoVenda,
            precoImport,
            qntd,
            IDCor,
            stock_loja,
            stock_armazem,
            idTipoProdDesp,
            idTaman,
            idForn,
            stockMinimo,
            URL_Foto,
            IDGenero,
            IDDesporto
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          product.id,
          product.name,
          product.description,
          product.price,
          product.importPrice,
          product.quantityUnit,
          product.colorId,
          product.stockStore,
          product.stockWarehouse,
          product.typeId,
          product.sizeId,
          product.supplierId,
          product.minimumStock,
          product.photo,
          product.genderId,
          product.sportId
        ]
      );
    }

    const [photoRows] = await connection.query(
      `
        SELECT 1
        FROM produto_fotos
        WHERE idProd = ? AND fotoUrl = ?
        LIMIT 1
      `,
      [product.id, product.photo]
    );

    if (!photoRows.length) {
      await connection.query(
        `
          INSERT INTO produto_fotos (idProd, fotoUrl, isPrimary, sortOrder)
          VALUES (?, ?, 1, 1)
        `,
        [product.id, product.photo]
      );
    }

    if (product.featured) {
      const [highlightRows] = await connection.query(
        `
          SELECT 1
          FROM destaques
          WHERE IDProduto = ?
          LIMIT 1
        `,
        [product.id]
      );

      if (!highlightRows.length) {
        await connection.query(
          `
            INSERT INTO destaques (IDProduto, descricaoDestaque)
            VALUES (?, ?)
          `,
          [product.id, product.description]
        );
      }
    }

    for (const campaignId of product.campaignIds) {
      await connection.query(
        `
          INSERT IGNORE INTO prod_campanha (IDProd, IDCampanha, descricao)
          VALUES (?, ?, ?)
        `,
        [product.id, campaignId, product.description]
      );
    }
  }
};

const ensureAdminTables = async (connection) => {
  // produto_highlight — homepage product carousel / highlights
  await connection.query(`
    CREATE TABLE IF NOT EXISTS produto_highlight (
      id                 INT          NOT NULL AUTO_INCREMENT,
      produto_id         INT          NOT NULL,
      highlight_title    VARCHAR(200) NULL,
      highlight_subtitle VARCHAR(300) NULL,
      active             TINYINT(1)   NOT NULL DEFAULT 1,
      sort_order         INT          NOT NULL DEFAULT 0,
      created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_ph_produto (produto_id),
      INDEX idx_ph_active (active, sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  // site_texts — multilingual CMS content editable from backoffice
  await connection.query(`
    CREATE TABLE IF NOT EXISTS site_texts (
      id           INT          NOT NULL AUTO_INCREMENT,
      section_key  VARCHAR(100) NOT NULL,
      content_key  VARCHAR(100) NOT NULL,
      lang         VARCHAR(5)   NOT NULL DEFAULT 'pt',
      content      TEXT         NOT NULL,
      created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_site_text (section_key, content_key, lang)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  // banners — page banners managed from backoffice
  await connection.query(`
    CREATE TABLE IF NOT EXISTS banners (
      id          INT          NOT NULL AUTO_INCREMENT,
      page_slug   VARCHAR(100) NOT NULL,
      title       VARCHAR(200) NULL,
      subtitle    VARCHAR(300) NULL,
      image_url   VARCHAR(500) NULL,
      active      TINYINT(1)   NOT NULL DEFAULT 1,
      sort_order  INT          NOT NULL DEFAULT 0,
      created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_banner_page (page_slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  // produto_vistas — tracks product page views for "product of the day" widget
  await connection.query(`
    CREATE TABLE IF NOT EXISTS produto_vistas (
      id         INT       NOT NULL AUTO_INCREMENT,
      produto_id INT       NOT NULL,
      viewed_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_pv_produto (produto_id),
      INDEX idx_pv_date (viewed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  // product_reviews — customer reviews and admin reply threads
  await connection.query(`
    CREATE TABLE IF NOT EXISTS product_reviews (
      id           INT          NOT NULL AUTO_INCREMENT,
      produto_id   INT          NOT NULL,
      user_name    VARCHAR(100) NOT NULL DEFAULT 'Anónimo',
      user_email   VARCHAR(150) NULL,
      rating       TINYINT      NOT NULL DEFAULT 5,
      comment      TEXT         NOT NULL,
      reply        TEXT         NULL,
      replied_at   DATETIME     NULL,
      is_offensive TINYINT(1)   NOT NULL DEFAULT 0,
      is_visible   TINYINT(1)   NOT NULL DEFAULT 1,
      created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_pr_produto (produto_id),
      INDEX idx_pr_visible (is_visible)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  // contact_messages — contact form submissions managed from backoffice
  await connection.query(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id          INT          NOT NULL AUTO_INCREMENT,
      name        VARCHAR(100) NOT NULL,
      email       VARCHAR(150) NOT NULL,
      phone       VARCHAR(30)  NULL,
      subject     VARCHAR(200) NOT NULL DEFAULT '',
      message     TEXT         NOT NULL,
      reply       TEXT         NULL,
      replied_at  DATETIME     NULL,
      is_read     TINYINT(1)   NOT NULL DEFAULT 0,
      is_archived TINYINT(1)   NOT NULL DEFAULT 0,
      created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_cm_read (is_read),
      INDEX idx_cm_archived (is_archived)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  // Ensure encomendas has observacoes for admin order notes display
  await ensureColumn(connection, "encomendas", "observacoes", "TEXT NULL");
};

export const bootstrapDatabase = async () => {
  ensureUploadsDir();

  if (env.useFakeDb) {
    return;
  }

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await ensureCheckoutInfrastructure(connection);
    await ensureAuthInfrastructure(connection);
    await ensureOrderInfrastructure(connection);
    await ensureAdminTables(connection);
    await ensureCampaignNaming(connection);
    await seedCatalogIfEmpty(connection);
    console.log("[bootstrap] Database schema verified and seeded.");
  } catch (err) {
    console.error("[bootstrap] Database setup error:", err.message);
    throw err;
  } finally {
    connection.release();
  }
};

