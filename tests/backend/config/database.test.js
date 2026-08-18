import {
  initializeDatabase,
  connectDatabase,
  disconnectDatabase,
  checkDatabaseHealth,
  getPrisma,
} from '../../src/config/database.js';
import config from '../../src/config/index.js';

// Mock do PrismaClient
const mockPrismaClient = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $queryRaw: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}));

describe('Database Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeDatabase', () => {
    it('deve inicializar o PrismaClient corretamente', () => {
      const result = initializeDatabase();

      expect(result).toBe(mockPrismaClient);
      expect(mockPrismaClient.$connect).not.toHaveBeenCalled();
    });

    it('deve retornar a mesma instância se já estiver inicializado', () => {
      const first = initializeDatabase();
      const second = initializeDatabase();

      expect(first).toBe(second);
    });
  });

  describe('connectDatabase', () => {
    it('deve conectar ao banco de dados com sucesso', async () => {
      mockPrismaClient.$connect.mockResolvedValue(undefined);

      const result = await connectDatabase();

      expect(mockPrismaClient.$connect).toHaveBeenCalled();
      expect(result).toBe(mockPrismaClient);
    });

    it('deve tentar reconectar em caso de falha', async () => {
      mockPrismaClient.$connect
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(undefined);

      const result = await connectDatabase(5);

      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(3);
      expect(result).toBe(mockPrismaClient);
    });

    it('deve lançar erro após todas as tentativas falharem', async () => {
      mockPrismaClient.$connect.mockRejectedValue(new Error('Connection failed'));

      await expect(connectDatabase(3)).rejects.toThrow('Connection failed');
      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(3);
    });
  });

  describe('disconnectDatabase', () => {
    it('deve desconectar do banco de dados', async () => {
      // Primeiro inicializa
      initializeDatabase();
      
      mockPrismaClient.$disconnect.mockResolvedValue(undefined);

      await disconnectDatabase();

      expect(mockPrismaClient.$disconnect).toHaveBeenCalled();
    });

    it('não deve falhar se prisma não estiver inicializado', async () => {
      // Não inicializa o prisma
      await disconnectDatabase();

      expect(mockPrismaClient.$disconnect).not.toHaveBeenCalled();
    });
  });

  describe('checkDatabaseHealth', () => {
    it('deve retornar status healthy quando conectado', async () => {
      initializeDatabase();
      mockPrismaClient.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await checkDatabaseHealth();

      expect(result.status).toBe('healthy');
      expect(result.connected).toBe(true);
    });

    it('deve retornar status disconnected quando não inicializado', async () => {
      const result = await checkDatabaseHealth();

      expect(result.status).toBe('disconnected');
      expect(result.connected).toBe(false);
    });

    it('deve retornar status unhealthy em caso de erro', async () => {
      initializeDatabase();
      mockPrismaClient.$queryRaw.mockRejectedValue(new Error('Query failed'));

      const result = await checkDatabaseHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.connected).toBe(false);
      expect(result.error).toBe('Query failed');
    });
  });

  describe('getPrisma', () => {
    it('deve retornar a instância do Prisma se inicializada', () => {
      initializeDatabase();
      
      const result = getPrisma();

      expect(result).toBe(mockPrismaClient);
    });

    it('deve lançar erro se Prisma não estiver inicializado', () => {
      expect(() => getPrisma()).toThrow('Prisma não inicializado. Chame connectDatabase() primeiro.');
    });
  });
});
