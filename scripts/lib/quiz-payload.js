const crypto = require('crypto');

const QUESTION_COUNT = 12;
const FPS = 30;
const BASE_QUESTION_FRAMES = 360;
const INTRO_OUTRO_FRAMES = 150;

const normalize = (value) => String(value || '').trim().toLocaleLowerCase('es');
const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;

const slugify = (value) => normalize(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 42);

const assertQuizContent = (content) => {
  if (!content || typeof content !== 'object') throw new Error('El contenido del quiz debe ser un objeto');
  if (!nonEmpty(content.title) || !nonEmpty(content.description)) throw new Error('El quiz necesita title y description');
  if (!Array.isArray(content.questions) || content.questions.length !== QUESTION_COUNT) {
    throw new Error(`El quiz debe contener exactamente ${QUESTION_COUNT} preguntas`);
  }

  const seenQuestions = new Set();
  content.questions.forEach((question, index) => {
    if (!nonEmpty(question.question) || !nonEmpty(question.explanation)) {
      throw new Error(`Pregunta ${index + 1}: faltan pregunta o explicación`);
    }
    const normalizedQuestion = normalize(question.question);
    if (seenQuestions.has(normalizedQuestion)) throw new Error(`Pregunta duplicada: ${question.question}`);
    seenQuestions.add(normalizedQuestion);

    if (!Array.isArray(question.options) || question.options.length !== 4 || !question.options.every(nonEmpty)) {
      throw new Error(`Pregunta ${index + 1}: debe tener exactamente cuatro opciones`);
    }
    if (new Set(question.options.map(normalize)).size !== 4) {
      throw new Error(`Pregunta ${index + 1}: contiene opciones duplicadas`);
    }
    if (!Number.isInteger(question.correct_index) || question.correct_index < 0 || question.correct_index > 3) {
      throw new Error(`Pregunta ${index + 1}: correct_index fuera de rango`);
    }
  });

  return content;
};

const assertQuizPayload = (payload) => {
  if (!payload || typeof payload !== 'object') throw new Error('El payload debe ser un objeto');
  if (!payload.video || !/^[a-z0-9][a-z0-9-]{1,80}$/.test(payload.video.id || '')) {
    throw new Error('video.id inválido; usa únicamente minúsculas, números y guiones');
  }
  if (!nonEmpty(payload.video.title) || !nonEmpty(payload.video.description) || !nonEmpty(payload.video.topic)) {
    throw new Error('El payload necesita video.title, video.description y video.topic');
  }
  if (!Array.isArray(payload.video.hashtags) || !payload.video.hashtags.every(nonEmpty)) {
    throw new Error('video.hashtags debe ser un array de textos');
  }
  if (!Array.isArray(payload.video.tags) || !payload.video.tags.every(nonEmpty)) {
    throw new Error('video.tags debe ser un array de textos');
  }
  if (!payload.intro || !nonEmpty(payload.intro.text) || !Number.isInteger(payload.intro.duration_frames) || payload.intro.duration_frames < 1) {
    throw new Error('intro inválida');
  }
  if (!payload.outro || !nonEmpty(payload.outro.text) || !Number.isInteger(payload.outro.duration_frames) || payload.outro.duration_frames < 1) {
    throw new Error('outro inválida');
  }
  if (!payload.render || payload.render.fps !== FPS || payload.render.width !== 1080 || payload.render.height !== 1920) {
    throw new Error('render debe ser 1080x1920 a 30 fps');
  }

  assertQuizContent({
    title: payload.video.title,
    description: payload.video.description,
    questions: payload.questions,
  });
  payload.questions.forEach((question, index) => {
    if (question.id !== index + 1) throw new Error(`Pregunta ${index + 1}: id inválido`);
    if (!Number.isInteger(question.duration_frames) || question.duration_frames < 1) {
      throw new Error(`Pregunta ${index + 1}: duration_frames inválido`);
    }
    if (question.answer_reveal_frame !== undefined &&
        (!Number.isInteger(question.answer_reveal_frame) || question.answer_reveal_frame < 1 || question.answer_reveal_frame >= question.duration_frames)) {
      throw new Error(`Pregunta ${index + 1}: answer_reveal_frame inválido`);
    }
  });
  return payload;
};

const buildQuizPayload = ({topic, content, id}) => {
  assertQuizContent(content);
  const safeTopic = String(topic).trim();
  const fingerprint = crypto.createHash('sha1').update(JSON.stringify(content.questions)).digest('hex').slice(0, 8);
  const videoId = id || `quiz-${slugify(safeTopic)}-${fingerprint}`;
  const hashtags = ['#quiz', '#trivia', '#shorts', `#${safeTopic.replace(/\s+/g, '')}`];
  const tags = ['quiz', 'trivia', 'shorts', safeTopic, slugify(safeTopic), `quiz-${slugify(safeTopic)}`];

  return {
    video: {
      id: videoId,
      title: content.title.slice(0, 100),
      description: content.description,
      tags,
      hashtags,
      duration_seconds: 154,
      difficulty: content.difficulty || 'mixed',
      topic: safeTopic,
      language: 'es',
      target_audience: 'general',
    },
    intro: {
      text: `Bienvenido al reto de ${safeTopic}. Son doce preguntas. ¿Cuántas podrás acertar?`,
      duration_frames: INTRO_OUTRO_FRAMES,
    },
    questions: content.questions.map((question, index) => ({
      id: index + 1,
      question: question.question.trim(),
      options: question.options.map((option) => option.trim()),
      correct_index: question.correct_index,
      explanation: question.explanation.trim(),
      difficulty: question.difficulty || (index < 4 ? 'easy' : index < 8 ? 'medium' : 'hard'),
      duration_frames: BASE_QUESTION_FRAMES,
    })),
    outro: {
      text: '¿Cuántas acertaste? Escribe tu puntuación y suscríbete para el próximo reto.',
      duration_frames: INTRO_OUTRO_FRAMES,
    },
    render: {
      fps: FPS,
      width: 1080,
      height: 1920,
      background_style: 'gradient',
      voice_style: 'energetic',
      music_style: 'quiz',
    },
  };
};

const quizContentSchema = {
  type: 'object',
  properties: {
    title: {type: 'string'},
    description: {type: 'string'},
    difficulty: {type: 'string', enum: ['easy', 'medium', 'hard', 'mixed']},
    questions: {
      type: 'array',
      minItems: QUESTION_COUNT,
      maxItems: QUESTION_COUNT,
      items: {
        type: 'object',
        properties: {
          question: {type: 'string'},
          options: {type: 'array', minItems: 4, maxItems: 4, items: {type: 'string'}},
          correct_index: {type: 'integer', minimum: 0, maximum: 3},
          explanation: {type: 'string'},
          difficulty: {type: 'string', enum: ['easy', 'medium', 'hard']},
        },
        required: ['question', 'options', 'correct_index', 'explanation', 'difficulty'],
        additionalProperties: false,
      },
    },
  },
  required: ['title', 'description', 'difficulty', 'questions'],
  additionalProperties: false,
};

module.exports = {QUESTION_COUNT, assertQuizContent, assertQuizPayload, buildQuizPayload, quizContentSchema, slugify};
