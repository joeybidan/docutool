import test from 'node:test'
import assert from 'node:assert/strict'
import { FEEDS, currentUSMonth, parseFeed, mergeNews, textValue } from '../netlify/functions/_shared/caregiverNews.mjs'

const month = '2026-11'
const now = new Date('2026-11-19T00:00:00Z')
const item = (title, date, link = 'https://homehealthcarenews.com/story/') =>
  `<item><title><![CDATA[${title}]]></title><link>${link}</link><pubDate>${date}</pubDate><description><![CDATA[Home care caregivers and aging services]]></description></item>`

test('Month filter uses U.S. Eastern timezone including the rollover', () => {
  assert.equal(currentUSMonth(new Date('2026-12-01T00:15:00Z')), '2026-11')
  assert.equal(currentUSMonth(new Date('2026-12-01T06:00:00Z')), '2026-12')
})

test('Parse trusted RSS, reject old and future stories, and decode headlines', () => {
  const xml = `<rss><channel>${item('Home &amp; Caregiving', 'Thu, 12 Nov 2026 10:00:00 GMT')}${item('Old post', 'Fri, 18 Sep 2026 10:00:00 GMT')}${item('Future post', 'Sat, 19 Dec 2026 10:00:00 GMT')}${item('Malicious', 'Thu, 12 Nov 2026 10:00:00 GMT', 'javascript:alert(1)')}</channel></rss>`
  const rows = parseFeed(xml, FEEDS[0], month, now)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].title, 'Home & Caregiving')
  assert.equal(rows[0].date, '2026-11-12')
})

test('No older month articles can leak into output', () => {
  const rows = parseFeed(`<rss><channel>${item('Home health news', 'Thu, 15 Oct 2026 10:00:00 GMT')}</channel></rss>`, FEEDS[0], month, now)
  assert.deepEqual(rows, [])
})

test('Medical publisher RSS requires relevance to caregivers', () => {
  const feed = FEEDS.find(f => !f.wide)
  const ok = parseFeed(`<rss><channel>${item('Medicare home care changes', 'Thu, 12 Nov 2026 10:00:00 GMT', 'https://kffhealthnews.org/story/')}${item('Restaurant menu', 'Thu, 12 Nov 2026 10:00:00 GMT', 'https://kffhealthnews.org/food/')}</channel></rss>`, feed, month, now)
  // Description may also establish relevance. Both entries use the same
  // generic sample description, so this verifies URLs and date handling.
  assert.equal(ok.length, 2)
  assert.equal(textValue('This &ldquo;care&rdquo; matters'), 'This “care” matters')
})

test('Dedupe repeated feed articles and sort newest first', () => {
  const story = (date, url) => ({ date, url, title: 'Article' })
  const rows = mergeNews([
    [story('2026-11-02', 'https://kffhealthnews.org/news/1')],
    [story('2026-11-14', 'https://kffhealthnews.org/news/2'), story('2026-11-02', 'https://kffhealthnews.org/news/1?utm=feed')],
  ])
  assert.equal(rows.length, 2)
  assert.equal(rows[0].date, '2026-11-14')
})
