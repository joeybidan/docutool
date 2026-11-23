/**
 * Focused photo pages display each upload exactly once. The dashboard roulette
 * duplicates cards only for its seamless scrolling animation.
 * Never mutate, remove, or deduplicate actual Supabase photo records here.
 */
export function buildRouletteEntries(items, repeatForAnimation = false) {
  const originals = items.map((item) => ({
    item, isClone: false, key: `primary-${item.id}`,
  }))
  if (!repeatForAnimation) return originals
  return [
    ...originals,
    ...items.map((item) => ({
      item, isClone: true, key: `clone-${item.id}`,
    })),
  ]
}
