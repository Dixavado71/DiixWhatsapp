import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller de Produtos
 * Gerencia catálogo de produtos por tenant
 */

export const productController = {
  /**
   * Listar produtos do tenant
   * GET /api/v1/products
   */
  listProducts: async (req, res) => {
    try {
      const { page = 1, limit = 20, category, active, featured, search } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // Determinar tenantId (SUPER_ADMIN pode especificar, outros usam o seu)
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

      if (category) {
        where.category = category;
      }

      if (active !== undefined) {
        where.active = active === 'true';
      }

      if (featured !== undefined) {
        where.featured = featured === 'true';
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.product.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          products,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error('Erro ao listar produtos:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao listar produtos.',
      });
    }
  },

  /**
   * Obter produto específico
   * GET /api/v1/products/:id
   */
  getProduct: async (req, res) => {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Produto não encontrado.',
        });
      }

      // Verificar permissão de acesso
      if (req.user.role !== 'SUPER_ADMIN' && product.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado a este produto.',
        });
      }

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error('Erro ao obter produto:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao obter produto.',
      });
    }
  },

  /**
   * Criar novo produto
   * POST /api/v1/products
   */
  createProduct: async (req, res) => {
    try {
      const { name, description, sku, price, costPrice, stock, category, images, metadata, active, featured } = req.body;

      // Validações
      if (!name || !price) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Nome e preço são obrigatórios.',
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

      // Verificar se SKU já existe para este tenant
      if (sku) {
        const existing = await prisma.product.findUnique({
          where: {
            tenantId_sku: {
              tenantId,
              sku,
            },
          },
        });

        if (existing) {
          return res.status(409).json({
            error: 'Conflict',
            message: 'SKU já cadastrado para este tenant.',
          });
        }
      }

      const product = await prisma.product.create({
        data: {
          tenantId,
          name,
          description: description || null,
          sku: sku || null,
          price: parseFloat(price),
          costPrice: costPrice ? parseFloat(costPrice) : null,
          stock: parseInt(stock) || 0,
          category: category || null,
          images: images || null,
          metadata: metadata || null,
          active: active !== undefined ? active : true,
          featured: featured || false,
        },
      });

      res.status(201).json({
        success: true,
        data: product,
        message: 'Produto criado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao criar produto.',
      });
    }
  },

  /**
   * Atualizar produto
   * PUT /api/v1/products/:id
   */
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, sku, price, costPrice, stock, category, images, metadata, active, featured } = req.body;

      // Buscar produto atual
      const currentProduct = await prisma.product.findUnique({
        where: { id },
      });

      if (!currentProduct) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Produto não encontrado.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && currentProduct.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado a este produto.',
        });
      }

      // Verificar SKU único se alterado
      if (sku && sku !== currentProduct.sku) {
        const existing = await prisma.product.findUnique({
          where: {
            tenantId_sku: {
              tenantId: currentProduct.tenantId,
              sku,
            },
          },
        });

        if (existing) {
          return res.status(409).json({
            error: 'Conflict',
            message: 'SKU já cadastrado para este tenant.',
          });
        }
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (sku !== undefined) updateData.sku = sku;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (costPrice !== undefined) updateData.costPrice = costPrice ? parseFloat(costPrice) : null;
      if (stock !== undefined) updateData.stock = parseInt(stock);
      if (category !== undefined) updateData.category = category;
      if (images !== undefined) updateData.images = images;
      if (metadata !== undefined) updateData.metadata = metadata;
      if (active !== undefined) updateData.active = active;
      if (featured !== undefined) updateData.featured = featured;

      const product = await prisma.product.update({
        where: { id },
        data: updateData,
      });

      res.status(200).json({
        success: true,
        data: product,
        message: 'Produto atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Produto não encontrado.',
        });
      }
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao atualizar produto.',
      });
    }
  },

  /**
   * Deletar produto
   * DELETE /api/v1/products/:id
   */
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Produto não encontrado.',
        });
      }

      // Verificar permissão
      if (req.user.role !== 'SUPER_ADMIN' && product.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Acesso negado a este produto.',
        });
      }

      await prisma.product.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Produto excluído com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Produto não encontrado.',
        });
      }
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao excluir produto.',
      });
    }
  },

  /**
   * Listar categorias de produtos
   * GET /api/v1/products/categories
   */
  listCategories: async (req, res) => {
    try {
      const tenantId = req.user.role === 'SUPER_ADMIN'
        ? (req.query.tenantId || req.accessibleTenantId)
        : req.user.tenantId;

      const categories = await prisma.product.groupBy({
        by: ['category'],
        where: {
          tenantId,
          active: true,
          category: { not: null },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      });

      res.status(200).json({
        success: true,
        data: categories.map((cat) => ({
          name: cat.category,
          count: cat._count.id,
        })),
      });
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Erro interno ao listar categorias.',
      });
    }
  },
};
