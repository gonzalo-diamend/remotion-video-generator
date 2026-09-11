#!/usr/bin/env node
const path = require('path');
const {google} = require('googleapis');
const {loadLocalEnv} = require('./lib/local-env');

const projectRoot = path.resolve(__dirname, '..');
loadLocalEnv(path.join(projectRoot, '.env.youtube.local'));

const required = ['YT_CLIENT_ID', 'YT_CLIENT_SECRET', 'YT_REDIRECT_URI', 'YT_REFRESH_TOKEN'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`[youtube-check] Faltan credenciales: ${missing.join(', ')}`);
  process.exit(1);
}

const main = async () => {
  const auth = new google.auth.OAuth2(process.env.YT_CLIENT_ID, process.env.YT_CLIENT_SECRET, process.env.YT_REDIRECT_URI);
  auth.setCredentials({refresh_token: process.env.YT_REFRESH_TOKEN});
  await auth.getAccessToken();

  const youtube = google.youtube({version: 'v3', auth});
  const response = await youtube.channels.list({part: ['id', 'snippet'], mine: true});
  const channel = response.data.items?.[0];
  if (!channel?.id) throw new Error('Las credenciales no devuelven ningún canal de YouTube.');

  const expected = process.env.YT_EXPECTED_CHANNEL_ID;
  if (expected && channel.id !== expected) {
    throw new Error(`Las credenciales pertenecen al canal ${channel.id}, pero se esperaba ${expected}.`);
  }

  console.log(`[youtube-check] OK: ${channel.snippet?.title || 'canal sin nombre'} (${channel.id})`);
};

main().catch((error) => {
  const message = error?.response?.data?.error_description || error?.response?.data?.error?.message || error.message;
  console.error(`[youtube-check] ${message}`);
  process.exit(1);
});
