#!/usr/bin/env node
const {spawnSync} = require('child_process');
const fs = require('fs');

const args = process.argv.slice(2);
const mode = args.includes('--mode=thumbs') ? 'thumbs' : 'videos';
const retriesArg = args.find((arg) => arg.startsWith('--retries='));
const retries = retriesArg ? Number(retriesArg.split('=')[1]) : 1;
const fromArg = args.find((arg) => arg.startsWith('--from='));
const toArg = args.find((arg) => arg.startsWith('--to='));
const from = fromArg ? Number(fromArg.split('=')[1]) : 1;
const to = toArg ? Number(toArg.split('=')[1]) : 50;
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE;

if (Number.isNaN(retries) || retries < 0) {
  throw new Error('Invalid --retries value');
}

const outDir = mode === 'videos' ? 'out/videos' : 'out/thumbnails';
fs.mkdirSync(outDir, {recursive: true});

const runRemotion = ({compositionId, outputPath}) => {
  const commandArgs = [
    'remotion',
    mode === 'videos' ? 'render' : 'still',
    'src/index.ts',
    compositionId,
    outputPath,
  ];

  if (browserExecutable) {
    commandArgs.push('--browser-executable', browserExecutable);
  }

  return spawnSync('npx', commandArgs, {stdio: 'inherit'});
};

const successes = [];
const failures = [];
const skipped = [];

for (let id = from; id <= to; id++) {
  const item = String(id).padStart(3, '0');
  const compositionId = mode === 'videos' ? `QuizVertical-${item}` : `QuizThumb-${item}`;
  const extension = mode === 'videos' ? 'mp4' : 'png';
  const outputPath = `${outDir}/quiz-${item}.${extension}`;

  if (fs.existsSync(outputPath)) {
    skipped.push({compositionId, outputPath});
    console.log(`[batch:${mode}] skip ${compositionId} -> ${outputPath} (already exists)`);
    continue;
  }

  let attempt = 0;
  let status = 1;

  while (attempt <= retries) {
    attempt += 1;
    console.log(`[batch:${mode}] run ${compositionId} -> ${outputPath} (attempt ${attempt}/${retries + 1})`);
    const result = runRemotion({compositionId, outputPath});
    status = result.status ?? 1;

    if (status === 0) {
      successes.push({compositionId, outputPath, attempt});
      break;
    }

    if (attempt <= retries) {
      console.log(`[batch:${mode}] retry scheduled for ${compositionId}`);
    }
  }

  if (status !== 0) {
    failures.push({compositionId, outputPath});
  }
}

console.log('\n[batch] summary');
console.log(`mode: ${mode}`);
console.log(`range: ${String(from).padStart(3, '0')}..${String(to).padStart(3, '0')}`);
console.log(`success: ${successes.length}`);
console.log(`failed: ${failures.length}`);
console.log(`skipped: ${skipped.length}`);

if (failures.length > 0) {
  console.log('[batch] failed compositions:');
  failures.forEach((failure) => console.log(`- ${failure.compositionId}`));
  process.exit(1);
}
