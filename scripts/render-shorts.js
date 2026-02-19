#!/usr/bin/env node
const fs = require('fs');
const {spawnSync} = require('child_process');

const dataset = JSON.parse(fs.readFileSync('data/shorts/history.json', 'utf8'));
const retriesArg = process.argv.slice(2).find((arg) => arg.startsWith('--retries='));
const retries = retriesArg ? Number(retriesArg.split('=')[1]) : 1;
const force = process.argv.includes('--force');
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE;

if (!Array.isArray(dataset)) {
  throw new Error('Dataset data/shorts/history.json inválido');
}

fs.mkdirSync('out/shorts', {recursive: true});

const successes = [];
const failures = [];
const skipped = [];

for (const [index, short] of dataset.entries()) {
  const compositionId = `short-${short.id}`;
  const outputPath = `out/shorts/${short.id}.mp4`;

  if (fs.existsSync(outputPath) && !force) {
    skipped.push(compositionId);
    console.log(`[shorts] skip ${compositionId} (${index + 1}/${dataset.length})`);
    continue;
  }

  let attempt = 0;
  let status = 1;

  while (attempt <= retries) {
    attempt += 1;
    const cmd = ['remotion', 'render', 'src/index.ts', compositionId, outputPath];
    if (browserExecutable) {
      cmd.push('--browser-executable', browserExecutable);
    }

    console.log(`[shorts] run ${compositionId} (${index + 1}/${dataset.length}) attempt ${attempt}/${retries + 1}`);
    const result = spawnSync('npx', cmd, {stdio: 'inherit'});
    status = result.status ?? 1;

    if (status === 0) {
      successes.push(compositionId);
      break;
    }

    if (attempt <= retries) {
      console.log(`[shorts] retry ${compositionId}`);
    }
  }

  if (status !== 0) {
    failures.push(compositionId);
  }
}

console.log('\n[shorts] summary');
console.log(`total: ${dataset.length}`);
console.log(`success: ${successes.length}`);
console.log(`failed: ${failures.length}`);
console.log(`skipped: ${skipped.length}`);

if (failures.length > 0) {
  console.log('[shorts] failed compositions:');
  failures.forEach((id) => console.log(`- ${id}`));
  process.exit(1);
}
