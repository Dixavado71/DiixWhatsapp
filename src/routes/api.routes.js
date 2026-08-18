import { Router } from 'express';
import { authenticate, requireSuperAdmin, requireTenantAdmin, ensureTenantAccess } from '../middleware/auth.js';
import { authController } from '../controllers/auth.controller.js';
import { adminController } from '../controllers/admin.controller.js';
import { productController } from '../controllers/product.controller.js';
import { cartController } from '../controllers/cart.controller.js';
import { orderController } from '../controllers/order.controller.js';
import { customerController } from '../controllers/customer.controller.js';
import { discountController } from '../controllers/discount.controller.js';
import { campaignController } from '../controllers/campaign.controller.js';
import { pixKeyController } from '../controllers/pixKey.controller.js';
import { addressController } from '../controllers/address.controller.js';
import { whatsappBotController } from '../controllers/whatsappBot.controller.js';

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

// ===========================================
// Rotas de Carrinho de Compras (Multi-Tenant)
// ===========================================

/**
 * @route   GET /api/v1/carts
 * @desc    Listar carrinhos do tenant
 * @access  TENANT_ADMIN, ATTENDANT, VIEWER
 */
router.get('/carts', authenticate, ensureTenantAccess, cartController.listCarts);

/**
 * @route   GET /api/v1/carts/:id
 * @desc    Obter carrinho específico
 * @access  TENANT_ADMIN, ATTENDANT, VIEWER
 */
router.get('/carts/:id', authenticate, ensureTenantAccess, cartController.getCart);

/**
 * @route   POST /api/v1/carts
 * @desc    Criar novo carrinho
 * @access  TENANT_ADMIN, ATTENDANT, CUSTOMER
 */
router.post('/carts', authenticate, ensureTenantAccess, cartController.createCart);

/**
 * @route   PUT /api/v1/carts/:id
 * @desc    Atualizar carrinho
 * @access  TENANT_ADMIN, ATTENDANT, CUSTOMER (dono do carrinho)
 */
router.put('/carts/:id', authenticate, ensureTenantAccess, cartController.updateCart);

/**
 * @route   DELETE /api/v1/carts/:id
 * @desc    Cancelar/abandonar carrinho
 * @access  TENANT_ADMIN, ATTENDANT, CUSTOMER (dono do carrinho)
 */
router.delete('/carts/:id', authenticate, ensureTenantAccess, cartController.cancelCart);

/**
 * @route   POST /api/v1/carts/:id/items
 * @desc    Adicionar item ao carrinho
 * @access  TENANT_ADMIN, ATTENDANT, CUSTOMER
 */
router.post('/carts/:id/items', authenticate, ensureTenantAccess, cartController.addItemToCart);

/**
 * @route   PUT /api/v1/carts/:id/items/:itemId
 * @desc    Atualizar item do carrinho
 * @access  TENANT_ADMIN, ATTENDANT, CUSTOMER
 */
router.put('/carts/:id/items/:itemId', authenticate, ensureTenantAccess, cartController.updateCartItem);

/**
 * @route   DELETE /api/v1/carts/:id/items/:itemId
 * @desc    Remover item do carrinho
 * @access  TENANT_ADMIN, ATTENDANT, CUSTOMER
 */
router.delete('/carts/:id/items/:itemId', authenticate, ensureTenantAccess, cartController.removeItemFromCart);

/**
 * @route   POST /api/v1/carts/:id/apply-discount
 * @desc    Aplicar desconto/cupom ao carrinho
 * @access  TENANT_ADMIN, ATTENDANT, CUSTOMER
 */
router.post('/carts/:id/apply-discount', authenticate, ensureTenantAccess, cartController.applyDiscount);

/**
 * @route   POST /api/v1/carts/:id/checkout
 * @desc    Realizar checkout (converter carrinho em pedido)
 * @access  TENANT_ADMIN, ATTENDANT, CUSTOMER
 */
router.post('/carts/:id/checkout', authenticate, ensureTenantAccess, cartController.checkout);

/**
 * @route   POST /api/v1/carts/:id/recalculate
 * @desc    Recalcular totais do carrinho
 * @access  TENANT_ADMIN, ATTENDANT
 */
