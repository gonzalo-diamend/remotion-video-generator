#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {loadTypeScriptModule} = require('./lib/load-typescript');
const {assertQuizPayload} = require('./lib/quiz-payload');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'data', 'batches', 'week-001');
const infoDir = path.join(output, 'info');
fs.mkdirSync(infoDir, {recursive: true});

const {spanishQuizVideos} = loadTypeScriptModule(path.join(root, 'src', 'videos-es.ts'));
const sourceFor = (topic) => {
  const source = spanishQuizVideos.find((item) => item.video.topic.toLocaleLowerCase('es') === topic.toLocaleLowerCase('es'));
  if (!source) throw new Error(`No existe contenido para el tema: ${topic}`);
  return source;
};

const days = [
  {day: 1, slug: 'historia', theme: 'Historia Universal', a: ['historia', 'Imperios y exploradores'], b: ['historia', 'Revoluciones y grandes acontecimientos']},
  {day: 2, slug: 'geografia', theme: 'Geografía Mundial', a: ['geografía', 'Países, capitales y fronteras'], b: ['geografía', 'Montañas, islas y desiertos']},
  {day: 3, slug: 'ciencia', theme: 'Ciencia', a: ['ciencia', 'Vida y cuerpo humano'], b: ['ciencia', 'Espacio, materia y energía']},
  {day: 4, slug: 'espana', theme: 'España', a: ['España', 'Geografía de España'], b: ['España', 'Cultura y tradiciones españolas']},
  {day: 5, slug: 'futbol', theme: 'Fútbol', a: ['fútbol', 'Reglas del fútbol'], b: ['fútbol', 'Historia y competiciones']},
  {day: 6, slug: 'mundo-digital', theme: 'Mundo Digital', a: ['tecnología', 'Tecnología esencial'], b: ['videojuegos', 'Videojuegos y gaming']},
  {day: 7, slug: 'entretenimiento', theme: 'Entretenimiento', a: ['cine', 'Cine'], b: ['anime', 'Anime']},
];

const topicTags = {
  historia: ['historia universal','preguntas de historia','test de historia','imperios','revoluciones'],
  geografia: ['geografía mundial','preguntas de geografía','capitales del mundo','mapas','países del mundo'],
  ciencia: ['quiz de ciencia','preguntas científicas','cuerpo humano','espacio','cultura científica'],
  espana: ['quiz España','cultura española','geografía de España','tradiciones españolas','preguntas de España'],
  futbol: ['quiz fútbol','preguntas de fútbol','trivia futbolera','Champions League','Mundial de fútbol'],
  'mundo-digital': ['quiz tecnología','videojuegos','gaming','cultura digital','preguntas geek'],
  entretenimiento: ['quiz cine','quiz anime','películas','manga','cultura pop'],
};

const baseTags = ['quiz','trivia','preguntas y respuestas','cultura general','juego de preguntas','reto mental','desafío de conocimiento','The Quiz Channel','quiz en español'];
const hashtagsFor = (slug, short) => short ? ['#Shorts','#Quiz',`#${slug.replace(/-/g, '')}`] : ['#Quiz','#Trivia',`#${slug.replace(/-/g, '')}`];

const makeQuestions = (topic, start, excluded = []) => {
  const source = sourceFor(topic).questions;
  const seen = new Set(excluded.map((q) => q.question.toLocaleLowerCase('es')));
  const selected = [];
  for (let offset = 0; offset < source.length && selected.length < 4; offset += 1) {
    const question = source[(start + offset) % source.length];
    const key = question.question.toLocaleLowerCase('es');
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push({...structuredClone(question), id: selected.length + 1, duration_frames: 300, answer_reveal_frame: 210});
  }
  if (selected.length !== 4) throw new Error(`No hay cuatro preguntas únicas para ${topic}`);
  return selected;
};

