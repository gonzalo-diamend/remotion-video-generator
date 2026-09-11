#!/usr/bin/env node
const crypto = require('crypto');
const http = require('http');
const path = require('path');
const {spawn} = require('child_process');
const {google} = require('googleapis');
const {loadLocalEnv} = require('./lib/local-env');

const projectRoot = path.resolve(__dirname, '..');
loadLocalEnv(path.join(projectRoot, '.env.youtube.local'));

const required = ['YT_CLIENT_ID', 'YT_CLIENT_SECRET'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`[youtube-auth] Faltan ${missing.join(', ')} en .env.youtube.local o en el entorno.`);
  process.exit(1);
}

const redirectUri = process.env.YT_REDIRECT_URI || 'http://localhost:53682/oauth2callback';
const callback = new URL(redirectUri);
if (callback.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(callback.hostname)) {
  console.error('[youtube-auth] YT_REDIRECT_URI debe ser una URL local, por ejemplo http://localhost:53682/oauth2callback');
  process.exit(1);
}

const oauth = new google.auth.OAuth2(process.env.YT_CLIENT_ID, process.env.YT_CLIENT_SECRET, redirectUri);
const state = crypto.randomBytes(24).toString('hex');
const authUrl = oauth.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  include_granted_scopes: true,
  state,
  scope: ['https://www.googleapis.com/auth/youtube'],
});

const openBrowser = (url) => {
  const command = process.platform === 'win32' ? 'explorer.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const child = spawn(command, [url], {detached: true, stdio: 'ignore'});
  child.on('error', () => {});
  child.unref();
};

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, redirectUri);
  if (requestUrl.pathname !== callback.pathname) {
    response.writeHead(404).end('Not found');
    return;
  }

  if (requestUrl.searchParams.get('state') !== state) {
    response.writeHead(400).end('Invalid OAuth state');
    return;
  }

  const error = requestUrl.searchParams.get('error');
  const code = requestUrl.searchParams.get('code');
  if (error || !code) {
    response.writeHead(400, {'Content-Type': 'text/plain; charset=utf-8'}).end(`Autorización cancelada: ${error || 'sin código'}`);
    server.close();
    return;
  }

  try {
    const {tokens} = await oauth.getToken(code);
    if (!tokens.refresh_token) throw new Error('Google no devolvió refresh_token. Revoca el acceso anterior y vuelve a ejecutar el comando.');
    oauth.setCredentials(tokens);
    const youtube = google.youtube({version: 'v3', auth: oauth});
    const channelResponse = await youtube.channels.list({part: ['id', 'snippet'], mine: true});
    const channel = channelResponse.data.items?.[0];
    if (!channel?.id) throw new Error('La cuenta autorizada no tiene un canal de YouTube disponible.');

    response.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'}).end('Autorización completada. Puedes cerrar esta pestaña y volver a la terminal.');
    console.log('\n[youtube-auth] Autorización completada');
    console.log(`[youtube-auth] Canal: ${channel.snippet?.title || 'sin nombre'} (${channel.id})`);
    console.log('\nCopia estos valores en GitHub Actions Secrets:');
    console.log(`YT_CLIENT_ID=${process.env.YT_CLIENT_ID}`);
    console.log(`YT_CLIENT_SECRET=${process.env.YT_CLIENT_SECRET}`);
    console.log(`YT_REDIRECT_URI=${redirectUri}`);
    console.log(`YT_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log(`\nVariable opcional de seguridad: YT_EXPECTED_CHANNEL_ID=${channel.id}`);
  } catch (exchangeError) {
    response.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'}).end('No se pudo completar la autorización. Revisa la terminal.');
    console.error(`[youtube-auth] ${exchangeError.message}`);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});

server.on('error', (error) => {
  console.error(`[youtube-auth] No se pudo abrir ${redirectUri}: ${error.message}`);
  process.exit(1);
});

server.listen(Number(callback.port || 80), callback.hostname, () => {
  console.log(`[youtube-auth] Esperando autorización en ${redirectUri}`);
  console.log(`[youtube-auth] Si el navegador no se abre, visita:\n${authUrl}\n`);
  openBrowser(authUrl);
});

setTimeout(() => {
  console.error('[youtube-auth] Tiempo de autorización agotado. Ejecuta nuevamente npm run youtube:auth.');
  server.close();
  process.exitCode = 1;
}, 10 * 60 * 1000).unref();
