#!/usr/bin/env node
const fs = require('fs');

const STOCK_VIDEO_COUNT = 180;
const DEFAULT_STOCK_START_DATE = '2026-09-11';

const madridParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({type, value}) => [type, value]));
};

const scheduledPlan = (date = new Date()) => {
  const parts = madridParts(date);
  const hour = Number(parts.hour);
  const slot = hour === 13 ? 0 : hour === 21 ? 1 : -1;
  const dateKey = `${parts.year}-${parts.month}-${parts.day}`;
  const dayNumber = Math.floor(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)) / 86400000);
  const stockStartDate = process.env.YT_STOCK_START_DATE || DEFAULT_STOCK_START_DATE;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(stockStartDate)) throw new Error('YT_STOCK_START_DATE debe usar YYYY-MM-DD');
  const stockStartDay = Math.floor(new Date(`${stockStartDate}T00:00:00Z`).getTime() / 86400000);
  const stockOffset = (dayNumber - stockStartDay) * 2 + Math.max(slot, 0);
  const hasStock = slot >= 0 && stockOffset >= 0 && stockOffset < STOCK_VIDEO_COUNT;
  const stockIndex = hasStock ? stockOffset + 1 : 0;
  return {
    should_run: hasStock ? 'true' : 'false',
    stock_index: String(stockIndex),
    slot_id: slot >= 0 ? `${dateKey}-${slot === 0 ? 'mediodia' : 'noche'}` : '',
    tts: 'mpt',
    upload: 'true',
    privacy: 'public',
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
  const plan = process.env.GITHUB_EVENT_NAME === 'schedule' ? scheduledPlan() : manualPlan();
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${Object.entries(plan).map(([key, value]) => `${key}=${value}`).join('\n')}\n`);
  } else {
    console.log(JSON.stringify(plan, null, 2));
  }
}

module.exports = {DEFAULT_STOCK_START_DATE, STOCK_VIDEO_COUNT, madridParts, scheduledPlan, manualPlan};
