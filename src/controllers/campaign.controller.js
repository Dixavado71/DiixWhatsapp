import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller de Campanhas Promocionais (Campaign)
 * Gerencia campanhas de marketing e promoções segmentadas
 */

export const campaignController = {
  /**
   * Listar campanhas do tenant
   * GET /api/v1/campaigns
   */
  listCampaigns: async (req, res) => {
    try {
      const { page = 1, limit = 20, isActive, type, search } = req.query;

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

      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      if (type) {
        where.type = type;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [campaigns, total] = await Promise.all([
        prisma.campaign.findMany({
          where,
          skip,
          take,
          include: {
            discount: {
              select: {
                id: true,
                code: true,
                type: true,
                value: true,
              },
            },
          },
          orderBy: { startDate: 'desc' },
        }),
        prisma.campaign.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          campaigns,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error('Erro ao listar campanhas:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao listar campanhas.',
      });
    }
  },

  /**
   * Obter campanha específica
   * GET /api/v1/campaigns/:id
   */
  getCampaign: async (req, res) => {
    try {
      const { id } = req.params;

      const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: {
          discount: true,
        },
      });

      if (!campaign) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Campanha não encontrada.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && campaign.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado a esta campanha.',
        });
      }

      res.status(200).json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      console.error('Erro ao obter campanha:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao obter campanha.',
      });
    }
  },

  /**
   * Criar nova campanha
   * POST /api/v1/campaigns
   */
  createCampaign: async (req, res) => {
    try {
      const {
        name,
        description,
        type,
        discountId,
        startDate,
        endDate,
        isActive,
        usageLimit,
        perCustomerLimit,
        minPurchaseAmount,
        targetCategories,
        targetProducts,
        targetCustomerGroups,
        targetCustomers,
      } = req.body;

      // Validações
      if (!name || !type || !discountId || !startDate || !endDate) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Nome, tipo, desconto e período são obrigatórios.',
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

      // Verificar se desconto existe e pertence ao tenant
      const discount = await prisma.discount.findUnique({
        where: { id: discountId },
      });

      if (!discount || discount.tenantId !== tenantId) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Desconto não encontrado ou não pertence a este tenant.',
        });
      }

      // Validar período
      if (new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Data de início deve ser anterior à data de término.',
        });
      }

      const campaign = await prisma.campaign.create({
        data: {
          tenantId,
          name,
          description: description || null,
          type,
          discountId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isActive: isActive !== undefined ? isActive : true,
          usageLimit: usageLimit ? parseInt(usageLimit) : null,
          perCustomerLimit: perCustomerLimit ? parseInt(perCustomerLimit) : null,
          minPurchaseAmount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : null,
          targetCategories: targetCategories || [],
          targetProducts: targetProducts || [],
          targetCustomerGroups: targetCustomerGroups || [],
          targetCustomers: targetCustomers || [],
        },
        include: {
          discount: true,
        },
      });

      res.status(201).json({
        success: true,
        data: campaign,
        message: 'Campanha criada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao criar campanha.',
      });
    }
  },

  /**
   * Atualizar campanha
   * PUT /api/v1/campaigns/:id
   */
  updateCampaign: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        type,
        discountId,
        startDate,
        endDate,
        isActive,
        usageLimit,
        perCustomerLimit,
        minPurchaseAmount,
        targetCategories,
        targetProducts,
        targetCustomerGroups,
        targetCustomers,
      } = req.body;

      const currentCampaign = await prisma.campaign.findUnique({
        where: { id },
      });

      if (!currentCampaign) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Campanha não encontrada.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && currentCampaign.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado a esta campanha.',
        });
      }

      // Verificar desconto se alterado
      if (discountId && discountId !== currentCampaign.discountId) {
        const discount = await prisma.discount.findUnique({
          where: { id: discountId },
        });

        if (!discount || discount.tenantId !== currentCampaign.tenantId) {
          return res.status(404).json({
            error: 'NotFound',
            message: 'Desconto não encontrado ou não pertence a este tenant.',
          });
        }
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (type) updateData.type = type;
      if (discountId) updateData.discountId = discountId;
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate) updateData.endDate = new Date(endDate);
      if (isActive !== undefined) updateData.isActive = isActive;
      if (usageLimit !== undefined) updateData.usageLimit = usageLimit ? parseInt(usageLimit) : null;
      if (perCustomerLimit !== undefined) updateData.perCustomerLimit = perCustomerLimit ? parseInt(perCustomerLimit) : null;
      if (minPurchaseAmount !== undefined) updateData.minPurchaseAmount = minPurchaseAmount ? parseFloat(minPurchaseAmount) : null;
      if (targetCategories !== undefined) updateData.targetCategories = targetCategories;
      if (targetProducts !== undefined) updateData.targetProducts = targetProducts;
      if (targetCustomerGroups !== undefined) updateData.targetCustomerGroups = targetCustomerGroups;
      if (targetCustomers !== undefined) updateData.targetCustomers = targetCustomers;

      const campaign = await prisma.campaign.update({
        where: { id },
        data: updateData,
        include: {
          discount: true,
        },
      });

      res.status(200).json({
        success: true,
        data: campaign,
        message: 'Campanha atualizada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao atualizar campanha:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Campanha não encontrada.',
        });
      }
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao atualizar campanha.',
      });
    }
  },

  /**
   * Ativar/Desativar campanha
   * PUT /api/v1/campaigns/:id/toggle
   */
  toggleCampaign: async (req, res) => {
    try {
      const { id } = req.params;

      const campaign = await prisma.campaign.findUnique({
        where: { id },
      });

      if (!campaign) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Campanha não encontrada.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && campaign.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado.',
        });
      }

      const updatedCampaign = await prisma.campaign.update({
        where: { id },
        data: { isActive: !campaign.isActive },
      });

      res.status(200).json({
        success: true,
        data: updatedCampaign,
        message: `Campanha ${updatedCampaign.isActive ? 'ativada' : 'desativada'} com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao alternar campanha:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao alternar campanha.',
      });
    }
  },

  /**
   * Estatísticas da campanha
   * GET /api/v1/campaigns/:id/stats
   */
  getCampaignStats: async (req, res) => {
    try {
      const { id } = req.params;

      const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: {
          discount: {
            include: {
              orders: {
                select: {
                  id: true,
                  total: true,
                  createdAt: true,
                },
              },
              carts: {
                select: {
                  id: true,
                  total: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      });

      if (!campaign) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Campanha não encontrada.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && campaign.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado.',
        });
      }

      const stats = {
        usageCount: campaign.usageCount,
        usageLimit: campaign.usageLimit,
        remainingUses: campaign.usageLimit ? campaign.usageLimit - campaign.usageCount : null,
        discountUsage: campaign.discount.usageCount,
        totalRevenue: campaign.discount.orders.reduce((sum, order) => sum.add(order.total), 0),
        totalOrders: campaign.discount.orders.length,
        cartConversions: campaign.discount.carts.filter(c => c.convertedToOrderId).length,
        activeCarts: campaign.discount.carts.filter(c => c.status === 'ACTIVE').length,
      };

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas da campanha:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao obter estatísticas.',
      });
    }
  },

  /**
   * Deletar campanha
   * DELETE /api/v1/campaigns/:id
   */
  deleteCampaign: async (req, res) => {
    try {
      const { id } = req.params;

      const campaign = await prisma.campaign.findUnique({
        where: { id },
      });

      if (!campaign) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Campanha não encontrada.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && campaign.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado.',
        });
      }

      await prisma.campaign.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Campanha excluída com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir campanha:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Campanha não encontrada.',
        });
      }
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao excluir campanha.',
      });
    }
  },
};
