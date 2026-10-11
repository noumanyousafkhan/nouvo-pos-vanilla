-- NOUVO POS VANILLA — Demo Data
-- Version: 21

-- Demo Categories
INSERT OR IGNORE INTO categories (id, name, sort_order, is_active) VALUES
  (1, 'Pizza', 1, 1),
  (2, 'Burgers', 2, 1),
  (3, 'Shawarma', 3, 1),
  (4, 'Wraps', 4, 1),
  (5, 'Sides', 5, 1),
  (6, 'Drinks', 6, 1);

-- Demo Products
INSERT OR IGNORE INTO products (id, category_id, name, price, is_active) VALUES
  (1, 1, 'BBQ Chicken Pizza', 1350, 1),
  (2, 1, 'Chaproni Pizza', 1400, 1),
  (3, 1, 'Cheese Lover Pizza', 1100, 1),
  (4, 1, 'Chicken Malai Tikka Pizza', 1400, 1),
  (5, 1, 'Chicken Tikka Pizza', 1200, 1),
  (6, 1, 'Fajita Pizza', 1300, 1),
  (7, 1, 'Pepperoni Pizza', 1400, 1),
  (8, 2, 'Zinger Burger', 600, 1),
  (9, 2, 'Beef Burger', 700, 1),
  (10, 3, 'Chicken Shawarma', 300, 1),
  (11, 3, 'Beef Shawarma', 350, 1),
  (12, 4, 'Chicken Wrap', 400, 1),
  (13, 5, 'French Fries', 200, 1),
  (14, 5, 'Onion Rings', 250, 1),
  (15, 6, 'Coke', 150, 1),
  (16, 6, 'Sprite', 150, 1),
  (17, 6, 'Water', 80, 1);

INSERT OR IGNORE INTO version (version, name) VALUES (21, 'demo_data');
