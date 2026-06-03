PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  birthday DATE,
  administrator INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  CHECK (administrator IN (0, 1))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  brand TEXT NOT NULL,
  price REAL NOT NULL,
  picture_front TEXT,
  picture_back TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sku TEXT UNIQUE,
  description TEXT,

  CHECK (price >= 0)
);

CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, product_id),

  FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_id TEXT,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE,

  CHECK (quantity > 0),
  CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_user_cart_item
ON cart_items(user_id, product_id)
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_session_cart_item
ON cart_items(session_id, product_id)
WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS index_favorites_user_id
ON favorites(user_id);

CREATE INDEX IF NOT EXISTS index_favorites_product_id
ON favorites(product_id);

CREATE INDEX IF NOT EXISTS index_cart_items_user_id
ON cart_items(user_id);

CREATE INDEX IF NOT EXISTS index_cart_items_session_id
ON cart_items(session_id);

CREATE INDEX IF NOT EXISTS index_cart_items_product_id
ON cart_items(product_id);