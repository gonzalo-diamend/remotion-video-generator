#!/usr/bin/env node
const fs = require('fs');

const TOPICS = [
  'Historia universal', 'Geografía mundial', 'Ciencia cotidiana', 'Cine clásico',
  'Animales sorprendentes', 'Capitales del mundo', 'Inventos famosos', 'Mitología griega',
  'Espacio y astronomía', 'Cuerpo humano', 'Música internacional', 'Literatura universal',
  'Banderas del mundo', 'Gastronomía mundial', 'Récords históricos', 'Naturaleza extrema',
  'Antiguo Egipto', 'Grandes exploradores', 'Deportes olímpicos', 'Arte y pintores',
  'Dinosaurios', 'Océanos y vida marina', 'Tecnología e Internet', 'Imperio romano',
  'Países de Europa', 'Curiosidades del idioma español', 'Matemática divertida', 'Series de televisión',
  'Monumentos famosos', 'Premios Nobel', 'Civilizaciones antiguas', 'Fútbol internacional',
  'Química cotidiana', 'Personajes históricos', 'Maravillas naturales', 'Videojuegos clásicos',
  'Sistema solar', 'Reinos animales', 'Historia de España', 'Cultura latinoamericana',
];

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
  return {
    should_run: slot >= 0 ? 'true' : 'false',
    topic: slot >= 0 ? TOPICS[(dayNumber * 2 + slot) % TOPICS.length] : '',
    video_id: slot >= 0 ? `quiz-${dateKey}-${slot === 0 ? 'mediodia' : 'noche'}` : '',
    tts: 'openai',
    upload: 'true',
    privacy: 'public',
  };
};

const manualPlan = () => {
  const clean = (value) => String(value || '').replace(/[\r\n]+/g, ' ').trim();
  const tts = clean(process.env.MANUAL_TTS) || 'openai';
  const privacy = clean(process.env.MANUAL_PRIVACY) || 'private';
  if (!['openai', 'auto', 'mpt', 'none'].includes(tts)) throw new Error('TTS manual inválido');
  if (!['private', 'unlisted', 'public'].includes(privacy)) throw new Error('Privacidad manual inválida');
  return {
    should_run: 'true',
    topic: clean(process.env.MANUAL_TOPIC),
    video_id: '',
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

module.exports = {TOPICS, madridParts, scheduledPlan};
