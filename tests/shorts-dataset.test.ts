import test from 'node:test';
import assert from 'node:assert/strict';
import shortsHistory from '../data/shorts/history.json';

test('dataset de shorts tiene estructura válida', () => {
  assert.ok(Array.isArray(shortsHistory));
  assert.ok(shortsHistory.length >= 1);

  for (const item of shortsHistory) {
    assert.equal(typeof item.id, 'string');
    assert.ok(item.id.length > 0);
    assert.equal(typeof item.series, 'string');
    assert.equal(typeof item.level, 'string');
    assert.equal(typeof item.question, 'string');

    assert.ok(Array.isArray(item.options));
    assert.equal(item.options.length, 4);
    assert.ok(item.options.every((option) => typeof option === 'string' && option.length > 0));

    assert.equal(typeof item.correctIndex, 'number');
    assert.ok(item.correctIndex >= 0 && item.correctIndex < 4);

    if (item.explanation !== undefined) {
      assert.equal(typeof item.explanation, 'string');
    }
  }
});

test('ids de shorts son únicos', () => {
  const ids = shortsHistory.map((item) => item.id);
  const unique = new Set(ids);
  assert.equal(unique.size, ids.length);
});
