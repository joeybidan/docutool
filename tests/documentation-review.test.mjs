import test from 'node:test'
import assert from 'node:assert/strict'
import { reviewDocumentation } from '../src/utils/documentationReview.js'

const wrapUp = [
  'CALL WRAP-UP',
  'Caller: Member / client',
  'Client / member full name: Alex Example',
  'Issue: Timesheet / clock in or out',
  'Action taken: Guided through navigation',
  'Outcome: Resolved',
].join('\n')

test('structured Phase 2 wrap-up finds all three required fields', () => {
  const report = reviewDocumentation(wrapUp)
  assert.equal(report.warningCount, 0)
  assert.deepEqual(report.checks.map(item => item.id), ['full-name', 'issue', 'action'])
})
test('empty or generic template notes prompt review instead of claiming QA success', () => {
  for (const note of ['', 'Member called in\nCaregiver called in', 'Issue is general questions']) {
    const report = reviewDocumentation(note)
    assert.ok(report.warningCount >= 2)
  }
})
test('traditional freeform note detects issue and action but warns when name missing', () => {
  const report = reviewDocumentation('Member called in about a timesheet problem. Guided the caller through navigation.')
  assert.deepEqual(report.warnings.map(item => item.id), ['full-name'])
})
test('a single name does not count as a verified full name', () => {
  const report = reviewDocumentation(wrapUp.replace('Alex Example', 'Joey'))
  assert.deepEqual(report.warnings.map(item => item.id), ['full-name'])
})
test('placeholders do not count as documentation', () => {
  const report = reviewDocumentation('Name: N/A\nIssue: unknown\nAction taken: TBD')
  assert.equal(report.warningCount, 3)
})
test('action is not inferred from Outcome: Resolved alone', () => {
  const note = 'Member name: Maria Garcia\nIssue: General question\nOutcome: Resolved'
  assert.deepEqual(reviewDocumentation(note).warnings.map(item => item.id), ['action'])
})
test('pending outcome must include a follow-up plan', () => {
  const pending = wrapUp.replace('Outcome: Resolved', 'Outcome: Pending follow-up')
  const report = reviewDocumentation(pending)
  assert.deepEqual(report.warnings.map(item => item.id), ['next-steps'])
  assert.equal(reviewDocumentation(pending + '\nNext steps: Call client Friday afternoon.').warningCount, 0)
})
test('explicit next steps are evaluated without uploading or changing text', () => {
  const note = 'Caller name: Jane Doe\nReason for call: interview schedule\nResolution: transferred to team'
  const copy = note
  const report = reviewDocumentation(note)
  assert.equal(report.warningCount, 0)
  assert.equal(note, copy)
})
test('a false-positive-prone template phrase does not count as client name', () => {
  assert.equal(reviewDocumentation('Resolved by guiding navigation and answering questions\nMember called in').warnings.some(c => c.id === 'full-name'),true)
})
test('non-English or unconventional note formatting is still treated as advisory, not a hard gate', () => {
  const report = reviewDocumentation('Nombre: María Pérez\nConsulta: reloj\nSe le ayudó')
  assert.ok(report.warningCount > 0)
  assert.ok(Array.isArray(report.warnings))
})
