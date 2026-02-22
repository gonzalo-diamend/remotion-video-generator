#!/usr/bin/env node
const fs = require('fs');
const {spawnSync} = require('child_process');

const dataset = JSON.parse(fs.readFileSync('data/shorts/history.json', 'utf8'));
const retriesArg = process.argv.slice(2).find((arg) => arg.startsWith('--retries='));
const retries = retriesArg ? Number(retriesArg.split('=')[1]) : 1;
const force = process.argv.includes('--force');
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE;
const reportPathArg = process.argv.slice(2).find((arg) => arg.startsWith('--report-path='));
const reportPath = reportPathArg ? reportPathArg.split('=')[1] : 'out/reports/render-shorts-latest.json';
const historyPathArg = process.argv.slice(2).find((arg) => arg.startsWith('--history-path='));
const historyPath = historyPathArg ? historyPathArg.split('=')[1] : 'out/reports/render-shorts-history.ndjson';

if (!Array.isArray(dataset)) {
  throw new Error('Dataset data/shorts/history.json inválido');
}

fs.mkdirSync('out/shorts', {recursive: true});


const ensureDirForFile = (filePath) => {
  const lastSlash = filePath.lastIndexOf('/');
  if (lastSlash === -1) {
    return;
  }

  const dirPath = filePath.slice(0, lastSlash);
  if (dirPath) {
    fs.mkdirSync(dirPath, {recursive: true});
  }
};

const successes = [];
const failures = [];
const skipped = [];
const startedAt = new Date();
const startedAtMs = Date.now();

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
    const attemptStartedAtMs = Date.now();
    const result = spawnSync('npx', cmd, {stdio: 'inherit'});
    const durationMs = Date.now() - attemptStartedAtMs;
    status = result.status ?? 1;

    if (status === 0) {
      successes.push({compositionId, attempt, durationMs});
      break;
    }

    if (attempt <= retries) {
      console.log(`[shorts] retry ${compositionId}`);
    }
  }

  if (status !== 0) {
    failures.push({compositionId, attempts: attempt});
  }
}

const finishedAt = new Date();
const totalDurationMs = Date.now() - startedAtMs;
const report = {
  script: 'render-shorts',
  retries,
  force,
  startedAt: startedAt.toISOString(),
  finishedAt: finishedAt.toISOString(),
  totalDurationMs,
  summary: {
    total: dataset.length,
    success: successes.length,
    failed: failures.length,
    skipped: skipped.length,
  },
  successes,
  failures,
  skipped,
};

ensureDirForFile(reportPath);
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

ensureDirForFile(historyPath);
fs.appendFileSync(historyPath, `${JSON.stringify(report)}\n`, 'utf8');

console.log('\n[shorts] summary');
console.log(`total: ${dataset.length}`);
console.log(`success: ${successes.length}`);
console.log(`failed: ${failures.length}`);
console.log(`skipped: ${skipped.length}`);
console.log(`duration_ms: ${totalDurationMs}`);
console.log(`report: ${reportPath}`);
console.log(`history: ${historyPath}`);

if (failures.length > 0) {
  console.log('[shorts] failed compositions:');
  failures.forEach((id) => console.log(`- ${id}`));
  process.exit(1);
}
