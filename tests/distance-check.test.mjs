import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ZIP_API_BASE, parseUsArea, straightLineMiles, resolveZipArea,
  calculateZipDistance, googleMapsDirectionsUrl, estimateModerateTrafficPlanningMinutes,
} from '../src/utils/distanceCheck.js'

test('reads ZIP only or optional city/state and ZIP+4', () => {
  assert.deepEqual(parseUsArea('Seattle, WA 98101'), { zip:'98101', state:'WA' })
  assert.deepEqual(parseUsArea('  90210  '), { zip:'90210', state:null })
  assert.deepEqual(parseUsArea('Los Angeles, CA 90001-1234'), { zip:'90001', state:'CA' })
  assert.equal(parseUsArea('Seattle, WA'), null)
  assert.equal(parseUsArea('12'), null)
  assert.equal(parseUsArea('some 123456'), null)
  assert.equal(parseUsArea(null), null)
})

const fixtures = {
  '98101': { 'place name':'Seattle', 'state abbreviation':'WA', latitude:'47.6114', longitude:'-122.337' },
  '90210': { 'place name':'Beverly Hills', 'state abbreviation':'CA', latitude:'34.0901', longitude:'-118.4065' },
}
function fakeFetch(url) {
  assert.ok(url.startsWith(ZIP_API_BASE))
  const zip = url.split('/').at(-1)
  const place = fixtures[zip]
  return Promise.resolve(place
    ? {ok:true,status:200,json:async()=>({places:[place]})}
    : {ok:false,status:404})
}
test('uses only ZIP-code lookups, never names or client addresses', async () => {
  const routes = []
  const result = await calculateZipDistance('Seattle, WA 98101', 'Beverly Hills, CA 90210', {
    fetchImpl: async (url) => { routes.push(url); return fakeFetch(url) },
  })
  assert.deepEqual(routes, [ZIP_API_BASE+'98101', ZIP_API_BASE+'90210'])
  assert.equal(result.caregiver.state, 'WA')
  assert.equal(result.client.state, 'CA')
  assert.ok(result.miles > 900 && result.miles < 1200)
  assert.equal(result.kilometers, Math.round(result.miles * 1.609344) /* rounded-mile approximation */)
})
test('same ZIP is zero and miles are symmetrical', () => {
  const seattle={latitude:47.6114,longitude:-122.337}
  const la={latitude:34.0901,longitude:-118.4065}
  assert.equal(straightLineMiles(seattle,seattle),0)
  assert.equal(straightLineMiles(seattle,la),straightLineMiles(la,seattle))
})
test('does not silently trust a ZIP with the wrong state', async () => {
  await assert.rejects(() => calculateZipDistance('Seattle, NY 98101','90210',{fetchImpl:fakeFetch}),/not NY/)
})
test('rejects invalid ZIP and missing area', async () => {
  await assert.rejects(() => calculateZipDistance('Seattle, WA','90210',{fetchImpl:fakeFetch}),/5-digit/)
  await assert.rejects(() => resolveZipArea('xyz',{fetchImpl:fakeFetch}),/5-digit/)
  await assert.rejects(() => resolveZipArea('00000',{fetchImpl:fakeFetch}),/not found/)
})
test('handles unexpected lookup data safely', async () => {
  await assert.rejects(() => resolveZipArea('98101', {fetchImpl:async()=>({
    status:200,ok:true,json:async()=>({places:[{latitude:999,longitude:0}]}),
  })}),/unavailable/)
})
test('Google Maps directions link contains validated ZIPs and driving mode', () => {
  assert.equal(googleMapsDirectionsUrl('98101','oops'), '')
  const link = new URL(googleMapsDirectionsUrl('98101','90210'))
  assert.equal(link.hostname,'www.google.com')
  assert.equal(link.pathname,'/maps/dir/')
  assert.equal(link.searchParams.get('api'),'1')
  assert.equal(link.searchParams.get('travelmode'),'driving')
  assert.equal(link.searchParams.get('origin'),'98101, USA')
  assert.equal(link.searchParams.get('destination'),'90210, USA')
})


test('rough moderate-traffic minutes use a broad interval, never a false live ETA', () => {
  const estimate = estimateModerateTrafficPlanningMinutes(18)
  assert.deepEqual(estimate, { minMinutes:20, maxMinutes:40 })
  assert.equal(estimateModerateTrafficPlanningMinutes(0), null)
  assert.equal(estimateModerateTrafficPlanningMinutes(1.5), null)
  assert.equal(estimateModerateTrafficPlanningMinutes(-1), null)
  assert.equal(estimateModerateTrafficPlanningMinutes(Number.NaN), null)
  assert.equal(estimateModerateTrafficPlanningMinutes(Number.POSITIVE_INFINITY), null)
  const farther = estimateModerateTrafficPlanningMinutes(50)
  assert.ok(farther.maxMinutes > estimate.maxMinutes)
})

test('distance calculator attaches planning range without calling a road/traffic service', async () => {
  const urls = []
  const result = await calculateZipDistance('Seattle, WA 98101','Beverly Hills, CA 90210',{
    fetchImpl: async url => { urls.push(url); return fakeFetch(url) },
  })
  assert.deepEqual(urls, [ZIP_API_BASE+'98101', ZIP_API_BASE+'90210'])
  assert.deepEqual(result.moderateTrafficPlanning,
    estimateModerateTrafficPlanningMinutes(straightLineMiles(result.caregiver,result.client)))
})

test('street address text is ignored in ZIP-only lookup', async () => {
  const urls=[]
  await calculateZipDistance('2065 Sanders Road, Seattle, WA 98101', '310 Jackson St, Beverly Hills, CA 90210', {
    fetchImpl: async url => { urls.push(url); return fakeFetch(url) },
  })
  assert.deepEqual(urls,[ZIP_API_BASE+'98101',ZIP_API_BASE+'90210'])
})
