import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library.js';

const prisma = new PrismaClient();

/**
 * Controller de Carrinho de Compras (Cart)
 * Gerencia carrinhos, itens e checkout
 */

export const cartController = {
  /**
   * Listar carrinhos do tenant
   * GET /api/v1/carts
   */
  listCarts: async (req, res) => {
    try {
      const { page = 1, limit = 20, status, customerId, search } = req.query;

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

      if (status) {
        where.status = status;
      }

      if (customerId) {
        where.customerId = customerId;
      }

      if (search) {
        where.sessionId = { contains: search, mode: 'insensitive' };
      }

      const [carts, total] = await Promise.all([
        prisma.cart.findMany({
          where,
          skip,
          take,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                    images: true,
                  },
                },
              },
            },
            appliedDiscount: {
              select: {
                id: true,
                code: true,
                type: true,
                value: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.cart.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          carts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error('Erro ao listar carrinhos:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao listar carrinhos.',
      });
    }
  },

  /**
   * Obter carrinho específico
   * GET /api/v1/carts/:id
   */
  getCart: async (req, res) => {
    try {
      const { id } = req.params;

      const cart = await prisma.cart.findUnique({
        where: { id },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
          appliedDiscount: true,
        },
      });

      if (!cart) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Carrinho não encontrado.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && cart.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado a este carrinho.',
        });
      }

      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      console.error('Erro ao obter carrinho:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao obter carrinho.',
      });
    }
  },

  /**
   * Obter carrinho por sessão (para clientes não logados)
   * GET /api/v1/carts/session/:sessionId
   */
  getCartBySession: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { tenantId } = req.query;

      if (!sessionId || !tenantId) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Session ID e Tenant ID são obrigatórios.',
        });
      }

      const cart = await prisma.cart.findFirst({
        where: {
          sessionId,
          tenantId,
          status: 'ACTIVE',
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cart) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Carrinho não encontrado.',
        });
      }

      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      console.error('Erro ao obter carrinho por sessão:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao obter carrinho.',
      });
    }
  },

  /**
   * Criar novo carrinho
   * POST /api/v1/carts
   */
  createCart: async (req, res) => {
    try {
      const { customerId, sessionId, expiresAt, metadata } = req.body;

      // Validações
      if (!customerId && !sessionId) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Customer ID ou Session ID é obrigatório.',
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

        // Verificar se cliente pertence ao tenant
        if (customerExists.tenantId !== tenantId) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Cliente não pertence a este tenant.',
          });
        }
      }

      const cart = await prisma.cart.create({
        data: {
          tenantId,
          customerId: customerId || null,
          sessionId: sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'ACTIVE',
          subtotal: 0,
          discountAmount: 0,
          total: 0,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          metadata: metadata || null,
        },
      });

      res.status(201).json({
        success: true,
        data: cart,
        message: 'Carrinho criado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao criar carrinho:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao criar carrinho.',
      });
    }
  },

  /**
   * Adicionar item ao carrinho
   * POST /api/v1/carts/:id/items
   */
  addCartItem: async (req, res) => {
    try {
      const { id } = req.params;
      const { productId, quantity, metadata } = req.body;

      if (!productId || !quantity || quantity < 1) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Produto ID e quantidade válida são obrigatórios.',
        });
      }

      // Buscar carrinho
      const cart = await prisma.cart.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!cart) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Carrinho não encontrado.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && cart.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado a este carrinho.',
        });
      }

      // Verificar se carrinho está ativo
      if (cart.status !== 'ACTIVE') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Carrinho não está mais ativo.',
        });
      }

      // Buscar produto
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Produto não encontrado.',
        });
      }

      // Verificar estoque
      if (product.stock < quantity) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Estoque insuficiente.',
        });
      }

      // Verificar se produto já está no carrinho
      const existingItem = cart.items.find(item => item.productId === productId);

      let cartItem;
      if (existingItem) {
        // Atualizar quantidade
        const newQuantity = existingItem.quantity + quantity;
        cartItem = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: newQuantity,
            totalPrice: product.price.mul(newQuantity),
          },
        });
      } else {
        // Criar novo item
        cartItem = await prisma.cartItem.create({
          data: {
            cartId: id,
            productId,
            quantity,
            unitPrice: product.price,
            totalPrice: product.price.mul(quantity),
            metadata: metadata || null,
          },
        });
      }

      // Recalcular totais do carrinho
      await cartController.recalculateCartTotals(id);

      res.status(200).json({
        success: true,
        data: cartItem,
        message: 'Item adicionado ao carrinho.',
      });
    } catch (error) {
      console.error('Erro ao adicionar item ao carrinho:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao adicionar item.',
      });
    }
  },

  /**
   * Atualizar item do carrinho
   * PUT /api/v1/carts/:cartId/items/:itemId
   */
  updateCartItem: async (req, res) => {
    try {
      const { cartId, itemId } = req.params;
      const { quantity, metadata } = req.body;

      if (quantity !== undefined && (quantity < 1 || isNaN(quantity))) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Quantidade deve ser maior que zero.',
        });
      }

      // Buscar item
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { product: true },
      });

      if (!cartItem) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Item não encontrado.',
        });
      }

      // Verificar permissão
      const cart = await prisma.cart.findUnique({ where: { id: cartId } });
      if (req.user.role !== 'SUPER_ADMIN' && cart.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado.',
        });
      }

      const updateData = {};
      if (quantity !== undefined) updateData.quantity = parseInt(quantity);
      if (metadata !== undefined) updateData.metadata = metadata;

      if (quantity !== undefined) {
        updateData.totalPrice = cartItem.unitPrice.mul(quantity);
      }

      const updatedItem = await prisma.cartItem.update({
        where: { id: itemId },
        data: updateData,
      });

      // Recalcular totais
      await cartController.recalculateCartTotals(cartId);

      res.status(200).json({
        success: true,
        data: updatedItem,
        message: 'Item atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao atualizar item do carrinho:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao atualizar item.',
      });
    }
  },

  /**
   * Remover item do carrinho
   * DELETE /api/v1/carts/:cartId/items/:itemId
   */
  removeCartItem: async (req, res) => {
    try {
      const { cartId, itemId } = req.params;

      // Buscar item
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
      });

      if (!cartItem) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Item não encontrado.',
        });
      }

      // Verificar permissão
      const cart = await prisma.cart.findUnique({ where: { id: cartId } });
      if (req.user.role !== 'SUPER_ADMIN' && cart.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado.',
        });
      }

      await prisma.cartItem.delete({
        where: { id: itemId },
      });

      // Recalcular totais
      await cartController.recalculateCartTotals(cartId);

      res.status(200).json({
        success: true,
        message: 'Item removido do carrinho.',
      });
    } catch (error) {
      console.error('Erro ao remover item do carrinho:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao remover item.',
      });
    }
  },

  /**
   * Aplicar desconto/cupom no carrinho
   * POST /api/v1/carts/:id/discount
   */
  applyDiscount: async (req, res) => {
    try {
      const { id } = req.params;
      const { discountCode } = req.body;

      if (!discountCode) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Código do cupom é obrigatório.',
        });
      }

      // Buscar carrinho
      const cart = await prisma.cart.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!cart) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Carrinho não encontrado.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && cart.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado.',
        });
      }

      // Buscar desconto
      const discount = await prisma.discount.findFirst({
        where: {
          code: discountCode,
          tenantId: cart.tenantId,
          isActive: true,
        },
      });

      if (!discount) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Cupom não encontrado ou inválido.',
        });
      }

      // Validar período
      const now = new Date();
      if (now < discount.startDate || now > discount.endDate) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Cupom fora do período de validade.',
        });
      }

      // Validar limite de usos
      if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Cupom esgotado.',
        });
      }

      // Validar valor mínimo de compra
      if (discount.minPurchaseAmount && cart.subtotal < discount.minPurchaseAmount) {
        return res.status(400).json({
          error: 'BadRequest',
          message: `Valor mínimo para usar este cupom: R$ ${discount.minPurchaseAmount}`,
        });
      }

      // Calcular desconto
      let discountAmount = 0;
      if (discount.type === 'PERCENTAGE') {
        discountAmount = cart.subtotal.mul(discount.value.div(100));
        if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
          discountAmount = discount.maxDiscountAmount;
        }
      } else {
        discountAmount = discount.value;
      }

      // Atualizar carrinho
      const updatedCart = await prisma.cart.update({
        where: { id },
        data: {
          appliedDiscountId: discount.id,
          discountAmount,
          total: cart.subtotal.sub(discountAmount),
        },
        include: { appliedDiscount: true },
      });

      // Incrementar uso do cupom
      await prisma.discount.update({
        where: { id: discount.id },
        data: { usageCount: { increment: 1 } },
      });

      res.status(200).json({
        success: true,
        data: updatedCart,
        message: 'Cupom aplicado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao aplicar desconto:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao aplicar desconto.',
      });
    }
  },

  /**
   * Converter carrinho em pedido
   * POST /api/v1/carts/:id/checkout
   */
  checkout: async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentMethod, pixKeyId, shippingAddressId, billingAddressId, customerNotes } = req.body;

      // Buscar carrinho
      const cart = await prisma.cart.findUnique({
        where: { id },
        include: {
          items: {
            include: { product: true },
          },
          customer: true,
        },
      });

      if (!cart) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Carrinho não encontrado.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && cart.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado.',
        });
      }

      // Verificar se carrinho está ativo
      if (cart.status !== 'ACTIVE') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Carrinho não está mais ativo.',
        });
      }

      // Verificar se há itens
      if (cart.items.length === 0) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Carrinho vazio.',
        });
      }

      // Validar método de pagamento
      const validPaymentMethods = ['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BOLETO', 'CASH', 'OTHER'];
      if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Método de pagamento inválido.',
        });
      }

      // Se PIX, validar chave
      let pixKeyUsed = null;
      let pixTxId = null;
      if (paymentMethod === 'PIX') {
        if (!pixKeyId) {
          return res.status(400).json({
            error: 'BadRequest',
            message: 'Chave PIX é obrigatória para pagamento via PIX.',
          });
        }

        const pixKey = await prisma.pixKey.findUnique({
          where: { id: pixKeyId },
        });

        if (!pixKey || !pixKey.active || pixKey.tenantId !== cart.tenantId) {
          return res.status(400).json({
            error: 'BadRequest',
            message: 'Chave PIX inválida.',
          });
        }

        pixKeyUsed = pixKey.keyValue;
        pixTxId = `TX_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      }

      // Criar pedido
      const order = await prisma.order.create({
        data: {
          tenantId: cart.tenantId,
          customerId: cart.customerId,
          status: 'PENDING',
          paymentStatus: paymentMethod === 'PIX' ? 'PENDING' : 'PENDING',
          paymentMethod,
          pixKeyUsed,
          pixTxId,
          subtotal: cart.subtotal,
          discountAmount: cart.discountAmount,
          shippingCost: 0, // Pode ser calculado baseado no endereço
          total: cart.total,
          shippingAddressId: shippingAddressId || null,
          billingAddressId: billingAddressId || null,
          notes: customerNotes || null,
          items: {
            create: cart.items.map(item => ({
              productId: item.productId,
              productName: item.product.name,
              productSku: item.product.sku,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          },
        },
      });

      // Atualizar carrinho como convertido
      await prisma.cart.update({
        where: { id },
        data: {
          status: 'CONVERTED',
          convertedToOrderId: order.id,
        },
      });

      // Atualizar estoque dos produtos
      for (const item of cart.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      // Atualizar dados do cliente
      if (cart.customerId) {
        await prisma.customer.update({
          where: { id: cart.customerId },
          data: {
            totalSpent: { increment: order.total },
            totalOrders: { increment: 1 },
            lastPurchaseAt: new Date(),
          },
        });
      }

      res.status(201).json({
        success: true,
        data: order,
        message: 'Pedido criado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao finalizar pedido.',
      });
    }
  },

  /**
   * Cancelar/Abandonar carrinho
   * PUT /api/v1/carts/:id/cancel
   */
  cancelCart: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const cart = await prisma.cart.findUnique({
        where: { id },
      });

      if (!cart) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Carrinho não encontrado.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && cart.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado.',
        });
      }

      const updatedCart = await prisma.cart.update({
        where: { id },
        data: {
          status: 'ABANDONED',
          metadata: {
            ...cart.metadata,
            cancelledReason: reason,
            cancelledAt: new Date().toISOString(),
          },
        },
      });

      res.status(200).json({
        success: true,
        data: updatedCart,
        message: 'Carrinho cancelado.',
      });
    } catch (error) {
      console.error('Erro ao cancelar carrinho:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao cancelar carrinho.',
      });
    }
  },

  /**
   * Helper: Recalcular totais do carrinho
   */
  recalculateCartTotals: async (cartId) => {
    const items = await prisma.cartItem.findMany({
      where: { cartId },
    });

    const subtotal = items.reduce((sum, item) => sum.add(item.totalPrice), new Decimal(0));
    
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { appliedDiscount: true },
    });

    let discountAmount = new Decimal(0);
    if (cart.appliedDiscount) {
      const discount = cart.appliedDiscount;
      if (discount.type === 'PERCENTAGE') {
        discountAmount = subtotal.mul(discount.value.div(100));
        if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
          discountAmount = discount.maxDiscountAmount;
        }
      } else {
        discountAmount = discount.value;
      }
    }

    const total = subtotal.sub(discountAmount);

    await prisma.cart.update({
      where: { id: cartId },
      data: {
        subtotal,
        discountAmount,
        total,
      },
    });
  },
};
