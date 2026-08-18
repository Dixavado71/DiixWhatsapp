# 🛒 Sistema de E-commerce e Vendas - DiixWhatsapp v2.0

## 📋 Visão Geral

A versão 2.0 do **DiixWhatsapp** introduz um sistema completo de e-commerce com carrinho de compras, checkout, histórico de vendas, sistema de descontos, chaves PIX múltiplas por tenant, endereços de entrega, campanhas promocionais e muito mais.

## 🆕 Novas Funcionalidades Implementadas

### 1. **Histórico Completo de Vendas (Orders)**
- **Modelo `Order`**: Pedidos com status detalhados
- **Modelo `OrderItem`**: Itens individualizados por pedido
- Status do pedido: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED`
- Status do pagamento: `PENDING`, `PAID`, `PARTIALLY_PAID`, `REFUNDED`, `FAILED`, `CHARGEBACK`
- Métodos de pagamento: `PIX`, `CREDIT_CARD`, `DEBIT_CARD`, `BOLETO`, `CASH`, `OTHER`
- Campos adicionais:
  - `subtotal`: Valor antes de descontos
  - `discountAmount`: Valor do desconto aplicado
  - `shippingCost`: Custo de frete
  - `pixKeyUsed`: Chave PIX utilizada
  - `pixTxId`: Transaction ID do PIX
  - `deliveredAt`: Data de entrega
  - `cancelledAt`: Data de cancelamento

### 2. **Sistema de Clientes (Customers)**
- **Modelo `Customer`**: Cadastro completo de clientes
- Campos principais:
  - `name`, `phone`, `email`, `document` (CPF/CNPJ)
  - `tags`: Array de tags para segmentação
  - `totalSpent`: Total gasto pelo cliente
  - `totalOrders`: Número total de pedidos
  - `lastPurchaseAt`: Última data de compra
- Relacionamentos: Orders, Carts, Addresses

### 3. **Carrinho de Compras (Cart & Checkout)**
- **Modelo `Cart`**: Carrinho de compras ativo
- **Modelo `CartItem`**: Itens no carrinho
- Status do carrinho: `ACTIVE`, `ABANDONED`, `CONVERTED`, `EXPIRED`
- Campos:
  - `sessionId`: Para carrinhos temporários (não logados)
  - `subtotal`, `discountAmount`, `total`
  - `expiresAt`: Data de expiração
  - `convertedToOrderId`: Pedido convertido
- Suporte a desconto aplicado no carrinho

### 4. **Endereços de Entrega e Cobrança**
- **Modelo `Address`**: Endereços múltiplos
- Tipos: `RESIDENTIAL`, `COMMERCIAL`, `DELIVERY`, `BILLING`
- Campos completos:
  - `street`, `number`, `complement`, `neighborhood`
  - `city`, `state`, `zipCode`, `country`
  - `isDefault`: Endereço padrão
  - `label`: Apelido (Casa, Trabalho, etc.)
- Relacionamentos: Shipping e Billing para pedidos

### 5. **Chaves PIX por Tenant**
- **Modelo `PixKey`**: Múltiplas chaves PIX por loja
- Tipos de chave: `CPF`, `CNPJ`, `EMAIL`, `PHONE`, `RANDOM`
- Campos:
  - `keyValue`: Valor da chave
  - `bankName`, `bankCode`: Dados bancários
  - `accountHolder`, `accountNumber`, `agency`
  - `isDefault`: Chave padrão
  - `active`: Status da chave
  - `qrCodeStatic`: QR Code estático gerado

### 6. **Sistema de Descontos e Cupons**
- **Modelo `Discount`**: Descontos e cupons promocionais
- Tipos: `PERCENTAGE`, `FIXED`
- Campos:
  - `code`: Código do cupom
  - `value`: Valor ou porcentagem
  - `minPurchaseAmount`: Compra mínima
  - `maxDiscountAmount`: Desconto máximo
  - `usageLimit`, `usageCount`: Limites de uso
  - `perCustomerLimit`: Limite por cliente
  - `startDate`, `endDate`: Período de validade
  - `autoApply`: Aplicação automática
  - `stackable`: Pode usar com outros cupons
- Segmentação:
  - `targetProducts`: Produtos específicos
  - `targetCategories`: Categorias específicas
  - `targetCustomerGroups`: Grupos de clientes (tags)

### 7. **Campanhas e Promoções**
- **Modelo `Campaign`**: Campanhas promocionais
- Tipos: `SITE_WIDE`, `CATEGORY`, `PRODUCT`, `CUSTOMER_GROUP`, `CUSTOMER_INDIVIDUAL`
- Campos:
  - `name`, `description`
  - `type`: Tipo de campanha
  - `discountId`: Desconto vinculado
  - `startDate`, `endDate`: Período
  - `isActive`: Status
  - `usageLimit`, `usageCount`: Controle de usos
  - `perCustomerLimit`: Limite por cliente
  - `minPurchaseAmount`: Compra mínima
- Segmentação avançada:
  - `targetCategories`: Categorias alvo
  - `targetProducts`: Produtos alvo
  - `targetCustomerGroups`: Grupos de clientes
  - `targetCustomers`: Clientes específicos

### 8. **Produtos Atualizados**
- Relacionamentos adicionados:
  - `orderItems`: Itens de pedidos
  - `cartItems`: Itens no carrinho

## 🏗️ Estrutura do Banco de Dados

### Novos Enums
```prisma
// Tipos de Chave PIX
enum PixKeyType {
  CPF
  CNPJ
  EMAIL
  PHONE
  RANDOM
}

