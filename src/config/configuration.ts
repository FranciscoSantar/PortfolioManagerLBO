export default () => ({
  port: parseInt(process.env.APP_PORT || '8000', 10),
  isProd: process.env.IS_PROD === 'true',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpireTime: process.env.JWT_EXPIRES_IN || '1h',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'PortfolioManager',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  },
  cache: {
    host: process.env.CACHE_HOST || 'localhost',
    port: parseInt(process.env.CACHE_PORT || '6379', 10),
  },
});
