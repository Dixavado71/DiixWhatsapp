import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller de Clientes (Customer)
 * Gerencia histórico, dados e segmentação de clientes
 */

export const customerController = {
  /**
   * Listar clientes do tenant
   * GET /api/v1/customers
   */
  listCustomers: async (req, res) => {
    try {
      const { page = 1, limit = 20, search, tags, minSpent, maxSpent, hasOrders } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // Determinar tenantId
      const tenantId = req.user.role === 'SUPER_ADMIN'
        ? (req.query.tenantId || req.accessibleTenantId)
        : req.user.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Tenant ID é obrigatório.',
        });
      }

      const where = { tenantId };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { document: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (tags) {
        const tagsArray = Array.isArray(tags) ? tags : tags.split(',');
        where.tags = {
          hasSome: tagsArray,
        };
      }

      if (minSpent || maxSpent) {
        where.totalSpent = {};
        if (minSpent) where.totalSpent.gte = parseFloat(minSpent);
        if (maxSpent) where.totalSpent.lte = parseFloat(maxSpent);
      }

      if (hasOrders !== undefined) {
        where.totalOrders = hasOrders === 'true' ? { gt: 0 } : 0;
      }

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          skip,
          take,
          include: {
            orders: {
              select: {
                id: true,
                total: true,
                status: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
            addresses: {
              where: { isDefault: true },
              take: 1,
            },
          },
          orderBy: { totalSpent: 'desc' },
        }),
        prisma.customer.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          customers,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao listar clientes.',
      });
    }
  },

  /**
   * Obter cliente específico
   * GET /api/v1/customers/:id
   */
  getCustomer: async (req, res) => {
    try {
      const { id } = req.params;

      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          orders: {
            include: {
              items: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      images: true,
                    },
                  },
                },
              },
              shippingAddress: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          addresses: true,
          carts: {
            where: { status: 'ACTIVE' },
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      if (!customer) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Cliente não encontrado.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && customer.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado a este cliente.',
        });
      }

      res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      console.error('Erro ao obter cliente:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao obter cliente.',
      });
    }
  },

  /**
   * Criar novo cliente
   * POST /api/v1/customers
   */
  createCustomer: async (req, res) => {
    try {
      const { name, phone, email, document, tags, notes } = req.body;

      // Validações
      if (!name || !phone) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Nome e telefone são obrigatórios.',
        });
      }

      // Determinar tenantId
      const tenantId = req.user.role === 'SUPER_ADMIN'
        ? (req.body.tenantId || req.accessibleTenantId)
        : req.user.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Tenant ID é obrigatório.',
        });
      }

      // Verificar se telefone já existe para este tenant
      const existing = await prisma.customer.findUnique({
        where: {
          tenantId_phone: {
            tenantId,
            phone,
          },
        },
      });

      if (existing) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Telefone já cadastrado para este tenant.',
        });
      }

      const customer = await prisma.customer.create({
        data: {
          tenantId,
          name,
          phone,
          email: email || null,
          document: document || null,
          tags: tags || [],
          notes: notes || null,
          totalSpent: 0,
          totalOrders: 0,
        },
      });

      res.status(201).json({
        success: true,
        data: customer,
        message: 'Cliente criado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      if (error.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Cliente já existe com este telefone.',
        });
      }
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao criar cliente.',
      });
    }
  },

  /**
   * Atualizar cliente
   * PUT /api/v1/customers/:id
   */
  updateCustomer: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, phone, email, document, tags, notes } = req.body;

      // Buscar cliente atual
      const currentCustomer = await prisma.customer.findUnique({
        where: { id },
      });

      if (!currentCustomer) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Cliente não encontrado.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && currentCustomer.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado a este cliente.',
        });
      }

      // Verificar telefone único se alterado
      if (phone && phone !== currentCustomer.phone) {
        const existing = await prisma.customer.findUnique({
          where: {
            tenantId_phone: {
              tenantId: currentCustomer.tenantId,
              phone,
            },
          },
        });

        if (existing) {
          return res.status(409).json({
            error: 'Conflict',
            message: 'Telefone já cadastrado para este tenant.',
          });
        }
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (email !== undefined) updateData.email = email;
      if (document !== undefined) updateData.document = document;
      if (tags !== undefined) updateData.tags = tags;
      if (notes !== undefined) updateData.notes = notes;

      const customer = await prisma.customer.update({
        where: { id },
        data: updateData,
      });

      res.status(200).json({
        success: true,
        data: customer,
        message: 'Cliente atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Cliente não encontrado.',
        });
      }
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao atualizar cliente.',
      });
    }
  },

  /**
   * Adicionar tag ao cliente
   * POST /api/v1/customers/:id/tags
   */
  addCustomerTag: async (req, res) => {
    try {
      const { id } = req.params;
      const { tags } = req.body;

      if (!tags || !Array.isArray(tags) || tags.length === 0) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Tags são obrigatórias.',
        });
      }

      const customer = await prisma.customer.findUnique({
        where: { id },
      });

      if (!customer) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Cliente não encontrado.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && customer.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado.',
        });
      }

      const updatedTags = [...new Set([...customer.tags, ...tags])];

      const updatedCustomer = await prisma.customer.update({
        where: { id },
        data: { tags: updatedTags },
      });

      res.status(200).json({
        success: true,
        data: updatedCustomer,
        message: 'Tags adicionadas com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao adicionar tags:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao adicionar tags.',
      });
    }
  },

  /**
   * Remover tag do cliente
   * DELETE /api/v1/customers/:id/tags
   */
  removeCustomerTag: async (req, res) => {
    try {
      const { id } = req.params;
      const { tags } = req.body;

      if (!tags || !Array.isArray(tags) || tags.length === 0) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Tags são obrigatórias.',
        });
      }

      const customer = await prisma.customer.findUnique({
        where: { id },
      });

      if (!customer) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Cliente não encontrado.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && customer.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado.',
        });
      }

      const updatedTags = customer.tags.filter(tag => !tags.includes(tag));

      const updatedCustomer = await prisma.customer.update({
        where: { id },
        data: { tags: updatedTags },
      });

      res.status(200).json({
        success: true,
        data: updatedCustomer,
        message: 'Tags removidas com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao remover tags:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao remover tags.',
      });
    }
  },

  /**
   * Obter estatísticas do cliente
   * GET /api/v1/customers/:id/stats
   */
  getCustomerStats: async (req, res) => {
    try {
      const { id } = req.params;

      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          orders: {
            select: {
              total: true,
              status: true,
              paymentStatus: true,
              createdAt: true,
            },
          },
        },
      });

      if (!customer) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Cliente não encontrado.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && customer.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado.',
        });
      }

      // Calcular estatísticas
      const stats = {
        totalOrders: customer.orders.length,
        totalSpent: customer.totalSpent,
        averageOrderValue: customer.orders.length > 0
          ? customer.totalSpent.div(customer.orders.length)
          : 0,
        ordersByStatus: customer.orders.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {}),
        lastPurchaseAt: customer.lastPurchaseAt,
        firstPurchaseAt: customer.orders.length > 0
          ? customer.orders[customer.orders.length - 1].createdAt
          : null,
      };

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas do cliente:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao obter estatísticas.',
      });
    }
  },

  /**
   * Listar grupos de clientes (por tags)
   * GET /api/v1/customers/groups
   */
  listCustomerGroups: async (req, res) => {
    try {
      // Determinar tenantId
      const tenantId = req.user.role === 'SUPER_ADMIN'
        ? (req.query.tenantId || req.accessibleTenantId)
        : req.user.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Tenant ID é obrigatório.',
        });
      }

      const groups = await prisma.customer.groupBy({
        by: ['tags'],
        where: {
          tenantId,
          tags: {
            isEmpty: false,
          },
        },
      });

      // Extrair todas as tags únicas e contar clientes por tag
      const tagCounts = {};
      groups.forEach(group => {
        group.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      const result = Object.entries(tagCounts).map(([tag, count]) => ({
        tag,
        count,
      })).sort((a, b) => b.count - a.count);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Erro ao listar grupos de clientes:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao listar grupos.',
      });
    }
  },

  /**
   * Deletar cliente
   * DELETE /api/v1/customers/:id
   */
  deleteCustomer: async (req, res) => {
    try {
      const { id } = req.params;

      const customer = await prisma.customer.findUnique({
        where: { id },
      });

      if (!customer) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Cliente não encontrado.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && customer.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado a este cliente.',
        });
      }

      // Verificar se tem pedidos
      const orderCount = await prisma.order.count({
        where: { customerId: id },
      });

      if (orderCount > 0) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Não é possível excluir cliente com pedidos registrados.',
        });
      }

      await prisma.customer.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Cliente excluído com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Cliente não encontrado.',
        });
      }
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao excluir cliente.',
      });
    }
  },
};
