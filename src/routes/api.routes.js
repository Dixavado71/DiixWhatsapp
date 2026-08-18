import { Router } from 'express';
import { authenticate, requireSuperAdmin, requireTenantAdmin, ensureTenantAccess } from '../middleware/auth.js';
import { authController } from '../controllers/auth.controller.js';
import { adminController } from '../controllers/admin.controller.js';
import { productController } from '../controllers/product.controller.js';

const router = Router();

// ===========================================
// Rotas Públicas de Autenticação
// ===========================================

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login de usuário
 * @access  Público
 */
router.post('/auth/login', authController.login);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registro de novo usuário
 * @access  TENANT_ADMIN, SUPER_ADMIN
 */
router.post('/auth/register', authenticate, requireTenantAdmin, authController.register);

// ===========================================
// Rotas Protegidas de Usuário
// ===========================================

/**
 * @route   GET /api/v1/auth/me
 * @desc    Obter dados do usuário autenticado
 * @access  Privado
 */
router.get('/auth/me', authenticate, authController.getMe);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Atualizar perfil do usuário
 * @access  Privado
 */
router.put('/auth/profile', authenticate, authController.updateProfile);

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Alterar senha
 * @access  Privado
 */
router.put('/auth/change-password', authenticate, authController.changePassword);

// ===========================================
// Rotas Administrativas (SUPER_ADMIN apenas)
// ===========================================

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Estatísticas globais da plataforma
 * @access  SUPER_ADMIN
 */
router.get('/admin/stats', authenticate, requireSuperAdmin, adminController.getStats);

/**
 * @route   GET /api/v1/admin/tenants
 * @desc    Listar todos os tenants com paginação e filtros
 * @access  SUPER_ADMIN
 */
router.get('/admin/tenants', authenticate, requireSuperAdmin, adminController.listTenants);

/**
 * @route   POST /api/v1/admin/tenants
 * @desc    Criar novo tenant
 * @access  SUPER_ADMIN
 */
router.post('/admin/tenants', authenticate, requireSuperAdmin, adminController.createTenant);

/**
 * @route   GET /api/v1/admin/tenants/:id
 * @desc    Obter detalhes de um tenant
 * @access  SUPER_ADMIN
 */
router.get('/admin/tenants/:id', authenticate, requireSuperAdmin, adminController.getTenant);

/**
 * @route   PUT /api/v1/admin/tenants/:id
 * @desc    Atualizar tenant
 * @access  SUPER_ADMIN
 */
router.put('/admin/tenants/:id', authenticate, requireSuperAdmin, adminController.updateTenant);

/**
 * @route   PUT /api/v1/admin/tenants/:id/block
 * @desc    Bloquear/Desbloquear tenant
 * @access  SUPER_ADMIN
 */
router.put('/admin/tenants/:id/block', authenticate, requireSuperAdmin, adminController.toggleTenantBlock);

/**
 * @route   DELETE /api/v1/admin/tenants/:id
 * @desc    Deletar tenant
 * @access  SUPER_ADMIN
 */
router.delete('/admin/tenants/:id', authenticate, requireSuperAdmin, adminController.deleteTenant);

// ===========================================
// Rotas de Produtos (Multi-Tenant)
// ===========================================

/**
 * @route   GET /api/v1/products
 * @desc    Listar produtos do tenant
 * @access  TENANT_ADMIN, ATTENDANT, VIEWER (do próprio tenant)
 */
router.get('/products', authenticate, ensureTenantAccess, productController.listProducts);

/**
 * @route   GET /api/v1/products/categories
 * @desc    Listar categorias de produtos
 * @access  TENANT_ADMIN, ATTENDANT, VIEWER (do próprio tenant)
 */
router.get('/products/categories', authenticate, ensureTenantAccess, productController.listCategories);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Obter produto específico
 * @access  TENANT_ADMIN, ATTENDANT, VIEWER (do próprio tenant)
 */
router.get('/products/:id', authenticate, ensureTenantAccess, productController.getProduct);

/**
 * @route   POST /api/v1/products
 * @desc    Criar novo produto
 * @access  TENANT_ADMIN, SUPER_ADMIN
 */
router.post('/products', authenticate, requireTenantAdmin, ensureTenantAccess, productController.createProduct);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Atualizar produto
 * @access  TENANT_ADMIN, SUPER_ADMIN
 */
router.put('/products/:id', authenticate, requireTenantAdmin, ensureTenantAccess, productController.updateProduct);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Deletar produto
 * @access  TENANT_ADMIN, SUPER_ADMIN
 */
router.delete('/products/:id', authenticate, requireTenantAdmin, ensureTenantAccess, productController.deleteProduct);

export default router;
