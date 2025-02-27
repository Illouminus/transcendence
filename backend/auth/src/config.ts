import dotenv from 'dotenv';
import path from 'path';

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

/**
 * Check if the configuration is valid for production
 */
function validateConfig() {
  if (config.server.env === 'production') {
    if (config.security.jwtSecret === 'supersecret-change-in-production') {
      console.warn('WARNING: Using default JWT secret in production! Set JWT_SECRET env variable.');
    }
    
    if (config.security.cookieSecret === 'cookie-secret-change-in-production') {
      console.warn('WARNING: Using default cookie secret in production! Set COOKIE_SECRET env variable.');
    }
    
    if (!config.auth.googleClientId) {
      console.warn('WARNING: Google authentication will not work without GOOGLE_CLIENT_ID env variable.');
    }
  }
}

// Check the configuration when the module is loaded
validateConfig();

export default config;