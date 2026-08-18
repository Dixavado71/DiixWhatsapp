/**
 * Setup Global para Testes Backend
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-123456789';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.API_KEY = 'test-api-key';

jest.setTimeout(30000);

console.log('✅ Setup de testes backend inicializado');
