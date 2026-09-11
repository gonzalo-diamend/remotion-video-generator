#!/usr/bin/env node
const fs = require('fs');

const STOCK_VIDEO_COUNT = 180;
const DEFAULT_STOCK_START_DATE = '2026-09-11';
const SCHEDULES = {
  summer: {midday: '0 11 * * *', evening: '0 19 * * *'},
  winter: {midday: '0 12 * * *', evening: '0 20 * * *'},
};

const madridParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({type, value}) => [type, value]));
};

const madridOffsetHours = (date = new Date()) => {
  const label = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Madrid',
    timeZoneName: 'longOffset',
  }).formatToParts(date).find(({type}) => type === 'timeZoneName')?.value;
  const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(label || '');
  if (!match) throw new Error(`No se pudo resolver el huso horario de Madrid: ${label || 'vacío'}`);
  const sign = match[1] === '+' ? 1 : -1;
  return sign * (Number(match[2]) + Number(match[3]) / 60);
};

const previousDateKey = (dateKey) => {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
};

const resolveScheduledSlot = (date, eventSchedule) => {
  const parts = madridParts(date);
  const localHour = Number(parts.hour);
  let dateKey = `${parts.year}-${parts.month}-${parts.day}`;

  if (!eventSchedule) {
    return {slot: localHour === 13 ? 0 : localHour === 21 ? 1 : -1, dateKey};
  }

  const schedules = madridOffsetHours(date) === 2 ? SCHEDULES.summer : SCHEDULES.winter;
  const slot = eventSchedule === schedules.midday ? 0 : eventSchedule === schedules.evening ? 1 : -1;

  // GitHub Actions may start a scheduled job hours late. If the evening run
  // crosses midnight in Madrid, it still belongs to the previous stock day.
  if (slot === 1 && localHour < 6) dateKey = previousDateKey(dateKey);
  return {slot, dateKey};
};

const scheduledPlan = (date = new Date(), eventSchedule = process.env.GITHUB_EVENT_SCHEDULE) => {
  const {slot, dateKey} = resolveScheduledSlot(date, eventSchedule);
  const [year, month, day] = dateKey.split('-').map(Number);
  const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  const stockStartDate = process.env.YT_STOCK_START_DATE || DEFAULT_STOCK_START_DATE;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(stockStartDate)) throw new Error('YT_STOCK_START_DATE debe usar YYYY-MM-DD');
  const stockStartDay = Math.floor(new Date(`${stockStartDate}T00:00:00Z`).getTime() / 86400000);
  const stockOffset = (dayNumber - stockStartDay) * 2 + Math.max(slot, 0);
  const hasStock = slot >= 0 && stockOffset >= 0 && stockOffset < STOCK_VIDEO_COUNT;
  const stockIndex = hasStock ? stockOffset + 1 : 0;
  const privacy = process.env.YT_AUTOMATION_PRIVACY || 'private';
  if (!['private', 'unlisted', 'public'].includes(privacy)) throw new Error('YT_AUTOMATION_PRIVACY debe ser private, unlisted o public');
  return {
    should_run: hasStock ? 'true' : 'false',
    stock_index: String(stockIndex),
    slot_id: slot >= 0 ? `${dateKey}-${slot === 0 ? 'mediodia' : 'noche'}` : '',
    tts: 'mpt',
    upload: 'true',
    privacy,
  };
};

const manualPlan = () => {
  const clean = (value) => String(value || '').replace(/[\r\n]+/g, ' ').trim();
  const stockIndex = Number(clean(process.env.MANUAL_STOCK_INDEX) || '1');
  const tts = clean(process.env.MANUAL_TTS) || 'mpt';
  const privacy = clean(process.env.MANUAL_PRIVACY) || 'private';
  if (!Number.isInteger(stockIndex) || stockIndex < 1 || stockIndex > STOCK_VIDEO_COUNT) {
    throw new Error(`Índice manual inválido: usa un número entre 1 y ${STOCK_VIDEO_COUNT}`);
  }
  if (!['mpt', 'none'].includes(tts)) throw new Error('TTS manual inválido');
  if (!['private', 'unlisted', 'public'].includes(privacy)) throw new Error('Privacidad manual inválida');
  return {
    should_run: 'true',
    stock_index: String(stockIndex),
    slot_id: 'manual',
    tts,
    upload: clean(process.env.MANUAL_UPLOAD) === 'true' ? 'true' : 'false',
    privacy,
  };
};

if (require.main === module) {
  const plan = process.env.GITHUB_EVENT_NAME === 'schedule' ? scheduledPlan(new Date(), process.env.GITHUB_EVENT_SCHEDULE) : manualPlan();
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${Object.entries(plan).map(([key, value]) => `${key}=${value}`).join('\n')}\n`);
  } else {
    console.log(JSON.stringify(plan, null, 2));
  }
}

module.exports = {
  DEFAULT_STOCK_START_DATE,
  STOCK_VIDEO_COUNT,
  SCHEDULES,
  madridParts,
  madridOffsetHours,
  resolveScheduledSlot,
  scheduledPlan,
  manualPlan,
};
