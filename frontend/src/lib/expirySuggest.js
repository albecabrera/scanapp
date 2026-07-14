// Heuristic shelf-life suggestion by product name keywords (es/de/en)
const RULES = [
  { days: 2,   kw: ['pescado', 'fisch', 'fish', 'marisco', 'gamba'] },
  { days: 3,   kw: ['carne', 'fleisch', 'pollo', 'hähnchen', 'hackfleisch', 'meat', 'filete'] },
  { days: 4,   kw: ['pan ', 'brot', 'bread', 'baguette', 'bollo'] },
  { days: 5,   kw: ['jamón', 'schinken', 'ham', 'embutido', 'wurst', 'salami', 'chorizo', 'mortadela'] },
  { days: 7,   kw: ['leche', 'milch', 'milk', 'nata', 'sahne', 'crema'] },
  { days: 10,  kw: ['fruta', 'obst', 'verdura', 'gemüse', 'ensalada', 'salat', 'tomate fresco'] },
  { days: 14,  kw: ['yogur', 'joghurt', 'yogurt', 'kefir', 'pudding', 'natillas'] },
  { days: 21,  kw: ['queso', 'käse', 'cheese', 'huevo', 'eier', 'egg', 'tofu'] },
  { days: 45,  kw: ['mantequilla', 'butter', 'margarina'] },
  { days: 180, kw: ['congelado', 'tiefkühl', 'frozen', 'pizza', 'helado', 'eis '] },
  { days: 240, kw: ['chocolate', 'schokolade', 'galleta', 'keks', 'cereal', 'müsli', 'snack'] },
  { days: 365, kw: ['pasta', 'arroz', 'reis', 'conserva', 'dose', 'lata', 'garbanzo', 'lenteja', 'alubia', 'bohne', 'harina', 'mehl', 'aceite', 'öl', 'azúcar', 'zucker', 'sal ', 'salz', 'miel', 'honig', 'café', 'kaffee', 'té ', 'tee '] },
]

// Open Food Facts category tags (lang prefix already stripped server-side).
// Far higher coverage than name keywords: most OFF products carry categories.
const CATEGORY_RULES = [
  { days: 2,   kw: ['fishes', 'seafood', 'fresh-fish'] },
  { days: 3,   kw: ['fresh-meats', 'poultry', 'meats', 'sausages'] },
  { days: 4,   kw: ['breads', 'fresh-bread'] },
  { days: 5,   kw: ['hams', 'cooked-hams', 'charcuterie', 'deli-meats'] },
  { days: 7,   kw: ['milks', 'creams', 'fresh-creams'] },
  { days: 10,  kw: ['fresh-vegetables', 'fresh-fruits', 'salads', 'fresh-foods'] },
  { days: 14,  kw: ['yogurts', 'fermented-milk-products', 'desserts', 'dairy-desserts'] },
  { days: 21,  kw: ['cheeses', 'eggs', 'tofu'] },
  { days: 45,  kw: ['butters', 'margarines', 'fats'] },
  { days: 180, kw: ['frozen-foods', 'ice-creams', 'frozen-desserts'] },
  { days: 240, kw: ['chocolates', 'biscuits', 'breakfast-cereals', 'snacks', 'sweet-snacks'] },
  { days: 365, kw: ['pastas', 'rice', 'canned-foods', 'legumes', 'flours', 'vegetable-oils', 'sugars', 'honeys', 'coffees', 'teas', 'groceries'] },
]

export function suggestExpiryDays(name, categories = null) {
  if (name) {
    const n = ' ' + name.toLowerCase() + ' '
    for (const rule of RULES) {
      if (rule.kw.some(k => n.includes(k))) return rule.days
    }
  }
  // Fallback: match Open Food Facts category tags
  if (Array.isArray(categories) && categories.length) {
    for (const rule of CATEGORY_RULES) {
      if (rule.kw.some(k => categories.includes(k))) return rule.days
    }
  }
  return null
}

export function addDays(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// Quick-pick chips: smart suggestion first when available, then standard offsets
export function expiryChips(name, categories = null) {
  const suggested = suggestExpiryDays(name, categories)
  const standard = [3, 7, 30, 180]
  const days = suggested && !standard.includes(suggested)
    ? [suggested, ...standard.filter(d => d !== suggested)].slice(0, 4)
    : standard
  return days.map(d => ({ days: d, date: addDays(d), suggested: d === suggested }))
}
