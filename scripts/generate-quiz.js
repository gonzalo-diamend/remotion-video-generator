#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {buildQuizPayload, quizContentSchema} = require('./lib/quiz-payload');

const getArg = (name, fallback = '') => {
  const prefix = `--${name}=`;
  const value = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
};

const extractOutputText = (response) => {
  if (typeof response.output_text === 'string') return response.output_text;
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && typeof content.text === 'string') return content.text;
    }
  }
  throw new Error('La API no devolvió output_text');
};

const main = async () => {
  const topic = getArg('topic');
  const output = path.resolve(getArg('output', 'out/generated/quiz.json'));
  const id = getArg('id') || undefined;
  const model = getArg('model', process.env.OPENAI_MODEL || 'gpt-5-mini');
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');

  if (!topic) throw new Error('Falta --topic="Tema del quiz"');
  if (!apiKey) throw new Error('Falta OPENAI_API_KEY. También puedes usar --input con un JSON ya creado.');

  const response = await fetch(`${baseUrl}/responses`, {
    method: 'POST',
    headers: {'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content: 'Eres editor experto de un canal de quizzes en español. Crea preguntas objetivamente verificables, evergreen, sin ambigüedad y sin repetir conceptos. Evita datos temporales salvo que el tema los exija. Las opciones incorrectas deben ser plausibles. La explicación debe ser breve y aportar contexto.',
        },
        {
          role: 'user',
          content: `Crea un quiz vertical de 12 preguntas sobre: ${topic}. Ordena 4 fáciles, 4 medias y 4 difíciles. Título atractivo sin afirmaciones engañosas. Descripción SEO natural.`,
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'youtube_quiz',
          strict: true,
          schema: quizContentSchema,
        },
      },
      max_output_tokens: 7000,
    }),
  });

  const body = await response.json();
  if (!response.ok) throw new Error(`OpenAI API ${response.status}: ${body?.error?.message || response.statusText}`);

  const content = JSON.parse(extractOutputText(body));
  const payload = buildQuizPayload({topic, content, id});
  fs.mkdirSync(path.dirname(output), {recursive: true});
  fs.writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(output);
};

main().catch((error) => {
  console.error(`[generate-quiz] ${error.message}`);
  process.exit(1);
});
