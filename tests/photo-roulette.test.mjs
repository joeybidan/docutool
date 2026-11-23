import test from 'node:test'
import assert from 'node:assert/strict'
import { buildRouletteEntries } from '../src/utils/photoRoulette.js'

test('focused Team Recognition, Kudos and Family Moments display one card per upload', () => {
  for (const [name, count] of [['Team Recognition', 10], ['Kudos', 5], ['Sharecare Family Moments', 5]]) {
    const items = Array.from({ length: count }, (_, i) => ({ id: `${name}-${i}`, imageUrl: `photo-${i}.jpg` }))
    const focused = buildRouletteEntries(items, false)
    assert.equal(focused.length, count, name)
    assert.deepEqual(focused.map((entry) => entry.item.id), items.map((item) => item.id))
    assert.ok(focused.every((entry) => !entry.isClone), name)
  }
})

test('dashboard photo roulette retains one hidden copy per card for its animation', () => {
  const items = [{ id: 'a' }, { id: 'b' }]
  const cards = buildRouletteEntries(items, true)
  assert.deepEqual(cards.map((card) => card.key), [
    'primary-a', 'primary-b', 'clone-a', 'clone-b',
  ])
  assert.deepEqual(cards.map((card) => card.isClone), [false, false, true, true])
})

test('empty and single-photo galleries remain stable without animation', () => {
  assert.deepEqual(buildRouletteEntries([], false), [])
  const item = { id: 7, title: 'Thank you' }
  assert.deepEqual(buildRouletteEntries([item], false), [{
    item, isClone: false, key: 'primary-7',
  }])
})