// Tipos de Desconto
enum DiscountType {
  PERCENTAGE
  FIXED
}

// Tipos de Campanha/Promoção
enum CampaignType {
  SITE_WIDE
  CATEGORY
  PRODUCT
  CUSTOMER_GROUP
  CUSTOMER_INDIVIDUAL
}

// Status do Pedido
enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

// Status do Pagamento
enum PaymentStatus {
  PENDING
  PAID
  PARTIALLY_PAID
  REFUNDED
  FAILED
  CHARGEBACK
}

// Método de Pagamento
enum PaymentMethod {
  PIX
  CREDIT_CARD
  DEBIT_CARD
  BOLETO
  CASH
  OTHER
}

// Tipo de Endereço
enum AddressType {
  RESIDENTIAL
  COMMERCIAL
  DELIVERY
  BILLING
}

// Status do Carrinho
enum CartStatus {
  ACTIVE
  ABANDONED
  CONVERTED
  EXPIRED
}
```

### Novos Modelos

#### Order (Pedidos)
```prisma
model Order {
  id              String
  tenantId        String
  customerId      String?
  customerName    String
  customerPhone   String
  customerEmail   String?
  totalAmount     Decimal
  subtotal        Decimal
  discountAmount  Decimal
  shippingCost    Decimal
  status          OrderStatus
  paymentMethod   PaymentMethod?
  paymentStatus   PaymentStatus
  pixKeyUsed      String?
  pixTxId         String?
  deliveredAt     DateTime?
  cancelledAt     DateTime?
  
  // Relacionamentos
  customer        Customer?
  items           OrderItem[]
  discount        Discount?
  shippingAddress Address?
  billingAddress  Address?
}
```

#### OrderItem (Itens do Pedido)
```prisma
model OrderItem {
  id             String
  orderId        String
  productId      String
  productName    String
  productSku     String?
  quantity       Int
  unitPrice      Decimal
  totalPrice     Decimal
  discountAmount Decimal
  metadata       Json?
  
  order          Order
  product        Product?
}
```

#### Customer (Clientes)
```prisma
model Customer {
  id             String
  tenantId       String
  name           String
  phone          String
  email          String?
  document       String?
  tags           String[]
  notes          String?
  totalSpent     Decimal
  totalOrders    Int
  lastPurchaseAt DateTime?
  
  // Relacionamentos
  orders         Order[]
  carts          Cart[]
  addresses      Address[]
}
```

#### Cart (Carrinho)
```prisma
model Cart {
  id                String
  tenantId          String
  customerId        String?
  sessionId         String
  status            CartStatus
  subtotal          Decimal
  discountAmount    Decimal
  total             Decimal
  expiresAt         DateTime?
  convertedToOrderId String?
  
  // Relacionamentos
  customer          Customer?
  items             CartItem[]
  appliedDiscount   Discount?
}
```

#### CartItem (Itens do Carrinho)
```prisma
model CartItem {
  id          String
  cartId      String
  productId   String
  quantity    Int
  unitPrice   Decimal
  totalPrice  Decimal
  metadata    Json?
  
  cart        Cart
  product     Product
}
```

#### Address (Endereços)
```prisma
model Address {
  id           String
  tenantId     String
  customerId   String?
  type         AddressType
  label        String?
  street       String
  number       String
  complement   String?
  neighborhood String
  city         String
  state        String
  zipCode      String
  country      String
  isDefault    Boolean
  
  // Relacionamentos
  customer           Customer?
  shippingOrders     Order[]
  billingOrders      Order[]
}
```

#### PixKey (Chaves PIX)
```prisma
model PixKey {
  id            String
  tenantId      String
  keyType       PixKeyType
  keyValue      String
  bankName      String
  bankCode      String?
  accountHolder String
  accountNumber String
  agency        String
  isDefault     Boolean
  active        Boolean
  qrCodeStatic  String?
  
  tenant        Tenant
}
```

#### Discount (Descontos)
```prisma
model Discount {
  id                String
  tenantId          String
  code              String
  description       String?
  type              DiscountType
  value             Decimal
  minPurchaseAmount Decimal?
  maxDiscountAmount Decimal?
  usageLimit        Int?
  usageCount        Int
  perCustomerLimit  Int?
  startDate         DateTime
  endDate           DateTime
  isActive          Boolean
  applicableTo      String
  targetProducts    String[]
  targetCategories  String[]
  targetCustomerGroups String[]
  autoApply         Boolean
  stackable         Boolean
  
  // Relacionamentos
  campaigns         Campaign[]
  orders            Order[]
  carts             Cart[]
}
```

#### Campaign (Campanhas)
```prisma
model Campaign {
  id                 String
  tenantId           String
  name               String
  description        String?
  type               CampaignType
  discountId         String
  startDate          DateTime
  endDate            DateTime
  isActive           Boolean
  usageLimit         Int?
  usageCount         Int
  perCustomerLimit   Int?
  minPurchaseAmount  Decimal?
  targetCategories   String[]
  targetProducts     String[]
  targetCustomerGroups String[]
  targetCustomers    String[]
  
  // Relacionamentos
  discount           Discount
}
```

## 🔄 Migração do Banco de Dados

Para aplicar as mudanças no banco de dados:

```bash
# Gerar Prisma Client
npm run db:generate

