export default (() => ({
  port: parseInt(process.env.PORT || '3000', 10),
  is_prod: process.env.IS_PROD === 'true',
  database: {
    host: process.env.DB_HOST || 'db',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'PortfolioManager',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  }
}));