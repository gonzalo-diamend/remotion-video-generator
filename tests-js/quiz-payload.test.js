const test = require('node:test');
const assert = require('node:assert/strict');
const {assertQuizContent, assertQuizPayload, buildQuizPayload} = require('../scripts/lib/quiz-payload');

const makeContent = () => ({
  title: 'Quiz de prueba',
  description: 'Descripción completa del quiz de prueba.',
  difficulty: 'mixed',
  questions: Array.from({length: 12}, (_, index) => ({
    question: `Pregunta única ${index + 1}`,
    options: ['A', 'B', 'C', 'D'].map((letter) => `${letter}-${index}`),
    correct_index: index % 4,
    explanation: `Explicación ${index + 1}`,
    difficulty: index < 4 ? 'easy' : index < 8 ? 'medium' : 'hard',
  })),
});

test('construye un payload renderizable de 12 preguntas', () => {
  const payload = buildQuizPayload({topic: 'Historia de España', content: makeContent()});
  assert.equal(payload.questions.length, 12);
  assert.equal(payload.render.width, 1080);
  assert.match(payload.video.id, /^quiz-historia-de-espana-/);
});

test('rechaza preguntas duplicadas', () => {
  const content = makeContent();
  content.questions[1].question = content.questions[0].question;
  assert.throws(() => assertQuizContent(content), /duplicada/);
});

test('rechaza un id que podría escapar del directorio de salida', () => {
  const payload = buildQuizPayload({topic: 'Historia', content: makeContent()});
  payload.video.id = '../fuera';
  assert.throws(() => assertQuizPayload(payload), /video.id inválido/);
});
