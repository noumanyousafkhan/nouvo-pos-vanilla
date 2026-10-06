-- NOUVO POS VANILLA — Initial Schema
-- Version: 1

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('super_admin','admin','cashier')),
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT
);
CREATE INDEX idx_sessions_token ON sessions(token);

CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  details TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

CREATE TABLE license (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id TEXT NOT NULL,
  license_key TEXT NOT NULL,
  expiry TEXT,
  activated_at TEXT,
  is_active INTEGER DEFAULT 1
);

CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  image_path TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  image_path TEXT,
  is_active INTEGER DEFAULT 1,
  has_variants INTEGER DEFAULT 0,
  has_modifiers INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_products_category ON products(category_id, is_active);

CREATE TABLE product_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_adjust REAL DEFAULT 0,
  is_default INTEGER DEFAULT 0
);

CREATE TABLE product_modifiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_required INTEGER DEFAULT 0,
  is_multiple INTEGER DEFAULT 1
);

CREATE TABLE modifier_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  modifier_id INTEGER NOT NULL REFERENCES product_modifiers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price REAL DEFAULT 0,
  is_default INTEGER DEFAULT 0
);

CREATE TABLE deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  image_path TEXT,
  is_active INTEGER DEFAULT 1,
  valid_from TEXT,
  valid_to TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE deal_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  variant_id INTEGER,
  quantity INTEGER DEFAULT 1
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE NOT NULL,
  invoice_number TEXT UNIQUE,
  order_type TEXT NOT NULL CHECK(order_type IN ('dine_in','takeaway','delivery')),
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  table_number TEXT,
  subtotal REAL NOT NULL DEFAULT 0,
  discount REAL DEFAULT 0,
  delivery_charge REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  payment_method TEXT CHECK(payment_method IN ('cash','card')),
  amount_received REAL DEFAULT 0,
  change REAL DEFAULT 0,
  status TEXT DEFAULT 'completed',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_number ON orders(order_number);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  variant_id INTEGER,
  deal_id INTEGER,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  unit_price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  line_total REAL NOT NULL,
  notes TEXT
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE TABLE order_item_modifiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_item_id INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  modifier_name TEXT NOT NULL,
  option_name TEXT NOT NULL,
  price REAL DEFAULT 0
);

CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  amount REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE invoice_counter (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prefix TEXT DEFAULT 'INV',
  last_number INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  size INTEGER,
  type TEXT CHECK(type IN ('auto','manual','pre_restore')),
  created_at TEXT DEFAULT (datetime('now'))
);
