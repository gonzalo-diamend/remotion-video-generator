import test from 'node:test';
import assert from 'node:assert/strict';
import shortsHistory from '../data/shorts/history.json';
import {spanishQuizVideos} from '../src/videos-es';
import {validateQuizVideoPayloads, validateShortsDataset} from '../src/runtime-validation';

test('validateShortsDataset acepta dataset válido', () => {
  const validated = validateShortsDataset(shortsHistory);
  assert.equal(validated.length, shortsHistory.length);
});

test('validateShortsDataset rechaza ids duplicados', () => {
  const duplicated = [
    {
      id: 'dup-1',
      series: 'Historia',
      level: 'easy',
      question: 'Pregunta 1',
      options: ['a', 'b', 'c', 'd'],
      correctIndex: 0,
    },
    {
      id: 'dup-1',
      series: 'Historia',
      level: 'easy',
      question: 'Pregunta 2',
      options: ['a', 'b', 'c', 'd'],
      correctIndex: 1,
    },
  ];

  assert.throws(() => validateShortsDataset(duplicated), /id duplicado/);
});

test('validateQuizVideoPayloads mantiene el shape esperado', () => {
  const validated = validateQuizVideoPayloads(spanishQuizVideos);
  assert.equal(validated.length, 50);
  assert.equal(validated[0].questions.length, 12);
});
