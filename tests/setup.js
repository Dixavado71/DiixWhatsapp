// Setup file for backend tests

// Mock console em testes
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Mock de variáveis de ambiente
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/diix_test';
process.env.EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
process.env.EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'test-key';

// Helper para aguardar tempo
global.waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para criar mock de request do Express
global.createMockRequest = (overrides = {}) => ({
  headers: {},
  params: {},
  query: {},
  body: {},
  tenant: null,
  ...overrides,
});

// Helper para criar mock de response do Express
global.createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};
