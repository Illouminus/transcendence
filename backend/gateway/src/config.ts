import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const config = {

  security: {
    jwtSecret: process.env.JWT_SECRET || 'supersecret-change-in-production',
    cookieSecret: process.env.COOKIE_SECRET || 'cookie-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    cookieMaxAge: 60 * 60 * 1000, // 1 hour
  },

    // Server settings
  server: {
    port: parseInt(process.env.GATEWAY_PORT || '8080', 10),
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  
  // Security settings
 services: {
    auth_service: process.env.AUTH_SERVICE_URL || 'http://auth:8081',
    user_service: process.env.USER_SERVICE_URL || 'http://user:8082',
    game_service: process.env.GAME_SERVICE_URL || 'http://game:8083',
    chat_service: process.env.CHAT_SERVICE_URL || 'http://chat:8084',
},

files: {
  uploadsDir: path.resolve(__dirname, '../public/images'),
},
};


export default config;