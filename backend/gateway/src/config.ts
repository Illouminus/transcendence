import dotenv from 'dotenv';

dotenv.config();

const config = {

    // Server settings
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  
  // Security settings
 services: {
    auth_service: process.env.AUTH_SERVICE_URL || 'http://localhost:8081',
    user_service: process.env.USER_SERVICE_URL || 'http://localhost:8082',
    game_service: process.env.GAME_SERVICE_URL || 'http://localhost:8083',
    chat_service: process.env.CHAT_SERVICE_URL || 'http://localhost:8084',
}  
};


export default config;