router.post('/carts/:id/recalculate', authenticate, ensureTenantAccess, cartController.recalculateTotals);

// ===========================================
// Rotas de Pedidos/Vendas (Multi-Tenant)
// ===========================================

/**
 * @route   GET /api/v1/orders
 * @desc    Listar pedidos do tenant com filtros
 * @access  TENANT_ADMIN, ATTENDANT, VIEWER
 */
router.get('/orders', authenticate, ensureTenantAccess, orderController.listOrders);

/**
 * @route   GET /api/v1/orders/stats
 * @desc    Estatísticas de pedidos
 * @access  TENANT_ADMIN, ATTENDANT
 */
router.get('/orders/stats', authenticate, ensureTenantAccess, orderController.getOrderStats);

/**
 * @route   GET /api/v1/orders/export
 * @desc    Exportar pedidos para CSV
 * @access  TENANT_ADMIN
 */
router.get('/orders/export', authenticate, requireTenantAdmin, ensureTenantAccess, orderController.exportOrders);

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Obter pedido específico
 * @access  TENANT_ADMIN, ATTENDANT, VIEWER, CUSTOMER (seu próprio pedido)
 */
router.get('/orders/:id', authenticate, ensureTenantAccess, orderController.getOrder);

/**
 * @route   POST /api/v1/orders
 * @desc    Criar novo pedido manualmente
 * @access  TENANT_ADMIN, ATTENDANT
 */
router.post('/orders', authenticate, requireTenantAdmin, ensureTenantAccess, orderController.createOrder);

/**
 * @route   PUT /api/v1/orders/:id
 * @desc    Atualizar pedido
 * @access  TENANT_ADMIN, ATTENDANT
 */
router.put('/orders/:id', authenticate, ensureTenantAccess, orderController.updateOrder);

/**
 * @route   PUT /api/v1/orders/:id/status
 * @desc    Atualizar status do pedido
 * @access  TENANT_ADMIN, ATTENDANT
 */
router.put('/orders/:id/status', authenticate, ensureTenantAccess, orderController.updateOrderStatus);

/**
 * @route   PUT /api/v1/orders/:id/payment-status
 * @desc    Atualizar status do pagamento
 * @access  TENANT_ADMIN, ATTENDANT
 */
router.put('/orders/:id/payment-status', authenticate, ensureTenantAccess, orderController.updatePaymentStatus);

/**
 * @route   POST /api/v1/orders/:id/notes
 * @desc    Adicionar observação ao pedido
 * @access  TENANT_ADMIN, ATTENDANT
 */
router.post('/orders/:id/notes', authenticate, ensureTenantAccess, orderController.addOrderNote);

/**
 * @route   POST /api/v1/orders/:id/cancel
 * @desc    Cancelar pedido
 * @access  TENANT_ADMIN, ATTENDANT
 */
router.post('/orders/:id/cancel', authenticate, ensureTenantAccess, orderController.cancelOrder);

/**
 * @route   POST /api/v1/webhook/pix
 * @desc    Webhook para confirmação automática de pagamento PIX
 * @access  Público (com validação de signature)
 */
router.post('/webhook/pix', orderController.pixWebhook);

// ===========================================
// Rotas de Clientes (Multi-Tenant)
// ===========================================

/**
 * @route   GET /api/v1/customers
 * @desc    Listar clientes do tenant
 * @access  TENANT_ADMIN, ATTENDANT, VIEWER
 */
router.get('/customers', authenticate, ensureTenantAccess, customerController.listCustomers);

/**
 * @route   GET /api/v1/customers/stats
 * @desc    Estatísticas de clientes
 * @access  TENANT_ADMIN, ATTENDANT
 */
router.get('/customers/stats', authenticate, ensureTenantAccess, customerController.getCustomerStats);

/**
 * @route   GET /api/v1/customers/groups
 * @desc    Listar grupos/tags de clientes
 * @access  TENANT_ADMIN, ATTENDANT
 */
router.get('/customers/groups', authenticate, ensureTenantAccess, customerController.getCustomerGroups);

/**
 * @route   GET /api/v1/customers/:id
 * @desc    Obter cliente específico
 * @access  TENANT_ADMIN, ATTENDANT, VIEWER
 */
