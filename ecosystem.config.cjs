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
      // Cluster mode + 2 instances + wait_ready gives us true zero-downtime
      // reload: `pm2 reload` spawns a fresh worker, waits for it to send
      // `process.send('ready')` (see server/plugins/pm2-ready.ts) BEFORE
      // routing traffic to it, then shuts the old worker down with
      // SIGINT — Nitro's setupGracefulShutdown drains in-flight requests
      // for up to 30s before exiting.
      exec_mode: 'cluster',
      instances: 2,
      wait_ready: true,
      // How long PM2 will wait for the new worker's `ready` signal before
      // declaring the reload failed and killing it. The pm2-ready probe
      // gives up at 30s; we cap PM2 a bit higher so its own timeout never
      // races ahead of the in-app deadline.
      listen_timeout: 30_000,
      // SIGINT first, then SIGKILL after this long. Must be >= Nitro's
      // own shutdown timeout (NITRO_SHUTDOWN_TIMEOUT, default 30s) or PM2
      // will hard-kill mid-drain.
      kill_timeout: 35_000,
      // Workers are independent — no shared in-memory state. The pricing
      // catalogue (server/utils/agent-pricing.ts) refreshes per-process;
      // each worker pulls its own copy on first hit, which is fine.
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
