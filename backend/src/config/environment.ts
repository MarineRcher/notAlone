import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

console.log('🔧 [CONFIG] Loading environment configuration...');
console.log('🔧 [CONFIG] E2EE_MIN_MEMBERS from env:', process.env.E2EE_MIN_MEMBERS);

export const config = {
  database: {
    host: process.env.DB_HOST || 'db',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'notalone',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
  },
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_here',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_super_secret_refresh_key_here',
  },
  e2ee: {
    minMembers: parseInt(process.env.E2EE_MIN_MEMBERS || '3'),
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
  },
  environment: process.env.NODE_ENV || 'development',
};

console.log('🔧 [CONFIG] Final e2ee.minMembers:', config.e2ee.minMembers);

export default config; 