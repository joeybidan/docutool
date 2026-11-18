import test from 'node:test'
import assert from 'node:assert/strict'
import { SECTION_TITLES, getSectionSlug, sectionHref } from '../src/utils/sectionRoutes.js'

test('every focused section has a stable, space-free direct URL', () => {
  assert.ok(Object.keys(SECTION_TITLES).length >= 20)
  for (const [slug, title] of Object.entries(SECTION_TITLES)) {
    assert.equal(typeof title, 'string')
    assert.match(slug, /^[a-z0-9]+$/)
    assert.equal(sectionHref(slug), `/${slug}`)
    assert.equal(getSectionSlug(`/${slug}`), slug)
    assert.equal(getSectionSlug(`/${slug}/`), slug)
  }
})

test('known short URLs work and unknown URLs do not resolve to another section', () => {
  assert.equal(getSectionSlug('/'), '')
  assert.equal(getSectionSlug('/knowledgebasesearch'), 'knowledgebasesearch')
  assert.equal(getSectionSlug('/carematch'), 'carematch')
  assert.equal(getSectionSlug('/managerannouncements'), 'managerannouncements')
  assert.equal(getSectionSlug('/soptrainings'), 'soptrainings')
  assert.equal(getSectionSlug('/thisdoesnotexist'), null)
  assert.throws(() => sectionHref('not-a-section'))
})
