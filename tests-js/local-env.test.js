const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');
const {loadLocalEnv, unquote} = require('../scripts/lib/local-env');

test('elimina comillas simples y dobles', () => {
  assert.equal(unquote('"value"'), 'value');
  assert.equal(unquote("'value'"), 'value');
  assert.equal(unquote('value'), 'value');
});

test('carga la configuración local sin sobrescribir variables existentes', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'youtube-env-'));
  const file = path.join(directory, '.env.youtube.local');
  fs.writeFileSync(file, '# comment\nYT_TEST_ONE="one"\nYT_TEST_TWO=from-file\nINVALID KEY=no\n', 'utf8');
  process.env.YT_TEST_TWO = 'from-env';
  try {
    assert.equal(loadLocalEnv(file), true);
    assert.equal(process.env.YT_TEST_ONE, 'one');
    assert.equal(process.env.YT_TEST_TWO, 'from-env');
  } finally {
    delete process.env.YT_TEST_ONE;
    delete process.env.YT_TEST_TWO;
    fs.rmSync(directory, {recursive: true, force: true});
  }
});
