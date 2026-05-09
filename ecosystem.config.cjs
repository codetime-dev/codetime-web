module.exports = {
  apps: [
    {
      name: 'CodetimeWebV3',
      port: '3001',
      cwd: __dirname,
      exec_mode: 'cluster',
      instances: 2,
      script: './.output/server/index.mjs',
      max_memory_restart: '500M',
      health_check: {
        enable: true,
        interval: 5000,
        url: 'http://localhost:3000/en',
        on_failure: 'restart',
        timeout: 5000,
      },
    },
  ],
}
