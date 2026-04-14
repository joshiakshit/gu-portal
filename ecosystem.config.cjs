module.exports = {
  apps: [
    {
      name: 'gu-portal-api',
      script: '/home/ash/.nvm/versions/node/v22.22.2/bin/node',
      args: 'src/server.js',
      cwd: '/var/www/gu-portal',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      restart_delay: 3000,
      max_restarts: 10,
      autorestart: true,
    },
    {
      name: 'gu-portal-scheduler',
      script: '/home/ash/.nvm/versions/node/v22.22.2/bin/node',
      args: 'src/scheduler.js',
      cwd: '/var/www/gu-portal',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
      },
      restart_delay: 5000,
      max_restarts: 10,
      autorestart: true,
      
      cron_restart: '5 1 * * *',
    },
  ],
};