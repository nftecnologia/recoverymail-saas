module.exports = {
  apps: [
    {
      name: 'recovery-api',
      script: './dist/bootstrap.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'recovery-worker',
      script: './dist/workers/worker-standalone.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}; 