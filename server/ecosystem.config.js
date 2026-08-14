/**
 * SitePulse — PM2 Process Manager configuration (non-Docker production).
 *
 * In Docker we run Node directly (one process per container; Docker handles
 * healthchecks & restarts). PM2 is the alternative for bare-metal / VM deploys
 * and gives you clustering, log rotation, and zero-downtime reloads.
 *
 *   pm2 start ecosystem.config.js --env production
 *   pm2 reload all                 # zero-downtime rolling update
 *   pm2 logs                       # stream logs
 */
module.exports = {
  apps: [
    {
      name: 'sitepulse-api',
      script: 'src/server.js',
      instances: 'max',     // cluster across all CPU cores
      exec_mode: 'cluster',
      node_args: '--max-old-space-size=512',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      // Graceful reload handling
      kill_timeout: 30000,
      // Restart policy
      max_restarts: 10,
      min_uptime: '30s',
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      // Health / readiness (PM2 Plus can poll this)
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
