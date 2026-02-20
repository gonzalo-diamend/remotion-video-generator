#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {google} = require('googleapis');

const projectRoot = path.resolve(__dirname, '..');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const hasFlag = (name) => args.includes(`--${name}`);
  const get = (name, fallback) => {
    const arg = args.find((item) => item.startsWith(`--${name}=`));
    if (!arg) {
      return fallback;
    }
    return arg.slice(name.length + 3);
  };

  return {
    manifest: get('manifest', 'out/publish/manifest.json'),
    state: get('state', 'out/publish/upload-state.json'),
    fromIndex: Number(get('from-index', '1')),
    toIndex: Number(get('to-index', String(Number.MAX_SAFE_INTEGER))),
    retries: Number(get('retries', '3')),
    dryRun: hasFlag('dry-run'),
    force: hasFlag('force'),
  };
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requiredEnv = [
  'YT_CLIENT_ID',
  'YT_CLIENT_SECRET',
  'YT_REDIRECT_URI',
  'YT_REFRESH_TOKEN',
];

const assertEnv = () => {
  const missing = requiredEnv.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
  }
};

const getYoutubeClient = () => {
  const auth = new google.auth.OAuth2(
    process.env.YT_CLIENT_ID,
    process.env.YT_CLIENT_SECRET,
    process.env.YT_REDIRECT_URI,
  );

  auth.setCredentials({
    refresh_token: process.env.YT_REFRESH_TOKEN,
  });

  return google.youtube({version: 'v3', auth});
};

const loadJson = (filePath, fallback) => {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const saveJson = (filePath, data) => {
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const shouldRetry = (error) => {
  const status = error?.response?.status;
  const reason = error?.errors?.[0]?.reason || error?.response?.data?.error?.errors?.[0]?.reason;

  if ([500, 502, 503, 504].includes(status)) {
    return true;
  }

  return reason === 'backendError' || reason === 'internalError' || reason === 'quotaExceeded';
};

const withRetries = async (fn, retries, label) => {
  let attempt = 0;
  let lastError = null;

  while (attempt <= retries) {
    attempt += 1;
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt > retries || !shouldRetry(error)) {
        throw error;
      }

      const waitMs = Math.min(30_000, 1000 * 2 ** (attempt - 1));
      console.warn(`[upload] retry ${label} (${attempt}/${retries + 1}) in ${waitMs}ms`);
      await sleep(waitMs);
    }
  }

  throw lastError;
};

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .filter((tag) => typeof tag === 'string' && tag.trim().length > 0)
    .map((tag) => tag.trim())
    .slice(0, 30);
};

const validateManifest = (manifest) => {
  if (!manifest || !Array.isArray(manifest.items)) {
    throw new Error('Manifest inválido: falta items[]');
  }
};

const uploadVideo = async (youtube, item, retries) => {
  const body = {
    snippet: {
      title: item.title,
      description: item.description,
      tags: normalizeTags(item.tags),
      categoryId: item.categoryId || '27',
      defaultLanguage: item.language || 'es',
      defaultAudioLanguage: item.language || 'es',
    },
    status: {
      privacyStatus: item.publishAt ? 'private' : item.privacyStatus || 'private',
      selfDeclaredMadeForKids: false,
      madeForKids: false,
    },
  };

  if (item.publishAt) {
    body.status.publishAt = item.publishAt;
  }

  const response = await withRetries(
    () =>
      youtube.videos.insert({
        part: ['snippet', 'status'],
        notifySubscribers: false,
        requestBody: body,
        media: {
          body: fs.createReadStream(item.videoPath),
        },
      }),
    retries,
    `videos.insert:${item.localId}`,
  );

  return response.data;
};

const uploadThumbnail = async (youtube, youtubeVideoId, thumbnailPath, retries, localId) => {
  if (!thumbnailPath || !fs.existsSync(thumbnailPath)) {
    return false;
  }

  await withRetries(
    () =>
      youtube.thumbnails.set({
        videoId: youtubeVideoId,
        media: {
          body: fs.createReadStream(thumbnailPath),
        },
      }),
    retries,
    `thumbnails.set:${localId}`,
  );

  return true;
};

const addToPlaylist = async (youtube, youtubeVideoId, playlistId, retries, localId) => {
  if (!playlistId) {
    return false;
  }

  await withRetries(
    () =>
      youtube.playlistItems.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: youtubeVideoId,
            },
          },
        },
      }),
    retries,
    `playlistItems.insert:${localId}`,
  );

  return true;
};

