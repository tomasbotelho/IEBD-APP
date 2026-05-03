CREATE TABLE cliente (
  id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tipoprod (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  description TEXT NULL
);

CREATE TABLE tamanhoprod (
  id INT PRIMARY KEY AUTO_INCREMENT,
  produto_id INT NOT NULL,
  label VARCHAR(50) NOT NULL,
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE TABLE produtos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fornecedor_id INT NULL,
  tipoprod_id INT NOT NULL,
  sku VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  discount_price DECIMAL(10,2) NULL,
  unit_label VARCHAR(50) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  image_url VARCHAR(500) NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tipoprod_id) REFERENCES tipoprod(id)
);

CREATE TABLE campanha (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  description TEXT NULL,
  badge VARCHAR(20) NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE prod_campanha (
  produto_id INT NOT NULL,
  campanha_id INT NOT NULL,
  PRIMARY KEY (produto_id, campanha_id),
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  FOREIGN KEY (campanha_id) REFERENCES campanha(id)
);

CREATE TABLE estados (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(120) NOT NULL
);

CREATE TABLE pedidos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  estado_id INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(50) NOT NULL,
  stripe_payment_intent_id VARCHAR(150) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES cliente(id),
  FOREIGN KEY (estado_id) REFERENCES estados(id)
);

CREATE TABLE detalhespedido (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pedido_id INT NOT NULL,
  produto_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE TABLE faturaspedido (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pedido_id INT NOT NULL,
  metpag_id INT NOT NULL,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  total DECIMAL(10,2) NOT NULL,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
);

CREATE TABLE metpag (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  provider VARCHAR(80) NOT NULL
);

CREATE TABLE fornecedor (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(180) NOT NULL,
  email VARCHAR(150) NULL,
  phone VARCHAR(20) NULL
);
