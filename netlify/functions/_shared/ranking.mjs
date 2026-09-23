// Keep one best score per browser identity. Ties favor the earlier started round.
export function topFive(entries) {
  const seen = new Set()
  return [...entries]
    .sort((a, b) => b.score - a.score || a.startedAt - b.startedAt || a.id.localeCompare(b.id))
    .filter(entry => {
      if (seen.has(entry.player)) return false
      seen.add(entry.player)
      return true
    })
    .slice(0, 5)
}

export function publicBoard(entries, player) {
  return { allTime: entries.map(({ name, score, supported, player: id }) => ({
    name, score, supported, isYou: id === player,
  })) }
}
