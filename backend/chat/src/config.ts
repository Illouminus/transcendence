import dotenv from "dotenv";
import path from "path";

dotenv.config();

const config = {
  // Server settings
  server: {
    port: parseInt(process.env.CHAT_PORT || "8084", 10), // Port différent du microservice auth
    host: process.env.HOST || "0.0.0.0",
    env: process.env.NODE_ENV || "development",
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  },

  // Security settings
  security: {
    jwtSecret: process.env.JWT_SECRET || "supersecret-change-in-production",
    cookieSecret: process.env.COOKIE_SECRET || 'cookie-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    cookieMaxAge: 60 * 60 * 1000, // 1 hour
  },

  // WebSocket settings
  websocket: {
    pingInterval: 10000, // 10s pour envoyer un ping aux clients
    pingTimeout: 5000, // 5s avant de considérer un client déconnecté
  },

  // Database settings
  database: {
    path: process.env.DB_PATH || path.resolve(__dirname, "../database.sqlite"),
  },
};

export default config;
