import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller de Chaves PIX (PixKey)
 * Gerencia múltiplas chaves PIX por tenant
 */

export const pixKeyController = {
  /**
   * Listar chaves PIX do tenant
   * GET /api/v1/pix-keys
   */
  listPixKeys: async (req, res) => {
    try {
      const { page = 1, limit = 20, isActive, isDefault, keyType } = req.query;

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
        where.active = isActive === 'true';
      }

      if (isDefault !== undefined) {
        where.isDefault = isDefault === 'true';
      }

      if (keyType) {
        where.keyType = keyType;
      }

      const [pixKeys, total] = await Promise.all([
        prisma.pixKey.findMany({
          where,
          skip,
          take,
          orderBy: { isDefault: 'desc' },
        }),
        prisma.pixKey.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          pixKeys,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error('Erro ao listar chaves PIX:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao listar chaves PIX.',
      });
    }
  },

  /**
   * Obter chave PIX específica
   * GET /api/v1/pix-keys/:id
   */
  getPixKey: async (req, res) => {
    try {
      const { id } = req.params;

      const pixKey = await prisma.pixKey.findUnique({
        where: { id },
      });

      if (!pixKey) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Chave PIX não encontrada.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && pixKey.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado a esta chave PIX.',
        });
      }

      res.status(200).json({
        success: true,
        data: pixKey,
      });
    } catch (error) {
      console.error('Erro ao obter chave PIX:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao obter chave PIX.',
      });
    }
  },

  /**
   * Criar nova chave PIX
   * POST /api/v1/pix-keys
   */
  createPixKey: async (req, res) => {
    try {
      const {
        keyType,
        keyValue,
        bankName,
        bankCode,
        accountHolder,
        accountNumber,
        agency,
        isDefault,
        qrCodeStatic,
      } = req.body;

      // Validações
      if (!keyType || !keyValue || !bankName || !accountHolder || !accountNumber || !agency) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Todos os campos obrigatórios devem ser preenchidos.',
        });
      }

      // Validar tipo de chave
      const validKeyTypes = ['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM'];
      if (!validKeyTypes.includes(keyType)) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Tipo de chave inválido.',
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

      // Verificar se chave já existe
      const existing = await prisma.pixKey.findUnique({
        where: {
          tenantId_keyValue: {
            tenantId,
            keyValue,
          },
        },
      });

      if (existing) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Chave PIX já cadastrada para este tenant.',
        });
      }

      // Se for padrão, desmarcar outras
      let actualIsDefault = isDefault || false;
      if (actualIsDefault) {
        await prisma.pixKey.updateMany({
          where: { tenantId, isDefault: true },
          data: { isDefault: false },
        });
      } else {
        // Verificar se já existe uma chave padrão
        const defaultKey = await prisma.pixKey.findFirst({
          where: { tenantId, isDefault: true },
        });

        if (!defaultKey) {
          actualIsDefault = true;
        }
      }

      const pixKey = await prisma.pixKey.create({
        data: {
          tenantId,
          keyType,
          keyValue,
          bankName,
          bankCode: bankCode || null,
          accountHolder,
          accountNumber,
          agency,
          isDefault: actualIsDefault,
          active: true,
          qrCodeStatic: qrCodeStatic || null,
        },
      });

      res.status(201).json({
        success: true,
        data: pixKey,
        message: 'Chave PIX criada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao criar chave PIX:', error);
      if (error.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Chave PIX já cadastrada.',
        });
      }
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao criar chave PIX.',
      });
    }
  },

  /**
   * Atualizar chave PIX
   * PUT /api/v1/pix-keys/:id
   */
  updatePixKey: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        keyType,
        keyValue,
        bankName,
        bankCode,
        accountHolder,
        accountNumber,
        agency,
        isDefault,
        active,
        qrCodeStatic,
      } = req.body;

      const currentPixKey = await prisma.pixKey.findUnique({
        where: { id },
      });

      if (!currentPixKey) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Chave PIX não encontrada.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && currentPixKey.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado a esta chave PIX.',
        });
      }

      // Verificar chave única se alterada
      if (keyValue && keyValue !== currentPixKey.keyValue) {
        const existing = await prisma.pixKey.findUnique({
          where: {
            tenantId_keyValue: {
              tenantId: currentPixKey.tenantId,
              keyValue,
            },
          },
        });

        if (existing) {
          return res.status(409).json({
            error: 'Conflict',
            message: 'Chave PIX já cadastrada.',
          });
        }
      }

      const updateData = {};
      if (keyType) updateData.keyType = keyType;
      if (keyValue !== undefined) updateData.keyValue = keyValue;
      if (bankName !== undefined) updateData.bankName = bankName;
      if (bankCode !== undefined) updateData.bankCode = bankCode;
      if (accountHolder !== undefined) updateData.accountHolder = accountHolder;
      if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
      if (agency !== undefined) updateData.agency = agency;
      if (active !== undefined) updateData.active = active;
      if (qrCodeStatic !== undefined) updateData.qrCodeStatic = qrCodeStatic;

      // Se for padrão, desmarcar outras
      if (isDefault !== undefined && isDefault !== currentPixKey.isDefault) {
        if (isDefault) {
          await prisma.pixKey.updateMany({
            where: { tenantId: currentPixKey.tenantId, isDefault: true },
            data: { isDefault: false },
          });
          updateData.isDefault = true;
        } else {
          // Não permitir desmarcar se for a única
          const count = await prisma.pixKey.count({
            where: { tenantId: currentPixKey.tenantId },
          });

          if (count > 1) {
            updateData.isDefault = false;
          }
        }
      }

      const pixKey = await prisma.pixKey.update({
        where: { id },
        data: updateData,
      });

      res.status(200).json({
        success: true,
        data: pixKey,
        message: 'Chave PIX atualizada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao atualizar chave PIX:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Chave PIX não encontrada.',
        });
      }
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao atualizar chave PIX.',
      });
    }
  },

  /**
   * Definir chave PIX como padrão
   * PUT /api/v1/pix-keys/:id/set-default
   */
  setDefaultPixKey: async (req, res) => {
    try {
      const { id } = req.params;

      const pixKey = await prisma.pixKey.findUnique({
        where: { id },
      });

      if (!pixKey) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Chave PIX não encontrada.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && pixKey.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado.',
        });
      }

      // Desmarcar todas as chaves padrão do tenant
      await prisma.pixKey.updateMany({
        where: { tenantId: pixKey.tenantId, isDefault: true },
        data: { isDefault: false },
      });

      // Marcar esta como padrão
      const updatedPixKey = await prisma.pixKey.update({
        where: { id },
        data: { isDefault: true },
      });

      res.status(200).json({
        success: true,
        data: updatedPixKey,
        message: 'Chave PIX definida como padrão.',
      });
    } catch (error) {
      console.error('Erro ao definir chave padrão:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao definir chave padrão.',
      });
    }
  },

  /**
   * Ativar/Desativar chave PIX
   * PUT /api/v1/pix-keys/:id/toggle
   */
  togglePixKey: async (req, res) => {
    try {
      const { id } = req.params;

      const pixKey = await prisma.pixKey.findUnique({
        where: { id },
      });

      if (!pixKey) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Chave PIX não encontrada.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && pixKey.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado.',
        });
      }

      const updatedPixKey = await prisma.pixKey.update({
        where: { id },
        data: { active: !pixKey.active },
      });

      res.status(200).json({
        success: true,
        data: updatedPixKey,
        message: `Chave PIX ${updatedPixKey.active ? 'ativada' : 'desativada'} com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao alternar chave PIX:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao alternar chave PIX.',
      });
    }
  },

  /**
   * Obter chave PIX padrão do tenant
   * GET /api/v1/pix-keys/default
   */
  getDefaultPixKey: async (req, res) => {
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

      const pixKey = await prisma.pixKey.findFirst({
        where: {
          tenantId,
          isDefault: true,
          active: true,
        },
      });

      if (!pixKey) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Nenhuma chave PIX padrão encontrada.',
        });
      }

      res.status(200).json({
        success: true,
        data: pixKey,
      });
    } catch (error) {
      console.error('Erro ao obter chave padrão:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao obter chave padrão.',
      });
    }
  },

  /**
   * Deletar chave PIX
   * DELETE /api/v1/pix-keys/:id
   */
  deletePixKey: async (req, res) => {
    try {
      const { id } = req.params;

      const pixKey = await prisma.pixKey.findUnique({
        where: { id },
      });

      if (!pixKey) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Chave PIX não encontrada.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && pixKey.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado.',
        });
      }

      // Não permitir deletar se for a única chave
      const count = await prisma.pixKey.count({
        where: { tenantId: pixKey.tenantId },
      });

      if (count <= 1) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Não é possível excluir a única chave PIX do tenant.',
        });
      }

      // Se for padrão, definir outra como padrão antes de excluir
      if (pixKey.isDefault) {
        const anotherKey = await prisma.pixKey.findFirst({
          where: {
            tenantId: pixKey.tenantId,
            id: { not: id },
          },
        });

        if (anotherKey) {
          await prisma.pixKey.update({
            where: { id: anotherKey.id },
            data: { isDefault: true },
          });
        }
      }

      await prisma.pixKey.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Chave PIX excluída com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir chave PIX:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Chave PIX não encontrada.',
        });
      }
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao excluir chave PIX.',
      });
    }
  },
};
