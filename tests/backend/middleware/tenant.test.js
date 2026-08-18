import { identifyTenant, checkTenantLimits } from '../../src/middleware/tenant.js';
import tenantRepository from '../../src/models/TenantRepository.js';

// Mock do tenantRepository
jest.mock('../../src/models/TenantRepository.js', () => ({
  findById: jest.fn(),
  findBySlug: jest.fn(),
  checkLimits: jest.fn(),
}));

describe('Middleware Tenant', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      params: {},
      tenant: null,
      tenantLimits: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('identifyTenant', () => {
    it('deve identificar tenant via header X-Tenant-ID', async () => {
      const mockTenant = {
        id: 'tenant-123',
        slug: 'test-tenant',
        name: 'Test Tenant',
        plan: 'premium',
        maxAccounts: 10,
        maxMessages: 5000,
        status: 'active',
      };

      req.headers['x-tenant-id'] = 'tenant-123';
      tenantRepository.findById.mockResolvedValue(mockTenant);

      await identifyTenant(req, res, next);

      expect(tenantRepository.findById).toHaveBeenCalledWith('tenant-123');
      expect(req.tenant).toEqual({
        id: 'tenant-123',
        slug: 'test-tenant',
        name: 'Test Tenant',
        plan: 'premium',
        maxAccounts: 10,
        maxMessages: 5000,
      });
      expect(next).toHaveBeenCalled();
    });

    it('deve identificar tenant via header X-Tenant-Slug', async () => {
      const mockTenant = {
        id: 'tenant-123',
        slug: 'test-tenant',
        name: 'Test Tenant',
        plan: 'basic',
        maxAccounts: 3,
        maxMessages: 1000,
        status: 'active',
      };

      req.headers['x-tenant-slug'] = 'test-tenant';
      tenantRepository.findBySlug.mockResolvedValue(mockTenant);

      await identifyTenant(req, res, next);

      expect(tenantRepository.findBySlug).toHaveBeenCalledWith('test-tenant');
      expect(req.tenant).toEqual({
        id: 'tenant-123',
        slug: 'test-tenant',
        name: 'Test Tenant',
        plan: 'basic',
        maxAccounts: 3,
        maxMessages: 1000,
      });
      expect(next).toHaveBeenCalled();
    });

    it('deve identificar tenant via subdomínio', async () => {
      const mockTenant = {
        id: 'tenant-123',
        slug: 'loja1',
        name: 'Loja 1',
        plan: 'standard',
        maxAccounts: 5,
        maxMessages: 2000,
        status: 'active',
      };

      req.headers.host = 'loja1.app.com';
      tenantRepository.findBySlug.mockResolvedValue(mockTenant);

      await identifyTenant(req, res, next);

      expect(tenantRepository.findBySlug).toHaveBeenCalledWith('loja1');
      expect(req.tenant.slug).toBe('loja1');
      expect(next).toHaveBeenCalled();
    });

    it('deve identificar tenant via path param', async () => {
      const mockTenant = {
        id: 'tenant-123',
        slug: 'path-tenant',
        name: 'Path Tenant',
        plan: 'basic',
        maxAccounts: 3,
        maxMessages: 1000,
        status: 'active',
      };

      req.params.tenantSlug = 'path-tenant';
      tenantRepository.findBySlug.mockResolvedValue(mockTenant);

      await identifyTenant(req, res, next);

      expect(tenantRepository.findBySlug).toHaveBeenCalledWith('path-tenant');
      expect(next).toHaveBeenCalled();
    });

    it('deve retornar erro 400 se nenhum identificador for fornecido', async () => {
      await identifyTenant(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Tenant não identificado',
        message: 'É necessário informar o tenant via header X-Tenant-ID, X-Tenant-Slug, subdomínio ou path.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar erro 404 se tenant não existir', async () => {
      req.headers['x-tenant-id'] = 'non-existent';
      tenantRepository.findById.mockResolvedValue(null);

      await identifyTenant(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Tenant não encontrado',
        message: 'O tenant especificado não existe ou foi desativado.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar erro 403 se tenant estiver inativo', async () => {
      const mockTenant = {
        id: 'tenant-123',
        slug: 'test-tenant',
        name: 'Test Tenant',
        status: 'inactive',
      };

      req.headers['x-tenant-id'] = 'tenant-123';
      tenantRepository.findById.mockResolvedValue(mockTenant);

      await identifyTenant(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Tenant inativo',
        message: 'Este tenant está com status "inactive". Entre em contato com o suporte.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar erro 500 em caso de exceção', async () => {
      req.headers['x-tenant-id'] = 'tenant-123';
      tenantRepository.findById.mockRejectedValue(new Error('Database error'));

      await identifyTenant(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Erro interno',
        message: 'Falha ao identificar o tenant.',
      });
    });
  });

  describe('checkTenantLimits', () => {
    it('deve verificar limites e permitir se dentro do limite', async () => {
      req.tenant = { id: 'tenant-123' };
      
      const mockLimits = {
        accounts: {
          current: 2,
          max: 5,
          exceeded: false,
        },
        messages: {
          current: 100,
          max: 1000,
          exceeded: false,
        },
      };

      tenantRepository.checkLimits.mockResolvedValue(mockLimits);

      await checkTenantLimits(req, res, next);

      expect(tenantRepository.checkLimits).toHaveBeenCalledWith('tenant-123');
      expect(req.tenantLimits).toEqual(mockLimits);
      expect(next).toHaveBeenCalled();
    });

    it('deve bloquear se limite de contas excedido', async () => {
      req.tenant = { id: 'tenant-123' };
      
      const mockLimits = {
        accounts: {
          current: 5,
          max: 5,
          exceeded: true,
        },
        messages: {
          current: 100,
          max: 1000,
          exceeded: false,
        },
      };

      tenantRepository.checkLimits.mockResolvedValue(mockLimits);

      await checkTenantLimits(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Limite excedido',
        message: 'Você atingiu o limite máximo de 5 contas WhatsApp.',
        limits: mockLimits,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve continuar sem bloquear se tenant não estiver definido', async () => {
      req.tenant = null;

      await checkTenantLimits(req, res, next);

      expect(tenantRepository.checkLimits).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('deve continuar mesmo em caso de erro (não bloqueante)', async () => {
      req.tenant = { id: 'tenant-123' };
      tenantRepository.checkLimits.mockRejectedValue(new Error('Failed'));

      await checkTenantLimits(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
