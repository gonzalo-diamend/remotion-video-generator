#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const get = (name, fallback) => {
    const arg = args.find((item) => item.startsWith(`--${name}=`));
    if (!arg) {
      return fallback;
    }
    return arg.slice(name.length + 3);
  };

  return {
    from: Number(get('from', '1')),
    to: Number(get('to', '50')),
    output: get('output', 'out/publish/manifest.json'),
    privacyStatus: get('privacy', process.env.YT_DEFAULT_PRIVACY_STATUS || 'private'),
    scheduleStart: get('schedule-start', process.env.YT_SCHEDULE_START || ''),
    intervalHours: Number(get('interval-hours', process.env.YT_SCHEDULE_INTERVAL_HOURS || '24')),
    categoryId: get('category-id', process.env.YT_DEFAULT_CATEGORY_ID || '27'),
    defaultPlaylistId: get('playlist-id', process.env.YT_DEFAULT_PLAYLIST_ID || ''),
  };
};

const transpileCache = new Map();
const moduleCache = new Map();

const transpileTs = (filePath) => {
  if (transpileCache.has(filePath)) {
    return transpileCache.get(filePath);
  }

  const source = fs.readFileSync(filePath, 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filePath,
  });

  transpileCache.set(filePath, result.outputText);
  return result.outputText;
};

const resolveLocalFile = (baseDir, request) => {
  const absoluteBase = path.resolve(baseDir, request);
  const candidates = [
    absoluteBase,
    `${absoluteBase}.ts`,
    `${absoluteBase}.js`,
    path.join(absoluteBase, 'index.ts'),
    path.join(absoluteBase, 'index.js'),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
};

const loadModule = (filePath) => {
  const absolutePath = path.resolve(filePath);

  if (moduleCache.has(absolutePath)) {
    return moduleCache.get(absolutePath).exports;
  }

  const module = {exports: {}};
  moduleCache.set(absolutePath, module);

  const ext = path.extname(absolutePath);
  const code = ext === '.ts' ? transpileTs(absolutePath) : fs.readFileSync(absolutePath, 'utf8');
  const dirname = path.dirname(absolutePath);

  const wrapped = `(function (exports, require, module, __filename, __dirname) {\n${code}\n})`;
  const script = new vm.Script(wrapped, {filename: absolutePath});
  const fn = script.runInThisContext();

  const localRequire = (request) => {
    if (request.startsWith('./') || request.startsWith('../')) {
      const target = resolveLocalFile(dirname, request);
      if (!target) {
        throw new Error(`No se pudo resolver módulo local: ${request} desde ${absolutePath}`);
      }
      return loadModule(target);
    }

    return require(request);
  };

  fn(module.exports, localRequire, module, absolutePath, dirname);
  return module.exports;
};

const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);

const ensureIsoDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Fecha inválida en --schedule-start: ${value}`);
  }
  return parsed;
};

const main = () => {
  const config = parseArgs();

  if (Number.isNaN(config.from) || Number.isNaN(config.to) || config.from < 1 || config.to < config.from) {
    throw new Error('Rango inválido. Usa --from=<n> --to=<n>');
  }

  if (Number.isNaN(config.intervalHours) || config.intervalHours < 1) {
    throw new Error('interval-hours inválido. Debe ser un entero >= 1');
  }

  const videosModule = loadModule(path.join(projectRoot, 'src', 'videos-es.ts'));
  const catalogModule = loadModule(path.join(projectRoot, 'src', 'render-catalog.ts'));

  const videos = videosModule.spanishQuizVideos;
  const buildRenderCatalog = catalogModule.buildRenderCatalog;

  if (!Array.isArray(videos)) {
    throw new Error('No se pudo cargar spanishQuizVideos desde src/videos-es.ts');
  }

  if (typeof buildRenderCatalog !== 'function') {
    throw new Error('No se pudo cargar buildRenderCatalog desde src/render-catalog.ts');
  }

  const catalog = buildRenderCatalog(videos);
  const selected = catalog.slice(config.from - 1, config.to);

  let scheduleCursor = null;
  if (config.scheduleStart) {
    scheduleCursor = ensureIsoDate(config.scheduleStart);
  }

  const manifestItems = selected.map((item, index) => {
    const video = videos.find((candidate) => candidate.video.id === item.videoId);
    const hashtags = Array.isArray(video?.video?.hashtags) ? video.video.hashtags.join(' ') : '';

    const finalDescription = hashtags
      ? `${item.description}\n\n${hashtags}`
      : item.description;

    const publishAt = scheduleCursor
      ? addHours(scheduleCursor, config.intervalHours * index).toISOString()
      : null;

    const privacyStatus = publishAt ? 'private' : config.privacyStatus;

    return {
      localId: item.videoId,
      title: item.title,
      description: finalDescription,
      tags: item.tags,
      categoryId: String(config.categoryId),
      privacyStatus,
      publishAt,
      playlistId: config.defaultPlaylistId || null,
      videoPath: item.videoOutputPath,
      thumbnailPath: item.thumbnailOutputPath,
      language: video?.video?.language || 'es',
    };
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'src/videos-es.ts',
    range: {
      from: config.from,
      to: config.to,
      count: manifestItems.length,
    },
    defaults: {
      categoryId: String(config.categoryId),
      privacyStatus: config.privacyStatus,
      scheduleStart: config.scheduleStart || null,
      intervalHours: config.intervalHours,
      playlistId: config.defaultPlaylistId || null,
    },
    items: manifestItems,
  };

  const outPath = path.resolve(projectRoot, config.output);
  fs.mkdirSync(path.dirname(outPath), {recursive: true});
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`[manifest] generado: ${path.relative(projectRoot, outPath)}`);
  console.log(`[manifest] items: ${manifestItems.length}`);
};

try {
  main();
} catch (error) {
  console.error('[manifest] error:', error.message);
  process.exit(1);
}
