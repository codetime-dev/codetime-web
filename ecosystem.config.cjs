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
      },
    },
  ],
}
