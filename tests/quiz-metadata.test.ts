import test from 'node:test';
import assert from 'node:assert/strict';
import {buildHashtags, buildSeoDescription, buildTags, buildThumbnailTitle} from '../src/quiz-metadata';
import {spanishQuizVideos} from '../src/videos-es';

test('buildSeoDescription incluye título y tópico', () => {
  const description = buildSeoDescription('historia', 'Quiz Épico');
  assert.match(description, /Quiz Épico/);
  assert.match(description, /historia/);
  assert.match(description, /Shorts|Reels|TikTok/);
});

test('buildTags agrega tags genéricos + variaciones del tópico', () => {
  const tags = buildTags('cultura general');
  assert.ok(tags.includes('quiz'));
  assert.ok(tags.includes('trivia'));
  assert.ok(tags.includes('cultura general'));
  assert.ok(tags.includes('cultura-general'));
  assert.ok(tags.includes('quiz-cultura-general'));
});

test('buildHashtags incluye hashtag del tópico sin espacios', () => {
  const hashtags = buildHashtags('cultura general');
  assert.deepEqual(hashtags.slice(0, 3), ['#quiz', '#trivia', '#shorts']);
  assert.ok(hashtags.includes('#culturageneral'));
});

test('buildThumbnailTitle usa topic en mayúsculas', () => {
  const payload = spanishQuizVideos[0];
  const title = buildThumbnailTitle(payload);
  assert.equal(title, `${payload.video.topic.toUpperCase()} QUIZ`);
});