router.get('/customers/:id', authenticate, ensureTenantAccess, customerController.getCustomer);

/**
 * @route   GET /api/v1/customers/:id/orders
 * @desc    Histórico de pedidos do cliente
 * @access  TENANT_ADMIN, ATTENDANT
 */
router.get('/customers/:id/orders', authenticate, ensureTenantAccess, customerController.getCustomerOrders);

/**
 * @route   GET /api/v1/customers/:id/stats
 * @desc    Estatísticas individuais do cliente
 * @access  TENANT_ADMIN, ATTENDANT
 */
router.get('/customers/:id/stats', authenticate, ensureTenantAccess, customerController.getCustomerStatsById);

/**
 * @route   POST /api/v1/customers
 * @desc    Criar novo cliente
 * @access  TENANT_ADMIN, ATTENDANT
 */
router.post('/customers', authenticate, ensureTenantAccess, customerController.createCustomer);

/**
 * @route   PUT /api/v1/customers/:id
 * @desc    Atualizar cliente
 * @access  TENANT_ADMIN, ATTENDANT
 */
router.put('/customers/:id', authenticate, ensureTenantAccess, customerController.updateCustomer);

/**
 * @route   DELETE /api/v1/customers/:id
 * @desc    Deletar cliente (soft delete)
 * @access  TENANT_ADMIN
 */
router.delete('/customers/:id', authenticate, requireTenantAdmin, ensureTenantAccess, customerController.deleteCustomer);

/**
 * @route   POST /api/v1/customers/:id/tags
 * @desc    Adicionar tag ao cliente
 * @access  TENANT_ADMIN, ATTENDANT
 */
router.post('/customers/:id/tags', authenticate, ensureTenantAccess, customerController.addCustomerTag);

/**
 * @route   DELETE /api/v1/customers/:id/tags/:tag
 * @desc    Remover tag do cliente
 * @access  TENANT_ADMIN, ATTENDANT
 */
router.delete('/customers/:id/tags/:tag', authenticate, ensureTenantAccess, customerController.removeCustomerTag);

// ===========================================
// Rotas de Descontos/Cupons (Multi-Tenant)
// ===========================================

/**
 * @route   GET /api/v1/discounts
 * @desc    Listar descontos do tenant
 * @access  TENANT_ADMIN, ATTENDANT, VIEWER
 */
router.get('/discounts', authenticate, ensureTenantAccess, discountController.listDiscounts);

/**
 * @route   GET /api/v1/discounts/:id
 * @desc    Obter desconto específico
 * @access  TENANT_ADMIN, ATTENDANT, VIEWER
 */
router.get('/discounts/:id', authenticate, ensureTenantAccess, discountController.getDiscount);

/**
 * @route   POST /api/v1/discounts
 * @desc    Criar novo desconto/cupom
 * @access  TENANT_ADMIN
 */
router.post('/discounts', authenticate, requireTenantAdmin, ensureTenantAccess, discountController.createDiscount);

/**
 * @route   PUT /api/v1/discounts/:id
 * @desc    Atualizar desconto
 * @access  TENANT_ADMIN
 */
router.put('/discounts/:id', authenticate, requireTenantAdmin, ensureTenantAccess, discountController.updateDiscount);

/**
 * @route   DELETE /api/v1/discounts/:id
 * @desc    Deletar desconto
 * @access  TENANT_ADMIN
 */
router.delete('/discounts/:id', authenticate, requireTenantAdmin, ensureTenantAccess, discountController.deleteDiscount);

/**
 * @route   POST /api/v1/discounts/validate
 * @desc    Validar cupom de desconto
 * @access  TENANT_ADMIN, ATTENDANT, CUSTOMER
 */
router.post('/discounts/validate', authenticate, ensureTenantAccess, discountController.validateDiscount);

/**
 * @route   POST /api/v1/discounts/calculate
 * @desc    Calcular valor do desconto
 * @access  TENANT_ADMIN, ATTENDANT, CUSTOMER
 */
router.post('/discounts/calculate', authenticate, ensureTenantAccess, discountController.calculateDiscount);

