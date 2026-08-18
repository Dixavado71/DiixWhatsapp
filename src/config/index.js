import dotenv from 'dotenv';

dotenv.config();

export default {
  // Servidor
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database - Escolha entre postgresql ou mongodb
  database: {
    provider: process.env.DB_PROVIDER || 'postgresql', // postgresql | mongodb
  },
  databaseUrl: process.env.DATABASE_URL,
  mongodbUri: process.env.MONGODB_URI,
  
  // Evolution API
  evolutionApi: {
    url: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
    apiKey: process.env.EVOLUTION_API_KEY || '',
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'change_this_secret_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // Multi-Tenant
  tenant: {
    defaultMaxAccounts: parseInt(process.env.DEFAULT_TENANT_LIMIT_ACCOUNTS || '5', 10),
    defaultMaxMessages: parseInt(process.env.DEFAULT_TENANT_LIMIT_MESSAGES || '1000', 10),
  },
  
  // Redis (opcional - usado para cache e filas)
  redis: {
    enabled: process.env.REDIS_ENABLED !== 'false', // true por padrão
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  
  // Webhook
  webhookUrl: process.env.WEBHOOK_URL || 'http://localhost:3000/webhook',
  
  // Log Level
  logLevel: process.env.LOG_LEVEL || 'debug',
  
  // Uploads
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};
