import {QuizVideoPayload} from './quiz-schema';
import {ShortQuizItem} from './types/quiz';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const assertCondition = (condition: unknown, message: string): void => {
  if (!condition) {
    throw new Error(`[runtime-validation] ${message}`);
  }
};

const validateShortQuizItem = (item: unknown, index: number): ShortQuizItem => {
  assertCondition(!!item && typeof item === 'object', `short item #${index + 1} debe ser un objeto`);

  const value = item as Partial<ShortQuizItem>;

  assertCondition(isNonEmptyString(value.id), `short item #${index + 1} tiene id inválido`);
  assertCondition(isNonEmptyString(value.series), `short ${value.id ?? index + 1} tiene series inválida`);
  assertCondition(isNonEmptyString(value.level), `short ${value.id ?? index + 1} tiene level inválido`);
  assertCondition(isNonEmptyString(value.question), `short ${value.id ?? index + 1} tiene question inválida`);

  assertCondition(Array.isArray(value.options), `short ${value.id ?? index + 1} debe tener options[]`);
  const options = value.options as unknown[];
  assertCondition(options.length === 4, `short ${value.id ?? index + 1} debe tener exactamente 4 opciones`);
  assertCondition(options.every(isNonEmptyString), `short ${value.id ?? index + 1} tiene opciones inválidas`);

  const correctIndex = value.correctIndex;
  if (typeof correctIndex !== 'number') {
    throw new Error(`[runtime-validation] short ${value.id ?? index + 1} tiene correctIndex inválido`);
  }
  assertCondition(correctIndex >= 0 && correctIndex < 4, `short ${value.id ?? index + 1} correctIndex fuera de rango`);

  if (value.explanation !== undefined) {
    assertCondition(isNonEmptyString(value.explanation), `short ${value.id ?? index + 1} explanation inválida`);
  }

  return value as ShortQuizItem;
};

export const validateShortsDataset = (items: unknown): ShortQuizItem[] => {
  assertCondition(Array.isArray(items), 'dataset de shorts debe ser un array');

  const inputItems = items as unknown[];
  const validItems = inputItems.map((item: unknown, index: number) => validateShortQuizItem(item, index));
  const ids = new Set<string>();

  for (const short of validItems) {
    assertCondition(!ids.has(short.id), `id duplicado en shorts: ${short.id}`);
    ids.add(short.id);
  }

  return validItems;
};

export const validateQuizVideoPayloads = (payloads: QuizVideoPayload[]): QuizVideoPayload[] => {
  assertCondition(payloads.length > 0, 'debe existir al menos un payload de quiz');

  payloads.forEach((payload, index) => {
    assertCondition(payload.video.id === `quiz-${String(index + 1).padStart(3, '0')}`, `video.id inválido en índice ${index}`);
    assertCondition(payload.questions.length === 12, `payload ${payload.video.id} debe tener 12 preguntas`);
    assertCondition(payload.render.fps === 30, `payload ${payload.video.id} fps inválido`);
    assertCondition(payload.render.width === 1080 && payload.render.height === 1920, `payload ${payload.video.id} resolución inválida`);

    payload.questions.forEach((question, qIndex) => {
      assertCondition(question.options.length === 4, `payload ${payload.video.id} pregunta ${qIndex + 1} debe tener 4 opciones`);
      assertCondition(question.correct_index >= 0 && question.correct_index < 4, `payload ${payload.video.id} pregunta ${qIndex + 1} correct_index inválido`);
      assertCondition(question.duration_frames > 0, `payload ${payload.video.id} pregunta ${qIndex + 1} duration_frames inválido`);
    });
  });

  return payloads;
};
