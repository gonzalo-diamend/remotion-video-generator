const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const {generateOpenAiSpeech} = require('../scripts/lib/openai-tts');

test('envía el texto a Audio Speech y guarda la respuesta binaria', async () => {
  let received;
  const server = http.createServer((request, response) => {
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      received = {url: request.url, auth: request.headers.authorization, body: JSON.parse(body)};
      response.writeHead(200, {'Content-Type': 'audio/mpeg'});
      response.end(Buffer.from('audio-test'));
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiz-tts-'));
  const output = path.join(directory, 'voice.mp3');

  try {
    const {port} = server.address();
    await generateOpenAiSpeech({
      text: 'Pregunta de prueba', output, voice: 'coral', model: 'gpt-4o-mini-tts',
      instructions: 'Habla en español.', apiKey: 'test-key', baseUrl: `http://127.0.0.1:${port}/v1`,
    });
    assert.equal(received.url, '/v1/audio/speech');
    assert.equal(received.auth, 'Bearer test-key');
    assert.equal(received.body.voice, 'coral');
    assert.equal(fs.readFileSync(output, 'utf8'), 'audio-test');
  } finally {
    server.close();
    fs.rmSync(directory, {recursive: true, force: true});
  }
});
