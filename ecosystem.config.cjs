module.exports = {
  apps: [
    {
      name: 'CodetimeWebV3',
      cwd: __dirname,
      script: './.output/server/index.mjs',
      // --env-file loads .env into process.env before the bundle runs.
      // Required for Postgres + LemonSqueezy credentials that aren't
      // baked into the Nuxt runtime config at build time.
      node_args: '--env-file=.env',
      exec_mode: 'fork',
      instances: 1,
      max_memory_restart: '500M',
      env: {
        PORT: 3001,
        HOST: '0.0.0.0',
        NODE_ENV: 'production',
      },
    },
  ],
}
