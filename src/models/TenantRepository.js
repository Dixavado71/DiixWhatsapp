import getPrisma from '../config/database.js';
import BaseRepository from './BaseRepository.js';

// Lazy load do prisma para garantir que esteja inicializado
const getTenantModel = () => {
  const prisma = getPrisma();
  return prisma.tenant;
};

/**
 * Repository para gerenciamento de Tenants
 */
class TenantRepository extends BaseRepository {
  constructor() {
    super(getTenantModel(), null); // Tenant não tem escopo de tenant
  }

  /**
   * Busca tenant por slug
   */
  async findBySlug(slug) {
    const prisma = getPrisma();
    return prisma.tenant.findUnique({
      where: { slug },
      include: {
        accounts: true,
        users: true,
      },
    });
  }

  /**
   * Busca tenant por ID com dados relacionados
   */
  async findByIdWithRelations(id) {
    const prisma = getPrisma();
    return prisma.tenant.findUnique({
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
  }

  /**
   * Verifica limites do tenant
   */
  async checkLimits(tenantId) {
    const prisma = getPrisma();
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            accounts: true,
            conversations: true,
            orders: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new Error('Tenant não encontrado');
    }

    return {
      accounts: {
        current: tenant._count.accounts,
        max: tenant.maxAccounts,
        exceeded: tenant._count.accounts >= tenant.maxAccounts,
      },
      messages: {
        current: 0, // Implementar contador de mensagens
        max: tenant.maxMessages,
        exceeded: false,
      },
    };
  }

  /**
   * Atualiza status do tenant
   */
  async updateStatus(id, status) {
    const prisma = getPrisma();
    return prisma.tenant.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Lista todos os tenants com paginação
   */
  async listAll({ skip = 0, take = 10, status = 'active' }) {
    const prisma = getPrisma();
    const where = status ? { status } : {};
    
    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take,
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
      }),
      prisma.tenant.count({ where }),
    ]);

    return {
      data: tenants,
      total,
      page: Math.floor(skip / take) + 1,
      totalPages: Math.ceil(total / take),
    };
  }
}

export default new TenantRepository();