const main = async () => {
  const config = parseArgs();

  if (Number.isNaN(config.fromIndex) || Number.isNaN(config.toIndex) || config.fromIndex < 1 || config.toIndex < config.fromIndex) {
    throw new Error('Rango inválido para --from-index/--to-index');
  }

  if (Number.isNaN(config.retries) || config.retries < 0) {
    throw new Error('Valor inválido para --retries');
  }

  const manifestPath = path.resolve(projectRoot, config.manifest);
  const statePath = path.resolve(projectRoot, config.state);

  const manifest = loadJson(manifestPath, null);
  validateManifest(manifest);

  const state = loadJson(statePath, {uploads: {}});
  if (!state.uploads || typeof state.uploads !== 'object') {
    state.uploads = {};
  }

  const items = manifest.items
    .slice(config.fromIndex - 1, config.toIndex)
    .filter((item) => item && typeof item === 'object');

  console.log(`[upload] items seleccionados: ${items.length}`);
  console.log(`[upload] modo: ${config.dryRun ? 'dry-run' : 'real'}`);

  if (config.dryRun) {
    items.forEach((item, index) => {
      const already = state.uploads[item.localId]?.youtubeVideoId ? 'yes' : 'no';
      console.log(
        `[dry-run] ${index + config.fromIndex}. ${item.localId} | existsInState=${already} | privacy=${item.privacyStatus} | publishAt=${item.publishAt || 'none'}`,
      );
    });
    return;
  }

  assertEnv();
  const youtube = getYoutubeClient();

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const [idx, item] of items.entries()) {
    const absoluteVideoPath = path.resolve(projectRoot, item.videoPath);
    const absoluteThumbnailPath = item.thumbnailPath ? path.resolve(projectRoot, item.thumbnailPath) : null;
    const stateEntry = state.uploads[item.localId];

    if (stateEntry?.youtubeVideoId && !config.force) {
      skipped += 1;
      console.log(`[upload] skip ${item.localId} (${idx + 1}/${items.length}) already uploaded as ${stateEntry.youtubeVideoId}`);
      continue;
    }

    if (!fs.existsSync(absoluteVideoPath)) {
      failed += 1;
      console.error(`[upload] fail ${item.localId} (${idx + 1}/${items.length}) missing video: ${item.videoPath}`);
      state.uploads[item.localId] = {
        ...stateEntry,
        localId: item.localId,
        status: 'failed',
        error: `missing video: ${item.videoPath}`,
        updatedAt: new Date().toISOString(),
      };
      saveJson(statePath, state);
      continue;
    }

    const uploadItem = {
      ...item,
      videoPath: absoluteVideoPath,
      thumbnailPath: absoluteThumbnailPath,
    };

    try {
      console.log(`[upload] start ${item.localId} (${idx + 1}/${items.length})`);
      const videoData = await uploadVideo(youtube, uploadItem, config.retries);
      const youtubeVideoId = videoData.id;

      const thumbnailUploaded = await uploadThumbnail(
        youtube,
        youtubeVideoId,
        absoluteThumbnailPath,
        config.retries,
        item.localId,
      );

      const playlistAttached = await addToPlaylist(
        youtube,
        youtubeVideoId,
        item.playlistId || manifest.defaults?.playlistId || null,
        config.retries,
        item.localId,
      );

      state.uploads[item.localId] = {
        localId: item.localId,
        youtubeVideoId,
        title: item.title,
        status: 'uploaded',
        privacyStatus: item.publishAt ? 'private' : item.privacyStatus,
        publishAt: item.publishAt || null,
        thumbnailUploaded,
        playlistAttached,
        uploadedAt: new Date().toISOString(),
      };

      saveJson(statePath, state);

      success += 1;
      console.log(`[upload] ok ${item.localId} -> ${youtubeVideoId}`);
    } catch (error) {
      failed += 1;
      const status = error?.response?.status;
      const reason = error?.response?.data?.error?.message || error.message;

      state.uploads[item.localId] = {
        ...stateEntry,
        localId: item.localId,
        status: 'failed',
        error: reason,
        httpStatus: status || null,
        updatedAt: new Date().toISOString(),
      };

      saveJson(statePath, state);

      console.error(`[upload] fail ${item.localId} status=${status || 'n/a'} reason=${reason}`);
    }
  }

  console.log('\n[upload] summary');
  console.log(`success: ${success}`);
  console.log(`skipped: ${skipped}`);
  console.log(`failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
};

main().catch((error) => {
  console.error('[upload] fatal:', error.message);
  process.exit(1);
});
