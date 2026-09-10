const test = require('node:test');
const assert = require('node:assert/strict');
const {scheduledPlan} = require('../scripts/select-topic');

test('programa el primer video a las 13:00 de Madrid', () => {
  const plan = scheduledPlan(new Date('2026-07-15T11:00:00Z'));
  assert.equal(plan.should_run, 'true');
  assert.equal(plan.video_id, 'quiz-2026-07-15-mediodia');
  assert.equal(plan.privacy, 'public');
});

test('programa el segundo video a las 21:00 de Madrid', () => {
  const plan = scheduledPlan(new Date('2026-01-15T20:00:00Z'));
  assert.equal(plan.should_run, 'true');
  assert.equal(plan.video_id, 'quiz-2026-01-15-noche');
});

test('descarta las comprobaciones UTC que no coinciden con el horario local', () => {
  assert.equal(scheduledPlan(new Date('2026-07-15T12:00:00Z')).should_run, 'false');
  assert.equal(scheduledPlan(new Date('2026-01-15T19:00:00Z')).should_run, 'false');
});
