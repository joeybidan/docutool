import test from 'node:test'
import assert from 'node:assert/strict'
import { EMPTY_WRAP_UP, validateCallWrapUp, formatCallWrapUpBlock } from '../src/utils/callWrapUp.js'

const complete = {
  caller: 'caregiver', fullName: 'Alex Example', issue: 'timesheet',
  action: 'guided', outcome: 'resolved', nextSteps: 'Explained the correct workflow.',
}

test('incomplete wrap-ups cannot be inserted', () => {
  assert.ok(validateCallWrapUp(EMPTY_WRAP_UP).length >= 5)
  assert.throws(() => formatCallWrapUpBlock(EMPTY_WRAP_UP), /Choose who called/)
})

test('creates factual, generic documentation without replacing free text', () => {
  const block = formatCallWrapUpBlock(complete)
  assert.match(block, /^CALL WRAP-UP\nCaller: Caregiver \/ provider/m)
  assert.match(block, /Client \/ member full name: Alex Example/)
  assert.match(block, /Issue: Timesheet \/ clock in or out/)
  assert.match(block, /Action taken: Guided through navigation/)
  assert.match(block, /Outcome: Resolved/)
  assert.match(block, /Details \/ next steps: Explained the correct workflow\./)
  assert.ok(!block.includes('UHC'))
})

test('pending follow-up must describe next action', () => {
  assert.ok(validateCallWrapUp({ ...complete, outcome: 'pending', nextSteps: '   ' }).length > 0)
  assert.equal(validateCallWrapUp({ ...complete, outcome: 'pending', nextSteps: 'Call back Friday afternoon.' }).length, 0)
})

test('Other issue and action require actual details', () => {
  assert.ok(validateCallWrapUp({ ...complete, issue: 'other', customIssue: '' }).length > 0)
  assert.ok(validateCallWrapUp({ ...complete, action: 'other', customAction: '' }).length > 0)
  assert.match(formatCallWrapUpBlock({
    ...complete, issue: 'other', customIssue: 'Request about form A',
    action: 'other', customAction: 'Sent approved information',
  }), /Issue: Request about form A\nAction taken: Sent approved information/)
})

test('sanitizes unexpected newlines in names and custom dropdown text', () => {
  const block = formatCallWrapUpBlock({
    ...complete, fullName: 'Alex\nExample', issue: 'other',
    customIssue: 'A\nB',
  })
  assert.match(block, /full name: Alex Example/)
  assert.match(block, /Issue: A B\nAction taken:/)
})
