import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller de Pedidos (Order)
 * Gerencia histórico de vendas, status e pagamentos
 */

export const orderController = {
  /**
   * Listar pedidos do tenant
   * GET /api/v1/orders
   */
  listOrders: async (req, res) => {
    try {
      const { page = 1, limit = 20, status, paymentStatus, customerId, search, startDate, endDate } = req.query;

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

      if (paymentStatus) {
        where.paymentStatus = paymentStatus;
      }

      if (customerId) {
        where.customerId = customerId;
      }

      if (search) {
        where.OR = [
          { id: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
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
            shippingAddress: true,
            billingAddress: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.order.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error('Erro ao listar pedidos:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao listar pedidos.',
      });
    }
  },

  /**
   * Obter pedido específico
   * GET /api/v1/orders/:id
   */
  getOrder: async (req, res) => {
    try {
      const { id } = req.params;

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
          shippingAddress: true,
          billingAddress: true,
        },
      });

      if (!order) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Pedido não encontrado.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && order.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado a este pedido.',
        });
      }

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      console.error('Erro ao obter pedido:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao obter pedido.',
      });
    }
  },

  /**
   * Criar novo pedido manualmente
   * POST /api/v1/orders
   */
  createOrder: async (req, res) => {
    try {
      const { customerId, paymentMethod, pixKeyId, shippingAddressId, billingAddressId, notes, items } = req.body;

      // Validações
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Itens do pedido são obrigatórios.',
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

      // Validar método de pagamento
      const validPaymentMethods = ['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BOLETO', 'CASH', 'OTHER'];
      if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Método de pagamento inválido.',
        });
      }

      // Calcular totais
      let subtotal = 0;
      const orderItems = [];

      for (const itemData of items) {
        const product = await prisma.product.findUnique({
          where: { id: itemData.productId },
        });

        if (!product) {
          return res.status(404).json({
            error: 'NotFound',
            message: `Produto ${itemData.productId} não encontrado.`,
          });
        }

        if (product.tenantId !== tenantId) {
          return res.status(403).json({
            error: 'Forbidden',
            message: `Produto ${itemData.productId} não pertence a este tenant.`,
          });
        }

        const totalPrice = product.price.mul(itemData.quantity);
        subtotal = subtotal.add(totalPrice);

        orderItems.push({
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity: itemData.quantity,
          unitPrice: product.price,
          totalPrice,
        });
      }

      // Se PIX, validar chave
      let pixKeyUsed = null;
      let pixTxId = null;
      if (paymentMethod === 'PIX') {
        if (pixKeyId) {
          const pixKey = await prisma.pixKey.findUnique({
            where: { id: pixKeyId },
          });

          if (pixKey && pixKey.active && pixKey.tenantId === tenantId) {
            pixKeyUsed = pixKey.keyValue;
            pixTxId = `TX_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
          }
        }
      }

      // Criar pedido
      const order = await prisma.order.create({
        data: {
          tenantId,
          customerId: customerId || null,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          paymentMethod,
          pixKeyUsed,
          pixTxId,
          subtotal,
          discountAmount: 0,
          shippingCost: 0,
          total: subtotal,
          shippingAddressId: shippingAddressId || null,
          billingAddressId: billingAddressId || null,
          notes: notes || null,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
        },
      });

      // Atualizar estoque
      for (const item of orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      // Atualizar dados do cliente
      if (customerId) {
        await prisma.customer.update({
          where: { id: customerId },
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
      console.error('Erro ao criar pedido:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao criar pedido.',
      });
    }
  },

  /**
   * Atualizar status do pedido
   * PUT /api/v1/orders/:id/status
   */
  updateOrderStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, paymentStatus } = req.body;

      const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
      const validPaymentStatuses = ['PENDING', 'PAID', 'PARTIALLY_PAID', 'REFUNDED', 'FAILED', 'CHARGEBACK'];

      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Status inválido.',
        });
      }

      if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Status de pagamento inválido.',
        });
      }

      // Buscar pedido atual
      const currentOrder = await prisma.order.findUnique({
        where: { id },
      });

      if (!currentOrder) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Pedido não encontrado.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && currentOrder.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado a este pedido.',
        });
      }

      const updateData = {};
      if (status) updateData.status = status;
      if (paymentStatus) updateData.paymentStatus = paymentStatus;

      // Definir datas especiais
      if (status === 'DELIVERED') {
        updateData.deliveredAt = new Date();
      } else if (status === 'CANCELLED') {
        updateData.cancelledAt = new Date();
      }

      const order = await prisma.order.update({
        where: { id },
        data: updateData,
      });

      // Se cancelado, devolver estoque
      if (status === 'CANCELLED') {
        const orderItems = await prisma.orderItem.findMany({
          where: { orderId: id },
        });

        for (const item of orderItems) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
            },
          });
        }
      }

      res.status(200).json({
        success: true,
        data: order,
        message: 'Pedido atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Pedido não encontrado.',
        });
      }
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao atualizar pedido.',
      });
    }
  },

  /**
   * Adicionar observação ao pedido
   * POST /api/v1/orders/:id/notes
   */
  addOrderNote: async (req, res) => {
    try {
      const { id } = req.params;
      const { note, internal } = req.body;

      if (!note) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Observação é obrigatória.',
        });
      }

      const order = await prisma.order.findUnique({
        where: { id },
      });

      if (!order) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Pedido não encontrado.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && order.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado.',
        });
      }

      const notes = order.notes ? `${order.notes}\n\n` : '';
      const timestamp = new Date().toISOString();
      const author = req.user.name || req.user.email;
      const noteType = internal ? '[INTERNO]' : '[CLIENTE]';
      
      const updatedNotes = `${notes}${timestamp} - ${author} ${noteType}: ${note}`;

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { notes: updatedNotes },
      });

      res.status(200).json({
        success: true,
        data: updatedOrder,
        message: 'Observação adicionada.',
      });
    } catch (error) {
      console.error('Erro ao adicionar observação:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao adicionar observação.',
      });
    }
  },

  /**
   * Confirmar pagamento PIX via webhook
   * POST /api/v1/orders/:id/payment/pix
   */
  confirmPixPayment: async (req, res) => {
    try {
      const { id } = req.params;
      const { txId, amount, paidAt } = req.body;

      if (!txId || !amount) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Dados do pagamento são obrigatórios.',
        });
      }

      const order = await prisma.order.findUnique({
        where: { id },
      });

      if (!order) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Pedido não encontrado.',
        });
      }

      // Verificar permissão (webhook pode ter token especial)
      if (req.user.role !== 'SUPER_ADMIN' && order.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado.',
        });
      }

      // Verificar se já foi pago
      if (order.paymentStatus === 'PAID') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Pedido já está pago.',
        });
      }

      // Validar valor
      if (parseFloat(amount) < parseFloat(order.total)) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Valor pago inconsistente.',
        });
      }

      // Atualizar pedido
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          paidAt: paidAt ? new Date(paidAt) : new Date(),
          metadata: {
            ...order.metadata,
            pixTxId: txId,
            pixPaidAt: paidAt,
          },
        },
      });

      res.status(200).json({
        success: true,
        data: updatedOrder,
        message: 'Pagamento PIX confirmado.',
      });
    } catch (error) {
      console.error('Erro ao confirmar pagamento PIX:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao confirmar pagamento.',
      });
    }
  },

  /**
   * Estatísticas de pedidos
   * GET /api/v1/orders/stats
   */
  getOrderStats: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

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

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [totalOrders, totalRevenue, ordersByStatus, ordersByPaymentStatus] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.aggregate({
          where: { ...where, paymentStatus: 'PAID' },
          _sum: { total: true },
        }),
        prisma.order.groupBy({
          by: ['status'],
          where,
          _count: { id: true },
        }),
        prisma.order.groupBy({
          by: ['paymentStatus'],
          where,
          _count: { id: true },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalOrders,
          totalRevenue: totalRevenue._sum.total || 0,
          ordersByStatus: ordersByStatus.reduce((acc, item) => {
            acc[item.status] = item._count.id;
            return acc;
          }, {}),
          ordersByPaymentStatus: ordersByPaymentStatus.reduce((acc, item) => {
            acc[item.paymentStatus] = item._count.id;
            return acc;
          }, {}),
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

  /**
   * Exportar pedidos para CSV/Excel
   * GET /api/v1/orders/export
   */
  exportOrders: async (req, res) => {
    try {
      const { startDate, endDate, format = 'csv' } = req.query;

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

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const orders = await prisma.order.findMany({
        where,
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (format === 'csv') {
        const csvRows = [
          ['ID', 'Data', 'Cliente', 'Email', 'Telefone', 'Status', 'Pagamento', 'Total', 'Itens']
        ];

        orders.forEach(order => {
          csvRows.push([
            order.id,
            order.createdAt.toISOString(),
            order.customer?.name || 'N/A',
            order.customer?.email || 'N/A',
            order.customer?.phone || 'N/A',
            order.status,
            order.paymentStatus,
            order.total.toString(),
            order.items.map(i => `${i.productName} (${i.quantity})`).join('; ')
          ]);
        });

        const csvContent = csvRows.map(row => row.join(',')).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=pedidos_${tenantId}_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csvContent);
      } else {
        res.status(200).json({
          success: true,
          data: orders,
        });
      }
    } catch (error) {
      console.error('Erro ao exportar pedidos:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao exportar pedidos.',
      });
    }
  },
};
