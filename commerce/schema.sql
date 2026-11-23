-- Central 360 Games: banco exclusivo, sob controle do proprietário.
-- Executar pela ferramenta Wrangler no Cloudflare D1. NÃO expor publicamente.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'E-book',
  price_cents INTEGER NOT NULL CHECK(price_cents>=0),
  image TEXT NOT NULL DEFAULT '',
  asset_key TEXT NOT NULL DEFAULT '',
  download_name TEXT NOT NULL DEFAULT 'arquivo.pdf',
  active INTEGER NOT NULL DEFAULT 0 CHECK(active IN (0,1)),
  rights_verified INTEGER NOT NULL DEFAULT 0 CHECK(rights_verified IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  access_hash TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK(amount_cents>0),
  status TEXT NOT NULL DEFAULT 'created'
    CHECK(status IN ('created','pending','paid','rejected','cancelled','revoked')),
  payment_status TEXT NOT NULL DEFAULT '',
  payment_id TEXT UNIQUE,
  email_sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  title TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK(price_cents>0),
  asset_key TEXT NOT NULL,
  download_name TEXT NOT NULL DEFAULT 'arquivo.pdf',
  PRIMARY KEY(order_id,product_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status,created_at);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
