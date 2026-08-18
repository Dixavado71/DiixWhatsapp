import createTenantRepository from '../../src/models/TenantRepository.js';

// Mock do Prisma
const mockPrisma = {
  tenant: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('../../src/config/database.js', () => {
  return () => mockPrisma;
});

describe('TenantRepository', () => {
  let repository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = createTenantRepository();
  });

  describe('findBySlug', () => {
    it('deve buscar tenant por slug com sucesso', async () => {
      const slug = 'test-tenant';
      const mockTenant = {
        id: '1',
        slug,
        name: 'Test Tenant',
        accounts: [],
        users: [],
      };

      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await repository.findBySlug(slug);

      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug },
        include: {
          accounts: true,
          users: true,
        },
      });
      expect(result).toEqual(mockTenant);
    });

    it('deve retornar null se tenant não existir', async () => {
      const slug = 'non-existent';
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      const result = await repository.findBySlug(slug);

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithRelations', () => {
    it('deve buscar tenant por ID com relações', async () => {
      const id = 'tenant-123';
      const mockTenant = {
        id,
        name: 'Test Tenant',
        accounts: [{ id: 'acc-1', name: 'Account 1' }],
        users: [{ id: 'user-1', name: 'User 1', email: 'user@test.com', role: 'admin' }],
        conversations: [],
        orders: [],
      };

      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await repository.findByIdWithRelations(id);

      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: {
          accounts: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          conversations: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
          orders: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      expect(result).toEqual(mockTenant);
    });
  });

  describe('checkLimits', () => {
    it('deve verificar limites do tenant corretamente', async () => {
      const tenantId = 'tenant-123';
      const mockTenant = {
        id: tenantId,
        maxAccounts: 5,
        maxMessages: 1000,
        _count: {
          accounts: 3,
          conversations: 10,
          orders: 5,
        },
      };

      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await repository.checkLimits(tenantId);

      expect(result).toEqual({
        accounts: {
          current: 3,
          max: 5,
          exceeded: false,
        },
        messages: {
          current: 0,
          max: 1000,
          exceeded: false,
        },
      });
    });

    it('deve indicar limite excedido quando atingir máximo', async () => {
      const tenantId = 'tenant-123';
      const mockTenant = {
        id: tenantId,
        maxAccounts: 5,
        maxMessages: 1000,
        _count: {
          accounts: 5,
          conversations: 10,
          orders: 5,
        },
      };

      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await repository.checkLimits(tenantId);

      expect(result.accounts.exceeded).toBe(true);
    });

    it('deve lançar erro se tenant não existir', async () => {
      const tenantId = 'non-existent';
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(repository.checkLimits(tenantId)).rejects.toThrow('Tenant não encontrado');
    });
  });

  describe('updateStatus', () => {
    it('deve atualizar status do tenant', async () => {
      const id = 'tenant-123';
      const status = 'inactive';
      const mockUpdated = { id, status, name: 'Test' };

      mockPrisma.tenant.update.mockResolvedValue(mockUpdated);

      const result = await repository.updateStatus(id, status);

      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id },
        data: { status },
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('listAll', () => {
    it('deve listar tenants com paginação', async () => {
      const mockTenants = [
        { id: '1', name: 'Tenant 1' },
        { id: '2', name: 'Tenant 2' },
      ];
      const total = 2;

      mockPrisma.tenant.findMany.mockResolvedValue(mockTenants);
      mockPrisma.tenant.count.mockResolvedValue(total);

      const result = await repository.listAll({ skip: 0, take: 10, status: 'active' });

      expect(mockPrisma.tenant.findMany).toHaveBeenCalledWith({
        where: { status: 'active' },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              accounts: true,
              users: true,
              conversations: true,
            },
          },
        },
      });
      expect(result).toEqual({
        data: mockTenants,
        total,
        page: 1,
        totalPages: 1,
      });
    });

    it('deve listar todos os tenants sem filtro de status', async () => {
      const mockTenants = [{ id: '1', name: 'Tenant 1' }];
      const total = 1;

      mockPrisma.tenant.findMany.mockResolvedValue(mockTenants);
      mockPrisma.tenant.count.mockResolvedValue(total);

      await repository.listAll({ skip: 0, take: 10, status: null });

      expect(mockPrisma.tenant.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              accounts: true,
              users: true,
              conversations: true,
            },
          },
        },
      });
    });
  });
});
