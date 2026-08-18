/**
 * Schemas de Validação com Zod para o Projeto DiixWhatsapp
 * Todos os schemas reutilizáveis para controllers
 */

const { z } = require('zod');

// Schema base para IDs UUID
const uuidSchema = z.string().uuid('ID inválido');

// Schema para email válido
const emailSchema = z.string().email('Email inválido');

// Schema para telefone brasileiro
const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Telefone inválido')
  .or(z.string().length(0).optional());

// Schema para CPF/CNPJ
const documentSchema = z.string()
  .regex(/^\d{11}$|^\d{14}$/, 'CPF ou CNPJ inválido')
  .optional();

// Schema para decimal (preços)
const decimalSchema = z.number().positive('Valor deve ser positivo')
  .or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(val => parseFloat(val)));

// ============================================
// TENANT SCHEMAS
// ============================================

const createTenantSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    slug: z.string().min(3, 'Slug deve ter pelo menos 3 caracteres').regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
    email: emailSchema,
    phone: phoneSchema.optional(),
    plan: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']).default('FREE'),
  }),
});

const updateTenantSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    name: z.string().min(3).optional(),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE', 'TRIAL']).optional(),
    plan: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']).optional(),
  }),
});

// ============================================
// USER SCHEMAS
// ============================================

const createUserSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    role: z.enum(['SUPER_ADMIN', 'TENANT_ADMIN', 'ATTENDANT', 'VIEWER']).default('VIEWER'),
    tenantId: uuidSchema.optional(),
  }),
});

const loginUserSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Senha é obrigatória'),
  }),
});

const updateUserSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    name: z.string().min(3).optional(),
    email: emailSchema.optional(),
    role: z.enum(['SUPER_ADMIN', 'TENANT_ADMIN', 'ATTENDANT', 'VIEWER']).optional(),
    status: z.string().optional(),
  }),
});

// ============================================
// WHATSAPP ACCOUNT SCHEMAS
// ============================================

const createWhatsAppAccountSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    instanceId: z.string().min(1, 'Instance ID é obrigatório'),
    phoneNumber: phoneSchema,
    webhookUrl: z.string().url('URL inválida').optional(),
  }),
});

const updateWhatsAppAccountSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    name: z.string().min(3).optional(),
    status: z.string().optional(),
    webhookUrl: z.string().url().optional(),
  }),
});

// ============================================
// PRODUCT SCHEMAS
// ============================================

const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nome do produto é obrigatório'),
    description: z.string().optional(),
    sku: z.string().optional(),
    price: decimalSchema,
    costPrice: decimalSchema.optional(),
    stock: z.number().int().min(0).default(0),
    minStock: z.number().int().min(0).default(5),
    category: z.string().optional(),
    categoryId: uuidSchema.optional(),
    images: z.array(z.string().url()).optional(),
    active: z.boolean().default(true),
    featured: z.boolean().default(false),
    weight: decimalSchema.optional(),
    dimensions: z.object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
    }).optional(),
    tags: z.array(z.string()).optional(),
    variations: z.any().optional(),
    attributes: z.any().optional(),
  }),
});

const updateProductSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    name: z.string().min(3).optional(),
    description: z.string().optional(),
    price: decimalSchema.optional(),
    stock: z.number().int().min(0).optional(),
    active: z.boolean().optional(),
    featured: z.boolean().optional(),
    archived: z.boolean().optional(),
  }),
});

// ============================================
// CUSTOMER SCHEMAS
// ============================================

const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nome é obrigatório'),
    phone: phoneSchema,
    email: emailSchema.optional(),
    document: documentSchema.optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }),
});

const updateCustomerSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    name: z.string().min(3).optional(),
    email: emailSchema.optional(),
    document: documentSchema.optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }),
});

// ============================================
// CART SCHEMAS
// ============================================

const createCartSchema = z.object({
  body: z.object({
    customerId: uuidSchema.optional(),
    sessionId: uuidSchema.optional(),
    items: z.array(z.object({
      productId: uuidSchema,
      quantity: z.number().int().min(1),
      unitPrice: decimalSchema,
      metadata: z.any().optional(),
    })).min(1, 'Carrinho deve ter pelo menos 1 item'),
  }),
});

const addCartItemSchema = z.object({
  params: z.object({
    cartId: uuidSchema,
  }),
  body: z.object({
    productId: uuidSchema,
    quantity: z.number().int().min(1, 'Quantidade mínima é 1'),
    metadata: z.any().optional(),
  }),
});

const updateCartItemSchema = z.object({
  params: z.object({
    cartId: uuidSchema,
    itemId: uuidSchema,
  }),
  body: z.object({
    quantity: z.number().int().min(1, 'Quantidade mínima é 1'),
  }),
});

// ============================================
// ORDER SCHEMAS
// ============================================

const createOrderSchema = z.object({
  body: z.object({
    customerId: uuidSchema.optional(),
    customerName: z.string().min(3),
    customerPhone: phoneSchema,
    customerEmail: emailSchema.optional(),
    items: z.array(z.object({
      productId: uuidSchema,
      productName: z.string(),
      quantity: z.number().int().min(1),
      unitPrice: decimalSchema,
      discountAmount: decimalSchema.default(0),
      metadata: z.any().optional(),
    })).min(1, 'Pedido deve ter pelo menos 1 item'),
    shippingAddressId: uuidSchema.optional(),
    billingAddressId: uuidSchema.optional(),
    paymentMethod: z.enum(['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BOLETO', 'CASH', 'OTHER']),
    discountId: uuidSchema.optional(),
    notes: z.string().optional(),
  }),
});

const updateOrderStatusSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
    notes: z.string().optional(),
  }),
});

const updatePaymentStatusSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    paymentStatus: z.enum(['PENDING', 'PAID', 'PARTIALLY_PAID', 'REFUNDED', 'FAILED', 'CHARGEBACK']),
    pixTxId: z.string().optional(),
  }),
});

// ============================================
// ADDRESS SCHEMAS
// ============================================

const createAddressSchema = z.object({
  body: z.object({
    customerId: uuidSchema.optional(),
    type: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'DELIVERY', 'BILLING']).default('RESIDENTIAL'),
    label: z.string().optional(),
    street: z.string().min(1, 'Rua é obrigatória'),
    number: z.string().min(1, 'Número é obrigatório'),
    complement: z.string().optional(),
    neighborhood: z.string().min(1, 'Bairro é obrigatório'),
    city: z.string().min(1, 'Cidade é obrigatória'),
    state: z.string().length(2, 'Estado deve ter 2 letras'),
    zipCode: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
    country: z.string().default('Brasil'),
    isDefault: z.boolean().default(false),
  }),
});

const updateAddressSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().length(2).optional(),
    zipCode: z.string().optional(),
    isDefault: z.boolean().optional(),
  }),
});

// ============================================
// DISCOUNT SCHEMAS
// ============================================

const createDiscountSchema = z.object({
  body: z.object({
    code: z.string().min(3, 'Código é obrigatório').regex(/^[A-Z0-9-]+$/, 'Código deve conter apenas letras maiúsculas, números e hífens'),
    description: z.string().optional(),
    type: z.enum(['PERCENTAGE', 'FIXED']),
    value: decimalSchema,
    minPurchaseAmount: decimalSchema.optional(),
    maxDiscountAmount: decimalSchema.optional(),
    usageLimit: z.number().int().min(1).optional(),
    perCustomerLimit: z.number().int().min(1).default(1),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    isActive: z.boolean().default(true),
    applicableTo: z.enum(['all', 'specific_products', 'specific_categories']).default('all'),
    targetProducts: z.array(uuidSchema).optional(),
    targetCategories: z.array(uuidSchema).optional(),
    targetCustomerGroups: z.array(z.string()).optional(),
    autoApply: z.boolean().default(false),
    stackable: z.boolean().default(false),
  }),
});

const validateDiscountSchema = z.object({
  params: z.object({
    code: z.string(),
  }),
  body: z.object({
    cartTotal: decimalSchema,
    customerId: uuidSchema.optional(),
    productIds: z.array(uuidSchema).optional(),
    categoryIds: z.array(uuidSchema).optional(),
  }),
});

// ============================================
// CAMPAIGN SCHEMAS
// ============================================

const createCampaignSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nome é obrigatório'),
    description: z.string().optional(),
    type: z.enum(['SITE_WIDE', 'CATEGORY', 'PRODUCT', 'CUSTOMER_GROUP', 'CUSTOMER_INDIVIDUAL']),
    discountId: uuidSchema,
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    isActive: z.boolean().default(true),
    usageLimit: z.number().int().min(1).optional(),
    perCustomerLimit: z.number().int().min(1).optional(),
    minPurchaseAmount: decimalSchema.optional(),
    targetCategories: z.array(uuidSchema).optional(),
    targetProducts: z.array(uuidSchema).optional(),
    targetCustomerGroups: z.array(z.string()).optional(),
    targetCustomers: z.array(uuidSchema).optional(),
  }),
});

// ============================================
// PIX KEY SCHEMAS
// ============================================

const createPixKeySchema = z.object({
  body: z.object({
    keyType: z.enum(['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM']),
    keyValue: z.string().min(1, 'Chave é obrigatória'),
    bankName: z.string().min(1, 'Nome do banco é obrigatório'),
    bankCode: z.string().optional(),
    accountHolder: z.string().min(1, 'Titular da conta é obrigatório'),
    accountNumber: z.string().min(1, 'Número da conta é obrigatório'),
    agency: z.string().min(1, 'Agência é obrigatória'),
    isDefault: z.boolean().default(false),
    active: z.boolean().default(true),
  }),
});

// ============================================
// AUTH SCHEMAS
// ============================================

const authSchema = z.object({
  headers: z.object({
    authorization: z.string().startsWith('Bearer ', 'Token deve começar com Bearer '),
  }),
});

const tenantParamSchema = z.object({
  params: z.object({
    tenantId: uuidSchema,
  }),
});

// ============================================
// PAGINATION & FILTER SCHEMAS
// ============================================

const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).default(1)),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100).default(20)),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  filters: z.any().optional(),
});

// ============================================
// EXPORT ALL SCHEMAS
// ============================================

module.exports = {
  // Base schemas
  uuidSchema,
  emailSchema,
  phoneSchema,
  documentSchema,
  decimalSchema,
  
  // Tenant schemas
  createTenantSchema,
  updateTenantSchema,
  
  // User schemas
  createUserSchema,
  loginUserSchema,
  updateUserSchema,
  
  // WhatsApp Account schemas
  createWhatsAppAccountSchema,
  updateWhatsAppAccountSchema,
  
  // Product schemas
  createProductSchema,
  updateProductSchema,
  
  // Customer schemas
  createCustomerSchema,
  updateCustomerSchema,
  
  // Cart schemas
  createCartSchema,
  addCartItemSchema,
  updateCartItemSchema,
  
  // Order schemas
  createOrderSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
  
  // Address schemas
  createAddressSchema,
  updateAddressSchema,
  
  // Discount schemas
  createDiscountSchema,
  validateDiscountSchema,
  
  // Campaign schemas
  createCampaignSchema,
  
  // PixKey schemas
  createPixKeySchema,
  
  // Auth schemas
  authSchema,
  tenantParamSchema,
  
  // Pagination schemas
  paginationSchema,
};
