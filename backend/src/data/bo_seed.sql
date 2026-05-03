-- =============================================================================
-- BACK-OFFICE DEMO SEED
-- Populates: campanha columns, produto_highlight, banners,
--            additional orders + invoices, product views
-- Safe to run multiple times (INSERT IGNORE / IF NOT EXISTS guards).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add missing columns to campanha (safe even if columns already exist)
-- ---------------------------------------------------------------------------
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'campanha' AND COLUMN_NAME = 'descricao'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE campanha ADD COLUMN descricao text NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'campanha' AND COLUMN_NAME = 'bannerTitle'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE campanha ADD COLUMN bannerTitle varchar(120) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'campanha' AND COLUMN_NAME = 'bannerCopy'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE campanha ADD COLUMN bannerCopy varchar(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 2. Update existing campaigns with full data
-- ---------------------------------------------------------------------------
UPDATE campanha SET
  descricao    = 'Promoções de início de época com descontos exclusivos em calçado, vestuário e acessórios de corrida.',
  bannerTitle  = 'Abertura de Época',
  bannerCopy   = 'Até 20% de desconto em artigos selecionados. Começa bem a temporada.'
WHERE idCamp = 1;

UPDATE campanha SET
  descricao    = 'Campanha dedicada ao desporto ao ar livre com descontos em mochilas, lanternas e calçado de trail.',
  bannerTitle  = 'Outdoor Days',
  bannerCopy   = '15% de desconto em equipamento outdoor. Vai mais longe.'
WHERE idCamp = 2;

UPDATE campanha SET
  descricao    = 'Descontos especiais para equipas e clubes desportivos em artigos de futebol, andebol e basquetebol.',
  bannerTitle  = 'Team Deals',
  bannerCopy   = 'Equipa o teu clube com até 25% de desconto. Válido até 31 de maio.'
WHERE idCamp = 3;

-- ---------------------------------------------------------------------------
-- 3. Produto highlights para o carrossel da homepage
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO produto_highlight (produto_id, highlight_title, highlight_subtitle, active, sort_order) VALUES
(1,  'Velocidade no Asfalto',       'Sapatilhas de corrida com amortecimento reativo e malha respirável.',     1, 1),
(3,  'O GPS que te Acompanha',       'Relógio com GPS integrado, monitorização cardíaca e autonomia de 7 dias.',1, 2),
(10, 'Proteção para o Trail',       'Casaco técnico impermeável com ventilação e capuz ajustável.',             1, 3),
(11, 'Pedala com Segurança',        'Capacete aero com sistema de ajuste micrométrico e ventilação ativa.',    1, 4),
(16, 'Conquista o Trilho',          'Bota de montanha com membrana impermeável GTX e sola de alta aderência.', 1, 5);

-- ---------------------------------------------------------------------------
-- 4. Banners da homepage
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO banners (page_slug, title, subtitle, image_url, active, sort_order) VALUES
('home', 'Nova Coleção Verão 2026',     'Artigos técnicos para os dias mais longos do ano.',          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80', 1, 1),
('home', 'Equipa o teu Clube',          'Descontos exclusivos para equipas e associações desportivas.','https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80', 1, 2),
('home', 'Corrida Urbana',             'Sapatilhas, GPS e vestuário técnico para a cidade.',          'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&q=80', 1, 3);

-- ---------------------------------------------------------------------------
-- 5. Additional prod_campanha links
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO prod_campanha (IDProd, IDCampanha, descricao) VALUES
(9,  2, 'Mochila com desconto outdoor para trilhos e caminhadas.'),
(10, 2, 'Casaco técnico em campanha outdoor para condições adversas.'),
(13, 2, 'Lanterna recarregável com desconto para aventura noturna.'),
(16, 2, 'Bota de montanha com preço especial para trail e caminhada.'),
(19, 3, 'Bola de andebol para equipas com preço de clube.'),
(22, 3, 'Bola de basquetebol para exterior com desconto de equipa.'),
(25, 3, 'Bola de voleibol para equipas com preço promocional.');

-- ---------------------------------------------------------------------------
-- 6. Product views (últimos 30 dias — distribui visualizações reais)
-- ---------------------------------------------------------------------------
INSERT INTO produto_vistas (produto_id, viewed_at) VALUES
(1, DATE_SUB(NOW(), INTERVAL  1 DAY)),(1, DATE_SUB(NOW(), INTERVAL  1 DAY)),(1, DATE_SUB(NOW(), INTERVAL  2 DAY)),
(1, DATE_SUB(NOW(), INTERVAL  3 DAY)),(1, DATE_SUB(NOW(), INTERVAL  5 DAY)),(1, DATE_SUB(NOW(), INTERVAL  7 DAY)),
(3, DATE_SUB(NOW(), INTERVAL  1 DAY)),(3, DATE_SUB(NOW(), INTERVAL  2 DAY)),(3, DATE_SUB(NOW(), INTERVAL  4 DAY)),
(3, DATE_SUB(NOW(), INTERVAL  6 DAY)),(3, DATE_SUB(NOW(), INTERVAL  8 DAY)),
(10, DATE_SUB(NOW(), INTERVAL 1 DAY)),(10, DATE_SUB(NOW(), INTERVAL 3 DAY)),(10, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(11, DATE_SUB(NOW(), INTERVAL 2 DAY)),(11, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(16, DATE_SUB(NOW(), INTERVAL 1 DAY)),(16, DATE_SUB(NOW(), INTERVAL 2 DAY)),(16, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(7,  DATE_SUB(NOW(), INTERVAL 1 DAY)),(7,  DATE_SUB(NOW(), INTERVAL 3 DAY)),
(22, DATE_SUB(NOW(), INTERVAL 2 DAY)),(22, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(5,  DATE_SUB(NOW(), INTERVAL 1 DAY)),(5,  DATE_SUB(NOW(), INTERVAL 4 DAY)),
(9,  DATE_SUB(NOW(), INTERVAL 2 DAY)),(9,  DATE_SUB(NOW(), INTERVAL 7 DAY)),
(1,  NOW()),(3, NOW()),(10, NOW()),(11, NOW()),(1, NOW());

-- ---------------------------------------------------------------------------
-- 7. Extra clientes (compradores demo)
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO cliente (idCliente, nome, email, telefone, morada, codigoPostal) VALUES
(20, 'Ana Sousa',        'ana.sousa@email.pt',        912000001, 'Rua das Flores 12, Lisboa',         '1200-001'),
(21, 'Carlos Mendes',    'carlos.mendes@email.pt',    913000002, 'Av. da Liberdade 55, Lisboa',       '1250-096'),
(22, 'Sofia Almeida',    'sofia.almeida@email.pt',    914000003, 'Rua do Porto 8, Porto',             '4000-001'),
(23, 'Rui Oliveira',     'rui.oliveira@email.pt',     915000004, 'Rua de Santa Catarina 20, Porto',   '4000-447'),
(24, 'Beatriz Costa',    'beatriz.costa@email.pt',    916000005, 'Av. dos Aliados 33, Porto',         '4000-066'),
(25, 'Pedro Silva',      'pedro.silva@email.pt',      917000006, 'Rua Augusta 100, Lisboa',           '1100-048'),
(26, 'Inês Rodrigues',   'ines.rodrigues@email.pt',   918000007, 'Rua Garrett 15, Lisboa',            '1200-204'),
(27, 'Miguel Santos',    'miguel.santos@email.pt',    919000008, 'Rua Dom Pedro IV 22, Coimbra',      '3000-333'),
(28, 'Catarina Ferreira','catarina.ferreira@email.pt',910000009, 'Av. Marginal 400, Cascais',         '2750-001'),
(29, 'Francisco Lima',   'francisco.lima@email.pt',   911000010, 'Rua de Belém 5, Lisboa',            '1300-085');

-- login para os clientes demo (password: Cliente@123 → mesmo hash para todos)
INSERT IGNORE INTO login (IDlogin, Pass_hash, username, IDtipoUser) VALUES
(20, '$2a$10$WPDuw3RvCvifJzinT2eJ4OjzmqsnhfPuTHTrEONUhDIHbT4ys72mK', 'asousa',    4),
(21, '$2a$10$WPDuw3RvCvifJzinT2eJ4OjzmqsnhfPuTHTrEONUhDIHbT4ys72mK', 'cmendes',   4),
(22, '$2a$10$WPDuw3RvCvifJzinT2eJ4OjzmqsnhfPuTHTrEONUhDIHbT4ys72mK', 'salmeida',  4),
(23, '$2a$10$WPDuw3RvCvifJzinT2eJ4OjzmqsnhfPuTHTrEONUhDIHbT4ys72mK', 'roliveira', 4),
(24, '$2a$10$WPDuw3RvCvifJzinT2eJ4OjzmqsnhfPuTHTrEONUhDIHbT4ys72mK', 'bcosta',    4),
(25, '$2a$10$WPDuw3RvCvifJzinT2eJ4OjzmqsnhfPuTHTrEONUhDIHbT4ys72mK', 'psilva',    4),
(26, '$2a$10$WPDuw3RvCvifJzinT2eJ4OjzmqsnhfPuTHTrEONUhDIHbT4ys72mK', 'irodrigues',4),
(27, '$2a$10$WPDuw3RvCvifJzinT2eJ4OjzmqsnhfPuTHTrEONUhDIHbT4ys72mK', 'msantos',   4),
(28, '$2a$10$WPDuw3RvCvifJzinT2eJ4OjzmqsnhfPuTHTrEONUhDIHbT4ys72mK', 'cferreira', 4),
(29, '$2a$10$WPDuw3RvCvifJzinT2eJ4OjzmqsnhfPuTHTrEONUhDIHbT4ys72mK', 'flima',     4);

-- ---------------------------------------------------------------------------
-- 8. Encomendas (30+ pedidos espalhados pelos últimos 90 dias)
--    idEstado: 1=Pendente  2=Entregue  4=Cancelada
-- ---------------------------------------------------------------------------
INSERT INTO encomendas
  (idCliente, DataPedido, DataHoraPedido, DataEntrega, isValid, idEstado,
   moradaRua, distritoIlha, municipio, freguesia, codigoPostal) VALUES

-- Últimas 24h
(20, CURDATE(), DATE_SUB(NOW(), INTERVAL  4 HOUR),  DATE_ADD(CURDATE(), INTERVAL 3 DAY), 1, 1, 'Rua das Flores 12',       'Lisboa', 'Lisboa',            'Santo António',  '1200-001'),
(21, CURDATE(), DATE_SUB(NOW(), INTERVAL  7 HOUR),  DATE_ADD(CURDATE(), INTERVAL 3 DAY), 1, 1, 'Av. da Liberdade 55',     'Lisboa', 'Lisboa',            'Avenidas Novas', '1250-096'),

-- Últimos 7 dias — entregues
(22, DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY),  DATE_SUB(CURDATE(), INTERVAL 1 DAY),  1, 2, 'Rua do Porto 8',          'Porto',  'Porto',             'Cedofeita',      '4000-001'),
(23, DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY),  DATE_SUB(CURDATE(), INTERVAL 1 DAY),  1, 2, 'Rua de Santa Catarina 20','Porto',  'Porto',             'Bonfim',         '4000-447'),
(24, DATE_SUB(CURDATE(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY),  DATE_SUB(CURDATE(), INTERVAL 2 DAY),  1, 2, 'Av. dos Aliados 33',      'Porto',  'Porto',             'Santo Ildefonso','4000-066'),
(25, DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY),  DATE_SUB(CURDATE(), INTERVAL 2 DAY),  1, 2, 'Rua Augusta 100',         'Lisboa', 'Lisboa',            'Santa Maria Maior','1100-048'),
(20, DATE_SUB(CURDATE(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY),  DATE_SUB(CURDATE(), INTERVAL 3 DAY),  1, 2, 'Rua das Flores 12',       'Lisboa', 'Lisboa',            'Santo António',  '1200-001'),

-- Últimos 7 dias — pendente + cancelada
(26, DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY),  DATE_ADD(CURDATE(), INTERVAL 2 DAY),  1, 1, 'Rua Garrett 15',          'Lisboa', 'Lisboa',            'Misericórdia',   '1200-204'),
(27, DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY),  DATE_SUB(CURDATE(), INTERVAL 1 DAY),  0, 4, 'Rua Dom Pedro IV 22',     'Coimbra','Coimbra',           'Sé Nova',        '3000-333'),

-- Dias 8-15
(28, DATE_SUB(CURDATE(), INTERVAL  8 DAY), DATE_SUB(NOW(), INTERVAL  8 DAY), DATE_SUB(CURDATE(), INTERVAL 5 DAY), 1, 2, 'Av. Marginal 400',        'Lisboa', 'Cascais',           'Cascais e Estoril','2750-001'),
(29, DATE_SUB(CURDATE(), INTERVAL  9 DAY), DATE_SUB(NOW(), INTERVAL  9 DAY), DATE_SUB(CURDATE(), INTERVAL 6 DAY), 1, 2, 'Rua de Belém 5',          'Lisboa', 'Lisboa',            'Belém',          '1300-085'),
(21, DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(CURDATE(), INTERVAL 7 DAY), 1, 2, 'Av. da Liberdade 55',     'Lisboa', 'Lisboa',            'Avenidas Novas', '1250-096'),
(22, DATE_SUB(CURDATE(), INTERVAL 11 DAY), DATE_SUB(NOW(), INTERVAL 11 DAY), DATE_SUB(CURDATE(), INTERVAL 8 DAY), 1, 2, 'Rua do Porto 8',          'Porto',  'Porto',             'Cedofeita',      '4000-001'),
(23, DATE_SUB(CURDATE(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(CURDATE(), INTERVAL 9 DAY), 1, 2, 'Rua de Santa Catarina 20','Porto',  'Porto',             'Bonfim',         '4000-447'),
(25, DATE_SUB(CURDATE(), INTERVAL 13 DAY), DATE_SUB(NOW(), INTERVAL 13 DAY), DATE_SUB(CURDATE(), INTERVAL 10 DAY),1, 2, 'Rua Augusta 100',         'Lisboa', 'Lisboa',            'Santa Maria Maior','1100-048'),
(26, DATE_SUB(CURDATE(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(CURDATE(), INTERVAL 11 DAY),1, 2, 'Rua Garrett 15',          'Lisboa', 'Lisboa',            'Misericórdia',   '1200-204'),

-- Dias 16-22
(27, DATE_SUB(CURDATE(), INTERVAL 16 DAY), DATE_SUB(NOW(), INTERVAL 16 DAY), DATE_SUB(CURDATE(), INTERVAL 13 DAY),1, 2, 'Rua Dom Pedro IV 22',     'Coimbra','Coimbra',           'Sé Nova',        '3000-333'),
(28, DATE_SUB(CURDATE(), INTERVAL 17 DAY), DATE_SUB(NOW(), INTERVAL 17 DAY), DATE_SUB(CURDATE(), INTERVAL 14 DAY),1, 2, 'Av. Marginal 400',        'Lisboa', 'Cascais',           'Cascais e Estoril','2750-001'),
(29, DATE_SUB(CURDATE(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(CURDATE(), INTERVAL 15 DAY),1, 2, 'Rua de Belém 5',          'Lisboa', 'Lisboa',            'Belém',          '1300-085'),
(20, DATE_SUB(CURDATE(), INTERVAL 19 DAY), DATE_SUB(NOW(), INTERVAL 19 DAY), DATE_SUB(CURDATE(), INTERVAL 16 DAY),1, 2, 'Rua das Flores 12',       'Lisboa', 'Lisboa',            'Santo António',  '1200-001'),
(24, DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(CURDATE(), INTERVAL 17 DAY),1, 2, 'Av. dos Aliados 33',      'Porto',  'Porto',             'Santo Ildefonso','4000-066'),
(21, DATE_SUB(CURDATE(), INTERVAL 21 DAY), DATE_SUB(NOW(), INTERVAL 21 DAY), DATE_SUB(CURDATE(), INTERVAL 18 DAY),0, 4, 'Av. da Liberdade 55',     'Lisboa', 'Lisboa',            'Avenidas Novas', '1250-096'),

-- Dias 23-30
(22, DATE_SUB(CURDATE(), INTERVAL 23 DAY), DATE_SUB(NOW(), INTERVAL 23 DAY), DATE_SUB(CURDATE(), INTERVAL 20 DAY),1, 2, 'Rua do Porto 8',          'Porto',  'Porto',             'Cedofeita',      '4000-001'),
(23, DATE_SUB(CURDATE(), INTERVAL 24 DAY), DATE_SUB(NOW(), INTERVAL 24 DAY), DATE_SUB(CURDATE(), INTERVAL 21 DAY),1, 2, 'Rua de Santa Catarina 20','Porto',  'Porto',             'Bonfim',         '4000-447'),
(25, DATE_SUB(CURDATE(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(CURDATE(), INTERVAL 22 DAY),1, 2, 'Rua Augusta 100',         'Lisboa', 'Lisboa',            'Santa Maria Maior','1100-048'),
(26, DATE_SUB(CURDATE(), INTERVAL 26 DAY), DATE_SUB(NOW(), INTERVAL 26 DAY), DATE_SUB(CURDATE(), INTERVAL 23 DAY),1, 2, 'Rua Garrett 15',          'Lisboa', 'Lisboa',            'Misericórdia',   '1200-204'),
(27, DATE_SUB(CURDATE(), INTERVAL 27 DAY), DATE_SUB(NOW(), INTERVAL 27 DAY), DATE_SUB(CURDATE(), INTERVAL 24 DAY),1, 2, 'Rua Dom Pedro IV 22',     'Coimbra','Coimbra',           'Sé Nova',        '3000-333'),
(28, DATE_SUB(CURDATE(), INTERVAL 28 DAY), DATE_SUB(NOW(), INTERVAL 28 DAY), DATE_SUB(CURDATE(), INTERVAL 25 DAY),1, 2, 'Av. Marginal 400',        'Lisboa', 'Cascais',           'Cascais e Estoril','2750-001'),
(29, DATE_SUB(CURDATE(), INTERVAL 29 DAY), DATE_SUB(NOW(), INTERVAL 29 DAY), DATE_SUB(CURDATE(), INTERVAL 26 DAY),1, 2, 'Rua de Belém 5',          'Lisboa', 'Lisboa',            'Belém',          '1300-085'),

-- Dias 31-90 (mês anterior)
(20, DATE_SUB(CURDATE(), INTERVAL 35 DAY), DATE_SUB(NOW(), INTERVAL 35 DAY), DATE_SUB(CURDATE(), INTERVAL 32 DAY),1, 2, 'Rua das Flores 12',       'Lisboa', 'Lisboa',            'Santo António',  '1200-001'),
(21, DATE_SUB(CURDATE(), INTERVAL 40 DAY), DATE_SUB(NOW(), INTERVAL 40 DAY), DATE_SUB(CURDATE(), INTERVAL 37 DAY),1, 2, 'Av. da Liberdade 55',     'Lisboa', 'Lisboa',            'Avenidas Novas', '1250-096'),
(22, DATE_SUB(CURDATE(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_SUB(CURDATE(), INTERVAL 42 DAY),1, 2, 'Rua do Porto 8',          'Porto',  'Porto',             'Cedofeita',      '4000-001'),
(23, DATE_SUB(CURDATE(), INTERVAL 50 DAY), DATE_SUB(NOW(), INTERVAL 50 DAY), DATE_SUB(CURDATE(), INTERVAL 47 DAY),1, 2, 'Rua de Santa Catarina 20','Porto',  'Porto',             'Bonfim',         '4000-447'),
(24, DATE_SUB(CURDATE(), INTERVAL 55 DAY), DATE_SUB(NOW(), INTERVAL 55 DAY), DATE_SUB(CURDATE(), INTERVAL 52 DAY),1, 2, 'Av. dos Aliados 33',      'Porto',  'Porto',             'Santo Ildefonso','4000-066'),
(25, DATE_SUB(CURDATE(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(CURDATE(), INTERVAL 57 DAY),1, 2, 'Rua Augusta 100',         'Lisboa', 'Lisboa',            'Santa Maria Maior','1100-048'),
(26, DATE_SUB(CURDATE(), INTERVAL 70 DAY), DATE_SUB(NOW(), INTERVAL 70 DAY), DATE_SUB(CURDATE(), INTERVAL 67 DAY),0, 4, 'Rua Garrett 15',          'Lisboa', 'Lisboa',            'Misericórdia',   '1200-204'),
(27, DATE_SUB(CURDATE(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(CURDATE(), INTERVAL 77 DAY),1, 2, 'Rua Dom Pedro IV 22',     'Coimbra','Coimbra',           'Sé Nova',        '3000-333'),
(28, DATE_SUB(CURDATE(), INTERVAL 85 DAY), DATE_SUB(NOW(), INTERVAL 85 DAY), DATE_SUB(CURDATE(), INTERVAL 82 DAY),1, 2, 'Av. Marginal 400',        'Lisboa', 'Cascais',           'Cascais e Estoril','2750-001'),
(29, DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_SUB(NOW(), INTERVAL 90 DAY), DATE_SUB(CURDATE(), INTERVAL 87 DAY),1, 2, 'Rua de Belém 5',          'Lisboa', 'Lisboa',            'Belém',          '1300-085');

-- ---------------------------------------------------------------------------
-- 9. Detalhes das encomendas
--    Nota: os idEnc começam em 3 (1 e 2 já existem)
-- ---------------------------------------------------------------------------
INSERT INTO detalhesencomenda (idProd, idEnc, qntd, PrecoLi, PrecoIli) VALUES
-- enc 3 (Sofia, Porto)
(1,  3, 1, 119.99,  95.99), (4,  3, 1,  29.99,  23.99),
-- enc 4 (Rui, Porto)
(7,  4, 2,  34.99,  27.99), (6,  4, 1,  14.99,  11.99),
-- enc 5 (Beatriz, Porto)
(5,  5, 1,  49.99,  37.49), (3,  5, 1, 179.99, 143.99),
-- enc 6 (Pedro, Lisboa)
(2,  6, 2,  32.99,  26.39), (6,  6, 3,  14.99,  11.99),
-- enc 7 (Ana, Lisboa)
(9,  7, 1,  69.99,  52.49), (10, 7, 1,  89.99,  74.99),
-- enc 8 (Inês, Lisboa)
(11, 8, 1,  59.99,  47.99),
-- enc 9 (Miguel, cancelada)
(22, 9, 1,  29.99,  22.49),
-- enc 10 (Catarina)
(16, 10, 1, 149.99, 126.74), (17, 10, 1,  39.99,  33.99),
-- enc 11 (Francisco)
(28, 11, 2,  29.99,  22.49), (29, 11, 1,   9.99,   7.49),
-- enc 12 (Carlos)
(1,  12, 1, 119.99,  95.99), (2, 12, 1,  32.99,  26.39),
-- enc 13 (Sofia)
(5,  13, 2,  49.99,  37.49),
-- enc 14 (Rui)
(7,  14, 1,  34.99,  27.99), (19, 14, 1,  54.99,  41.24),
-- enc 15 (Beatriz)
(8,  15, 1,  79.99,  63.99), (14, 15, 2,  12.99,   9.74),
-- enc 16 (Pedro)
(3,  16, 1, 179.99, 143.99),
-- enc 17 (Miguel)
(9,  17, 1,  69.99,  52.49), (6,  17, 2,  14.99,  11.24),
-- enc 18 (Catarina)
(16, 18, 1, 149.99, 126.74),
-- enc 19 (Francisco)
(11, 19, 1,  59.99,  47.99), (12, 19, 1,  44.99,  35.99),
-- enc 20 (Ana)
(1,  20, 1, 119.99,  95.99),
-- enc 21 (Beatriz)
(25, 21, 2,  44.99,  33.74),
-- enc 22 (Carlos, cancelada)
(5,  22, 1,  49.99,  37.49),
-- enc 23 (Sofia)
(10, 23, 1,  89.99,  74.99), (13, 23, 1,  59.99,  47.99),
-- enc 24 (Rui)
(22, 24, 2,  29.99,  22.49),
-- enc 25 (Pedro)
(1,  25, 1, 119.99,  95.99), (4,  25, 1,  29.99,  23.99),
-- enc 26 (Inês)
(3,  26, 1, 179.99, 143.99),
-- enc 27 (Miguel)
(7,  27, 3,  34.99,  27.99),
-- enc 28 (Catarina)
(9,  28, 1,  69.99,  52.49),
-- enc 29 (Francisco)
(2,  29, 2,  32.99,  26.39),
-- enc 30 (Ana, mês anterior)
(16, 30, 1, 149.99, 126.74), (17, 30, 1,  39.99,  33.99),
-- enc 31 (Carlos)
(5,  31, 2,  49.99,  37.49), (6,  31, 1,  14.99,  11.99),
-- enc 32 (Sofia)
(1,  32, 1, 119.99,  95.99),
-- enc 33 (Rui)
(8,  33, 1,  79.99,  63.99), (14, 33, 1,  12.99,   9.74),
-- enc 34 (Beatriz)
(3,  34, 1, 179.99, 143.99), (4,  34, 1,  29.99,  23.99),
-- enc 35 (Pedro)
(9,  35, 1,  69.99,  52.49),
-- enc 36 (Inês, cancelada)
(11, 36, 1,  59.99,  47.99),
-- enc 37 (Miguel)
(1,  37, 1, 119.99,  95.99), (2,  37, 1,  32.99,  26.39),
-- enc 38 (Catarina)
(16, 38, 1, 149.99, 126.74),
-- enc 39 (Francisco)
(28, 39, 1,  29.99,  22.49), (30, 39, 1,  17.99,  14.39),
-- enc 40 (Francisco, mês 3)
(10, 40, 1,  89.99,  74.99), (13, 40, 1,  59.99,  47.99);

-- ---------------------------------------------------------------------------
-- 10. Faturas das encomendas ENTREGUES (idEstado = 2)
-- ---------------------------------------------------------------------------
INSERT INTO faturasencomendas
  (IDEncomenda, PrecoTotal, DataFatura, DataHoraFatura, idMetPag, idCliente,
   paymentProvider, paymentReference, paymentStatus)
SELECT
  e.idEncomenda,
  ROUND((SELECT COALESCE(SUM(d.PrecoLi), 0) + 4.99 FROM detalhesencomenda d WHERE d.idEnc = e.idEncomenda), 2),
  e.DataEntrega,
  DATE_ADD(e.DataHoraPedido, INTERVAL 5 MINUTE),
  1,
  e.idCliente,
  'stripe',
  CONCAT('pi_demo_', LPAD(e.idEncomenda, 6, '0')),
  'paid'
FROM encomendas e
WHERE e.idEstado = 2
  AND e.idEncomenda NOT IN (SELECT IDEncomenda FROM faturasencomendas);
