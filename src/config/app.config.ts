export default () => ({
  port: parseInt(process.env.APP_PORT || '3000', 10),
  appName: process.env.APP_NAME || 'team-access-control-api',
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  session: {
    maxPerUser: parseInt(process.env.SESSION_MAX_PER_USER || '5', 10),
  },
});
