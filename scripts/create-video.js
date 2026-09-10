#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {spawnSync} = require('child_process');
const {loadTypeScriptModule} = require('./lib/load-typescript');
const {assertQuizPayload} = require('./lib/quiz-payload');

const projectRoot = path.resolve(__dirname, '..');
const getArg = (name, fallback = '') => {
  const prefix = `--${name}=`;
  const value = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
};
const hasFlag = (name) => process.argv.slice(2).includes(`--${name}`);
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {cwd: projectRoot, stdio: 'inherit', ...options});
  if ((result.status ?? 1) !== 0) throw new Error(`${command} terminó con código ${result.status}`);
};
const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

try {
  const topic = getArg('topic');
  const sourceInput = getArg('input');
  const requestedId = getArg('id');
  const builtinIndex = Number(getArg('index', '1'));
  const tts = getArg('tts', 'openai');
  const privacyStatus = getArg('privacy', 'private');
  const force = hasFlag('force');

  if (!['openai', 'mpt', 'auto', 'none'].includes(tts)) throw new Error('--tts debe ser openai, mpt, auto o none');
  if (!['private', 'unlisted', 'public'].includes(privacyStatus)) throw new Error('--privacy inválido');

  let payload;
  let seedPath;

  if (sourceInput) {
    seedPath = path.resolve(sourceInput);
    payload = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  } else if (topic) {
    const temporaryOutput = path.join(projectRoot, 'out', 'generated', `quiz-${Date.now()}.json`);
    const generationArgs = ['scripts/generate-quiz.js', `--topic=${topic}`, `--output=${temporaryOutput}`];
    if (requestedId) generationArgs.push(`--id=${requestedId}`);
    run('node', generationArgs);
    seedPath = temporaryOutput;
    payload = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  } else {
    const {spanishQuizVideos} = loadTypeScriptModule(path.join(projectRoot, 'src', 'videos-es.ts'));
    if (!Number.isInteger(builtinIndex) || builtinIndex < 1 || builtinIndex > spanishQuizVideos.length) {
      throw new Error(`--index debe estar entre 1 y ${spanishQuizVideos.length}`);
    }
    payload = structuredClone(spanishQuizVideos[builtinIndex - 1]);
    seedPath = path.join(projectRoot, 'out', 'jobs', payload.video.id, 'quiz.json');
    writeJson(seedPath, payload);
  }

  assertQuizPayload(payload);

  const jobDir = path.join(projectRoot, 'out', 'jobs', payload.video.id);
  fs.mkdirSync(jobDir, {recursive: true});
  const quizPath = path.join(jobDir, 'quiz.json');
  if (path.resolve(seedPath) !== path.resolve(quizPath)) writeJson(quizPath, payload);

  let props = {payload, audioCues: []};
  const propsPath = path.join(jobDir, 'props.json');
  if (tts !== 'none') {
    const narrationArgs = ['scripts/generate-narration.js', `--provider=${tts}`, `--input=${quizPath}`, `--props-output=${propsPath}`];
    if (force) narrationArgs.push('--force');
    run('node', narrationArgs);
    props = JSON.parse(fs.readFileSync(propsPath, 'utf8'));
    payload = props.payload;
  } else {
    writeJson(propsPath, props);
  }

  const videoPath = path.join(projectRoot, 'out', 'videos', `${payload.video.id}.mp4`);
  const thumbnailPath = path.join(projectRoot, 'out', 'thumbnails', `${payload.video.id}.png`);
  fs.mkdirSync(path.dirname(videoPath), {recursive: true});
  fs.mkdirSync(path.dirname(thumbnailPath), {recursive: true});

  if (!fs.existsSync(videoPath) || force) {
    const args = ['remotion', 'render', 'src/index.ts', 'QuizVerticalAuto', videoPath, `--props=${JSON.stringify(props)}`, '--codec=h264', '--crf=20'];
    if (process.env.REMOTION_BROWSER_EXECUTABLE) args.push('--browser-executable', process.env.REMOTION_BROWSER_EXECUTABLE);
    run('npx', args);
  } else {
    console.log(`[factory] video existente: ${videoPath}`);
  }

  if (!fs.existsSync(thumbnailPath) || force) {
    const args = ['remotion', 'still', 'src/index.ts', 'QuizThumbnailAuto', thumbnailPath, `--props=${JSON.stringify({payload})}`];
    if (process.env.REMOTION_BROWSER_EXECUTABLE) args.push('--browser-executable', process.env.REMOTION_BROWSER_EXECUTABLE);
    run('npx', args);
  }

  const manifestPath = path.join(jobDir, 'manifest.json');
  const hashtags = payload.video.hashtags.join(' ');
  const disclosure = 'Narración generada con inteligencia artificial.';
  writeJson(manifestPath, {
    generatedAt: new Date().toISOString(),
    source: quizPath,
    defaults: {privacyStatus},
    items: [{
      localId: payload.video.id,
      title: payload.video.title,
      description: `${payload.video.description}\n\n${disclosure}\n[quiz-id:${payload.video.id}]\n\n${hashtags}`,
      tags: payload.video.tags,
      categoryId: process.env.YT_DEFAULT_CATEGORY_ID || '27',
      privacyStatus,
      publishAt: null,
      playlistId: process.env.YT_DEFAULT_PLAYLIST_ID || null,
      videoPath: path.relative(projectRoot, videoPath),
      thumbnailPath: path.relative(projectRoot, thumbnailPath),
      language: 'es',
    }],
  });

  if (hasFlag('upload')) {
    run('node', ['scripts/youtube-upload.js', `--manifest=${manifestPath}`, '--from-index=1', '--to-index=1']);
  }

  console.log(JSON.stringify({videoId: payload.video.id, videoPath, thumbnailPath, manifestPath, durationSeconds: payload.video.duration_seconds}, null, 2));
} catch (error) {
  console.error(`[factory] ${error.message}`);
  process.exit(1);
}
