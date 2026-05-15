CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  brand TEXT NOT NULL,
  price REAL NOT NULL,
  picture_front TEXT,
  picture_back TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

