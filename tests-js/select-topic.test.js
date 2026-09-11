const test = require('node:test');
const assert = require('node:assert/strict');
const {manualPlan, scheduledPlan, STOCK_VIDEO_COUNT} = require('../scripts/select-topic');

test('programa el primer video con el cron de verano', () => {
  const plan = scheduledPlan(new Date('2026-09-11T11:00:00Z'), '0 11 * * *');
  assert.equal(plan.should_run, 'true');
  assert.equal(plan.stock_index, '1');
  assert.equal(plan.slot_id, '2026-09-11-mediodia');
  assert.equal(plan.tts, 'mpt');
  assert.equal(plan.privacy, 'private');
});

test('programa el segundo video con el cron de invierno', () => {
  const previous = process.env.YT_STOCK_START_DATE;
  process.env.YT_STOCK_START_DATE = '2026-01-15';
  try {
    const plan = scheduledPlan(new Date('2026-01-15T20:00:00Z'), '0 20 * * *');
    assert.equal(plan.should_run, 'true');
    assert.equal(plan.stock_index, '2');
    assert.equal(plan.slot_id, '2026-01-15-noche');
    assert.equal(plan.tts, 'mpt');
  } finally {
    if (previous === undefined) delete process.env.YT_STOCK_START_DATE;
    else process.env.YT_STOCK_START_DATE = previous;
  }
});

test('selecciona los índices de stock consecutivos en las dos franjas del día', () => {
  const midday = scheduledPlan(new Date('2026-09-11T11:00:00Z'), '0 11 * * *');
  const evening = scheduledPlan(new Date('2026-09-11T19:00:00Z'), '0 19 * * *');
  assert.equal(Number(evening.stock_index), (Number(midday.stock_index) % STOCK_VIDEO_COUNT) + 1);
});

test('la ejecución manual usa stock local y voz gratuita por defecto', () => {
  const previous = process.env.MANUAL_STOCK_INDEX;
  delete process.env.MANUAL_STOCK_INDEX;
  try {
    const plan = manualPlan();
    assert.equal(plan.stock_index, '1');
    assert.equal(plan.tts, 'mpt');
    assert.equal(plan.privacy, 'private');
  } finally {
    if (previous === undefined) delete process.env.MANUAL_STOCK_INDEX;
    else process.env.MANUAL_STOCK_INDEX = previous;
  }
});

test('descarta las comprobaciones UTC que no coinciden con el horario local', () => {
  assert.equal(scheduledPlan(new Date('2026-09-11T12:00:00Z'), '0 12 * * *').should_run, 'false');
  assert.equal(scheduledPlan(new Date('2026-09-11T20:00:00Z'), '0 20 * * *').should_run, 'false');
});

test('tolera un inicio retrasado de GitHub Actions', () => {
  const midday = scheduledPlan(new Date('2026-09-11T14:37:00Z'), '0 11 * * *');
  assert.equal(midday.should_run, 'true');
  assert.equal(midday.stock_index, '1');
  assert.equal(midday.slot_id, '2026-09-11-mediodia');
});

test('conserva el día anterior si la ejecución nocturna cruza medianoche', () => {
  const previous = process.env.YT_STOCK_START_DATE;
  process.env.YT_STOCK_START_DATE = '2026-09-11';
  try {
    const plan = scheduledPlan(new Date('2026-09-11T22:13:00Z'), '0 19 * * *');
    assert.equal(plan.should_run, 'true');
    assert.equal(plan.stock_index, '2');
    assert.equal(plan.slot_id, '2026-09-11-noche');
  } finally {
    if (previous === undefined) delete process.env.YT_STOCK_START_DATE;
    else process.env.YT_STOCK_START_DATE = previous;
  }
});

test('permite activar publicación pública de forma explícita', () => {
  const previous = process.env.YT_AUTOMATION_PRIVACY;
  process.env.YT_AUTOMATION_PRIVACY = 'public';
  try {
    assert.equal(scheduledPlan(new Date('2026-09-11T11:00:00Z'), '0 11 * * *').privacy, 'public');
  } finally {
    if (previous === undefined) delete process.env.YT_AUTOMATION_PRIVACY;
    else process.env.YT_AUTOMATION_PRIVACY = previous;
  }
});

test('detiene el cron cuando se agotan los 180 videos', () => {
  const plan = scheduledPlan(new Date('2026-12-10T12:00:00Z'), '0 12 * * *');
  assert.equal(plan.should_run, 'false');
  assert.equal(plan.stock_index, '0');
});
