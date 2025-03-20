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
};


export default config;