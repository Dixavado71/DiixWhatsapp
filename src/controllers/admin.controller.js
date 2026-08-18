import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller Administrativo (SUPER_ADMIN)
 * Gerencia tenants, usuários globais e estatísticas da plataforma
 */

export const adminController = {
  /**
   * Listar todos os tenants com filtros e paginação
   * GET /api/v1/admin/tenants
   */
  listTenants: async (req, res) => {
    try {
      const { page = 1, limit = 10, status, plan, search } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = {};

      if (status) {
        where.status = status;
      }

      if (plan) {
        where.plan = plan;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [tenants, total] = await Promise.all([
        prisma.tenant.findMany({
          where,
          skip,
          take,
          include: {
            _count: {
              select: {
                users: true,
                accounts: true,
                orders: true,
                products: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.tenant.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          tenants,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error('Erro ao listar tenants:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao listar tenants.',
      });
    }
  },

  /**
   * Criar novo tenant
   * POST /api/v1/admin/tenants
   */
  createTenant: async (req, res) => {
    try {
      const { name, email, phone, plan, maxAccounts, maxMessages } = req.body;

      // Validações
      if (!name || !email) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Nome e email são obrigatórios.',
        });
      }

      // Gerar slug único baseado no nome
      let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      let uniqueSlug = slug;
      let counter = 1;

      while (true) {
        const existing = await prisma.tenant.findUnique({
          where: { slug: uniqueSlug },
        });
        if (!existing) break;
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }

      // Criar tenant
      const tenant = await prisma.tenant.create({
        data: {
          name,
          slug: uniqueSlug,
          email,
          phone: phone || null,
          plan: plan || 'FREE',
          status: 'TRIAL',
          maxAccounts: maxAccounts || 3,
          maxMessages: maxMessages || 500,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dias de trial
        },
        include: {
          _count: {
            select: {
              users: true,
              accounts: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: tenant,
        message: 'Tenant criado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao criar tenant:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao criar tenant.',
      });
    }
  },

  /**
   * Obter detalhes de um tenant
   * GET /api/v1/admin/tenants/:id
   */
  getTenant: async (req, res) => {
    try {
      const { id } = req.params;

      const tenant = await prisma.tenant.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              status: true,
              createdAt: true,
            },
          },
          accounts: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
              status: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              orders: true,
              conversations: true,
              products: true,
              messages: true,
            },
          },
        },
      });

      if (!tenant) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Tenant não encontrado.',
        });
      }

      res.status(200).json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      console.error('Erro ao obter tenant:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao obter tenant.',
      });
    }
  },

  /**
   * Atualizar tenant
   * PUT /api/v1/admin/tenants/:id
   */
  updateTenant: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phone, plan, status, maxAccounts, maxMessages } = req.body;

      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (plan) updateData.plan = plan;
      if (status) updateData.status = status;
      if (maxAccounts !== undefined) updateData.maxAccounts = maxAccounts;
      if (maxMessages !== undefined) updateData.maxMessages = maxMessages;

      const tenant = await prisma.tenant.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: {
              users: true,
              accounts: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: tenant,
        message: 'Tenant atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao atualizar tenant:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Tenant não encontrado.',
        });
      }
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao atualizar tenant.',
      });
    }
  },

  /**
   * Bloquear/Desbloquear tenant
   * PUT /api/v1/admin/tenants/:id/block
   */
  toggleTenantBlock: async (req, res) => {
    try {
      const { id } = req.params;
      const { block } = req.body; // true para bloquear, false para desbloquear

      const newStatus = block ? 'SUSPENDED' : 'ACTIVE';

      const tenant = await prisma.tenant.update({
        where: { id },
        data: { status: newStatus },
      });

      res.status(200).json({
        success: true,
        data: tenant,
        message: `Tenant ${block ? 'bloqueado' : 'desbloqueado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao alternar status do tenant:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Tenant não encontrado.',
        });
      }
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao alternar status do tenant.',
      });
    }
  },

  /**
   * Deletar tenant (apenas se não tiver dados críticos)
   * DELETE /api/v1/admin/tenants/:id
   */
  deleteTenant: async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar se tenant existe e contar relacionamentos
      const tenant = await prisma.tenant.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              orders: true,
              conversations: true,
              messages: true,
            },
          },
        },
      });

      if (!tenant) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Tenant não encontrado.',
        });
      }

      // Prevenir exclusão se houver muitos dados
      if (tenant._count.orders > 0 || tenant._count.conversations > 0) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Não é possível excluir tenant com dados históricos. Marque como inativo.',
        });
      }

      // Excluir tenant (cascade deletará relacionados)
      await prisma.tenant.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Tenant excluído com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir tenant:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Tenant não encontrado.',
        });
      }
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao excluir tenant.',
      });
    }
  },

  /**
   * Estatísticas globais da plataforma
   * GET /api/v1/admin/stats
   */
  getStats: async (req, res) => {
    try {
      const [
        totalTenants,
        activeTenants,
        totalUsers,
        totalAccounts,
        totalMessages,
        totalOrders,
        totalProducts,
        recentTenants,
      ] = await Promise.all([
        prisma.tenant.count(),
        prisma.tenant.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count(),
        prisma.whatsAppAccount.count(),
        prisma.message.count(),
        prisma.order.count(),
        prisma.product.count(),
        prisma.tenant.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            plan: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);

      // Estatísticas por plano
      const tenantsByPlan = await prisma.tenant.groupBy({
        by: ['plan'],
        _count: { id: true },
      });

      // Mensagens nos últimos 7 dias
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const messagesLast7Days = await prisma.message.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
        _count: { id: true },
      });

      // Agrupar mensagens por dia
      const messagesByDay = {};
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        messagesByDay[dateStr] = 0;
      }

      messagesLast7Days.forEach((msg) => {
        const dateStr = msg.createdAt.toISOString().split('T')[0];
        if (messagesByDay.hasOwnProperty(dateStr)) {
          messagesByDay[dateStr] += msg._count.id;
        }
      });

      res.status(200).json({
        success: true,
        data: {
          overview: {
            totalTenants,
            activeTenants,
            totalUsers,
            totalAccounts,
            totalMessages,
            totalOrders,
            totalProducts,
          },
          tenantsByPlan: tenantsByPlan.reduce((acc, item) => {
            acc[item.plan] = item._count.id;
            return acc;
          }, {}),
          recentTenants,
          messagesLast7Days: Object.entries(messagesByDay).map(([date, count]) => ({
            date,
            count,
          })),
        },
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao obter estatísticas.',
      });
    }
  },
};
