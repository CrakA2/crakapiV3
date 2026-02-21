module.exports = {
  apps: [
    {
      name: 'crakapi-v3',
      script: 'build/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HENRIK_KEY: 'HDEV-a942d878-dde5-4d2c-bfb4-121979649dfd',
      },
      env_production: {
        NODE_ENV: 'production',
        HENRIK_KEY: 'HDEV-a942d878-dde5-4d2c-bfb4-121979649dfd',
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '500M',
    },
  ],
};
