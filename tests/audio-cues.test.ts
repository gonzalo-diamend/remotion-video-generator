import test from 'node:test';
import assert from 'node:assert/strict';
import {buildNarrationSegments} from '../src/audio-cues';
import {spanishQuizVideos} from '../src/videos-es';

test('crea intro, dos audios por pregunta y outro', () => {
  const payload = spanishQuizVideos[0];
  const segments = buildNarrationSegments(payload);

  assert.equal(segments.length, 26);
  assert.equal(segments[0].id, 'intro');
  assert.equal(segments.at(-1)?.id, 'outro');
  assert.equal(segments[1].from, payload.intro.duration_frames);
  assert.equal(
    segments[2].from,
    payload.intro.duration_frames + Math.floor(payload.questions[0].duration_frames * 0.75),
  );
});

test('todas las rutas de audio son públicas y relativas', () => {
  const segments = buildNarrationSegments(spanishQuizVideos[0]);
  assert.ok(segments.every((segment) => segment.src.startsWith('generated/quiz-001/')));
  assert.ok(segments.every((segment) => !segment.src.startsWith('/')));
});