const makePayload = ({id, theme, subtheme, slug, questions, short}) => {
  const count = questions.length;
  const title = short
    ? `${subtheme}: ¿logras 4/4? | Quiz rápido`
    : `Quiz de ${theme}: 8 preguntas para demostrar cuánto sabes`;
  const description = short
    ? `Pon a prueba tus conocimientos sobre ${subtheme.toLocaleLowerCase('es')} con 4 preguntas rápidas. Responde antes de que termine el tiempo y comenta tu puntuación: 0/4, 1/4, 2/4, 3/4 o 4/4.\n\n¿Quién de tus amigos conseguirá el pleno? Compártele el reto y suscríbete a The Quiz Channel para jugar cada día.`
    : `Reto completo de ${theme.toLocaleLowerCase('es')} con las 8 preguntas de los dos Shorts de hoy. Juega sin pausar, suma un punto por respuesta correcta y publica tu resultado del 0 al 8 en los comentarios.\n\nDesafía a un amigo, compara resultados y suscríbete a The Quiz Channel para un nuevo quiz cada día.`;
  const payload = {
    video: {
      id,
      title: title.slice(0, 100),
      description,
      tags: [...baseTags, ...(topicTags[slug] || []), subtheme, theme, short ? 'youtube shorts español' : 'quiz completo'].slice(0, 24),
      hashtags: hashtagsFor(slug, short),
      duration_seconds: short ? 58 : 110,
      difficulty: 'mixed',
      topic: theme,
      language: 'es',
      target_audience: 'general',
    },
    intro: {
      text: short
        ? `Reto rápido de ${subtheme}. Son cuatro preguntas. Responde antes de que termine el tiempo.`
        : `Bienvenido al recopilatorio de ${theme}. Ocho preguntas, un punto por acierto. ¿Podrás lograr ocho de ocho?`,
      duration_frames: 120,
    },
    questions: questions.map((q, index) => ({...q, id: index + 1})),
    outro: {
      text: short
        ? '¿Cuántas acertaste de cuatro? Escribe tu puntuación en comentarios y sigue el canal para el reto completo.'
        : '¿Cuántas acertaste de ocho? Publica tu resultado, desafía a un amigo y suscríbete para el próximo quiz.',
      duration_frames: 120,
    },
    render: {fps: 30, width: 1080, height: 1920, background_style: 'gradient', voice_style: 'energetic', music_style: 'quiz'},
  };
  assertQuizPayload(payload);
  return payload;
};

const scheduleDates = ['2026-09-15','2026-09-16','2026-09-17','2026-09-18','2026-09-19','2026-09-20','2026-09-21'];
const all = [];
const csv = ['dia,fecha_hora_madrid,tipo,id,tema,titulo'];
const safeCsv = (value) => `"${String(value).replace(/"/g, '""')}"`;

for (const day of days) {
  const number = String(day.day).padStart(3, '0');
  const sameSource = day.a[0] === day.b[0];
  const qa = makeQuestions(day.a[0], 0);
  const qb = makeQuestions(day.b[0], sameSource ? 4 : 0, qa);
  const shortA = makePayload({id: `short-${number}-a-${day.slug}`, theme: day.theme, subtheme: day.a[1], slug: day.slug, questions: qa, short: true});
  const shortB = makePayload({id: `short-${number}-b-${day.slug}`, theme: day.theme, subtheme: day.b[1], slug: day.slug, questions: qb, short: true});
  const long = makePayload({id: `recopilatorio-${number}-${day.slug}`, theme: day.theme, subtheme: day.theme, slug: day.slug, questions: [...qa, ...qb], short: false});

  const items = [
    {payload: shortA, format: 'short', time: '13:00', pinned: '¿Cuánto sacaste: 0/4, 1/4, 2/4, 3/4 o 4/4? 👇 La pregunta más difícil fue la número…'},
    {payload: shortB, format: 'short', time: '18:00', pinned: 'Segunda ronda del día: deja tu puntuación sobre 4 👇 ¿Superaste el resultado del primer Short?'},
    {payload: long, format: 'long', time: '21:00', pinned: 'Resultado final: ¿cuántas acertaste de 8? 👇 Etiqueta a alguien que pueda superar tu puntuación.'},
  ];

  for (const item of items) {
    const payloadPath = path.join(output, `${item.payload.video.id}.json`);
    fs.writeFileSync(payloadPath, `${JSON.stringify(item.payload, null, 2)}\n`);
    const publishAt = `${scheduleDates[day.day - 1]} ${item.time}`;
    const info = `# ${item.payload.video.title}

## Archivo de vídeo
${item.format === 'short' ? `out/shorts/${item.payload.video.id}.mp4` : `out/videos/${item.payload.video.id}.mp4`}

## Miniatura
out/thumbnails/${item.payload.video.id}.png

## Publicación recomendada
${publishAt} (Europe/Madrid)

## Título
${item.payload.video.title}

## Descripción
${item.payload.video.description}

Narración generada con inteligencia artificial.

${item.payload.video.hashtags.join(' ')}

## Etiquetas de YouTube
${item.payload.video.tags.join(', ')}

## Comentario fijado
${item.pinned}

## CTA
Pide la puntuación, una respuesta concreta y que desafíen a un amigo. Responde a los primeros comentarios para acelerar la conversación.
`;
    fs.writeFileSync(path.join(infoDir, `${item.payload.video.id}.md`), info);
    all.push({day: day.day, theme: day.theme, format: item.format, publishAt, id: item.payload.video.id, title: item.payload.video.title});
    csv.push([day.day, publishAt, item.format, item.payload.video.id, day.theme, item.payload.video.title].map(safeCsv).join(','));
  }
}
fs.writeFileSync(path.join(output, 'batch.json'), `${JSON.stringify(all, null, 2)}\n`);
fs.writeFileSync(path.join(output, 'CALENDARIO-PUBLICACION.csv'), `${csv.join('\n')}\n`);
console.log(`[weekly-batch] ${all.length} vídeos preparados en ${output}`);
