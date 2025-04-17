import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const config = {

  server: {
    port: parseInt(process.env.PORT || '8083', 10),
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
  },
  
  database: {
    path: process.env.DB_PATH || path.resolve(__dirname, '../database.sqlite'),
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'supersecret-change-in-production',
    cookieSecret: process.env.COOKIE_SECRET || 'cookie-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    cookieMaxAge: 60 * 60 * 1000, // 1 hour
  },
};



export default config;