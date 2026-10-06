const Database = require('better-sqlite3')
const os = require('os')
const path = require('path')

const dataDir = path.join(os.homedir(), '.config', 'nouvo-pos-vanilla', 'Database')
const dbPath = path.join(dataDir, 'nouvo.db')

console.log('Opening database:', dbPath)
const db = new Database(dbPath)

db.pragma('foreign_keys = ON')

// Clear existing categories/products (fresh demo)
db.prepare('DELETE FROM product_variants').run()
db.prepare('DELETE FROM modifier_options').run()
db.prepare('DELETE FROM product_modifiers').run()
db.prepare('DELETE FROM products').run()
db.prepare('DELETE FROM categories').run()

const categories = [
  { name: 'Pizza', sort_order: 1, icon: '🍕' },
  { name: 'Burgers', sort_order: 2, icon: '🍔' },
  { name: 'Shawarma', sort_order: 3, icon: '🌯' },
  { name: 'Wraps', sort_order: 4, icon: '🥙' },
  { name: 'Sides', sort_order: 5, icon: '🍟' },
  { name: 'Drinks', sort_order: 6, icon: '🥤' }
]

const insertCategory = db.prepare(`
  INSERT INTO categories (name, sort_order, is_active)
  VALUES (?, ?, 1)
`)

const categoryIds = {}
for (const cat of categories) {
  const result = insertCategory.run(cat.name, cat.sort_order)
  categoryIds[cat.name] = Number(result.lastInsertRowid)
  console.log(`  ✓ Category: ${cat.name} (id: ${categoryIds[cat.name]})`)
}

const insertProduct = db.prepare(`
  INSERT INTO products (category_id, name, price, is_active, has_variants, has_modifiers)
  VALUES (?, ?, ?, 1, ?, ?)
`)

const products = [
  // Pizza
  { cat: 'Pizza', name: 'Chicken Tikka Pizza', price: 1200, variants: true, modifiers: true },
  { cat: 'Pizza', name: 'Fajita Pizza', price: 1300, variants: true, modifiers: true },
  { cat: 'Pizza', name: 'Cheese Lover Pizza', price: 1100, variants: true, modifiers: true },
  { cat: 'Pizza', name: 'Pepperoni Pizza', price: 1400, variants: true, modifiers: true },
  { cat: 'Pizza', name: 'BBQ Chicken Pizza', price: 1350, variants: true, modifiers: true },

  // Burgers
  { cat: 'Burgers', name: 'Zinger Burger', price: 550, variants: false, modifiers: true },
  { cat: 'Burgers', name: 'Chicken Cheese Burger', price: 650, variants: false, modifiers: true },
  { cat: 'Burgers', name: 'Beef Burger', price: 700, variants: false, modifiers: true },
  { cat: 'Burgers', name: 'Double Zinger', price: 850, variants: false, modifiers: true },
  { cat: 'Burgers', name: 'Grilled Chicken Burger', price: 600, variants: false, modifiers: true },

  // Shawarma
  { cat: 'Shawarma', name: 'Chicken Shawarma', price: 250, variants: false, modifiers: true },
  { cat: 'Shawarma', name: 'Beef Shawarma', price: 300, variants: false, modifiers: true },
  { cat: 'Shawarma', name: 'Special Shawarma', price: 350, variants: false, modifiers: true },
  { cat: 'Shawarma', name: 'Cheese Shawarma', price: 400, variants: false, modifiers: true },

  // Wraps
  { cat: 'Wraps', name: 'Chicken Wrap', price: 350, variants: false, modifiers: true },
  { cat: 'Wraps', name: 'Beef Wrap', price: 400, variants: false, modifiers: true },
  { cat: 'Wraps', name: 'Grilled Chicken Wrap', price: 450, variants: false, modifiers: true },
  { cat: 'Wraps', name: 'Veggie Wrap', price: 300, variants: false, modifiers: true },

  // Sides
  { cat: 'Sides', name: 'French Fries', price: 200, variants: true, modifiers: false },
  { cat: 'Sides', name: 'Masala Fries', price: 250, variants: true, modifiers: false },
  { cat: 'Sides', name: 'Loaded Fries', price: 400, variants: false, modifiers: true },
  { cat: 'Sides', name: 'Chicken Nuggets', price: 350, variants: false, modifiers: true },
  { cat: 'Sides', name: 'Chicken Wings', price: 500, variants: false, modifiers: true },
  { cat: 'Sides', name: 'Onion Rings', price: 300, variants: false, modifiers: false },
  { cat: 'Sides', name: 'Cheese Sticks', price: 350, variants: false, modifiers: false },

  // Drinks
  { cat: 'Drinks', name: 'Coca Cola', price: 100, variants: true, modifiers: false },
  { cat: 'Drinks', name: 'Pepsi', price: 100, variants: true, modifiers: false },
  { cat: 'Drinks', name: 'Sprite', price: 100, variants: true, modifiers: false },
  { cat: 'Drinks', name: 'Mineral Water', price: 60, variants: false, modifiers: false },
  { cat: 'Drinks', name: 'Fresh Lime', price: 150, variants: false, modifiers: false },
  { cat: 'Drinks', name: 'Chocolate Shake', price: 350, variants: false, modifiers: true },
  { cat: 'Drinks', name: 'Mango Shake', price: 350, variants: false, modifiers: true }
]

