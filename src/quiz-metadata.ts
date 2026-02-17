import {QuizVideoPayload} from './quiz-schema';

const GENERIC_TAGS = ['quiz', 'trivia', 'shorts', 'viral'];

export const buildSeoDescription = (topic: string, title: string): string => {
  return `${title}. Quiz de ${topic} en español con 12 preguntas progresivas y respuestas explicadas. Ideal para Shorts, Reels y TikTok.`;
};

export const buildTags = (topic: string): string[] => {
  const normalizedTopic = topic.toLowerCase().replace(/\s+/g, '-');
  return [...GENERIC_TAGS, topic, normalizedTopic, `quiz-${normalizedTopic}`];
};

export const buildHashtags = (topic: string): string[] => {
  const compactTopic = topic.replace(/\s+/g, '');
  return ['#quiz', '#trivia', '#shorts', `#${compactTopic}`];
};

export const buildThumbnailTitle = (payload: QuizVideoPayload): string => {
  return `${payload.video.topic.toUpperCase()} QUIZ`;
};
