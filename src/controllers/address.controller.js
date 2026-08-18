import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller de Endereços (Address)
 * Gerencia endereços de entrega e cobrança
 */

export const addressController = {
  /**
   * Listar endereços do tenant
   * GET /api/v1/addresses
   */
  listAddresses: async (req, res) => {
    try {
      const { page = 1, limit = 20, customerId, type, isDefault, city, state } = req.query;

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

      if (customerId) {
        where.customerId = customerId;
      }

      if (type) {
        where.type = type;
      }

      if (isDefault !== undefined) {
        where.isDefault = isDefault === 'true';
      }

      if (city) {
        where.city = { contains: city, mode: 'insensitive' };
      }

      if (state) {
        where.state = state;
      }

      const [addresses, total] = await Promise.all([
        prisma.address.findMany({
          where,
          skip,
          take,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
          orderBy: { isDefault: 'desc' },
        }),
        prisma.address.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          addresses,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error('Erro ao listar endereços:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao listar endereços.',
      });
    }
  },

  /**
   * Obter endereço específico
   * GET /api/v1/addresses/:id
   */
  getAddress: async (req, res) => {
    try {
      const { id } = req.params;

      const address = await prisma.address.findUnique({
        where: { id },
        include: {
          customer: true,
        },
      });

      if (!address) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Endereço não encontrado.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && address.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado a este endereço.',
        });
      }

      res.status(200).json({
        success: true,
        data: address,
      });
    } catch (error) {
      console.error('Erro ao obter endereço:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao obter endereço.',
      });
    }
  },

  /**
   * Criar novo endereço
   * POST /api/v1/addresses
   */
  createAddress: async (req, res) => {
    try {
      const {
        customerId,
        type,
        label,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipCode,
        country,
        isDefault,
      } = req.body;

      // Validações
      if (!street || !number || !neighborhood || !city || !state || !zipCode) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Campos obrigatórios devem ser preenchidos.',
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

      // Verificar se cliente existe (se fornecido)
      if (customerId) {
        const customerExists = await prisma.customer.findUnique({
          where: { id: customerId },
        });

        if (!customerExists) {
          return res.status(404).json({
            error: 'NotFound',
            message: 'Cliente não encontrado.',
          });
        }

        if (customerExists.tenantId !== tenantId) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Cliente não pertence a este tenant.',
          });
        }
      }

      // Se for padrão, desmarcar outros
      let actualIsDefault = isDefault || false;
      if (actualIsDefault && customerId) {
        await prisma.address.updateMany({
          where: { customerId, isDefault: true },
          data: { isDefault: false },
        });
      } else if (customerId) {
        // Verificar se já existe um endereço padrão para este cliente
        const defaultAddress = await prisma.address.findFirst({
          where: { customerId, isDefault: true },
        });

        if (!defaultAddress) {
          actualIsDefault = true;
        }
      }

      const address = await prisma.address.create({
        data: {
          tenantId,
          customerId: customerId || null,
          type: type || 'RESIDENTIAL',
          label: label || null,
          street,
          number,
          complement: complement || null,
          neighborhood,
          city,
          state,
          zipCode,
          country: country || 'Brasil',
          isDefault: actualIsDefault,
        },
      });

      res.status(201).json({
        success: true,
        data: address,
        message: 'Endereço criado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao criar endereço:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao criar endereço.',
      });
    }
  },

  /**
   * Atualizar endereço
   * PUT /api/v1/addresses/:id
   */
  updateAddress: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        type,
        label,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipCode,
        country,
        isDefault,
      } = req.body;

      const currentAddress = await prisma.address.findUnique({
        where: { id },
      });

      if (!currentAddress) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Endereço não encontrado.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && currentAddress.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado a este endereço.',
        });
      }

      const updateData = {};
      if (type) updateData.type = type;
      if (label !== undefined) updateData.label = label;
      if (street !== undefined) updateData.street = street;
      if (number !== undefined) updateData.number = number;
      if (complement !== undefined) updateData.complement = complement;
      if (neighborhood !== undefined) updateData.neighborhood = neighborhood;
      if (city !== undefined) updateData.city = city;
      if (state !== undefined) updateData.state = state;
      if (zipCode !== undefined) updateData.zipCode = zipCode;
      if (country !== undefined) updateData.country = country;

      // Se for padrão, desmarcar outros
      if (isDefault !== undefined && isDefault !== currentAddress.isDefault) {
        if (isDefault && currentAddress.customerId) {
          await prisma.address.updateMany({
            where: { customerId: currentAddress.customerId, isDefault: true },
            data: { isDefault: false },
          });
          updateData.isDefault = true;
        } else if (!isDefault && currentAddress.customerId) {
          // Não permitir desmarcar se for o único
          const count = await prisma.address.count({
            where: { customerId: currentAddress.customerId },
          });

          if (count > 1) {
            updateData.isDefault = false;
          }
        }
      }

      const address = await prisma.address.update({
        where: { id },
        data: updateData,
      });

      res.status(200).json({
        success: true,
        data: address,
        message: 'Endereço atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao atualizar endereço:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Endereço não encontrado.',
        });
      }
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao atualizar endereço.',
      });
    }
  },

  /**
   * Definir endereço como padrão
   * PUT /api/v1/addresses/:id/set-default
   */
  setDefaultAddress: async (req, res) => {
    try {
      const { id } = req.params;

      const address = await prisma.address.findUnique({
        where: { id },
      });

      if (!address || !address.customerId) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Endereço não encontrado ou não pertence a um cliente.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && address.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado.',
        });
      }

      // Desmarcar todos os endereços padrão deste cliente
      await prisma.address.updateMany({
        where: { customerId: address.customerId, isDefault: true },
        data: { isDefault: false },
      });

      // Marcar este como padrão
      const updatedAddress = await prisma.address.update({
        where: { id },
        data: { isDefault: true },
      });

      res.status(200).json({
        success: true,
        data: updatedAddress,
        message: 'Endereço definido como padrão.',
      });
    } catch (error) {
      console.error('Erro ao definir endereço padrão:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao definir endereço padrão.',
      });
    }
  },

  /**
   * Obter endereços de um cliente
   * GET /api/v1/addresses/customer/:customerId
   */
  getCustomerAddresses: async (req, res) => {
    try {
      const { customerId } = req.params;

      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
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

      const addresses = await prisma.address.findMany({
        where: { customerId },
        orderBy: { isDefault: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: addresses,
      });
    } catch (error) {
      console.error('Erro ao obter endereços do cliente:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao obter endereços.',
      });
    }
  },

  /**
   * Deletar endereço
   * DELETE /api/v1/addresses/:id
   */
  deleteAddress: async (req, res) => {
    try {
      const { id } = req.params;

      const address = await prisma.address.findUnique({
        where: { id },
      });

      if (!address) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Endereço não encontrado.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && address.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado.',
        });
      }

      // Verificar se está sendo usado em pedidos
      const shippingOrders = await prisma.order.count({
        where: { shippingAddressId: id },
      });

      const billingOrders = await prisma.order.count({
        where: { billingAddressId: id },
      });

      if (shippingOrders > 0 || billingOrders > 0) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Não é possível excluir endereço utilizado em pedidos.',
        });
      }

      await prisma.address.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Endereço excluído com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir endereço:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Endereço não encontrado.',
        });
      }
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao excluir endereço.',
      });
    }
  },
};
