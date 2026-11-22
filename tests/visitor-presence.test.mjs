import test from 'node:test'
import assert from 'node:assert/strict'
import { createVisitorPresenceManager } from '../src/services/visitorPresenceManager.js'

function setup({ failRegister = false, cleanupDelayMs = 15 } = {}) {
  const channels = []
  let removed = 0
  let tracked = 0
  const client = {
    channel(topic, config) {
      const handlers = new Map()
      const channel = {
        subscribed: false,
        state: { device1: [{}] },
        on(type, filter, handler) {
          if (failRegister || this.subscribed) throw new Error(`cannot add ${type} callbacks after subscribe()`)
          handlers.set(filter.event, handler)
          return this
        },
        subscribe(handler) {
          this.subscribed = true
          this.callback = handler
          handler('SUBSCRIBED')
          return this
        },
        async track() { tracked += 1; return { error: null } },
        async untrack() {},
        presenceState() { return this.state },
        emit(event) { handlers.get(event)?.() },
      }
      channels.push({ topic, config, channel })
      return channel
    },
    async removeChannel() { removed += 1 },
  }
  const manager = createVisitorPresenceManager({
    getClient: () => client,
    getDeviceId: () => 'device1',
    isConfigured: () => true,
    channelName: 'docutool-online-devices-v1',
    cleanupDelayMs,
  })
  return { channels, manager, get removed() { return removed }, get tracked() { return tracked } }
}

const pause = (ms = 5) => new Promise(resolve => setTimeout(resolve, ms))

test('Multiple counters share one connection and never add listeners after subscribe', async () => {
  const ctx = setup()
  const a = [], b = []
  const stopA = ctx.manager.subscribe(v => a.push(v), e => assert.fail(e.message))
  await pause()
  const stopB = ctx.manager.subscribe(v => b.push(v), e => assert.fail(e.message))
  assert.equal(ctx.channels.length, 1)
  assert.equal(ctx.tracked, 1)
  const ch = ctx.channels[0].channel
  assert.equal(ctx.channels[0].config.config.presence.key, 'device1')
  ch.state = { device1: [{}], device2: [{}] }
  ch.emit('sync')
  assert.equal(a.at(-1), 2)
  assert.equal(b.at(-1), 2)
  stopA()
  ch.state = { device1: [{}] }
  ch.emit('sync')
  assert.equal(b.at(-1), 1)
  stopB()
  await pause(25)
  assert.equal(ctx.removed, 1)
})

test('Immediate remount does not reconnect or retrack (React StrictMode)', async () => {
  const ctx = setup()
  const stopA = ctx.manager.subscribe(() => {}, () => {})
  stopA()
  const stopB = ctx.manager.subscribe(() => {}, () => {})
  await pause(25)
  assert.equal(ctx.channels.length, 1)
  assert.equal(ctx.removed, 0)
  assert.equal(ctx.tracked, 1)
  stopB()
  await pause(25)
  assert.equal(ctx.removed, 1)
})

test('Registration error reports unavailable count without crashing the app', () => {
  const ctx = setup({ failRegister: true })
  const errors = []
  const unsubscribe = ctx.manager.subscribe(() => {}, error => errors.push(error.message))
  assert.match(errors[0], /cannot add presence callbacks/)
  unsubscribe()
})

test('Counter is optional without Supabase credentials', () => {
  const manager = createVisitorPresenceManager({
    isConfigured: () => false,
    getClient: () => { throw new Error('Should not connect') },
    getDeviceId: () => 'device1',
    channelName: 'unused',
  })
  const counts = []
  manager.subscribe(value => counts.push(value), () => {})()
  assert.deepEqual(counts, [null])
})
