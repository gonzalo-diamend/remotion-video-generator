import test from 'node:test';
import assert from 'node:assert/strict';
import {generateSpanishQuizVideos, quizRenderCatalog, spanishQuizVideos, STOCK_VIDEO_COUNT} from '../src/videos-es';

test('genera 180 videos de stock', () => {
  const videos = generateSpanishQuizVideos();
  assert.equal(videos.length, STOCK_VIDEO_COUNT);
  assert.equal(videos.length, 180);
});

test('cada video tiene estructura base consistente', () => {
  for (const video of spanishQuizVideos) {
    assert.ok(video.video.id.startsWith('quiz-'));
    assert.equal(video.questions.length, 12);
    assert.ok(video.video.description.length > 30);
    assert.ok(video.video.tags.length >= 5);
    assert.ok(video.video.hashtags.length >= 4);
    assert.equal(video.render.width, 1080);
    assert.equal(video.render.height, 1920);
    assert.equal(video.render.fps, 30);
  }
});

test('cada video combina un conjunto diferente de preguntas', () => {
  const signatures = spanishQuizVideos.map((video) =>
    video.questions.map((question) => question.question).sort().join('|'));
  assert.equal(new Set(signatures).size, STOCK_VIDEO_COUNT);
});

test('cada video mantiene cuatro preguntas por dificultad', () => {
  for (const video of spanishQuizVideos) {
    const counts = {easy: 0, medium: 0, hard: 0};
    video.questions.forEach((question) => { counts[question.difficulty] += 1; });
    assert.deepEqual(counts, {easy: 4, medium: 4, hard: 4});
  }
});

test('IDs y títulos son únicos en todo el stock', () => {
  assert.equal(new Set(spanishQuizVideos.map(({video}) => video.id)).size, STOCK_VIDEO_COUNT);
  assert.equal(new Set(spanishQuizVideos.map(({video}) => video.title)).size, STOCK_VIDEO_COUNT);
});

test('reparte de forma equilibrada las 144 preguntas verificadas', () => {
  const appearances = new Map<string, number>();
  spanishQuizVideos.forEach((video) => video.questions.forEach((question) => {
    appearances.set(question.question, (appearances.get(question.question) ?? 0) + 1);
  }));
  const counts = [...appearances.values()];
  assert.equal(appearances.size, 144);
  assert.ok(Math.max(...counts) - Math.min(...counts) <= 2);
});

test('quizRenderCatalog mapea composiciones y outputs por índice', () => {
  assert.equal(quizRenderCatalog.length, STOCK_VIDEO_COUNT);

  const first = quizRenderCatalog[0];
  assert.equal(first.compositionId, 'QuizVertical-001');
  assert.equal(first.thumbnailCompositionId, 'QuizThumb-001');
  assert.equal(first.videoOutputPath, 'out/videos/quiz-001.mp4');
  assert.equal(first.thumbnailOutputPath, 'out/thumbnails/quiz-001.png');

  const last = quizRenderCatalog[STOCK_VIDEO_COUNT - 1];
  assert.equal(last.compositionId, 'QuizVertical-180');
  assert.equal(last.thumbnailCompositionId, 'QuizThumb-180');
  assert.equal(last.videoOutputPath, 'out/videos/quiz-180.mp4');
  assert.equal(last.thumbnailOutputPath, 'out/thumbnails/quiz-180.png');
});