# Criar migration
npm run db:migrate

# Ou fazer push direto (desenvolvimento)
npx prisma db push
```

## 📊 Casos de Uso

### 1. Fluxo de Compra Completo
1. Cliente navega pelos produtos
2. Adiciona itens ao carrinho (`Cart` + `CartItem`)
3. Aplica cupom de desconto (`Discount`)
4. Seleciona endereço de entrega (`Address`)
5. Finaliza compra → Gera pedido (`Order` + `OrderItem`)
6. Recebe chave PIX para pagamento (`PixKey`)
7. Pagamento confirmado → Atualiza status do pedido

### 2. Campanha Promocional Segmentada
1. Tenant cria desconto (`Discount`)
2. Cria campanha (`Campaign`) vinculada ao desconto
3. Define segmento (categoria, produto, grupo de clientes)
4. Campanha ativa → Desconto aplicado automaticamente
5. Monitora uso (`usageCount`) e limite

### 3. Múltiplas Chaves PIX
1. Tenant cadastra várias chaves PIX (`PixKey`)
2. Define chave padrão (`isDefault`)
3. Gera QR Code estático
4. No checkout, usa chave padrão ou seleciona específica

### 4. Histórico de Compras do Cliente
1. Cliente realiza primeira compra → `Customer` criado
2. `totalOrders` incrementado
3. `totalSpent` atualizado
4. `lastPurchaseAt` registrado
5. Próximas compras vinculadas ao mesmo cliente

## 🔐 Multi-Tenant

Todas as novas entidades respeitam o isolamento multi-tenant:
- Cada modelo tem `tenantId`
- Índices em `tenantId` para performance
- Relacionamentos sempre dentro do mesmo tenant

## 📈 Dashboard e Métricas

Com os novos dados, é possível gerar métricas como:
- Total de vendas por período
- Ticket médio por cliente
- Produtos mais vendidos
- Carrinhos abandonados
- Cupons mais utilizados
- Campanhas com melhor ROI
- Clientes mais fiéis

## 🚀 Próximos Passos

1. **Controllers e Rotas API**
   - `CartController`: Gerenciar carrinho
   - `OrderController`: CRUD de pedidos
   - `CustomerController`: Gestão de clientes
   - `DiscountController`: Cupons e descontos
   - `CampaignController`: Campanhas promocionais
   - `PixKeyController`: Chaves PIX
   - `AddressController`: Endereços

2. **Integração com Gateway de Pagamento**
   - Webhook de confirmação PIX
   - Reconciliação de pagamentos

3. **Automação de Marketing**
   - Recuperação de carrinho abandonado
   - Ofertas personalizadas por segmento

4. **Relatórios Avançados**
   - Dashboard de vendas
   - Relatórios de performance de campanhas

## 📝 Versionamento

- **Versão do Schema**: 2.0
- **Data**: Janeiro 2025
- **Breaking Changes**: Sim (requer migração)

---

**Documentação Complementar**:
- [Schema do Banco de Dados](../prisma/schema.prisma)
- [Visão Geral do Projeto](./01-visao-geral.md)
- [Arquitetura do Sistema](./02-arquitetura.md)
- [Guia Multi-Tenant](./03-multi-tenant.md)
