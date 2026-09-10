#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {spawnSync} = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const target = path.resolve(process.env.MPT_DIR || path.join(projectRoot, '.tools', 'MoneyPrinterTurbo'));
const mptRef = process.env.MPT_REF || 'e20a3c4c05d8e3779e4ad4bb58bc56ca85c1836a';
const skipSync = process.argv.includes('--skip-sync');

const run = (command, args, cwd = projectRoot) => {
  const result = spawnSync(command, args, {cwd, stdio: 'inherit'});
  if ((result.status ?? 1) !== 0) throw new Error(`${command} terminó con código ${result.status}`);
};

try {
  if (!fs.existsSync(path.join(target, '.git'))) {
    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.mkdirSync(target, {recursive: true});
    run('git', ['init'], target);
    run('git', ['remote', 'add', 'origin', 'https://github.com/harry0703/MoneyPrinterTurbo.git'], target);
  } else {
    console.log(`[mpt] reutilizando ${target}`);
  }

  const current = spawnSync('git', ['rev-parse', 'HEAD'], {cwd: target, encoding: 'utf8'}).stdout?.trim();
  if (current !== mptRef) {
    run('git', ['fetch', '--depth', '1', 'origin', mptRef], target);
    run('git', ['checkout', '--detach', 'FETCH_HEAD'], target);
  }

  if (!fs.existsSync(path.join(target, 'LICENSE'))) throw new Error('La instalación de MoneyPrinterTurbo está incompleta');
  if (!skipSync) run(process.env.UV_EXECUTABLE || 'uv', ['sync', '--frozen'], target);
  console.log(`[mpt] listo: ${target}`);
} catch (error) {
  console.error(`[mpt] ${error.message}`);
  process.exit(1);
}