const productIds = {}
for (const p of products) {
  const result = insertProduct.run(
    categoryIds[p.cat],
    p.name,
    p.price,
    p.variants ? 1 : 0,
    p.modifiers ? 1 : 0
  )
  productIds[p.name] = Number(result.lastInsertRowid)
  console.log(`  ✓ Product: ${p.name} (${p.cat})`)
}

// Pizza variants (all pizzas get S/M/L sizes)
const insertVariant = db.prepare(`
  INSERT INTO product_variants (product_id, name, price_adjust, is_default)
  VALUES (?, ?, ?, ?)
`)

const pizzaProducts = products.filter((p) => p.cat === 'Pizza')
for (const p of pizzaProducts) {
  const pid = productIds[p.name]
  insertVariant.run(pid, 'Small (6")', -300, 0)
  insertVariant.run(pid, 'Medium (9")', 0, 1)
  insertVariant.run(pid, 'Large (12")', 500, 0)
  insertVariant.run(pid, 'Family (15")', 1000, 0)
}
console.log(`  ✓ Pizza variants added`)

// Fries variants
for (const name of ['French Fries', 'Masala Fries']) {
  const pid = productIds[name]
  insertVariant.run(pid, 'Regular', 0, 1)
  insertVariant.run(pid, 'Large', 100, 0)
}
console.log(`  ✓ Fries variants added`)

// Drink variants
for (const name of ['Coca Cola', 'Pepsi', 'Sprite']) {
  const pid = productIds[name]
  insertVariant.run(pid, 'Regular', 0, 1)
  insertVariant.run(pid, '1.5 Ltr', 150, 0)
}
console.log(`  ✓ Drink variants added`)

// Modifiers (add-ons)
const insertModifier = db.prepare(`
  INSERT INTO product_modifiers (product_id, name, is_required, is_multiple)
  VALUES (?, ?, 0, 1)
`)

const insertOption = db.prepare(`
  INSERT INTO modifier_options (modifier_id, name, price, is_default)
  VALUES (?, ?, ?, 0)
`)

// Pizza toppings
for (const p of pizzaProducts) {
  const pid = productIds[p.name]
  const modResult = insertModifier.run(pid, 'Toppings')
  const modId = Number(modResult.lastInsertRowid)
  insertOption.run(modId, 'Extra Cheese', 150)
  insertOption.run(modId, 'Chicken Tikka', 200)
  insertOption.run(modId, 'Olives', 100)
  insertOption.run(modId, 'Mushrooms', 120)
  insertOption.run(modId, 'Green Peppers', 80)
}
console.log(`  ✓ Pizza toppings added`)

// Burger add-ons
const burgerProducts = products.filter((p) => p.cat === 'Burgers')
for (const p of burgerProducts) {
  const pid = productIds[p.name]
  const modResult = insertModifier.run(pid, 'Add-ons')
  const modId = Number(modResult.lastInsertRowid)
  insertOption.run(modId, 'Extra Cheese', 80)
  insertOption.run(modId, 'Extra Patty', 200)
  insertOption.run(modId, 'Jalapeños', 50)
  insertOption.run(modId, 'Bacon', 150)
}
console.log(`  ✓ Burger add-ons added`)

// Shawarma add-ons
const shawarmaProducts = products.filter((p) => p.cat === 'Shawarma')
for (const p of shawarmaProducts) {
  const pid = productIds[p.name]
  const modResult = insertModifier.run(pid, 'Add-ons')
  const modId = Number(modResult.lastInsertRowid)
  insertOption.run(modId, 'Extra Chicken', 100)
  insertOption.run(modId, 'Cheese', 80)
  insertOption.run(modId, 'Garlic Sauce', 40)
  insertOption.run(modId, 'Spicy', 0)
}
console.log(`  ✓ Shawarma add-ons added`)

// Wrap add-ons
const wrapProducts = products.filter((p) => p.cat === 'Wraps')
for (const p of wrapProducts) {
  const pid = productIds[p.name]
  const modResult = insertModifier.run(pid, 'Add-ons')
  const modId = Number(modResult.lastInsertRowid)
  insertOption.run(modId, 'Extra Meat', 120)
  insertOption.run(modId, 'Cheese', 70)
  insertOption.run(modId, 'Hot Sauce', 30)
}
console.log(`  ✓ Wrap add-ons added`)

// Side add-ons
for (const name of ['Loaded Fries', 'Chicken Nuggets', 'Chicken Wings']) {
  const pid = productIds[name]
  const modResult = insertModifier.run(pid, 'Dips')
  const modId = Number(modResult.lastInsertRowid)
  insertOption.run(modId, 'Garlic Mayo', 40)
  insertOption.run(modId, 'BBQ Sauce', 40)
  insertOption.run(modId, 'Cheese Sauce', 60)
}
console.log(`  ✓ Side dips added`)

// Shake add-ons
for (const name of ['Chocolate Shake', 'Mango Shake']) {
  const pid = productIds[name]
  const modResult = insertModifier.run(pid, 'Extras')
  const modId = Number(modResult.lastInsertRowid)
  insertOption.run(modId, 'Extra Ice Cream', 80)
  insertOption.run(modId, 'Whipped Cream', 50)
}
console.log(`  ✓ Shake extras added`)

console.log('\n✅ Demo data seeded successfully!\n')
console.log('Summary:')
console.log(`  Categories: ${categories.length}`)
console.log(`  Products:   ${products.length}`)
console.log(`  Variants:   Added for pizzas, fries, drinks`)
console.log(`  Modifiers:  Added for pizzas, burgers, shawarma, wraps, sides, shakes`)
console.log('\nRestart the app to see them in POS.\n')

db.close()
