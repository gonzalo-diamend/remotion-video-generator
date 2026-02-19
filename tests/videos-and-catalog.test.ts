import test from 'node:test';
import assert from 'node:assert/strict';
import {generateSpanishQuizVideos, quizRenderCatalog, spanishQuizVideos} from '../src/videos-es';

test('genera exactamente 50 videos', () => {
  const videos = generateSpanishQuizVideos();
  assert.equal(videos.length, 50);
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

test('quizRenderCatalog mapea composiciones y outputs por índice', () => {
  assert.equal(quizRenderCatalog.length, 50);

  const first = quizRenderCatalog[0];
  assert.equal(first.compositionId, 'QuizVertical-001');
  assert.equal(first.thumbnailCompositionId, 'QuizThumb-001');
  assert.equal(first.videoOutputPath, 'out/videos/quiz-001.mp4');
  assert.equal(first.thumbnailOutputPath, 'out/thumbnails/quiz-001.png');

  const last = quizRenderCatalog[49];
  assert.equal(last.compositionId, 'QuizVertical-050');
  assert.equal(last.thumbnailCompositionId, 'QuizThumb-050');
  assert.equal(last.videoOutputPath, 'out/videos/quiz-050.mp4');
  assert.equal(last.thumbnailOutputPath, 'out/thumbnails/quiz-050.png');
});
