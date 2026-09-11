const fs = require('fs');
const path = require('path');

const unquote = (value) => {
  if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
    return value.slice(1, -1);
  }
  return value;
};

const loadLocalEnv = (filePath = path.resolve(process.cwd(), '.env.youtube.local')) => {
  if (!fs.existsSync(filePath)) return false;

  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const value = unquote(line.slice(separator + 1).trim());
    if (/^[A-Z][A-Z0-9_]*$/.test(key) && process.env[key] === undefined) process.env[key] = value;
  }
  return true;
};

module.exports = {loadLocalEnv, unquote};
