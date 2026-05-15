const fs = require('node:fs')
const path = require('node:path')

// Load `.env` into a plain object at PM2-config evaluation time and
// inject every entry through `env:` below. PM2 6.x silently drops
// `node_args` / `interpreter_args` for `.mjs` scripts spawned in fork
// mode (the resulting cmdline is just `node .output/server/index.mjs`
// — verified via /proc/<pid>/cmdline), so `node --env-file=.env` is
// not a viable runtime contract here. Parsing the file ourselves keeps
// .env as the single source of truth for OAuth/Postgres/LemonSqueezy
// credentials while guaranteeing the spawned process actually sees
// them in `process.env`.
function loadDotEnv(file) {
  const out = {}
  let text
  try {
 text = fs.readFileSync(file, 'utf8')
}
  catch {
 return out
}
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) {
 continue
}
    const eq = line.indexOf('=')
    if (eq <= 0) {
 continue
}
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith('\'') && value.endsWith('\''))) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

const dotenv = loadDotEnv(path.join(__dirname, '.env'))

module.exports = {
  apps: [
    {
      name: 'CodetimeWebV3',
      cwd: __dirname,
      script: './.output/server/index.mjs',
      exec_mode: 'fork',
      instances: 1,
      max_memory_restart: '500M',
      env: {
        PORT: 3001,
        HOST: '0.0.0.0',
        NODE_ENV: 'production',
        ...dotenv,
      },
    },
  ],
}
