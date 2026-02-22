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
const reportPathArg = args.find((arg) => arg.startsWith('--report-path='));
const reportPath = reportPathArg ? reportPathArg.split('=')[1] : `out/reports/render-batch-${mode}-latest.json`;
const historyPathArg = args.find((arg) => arg.startsWith('--history-path='));
const historyPath = historyPathArg ? historyPathArg.split('=')[1] : 'out/reports/render-batch-history.ndjson';

if (Number.isNaN(retries) || retries < 0) {
  throw new Error('Invalid --retries value');
}

const outDir = mode === 'videos' ? 'out/videos' : 'out/thumbnails';
fs.mkdirSync(outDir, {recursive: true});

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
const startedAt = new Date();
const startedAtMs = Date.now();

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
    const attemptStartedAtMs = Date.now();
    const result = runRemotion({compositionId, outputPath});
    const durationMs = Date.now() - attemptStartedAtMs;
    status = result.status ?? 1;

    if (status === 0) {
      successes.push({compositionId, outputPath, attempt, durationMs});
      break;
    }

    if (attempt <= retries) {
      console.log(`[batch:${mode}] retry scheduled for ${compositionId}`);
    }
  }

  if (status !== 0) {
    failures.push({compositionId, outputPath, attempts: attempt});
  }
}

const finishedAt = new Date();
const totalDurationMs = Date.now() - startedAtMs;
const report = {
  script: 'render-batch',
  mode,
  range: {
    from,
    to,
  },
  retries,
  startedAt: startedAt.toISOString(),
  finishedAt: finishedAt.toISOString(),
  totalDurationMs,
  summary: {
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

console.log('\n[batch] summary');
console.log(`mode: ${mode}`);
console.log(`range: ${String(from).padStart(3, '0')}..${String(to).padStart(3, '0')}`);
console.log(`success: ${successes.length}`);
console.log(`failed: ${failures.length}`);
console.log(`skipped: ${skipped.length}`);
console.log(`duration_ms: ${totalDurationMs}`);
console.log(`report: ${reportPath}`);
console.log(`history: ${historyPath}`);

if (failures.length > 0) {
  console.log('[batch] failed compositions:');
  failures.forEach((failure) => console.log(`- ${failure.compositionId}`));
  process.exit(1);
}