// ===========================================
// Rotas de Campanhas Promocionais (Multi-Tenant)
// ===========================================

/**
 * @route   GET /api/v1/campaigns
 * @desc    Listar campanhas do tenant
 * @access  TENANT_ADMIN, ATTENDANT, VIEWER
 */
router.get('/campaigns', authenticate, ensureTenantAccess, campaignController.listCampaigns);

/**
 * @route   GET /api/v1/campaigns/stats
 * @desc    Estatísticas de campanhas
 * @access  TENANT_ADMIN, ATTENDANT
 */
router.get('/campaigns/stats', authenticate, ensureTenantAccess, campaignController.getCampaignStats);

/**
 * @route   GET /api/v1/campaigns/:id
 * @desc    Obter campanha específica
 * @access  TENANT_ADMIN, ATTENDANT, VIEWER
 */
router.get('/campaigns/:id', authenticate, ensureTenantAccess, campaignController.getCampaign);

/**
 * @route   GET /api/v1/campaigns/:id/performance
 * @desc    Performance detalhada da campanha
 * @access  TENANT_ADMIN, ATTENDANT
 */
router.get('/campaigns/:id/performance', authenticate, ensureTenantAccess, campaignController.getCampaignPerformance);

/**
 * @route   POST /api/v1/campaigns
 * @desc    Criar nova campanha
 * @access  TENANT_ADMIN
 */
router.post('/campaigns', authenticate, requireTenantAdmin, ensureTenantAccess, campaignController.createCampaign);

/**
 * @route   PUT /api/v1/campaigns/:id
 * @desc    Atualizar campanha
 * @access  TENANT_ADMIN
 */
router.put('/campaigns/:id', authenticate, requireTenantAdmin, ensureTenantAccess, campaignController.updateCampaign);

/**
 * @route   DELETE /api/v1/campaigns/:id
 * @desc    Deletar campanha
 * @access  TENANT_ADMIN
 */
router.delete('/campaigns/:id', authenticate, requireTenantAdmin, ensureTenantAccess, campaignController.deleteCampaign);

/**
 * @route   POST /api/v1/campaigns/:id/activate
 * @desc    Ativar campanha
 * @access  TENANT_ADMIN
 */
router.post('/campaigns/:id/activate', authenticate, requireTenantAdmin, ensureTenantAccess, campaignController.activateCampaign);

/**
 * @route   POST /api/v1/campaigns/:id/deactivate
 * @desc    Desativar campanha
 * @access  TENANT_ADMIN
 */
router.post('/campaigns/:id/deactivate', authenticate, requireTenantAdmin, ensureTenantAccess, campaignController.deactivateCampaign);

// ===========================================
// Rotas de Chaves PIX (Multi-Tenant)
// ===========================================

/**
 * @route   GET /api/v1/pix-keys
 * @desc    Listar chaves PIX do tenant
 * @access  TENANT_ADMIN, ATTENDANT
 */
router.get('/pix-keys', authenticate, ensureTenantAccess, pixKeyController.listPixKeys);

/**
 * @route   GET /api/v1/pix-keys/default
 * @desc    Obter chave PIX padrão
 * @access  TENANT_ADMIN, ATTENDANT, CUSTOMER
 */
router.get('/pix-keys/default', authenticate, ensureTenantAccess, pixKeyController.getDefaultPixKey);

/**
 * @route   GET /api/v1/pix-keys/:id
 * @desc    Obter chave PIX específica
 * @access  TENANT_ADMIN, ATTENDANT
 */
router.get('/pix-keys/:id', authenticate, ensureTenantAccess, pixKeyController.getPixKey);

/**
 * @route   POST /api/v1/pix-keys
 * @desc    Cadastrar nova chave PIX
 * @access  TENANT_ADMIN
 */
router.post('/pix-keys', authenticate, requireTenantAdmin, ensureTenantAccess, pixKeyController.createPixKey);

/**
 * @route   PUT /api/v1/pix-keys/:id
 * @desc    Atualizar chave PIX
 * @access  TENANT_ADMIN
 */
router.put('/pix-keys/:id', authenticate, requireTenantAdmin, ensureTenantAccess, pixKeyController.updatePixKey);

