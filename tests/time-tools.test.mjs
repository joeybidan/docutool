import test from 'node:test'
import assert from 'node:assert/strict'
import { dateTimeInputInZone, resolveZonedDateTime } from '../src/utils/timezones.js'
import { parseClockAlarms, triggerDueAlarms } from '../src/utils/clockAlarms.js'
import { holidaysForYear } from '../src/constants/holidays.js'

test('conversion handles summer and winter US offsets and India half-hour offset', () => {
  const summer = resolveZonedDateTime('2026-07-01T09:00', 'Asia/Manila').instants[0]
  assert.equal(dateTimeInputInZone(new Date(summer), 'America/New_York'), '2026-06-30T21:00:00')
  assert.equal(dateTimeInputInZone(new Date(summer), 'Asia/Kolkata'), '2026-07-01T06:30:00')
  const winter = resolveZonedDateTime('2026-12-01T09:00', 'Asia/Manila').instants[0]
  assert.equal(dateTimeInputInZone(new Date(winter), 'America/New_York'), '2026-11-30T20:00:00')
})

test('spring-forward nonexistent times are rejected in every US clock', () => {
  for (const zone of ['America/New_York', 'America/Chicago', 'America/Los_Angeles']) {
    assert.equal(resolveZonedDateTime('2026-03-08T02:30', zone).instants.length, 0)
    assert.equal(resolveZonedDateTime('2026-03-08T03:30', zone).instants.length, 1)
  }
})

test('fall-back times offer both instants one hour apart', () => {
  for (const zone of ['America/New_York', 'America/Chicago', 'America/Los_Angeles']) {
    const { instants } = resolveZonedDateTime('2026-11-01T01:30', zone)
    assert.equal(instants.length, 2)
    assert.equal(instants[1] - instants[0], 3600000)
    for (const at of instants) assert.equal(dateTimeInputInZone(new Date(at), zone), '2026-11-01T01:30:00')
  }
})

test('invalid and empty dates are rejected', () => {
  for (const value of ['', 'bad', '2026-02-30T09:00', '2026-01-01T24:00', '2026-01-01T09:60']) {
    assert.equal(resolveZonedDateTime(value, 'Asia/Manila').instants.length, 0)
  }
})

test('due alarms trigger once, survive a delayed timer, and preserve future alarms', () => {
  const alarms = { 'Asia/Manila': { at: 1000, status: 'armed' }, 'America/New_York': { at: 9000, status: 'armed' } }
  assert.equal(triggerDueAlarms(alarms, 999), alarms)
  const ringing = triggerDueAlarms(alarms, 5000)
  assert.equal(ringing['Asia/Manila'].status, 'ringing')
  assert.equal(ringing['America/New_York'].status, 'armed')
  assert.equal(triggerDueAlarms(ringing, 6000), ringing)
})

test('persisted alarms reject corrupt data and unsupported zones', () => {
  assert.deepEqual(parseClockAlarms('broken'), {})
  assert.deepEqual(parseClockAlarms('{"version":2}'), {})
  const value = JSON.stringify({ version: 1, alarms: {
    'Asia/Manila': { at: 1000, status: 'armed', label: 'Lunch' },
    'America/Chicago': { at: 'bad', status: 'armed' },
    'unknown': { at: 1000, status: 'armed' },
  } })
  assert.deepEqual(parseClockAlarms(value), { 'Asia/Manila': { at: 1000, status: 'armed', label: 'Lunch' } })
})

test('holiday calendars distinguish observed US dates and unproclaimed Philippine Eid dates', () => {
  const current = holidaysForYear(2026)
  assert.equal(current.us.length, 11)
  assert.equal(current.philippines.length, 12)
  assert.deepEqual(current.us.find((item) => item.name === 'Independence Day'), { name: 'Independence Day', date: '2026-07-03', observed: true })
  assert.equal(current.philippines.find((item) => item.name === "Eid'l Fitr").date, '2026-03-20')
  assert.equal(holidaysForYear(2027).philippines.filter((item) => !item.date).length, 2)
  assert.deepEqual(holidaysForYear(2028), { us: [], philippines: [] })
})
