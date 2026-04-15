module.exports = {
  apps: [
    {
      name: 'gu-portal-api',
      cwd: '/var/www/gu-portal/backend',
      script: 'npm',
      args: 'start', // Assumes "start": "node src/server.js" in package.json
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'gu-portal-frontend',
      cwd: '/var/www/gu-portal/frontend',
      script: 'npm',
      args: 'start -- -p 3001', // Tells Next.js to use port 3001
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'gu-portal-scheduler',
      cwd: '/var/www/gu-portal/backend',
      script: 'node',
      args: 'src/scheduler.js',
      cron_restart: '0 1 * * *', // Restarts every day at 1 AM
      autorestart: true
    }
  ]
};