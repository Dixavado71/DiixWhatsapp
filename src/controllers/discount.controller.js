import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller de Descontos e Cupons (Discount)
 * Gerencia códigos promocionais, cupons e regras de desconto
 */

export const discountController = {
  /**
   * Listar descontos do tenant
   * GET /api/v1/discounts
   */
  listDiscounts: async (req, res) => {
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
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [discounts, total] = await Promise.all([
        prisma.discount.findMany({
          where,
          skip,
          take,
          include: {
            campaigns: {
              select: {
                id: true,
                name: true,
                isActive: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.discount.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          discounts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error('Erro ao listar descontos:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao listar descontos.',
      });
    }
  },

  /**
   * Obter desconto específico
   * GET /api/v1/discounts/:id
   */
  getDiscount: async (req, res) => {
    try {
      const { id } = req.params;

      const discount = await prisma.discount.findUnique({
        where: { id },
        include: {
          campaigns: true,
        },
      });

      if (!discount) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Desconto não encontrado.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && discount.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado a este desconto.',
        });
      }

      res.status(200).json({
        success: true,
        data: discount,
      });
    } catch (error) {
      console.error('Erro ao obter desconto:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao obter desconto.',
      });
    }
  },

  /**
   * Criar novo desconto/cupom
   * POST /api/v1/discounts
   */
  createDiscount: async (req, res) => {
    try {
      const {
        code,
        description,
        type,
        value,
        minPurchaseAmount,
        maxDiscountAmount,
        usageLimit,
        perCustomerLimit,
        startDate,
        endDate,
        isActive,
        applicableTo,
        targetProducts,
        targetCategories,
        targetCustomerGroups,
        autoApply,
        stackable,
      } = req.body;

      // Validações
      if (!code || !type || !value || !startDate || !endDate) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Código, tipo, valor e período são obrigatórios.',
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

      // Verificar se código já existe
      const existing = await prisma.discount.findUnique({
        where: {
          tenantId_code: {
            tenantId,
            code,
          },
        },
      });

      if (existing) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Código de cupom já existe para este tenant.',
        });
      }

      // Validar período
      if (new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Data de início deve ser anterior à data de término.',
        });
      }

      const discount = await prisma.discount.create({
        data: {
          tenantId,
          code: code.toUpperCase(),
          description: description || null,
          type,
          value: parseFloat(value),
          minPurchaseAmount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : null,
          maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
          usageLimit: usageLimit ? parseInt(usageLimit) : null,
          perCustomerLimit: perCustomerLimit ? parseInt(perCustomerLimit) : 1,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isActive: isActive !== undefined ? isActive : true,
          applicableTo: applicableTo || 'all',
          targetProducts: targetProducts || [],
          targetCategories: targetCategories || [],
          targetCustomerGroups: targetCustomerGroups || [],
          autoApply: autoApply || false,
          stackable: stackable || false,
        },
      });

      res.status(201).json({
        success: true,
        data: discount,
        message: 'Desconto criado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao criar desconto:', error);
      if (error.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Código de cupom já existe.',
        });
      }
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao criar desconto.',
      });
    }
  },

  /**
   * Atualizar desconto
   * PUT /api/v1/discounts/:id
   */
  updateDiscount: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        code,
        description,
        type,
        value,
        minPurchaseAmount,
        maxDiscountAmount,
        usageLimit,
        perCustomerLimit,
        startDate,
        endDate,
        isActive,
        applicableTo,
        targetProducts,
        targetCategories,
        targetCustomerGroups,
        autoApply,
        stackable,
      } = req.body;

      const currentDiscount = await prisma.discount.findUnique({
        where: { id },
      });

      if (!currentDiscount) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Desconto não encontrado.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && currentDiscount.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado a este desconto.',
        });
      }

      // Verificar código único se alterado
      if (code && code !== currentDiscount.code) {
        const existing = await prisma.discount.findUnique({
          where: {
            tenantId_code: {
              tenantId: currentDiscount.tenantId,
              code: code.toUpperCase(),
            },
          },
        });

        if (existing) {
          return res.status(409).json({
            error: 'Conflict',
            message: 'Código de cupom já existe.',
          });
        }
      }

      const updateData = {};
      if (code) updateData.code = code.toUpperCase();
      if (description !== undefined) updateData.description = description;
      if (type) updateData.type = type;
      if (value !== undefined) updateData.value = parseFloat(value);
      if (minPurchaseAmount !== undefined) updateData.minPurchaseAmount = minPurchaseAmount ? parseFloat(minPurchaseAmount) : null;
      if (maxDiscountAmount !== undefined) updateData.maxDiscountAmount = maxDiscountAmount ? parseFloat(maxDiscountAmount) : null;
      if (usageLimit !== undefined) updateData.usageLimit = usageLimit ? parseInt(usageLimit) : null;
      if (perCustomerLimit !== undefined) updateData.perCustomerLimit = perCustomerLimit ? parseInt(perCustomerLimit) : 1;
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate) updateData.endDate = new Date(endDate);
      if (isActive !== undefined) updateData.isActive = isActive;
      if (applicableTo !== undefined) updateData.applicableTo = applicableTo;
      if (targetProducts !== undefined) updateData.targetProducts = targetProducts;
      if (targetCategories !== undefined) updateData.targetCategories = targetCategories;
      if (targetCustomerGroups !== undefined) updateData.targetCustomerGroups = targetCustomerGroups;
      if (autoApply !== undefined) updateData.autoApply = autoApply;
      if (stackable !== undefined) updateData.stackable = stackable;

      const discount = await prisma.discount.update({
        where: { id },
        data: updateData,
      });

      res.status(200).json({
        success: true,
        data: discount,
        message: 'Desconto atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao atualizar desconto:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Desconto não encontrado.',
        });
      }
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao atualizar desconto.',
      });
    }
  },

  /**
   * Validar cupom
   * POST /api/v1/discounts/validate
   */
  validateDiscount: async (req, res) => {
    try {
      const { code, customerId, cartTotal } = req.body;

      if (!code) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Código do cupom é obrigatório.',
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

      const discount = await prisma.discount.findFirst({
        where: {
          code: code.toUpperCase(),
          tenantId,
        },
      });

      if (!discount) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Cupom não encontrado.',
        });
      }

      // Validar status
      if (!discount.isActive) {
        return res.status(400).json({
          valid: false,
          reason: 'Cupom desativado.',
        });
      }

      // Validar período
      const now = new Date();
      if (now < discount.startDate || now > discount.endDate) {
        return res.status(400).json({
          valid: false,
          reason: 'Cupom fora do período de validade.',
        });
      }

      // Validar limite de usos
      if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
        return res.status(400).json({
          valid: false,
          reason: 'Cupom esgotado.',
        });
      }

      // Validar valor mínimo
      if (discount.minPurchaseAmount && cartTotal && cartTotal < discount.minPurchaseAmount) {
        return res.status(400).json({
          valid: false,
          reason: `Valor mínimo para usar este cupom: R$ ${discount.minPurchaseAmount}`,
        });
      }

      // Calcular desconto
      let discountAmount = 0;
      if (discount.type === 'PERCENTAGE') {
        discountAmount = parseFloat(cartTotal) * (parseFloat(discount.value) / 100);
        if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
          discountAmount = parseFloat(discount.maxDiscountAmount);
        }
      } else {
        discountAmount = parseFloat(discount.value);
      }

      res.status(200).json({
        success: true,
        data: {
          valid: true,
          discount: {
            id: discount.id,
            code: discount.code,
            type: discount.type,
            value: discount.value,
            description: discount.description,
          },
          discountAmount,
        },
      });
    } catch (error) {
      console.error('Erro ao validar desconto:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao validar desconto.',
      });
    }
  },

  /**
   * Deletar desconto
   * DELETE /api/v1/discounts/:id
   */
  deleteDiscount: async (req, res) => {
    try {
      const { id } = req.params;

      const discount = await prisma.discount.findUnique({
        where: { id },
      });

      if (!discount) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Desconto não encontrado.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && discount.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado.',
        });
      }

      await prisma.discount.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Desconto excluído com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir desconto:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Desconto não encontrado.',
        });
      }
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao excluir desconto.',
      });
    }
  },
};