/**
 * @route   DELETE /api/v1/pix-keys/:id
 * @desc    Remover chave PIX
 * @access  TENANT_ADMIN
 */
router.delete('/pix-keys/:id', authenticate, requireTenantAdmin, ensureTenantAccess, pixKeyController.deletePixKey);

/**
 * @route   POST /api/v1/pix-keys/:id/set-default
 * @desc    Definir como chave padrão
 * @access  TENANT_ADMIN
 */
router.post('/pix-keys/:id/set-default', authenticate, requireTenantAdmin, ensureTenantAccess, pixKeyController.setDefaultPixKey);

/**
 * @route   POST /api/v1/pix-keys/:id/toggle
 * @desc    Ativar/Desativar chave PIX
 * @access  TENANT_ADMIN
 */
router.post('/pix-keys/:id/toggle', authenticate, requireTenantAdmin, ensureTenantAccess, pixKeyController.togglePixKey);

/**
 * @route   POST /api/v1/pix-keys/generate-qr
 * @desc    Gerar QR Code PIX estático
 * @access  TENANT_ADMIN, ATTENDANT, CUSTOMER
 */
router.post('/pix-keys/generate-qr', authenticate, ensureTenantAccess, pixKeyController.generateQRCode);

// ===========================================
// Rotas de Endereços (Multi-Tenant)
// ===========================================

/**
 * @route   GET /api/v1/addresses
 * @desc    Listar endereços do tenant ou cliente
 * @access  TENANT_ADMIN, ATTENDANT, CUSTOMER
 */
router.get('/addresses', authenticate, ensureTenantAccess, addressController.listAddresses);

/**
 * @route   GET /api/v1/addresses/customer/:customerId
 * @desc    Listar endereços de um cliente
 * @access  TENANT_ADMIN, ATTENDANT, CUSTOMER (seus próprios endereços)
 */
router.get('/addresses/customer/:customerId', authenticate, ensureTenantAccess, addressController.getCustomerAddresses);

/**
 * @route   GET /api/v1/addresses/:id
 * @desc    Obter endereço específico
 * @access  TENANT_ADMIN, ATTENDANT, CUSTOMER (seu próprio endereço)
 */
router.get('/addresses/:id', authenticate, ensureTenantAccess, addressController.getAddress);

/**
 * @route   POST /api/v1/addresses
 * @desc    Criar novo endereço
 * @access  TENANT_ADMIN, ATTENDANT, CUSTOMER
 */
router.post('/addresses', authenticate, ensureTenantAccess, addressController.createAddress);

/**
 * @route   PUT /api/v1/addresses/:id
 * @desc    Atualizar endereço
 * @access  TENANT_ADMIN, ATTENDANT, CUSTOMER (seu próprio endereço)
 */
router.put('/addresses/:id', authenticate, ensureTenantAccess, addressController.updateAddress);

/**
 * @route   DELETE /api/v1/addresses/:id
 * @desc    Deletar endereço
 * @access  TENANT_ADMIN, ATTENDANT, CUSTOMER (seu próprio endereço)
 */
router.delete('/addresses/:id', authenticate, ensureTenantAccess, addressController.deleteAddress);

/**
 * @route   POST /api/v1/addresses/:id/set-default
 * @desc    Definir como endereço padrão
 * @access  TENANT_ADMIN, ATTENDANT, CUSTOMER
 */
router.post('/addresses/:id/set-default', authenticate, ensureTenantAccess, addressController.setDefaultAddress);

/**
 * @route   POST /api/v1/addresses/validate-zip
 * @desc    Validar CEP e buscar endereço
 * @access  TENANT_ADMIN, ATTENDANT, CUSTOMER
 */
router.post('/addresses/validate-zip', authenticate, ensureTenantAccess, addressController.validateZipCode);

// ===========================================
// Rotas do Bot WhatsApp (Evolution API)
// ===========================================

/**
 * @route   POST /api/v1/whatsapp/webhook/:tenantId
 * @desc    Webhook para receber mensagens da Evolution API
 * @access  Público (requer validação de assinatura em produção)
 */
router.post('/whatsapp/webhook/:tenantId', whatsappBotController.receiveWebhook);

export default router;
