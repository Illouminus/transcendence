import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const config = {

    // Server settings
  server: {
    port: parseInt(process.env.PORT || '8082', 10),
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  
  // Security settings
  security: {
    jwtSecret: process.env.JWT_SECRET || 'supersecret-change-in-production',
    cookieSecret: process.env.COOKIE_SECRET || 'cookie-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    cookieMaxAge: 60 * 60 * 1000, // 1 hour
  },
  
  // Settings for Google OAuth 
  auth: {
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    twoFactorCodeTTL: 5 * 60 * 1000, // 5 minutes
  },

  
  // Settings for uploaded files
  files: {
    uploadsDir: path.resolve(__dirname, '../public/images'),
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimetypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
  
  // Settings for the database
  database: {
    path: process.env.DB_PATH || path.resolve(__dirname, '../database.sqlite'),
  },
};


export default config;