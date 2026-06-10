// Static recipe suggestions matched against expiring inventory items
const RECIPES = [
  {
    id: 'tortilla',
    kw: ['huevo', 'patata', 'eier', 'kartoffel'],
    minMatch: 1,
    es: { name: 'Tortilla de patatas', desc: 'Huevos + patatas + cebolla. 30 min.' },
    de: { name: 'Spanische Tortilla', desc: 'Eier + Kartoffeln + Zwiebel. 30 Min.' },
    emoji: '🍳',
  },
  {
    id: 'crepes',
    kw: ['leche', 'huevo', 'harina', 'milch', 'eier', 'mehl'],
    minMatch: 1,
    es: { name: 'Crêpes caseros', desc: 'Leche + huevos + harina. 20 min.' },
    de: { name: 'Pfannkuchen', desc: 'Milch + Eier + Mehl. 20 Min.' },
    emoji: '🥞',
  },
  {
    id: 'quiche',
    kw: ['huevo', 'queso', 'nata', 'espinaca', 'eier', 'käse', 'sahne', 'spinat'],
    minMatch: 2,
    es: { name: 'Quiche express', desc: 'Huevos + queso + verdura que tengas. 40 min.' },
    de: { name: 'Schnelle Quiche', desc: 'Eier + Käse + Gemüsereste. 40 Min.' },
    emoji: '🥧',
  },
  {
    id: 'pasta-tomate',
    kw: ['pasta', 'tomate', 'queso', 'käse'],
    minMatch: 2,
    es: { name: 'Pasta al pomodoro', desc: 'Pasta + tomate triturado + queso. 15 min.' },
    de: { name: 'Pasta al Pomodoro', desc: 'Pasta + Tomatensoße + Käse. 15 Min.' },
    emoji: '🍝',
  },
  {
    id: 'batido',
    kw: ['leche', 'yogur', 'fruta', 'plátano', 'milch', 'joghurt', 'obst', 'banane'],
    minMatch: 1,
    es: { name: 'Batido / smoothie', desc: 'Lácteos por vencer + fruta madura. 5 min.' },
    de: { name: 'Smoothie', desc: 'Milchprodukte + reifes Obst. 5 Min.' },
    emoji: '🥤',
  },
  {
    id: 'sandwich',
    kw: ['pan', 'jamón', 'queso', 'brot', 'schinken', 'käse'],
    minMatch: 2,
    es: { name: 'Sándwich caliente', desc: 'Pan + jamón + queso a la plancha. 10 min.' },
    de: { name: 'Heißes Sandwich', desc: 'Brot + Schinken + Käse gegrillt. 10 Min.' },
    emoji: '🥪',
  },
  {
    id: 'salteado',
    kw: ['verdura', 'espinaca', 'arroz', 'gemüse', 'spinat', 'reis'],
    minMatch: 1,
    es: { name: 'Salteado de verduras', desc: 'Verduras por vencer + arroz o pasta. 20 min.' },
    de: { name: 'Gemüsepfanne', desc: 'Gemüsereste + Reis oder Nudeln. 20 Min.' },
    emoji: '🥘',
  },
  {
    id: 'yogur-bowl',
    kw: ['yogur', 'joghurt', 'cereal', 'müsli', 'miel', 'honig', 'fruta'],
    minMatch: 1,
    es: { name: 'Bowl de yogur', desc: 'Yogur + cereales + fruta o miel. 5 min.' },
    de: { name: 'Joghurt-Bowl', desc: 'Joghurt + Müsli + Obst oder Honig. 5 Min.' },
    emoji: '🥣',
  },
]

// items: inventory items expiring soon. Returns up to `max` recipes with their matched item names.
export function matchRecipes(items, lang = 'es', max = 3) {
  if (!items?.length) return []
  const names = items.map(i => ({ raw: i.name, low: ' ' + i.name.toLowerCase() + ' ' }))

  const scored = RECIPES.map(r => {
    const matched = []
    for (const n of names) {
      if (r.kw.some(k => n.low.includes(k))) matched.push(n.raw)
    }
    return { recipe: r, matched: [...new Set(matched)] }
  })
    .filter(s => s.matched.length >= s.recipe.minMatch)
    .sort((a, b) => b.matched.length - a.matched.length)

  return scored.slice(0, max).map(s => ({
    id: s.recipe.id,
    emoji: s.recipe.emoji,
    name: (s.recipe[lang] ?? s.recipe.es).name,
    desc: (s.recipe[lang] ?? s.recipe.es).desc,
    matched: s.matched,
  }))
}
