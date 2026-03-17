module.exports = {
  apps: [
    {
      name: 'growthhelp-api',
      script: 'dist/index.js',
      cwd: '/root/Growth-help/apps/api',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        DATABASE_URL: 'postgresql://mlm_user:mlm_password@localhost:5432/mlm_db',
        JWT_SECRET: 'This_is_the_random_string_for_growthhelp_this_abc123xyz456',
      }
    }
  ]
};