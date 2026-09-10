#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {spawnSync} = require('child_process');
const {loadTypeScriptModule} = require('./lib/load-typescript');
const {assertQuizPayload} = require('./lib/quiz-payload');
const {generateOpenAiSpeech} = require('./lib/openai-tts');

const projectRoot = path.resolve(__dirname, '..');
const getArg = (name, fallback = '') => {
  const prefix = `--${name}=`;
  const value = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
};
const hasFlag = (name) => process.argv.slice(2).includes(`--${name}`);

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {stdio: 'inherit', ...options});
  if ((result.status ?? 1) !== 0) throw new Error(`${command} terminó con código ${result.status}`);
};

const durationSeconds = (filePath) => {
  const result = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', filePath], {encoding: 'utf8'});
  if ((result.status ?? 1) !== 0) throw new Error(`No se pudo medir ${filePath}`);
  return Number(result.stdout.trim());
};

const speechItems = (payload) => {
  const items = [{id: 'intro', fileName: 'intro.mp3', text: payload.intro.text}];
  payload.questions.forEach((question, index) => {
    const number = String(index + 1).padStart(2, '0');
    const options = question.options.map((option, optionIndex) => `Opción ${String.fromCharCode(65 + optionIndex)}: ${option}.`).join(' ');
    items.push({id: `question-${number}`, fileName: `question-${number}.mp3`, text: `Pregunta ${index + 1}. ${question.question}. ${options}`});
    items.push({id: `answer-${number}`, fileName: `answer-${number}.mp3`, text: `La respuesta correcta es la ${String.fromCharCode(65 + question.correct_index)}: ${question.options[question.correct_index]}. ${question.explanation}`});
  });
  items.push({id: 'outro', fileName: 'outro.mp3', text: payload.outro.text});
  return items;
};

const main = async () => {
  const input = path.resolve(getArg('input'));
  if (!getArg('input') || !fs.existsSync(input)) throw new Error('Falta --input=<quiz.json> válido');
  const payload = JSON.parse(fs.readFileSync(input, 'utf8'));
  assertQuizPayload(payload);
  const provider = getArg('provider', 'openai');
  if (!['openai', 'mpt', 'auto'].includes(provider)) throw new Error('--provider debe ser openai, mpt o auto');
  const openAiVoice = getArg('voice', process.env.OPENAI_TTS_VOICE || 'coral');
  const openAiModel = getArg('model', process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts');
  const openAiInstructions = process.env.OPENAI_TTS_INSTRUCTIONS ||
    'Habla en español de España, con energía de presentador de concurso, ritmo ágil, dicción clara y pausas naturales. No exageres ni grites.';
  const mptVoice = getArg('mpt-voice', process.env.MPT_VOICE || 'es-ES-AlvaroNeural');
  const rate = getArg('rate', process.env.MPT_VOICE_RATE || '+15%');
  const mptDir = path.resolve(process.env.MPT_DIR || path.join(projectRoot, '.tools', 'MoneyPrinterTurbo'));
  const uv = process.env.UV_EXECUTABLE || 'uv';
  const publicDir = path.resolve(getArg('output-dir', path.join(projectRoot, 'public', 'generated', payload.video.id)));
  const publicRoot = path.join(projectRoot, 'public');
  if (publicDir !== publicRoot && !publicDir.startsWith(`${publicRoot}${path.sep}`)) {
    throw new Error('--output-dir debe estar dentro de public/');
  }
  const mediaBasePath = path.relative(path.join(projectRoot, 'public'), publicDir).split(path.sep).join('/');
  const force = hasFlag('force');

  if (provider === 'mpt' && !fs.existsSync(path.join(mptDir, 'pyproject.toml'))) {
    throw new Error('MoneyPrinterTurbo no está instalado. Ejecuta npm run setup:mpt');
  }
  fs.mkdirSync(publicDir, {recursive: true});

  const measured = new Map();
  for (const item of speechItems(payload)) {
    const output = path.join(publicDir, item.fileName);
    if (!fs.existsSync(output) || force) {
      console.log(`[narration] ${item.id} (${provider})`);
      let generated = false;
      if (provider === 'openai' || (provider === 'auto' && process.env.OPENAI_API_KEY)) {
        try {
          await generateOpenAiSpeech({
            text: item.text,
            output,
            voice: openAiVoice,
            model: openAiModel,
            instructions: openAiInstructions,
            apiKey: process.env.OPENAI_API_KEY,
            baseUrl: process.env.OPENAI_BASE_URL,
          });
          generated = true;
        } catch (error) {
          if (provider === 'openai') throw error;
          console.warn(`[narration] OpenAI TTS no disponible: ${error.message}. Usando Edge TTS.`);
        }
      }
      if (!generated) {
        if (!fs.existsSync(path.join(mptDir, 'pyproject.toml'))) {
          throw new Error('El fallback de Edge TTS requiere npm run setup:mpt');
        }
        run(uv, ['run', '--project', mptDir, 'python', '-m', 'edge_tts', '--voice', mptVoice, '--rate', rate, '--text', item.text, '--write-media', output]);
      }
    }
    measured.set(item.id, durationSeconds(output));
  }

  const fps = payload.render.fps || 30;
  const paddingFrames = Math.ceil(fps * 0.35);
  payload.intro.duration_frames = Math.max(payload.intro.duration_frames, Math.ceil(measured.get('intro') * fps) + paddingFrames);
  payload.questions.forEach((question, index) => {
    const number = String(index + 1).padStart(2, '0');
    const questionFrames = Math.ceil(measured.get(`question-${number}`) * fps) + paddingFrames;
    const answerFrames = Math.ceil(measured.get(`answer-${number}`) * fps) + paddingFrames;
    question.answer_reveal_frame = Math.max(Math.floor(question.duration_frames * 0.7), questionFrames);
    question.duration_frames = Math.max(question.duration_frames, question.answer_reveal_frame + answerFrames);
  });
  payload.outro.duration_frames = Math.max(payload.outro.duration_frames, Math.ceil(measured.get('outro') * fps) + paddingFrames);
  payload.video.duration_seconds = Math.ceil((payload.intro.duration_frames + payload.questions.reduce((sum, question) => sum + question.duration_frames, 0) + payload.outro.duration_frames) / fps);

  const {buildNarrationCues} = loadTypeScriptModule(path.join(projectRoot, 'src', 'audio-cues.ts'));
  const props = {payload, audioCues: buildNarrationCues(payload, mediaBasePath)};
  const outputProps = path.resolve(getArg('props-output', path.join(publicDir, 'props.json')));
  fs.mkdirSync(path.dirname(outputProps), {recursive: true});
  fs.writeFileSync(outputProps, `${JSON.stringify(props, null, 2)}\n`, 'utf8');
  console.log(outputProps);
};

main().catch((error) => {
  console.error(`[narration] ${error.message}`);
  process.exit(1);
});
