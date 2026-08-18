# Guia Completo Multi-Tenant

## 📚 O que é Multi-Tenant?

**Multi-tenant** é uma arquitetura onde uma única instância do software serve múltiplos clientes (tenants). No contexto do DiixWhatsapp, cada **tenant** representa uma loja/empresa com suas configurações, contas WhatsApp e regras de negócio independentes.

### Benefícios da Arquitetura Multi-Tenant

| Benefício | Descrição | Impacto |
|-----------|-----------|---------|
| **Custo Reduzido** | Infraestrutura compartilhada | Até 70% economia |
| **Manutenção Simplificada** | Uma atualização para todos | Deploy mais rápido |
| **Escalabilidade** | Crescimento sem reengenharia | Suporta N tenants |
| **Isolamento** | Dados separados por tenant | Segurança e compliance |
| **Customização** | Configurações por tenant | Flexibilidade total |

## 🏗️ Modelos de Multi-Tenant

### Modelo Adotado: Database Compartilhado com Isolamento Lógico

```
┌─────────────────────────────────────────┐
│         Aplicação DiixWhatsapp          │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │        Middleware Tenant          │  │
│  │    (Isolamento por tenant_id)     │  │
│  └───────────────────────────────────┘  │
├─────────────────────────────────────────┤
│           Banco de Dados                │
│  ┌─────┬─────┬─────┬─────┬─────────┐   │
│  │ T1  │ T2  │ T3  │ T4  │ ... TN  │   │
│  │Dados│Dados│Dados│Dados│  Dados  │   │
│  └─────┴─────┴─────┴─────┴─────────┘   │
└─────────────────────────────────────────┘
```

### Comparação de Modelos

| Modelo | Isolamento | Custo | Complexidade | Escalabilidade |
|--------|-----------|-------|--------------|----------------|
| **Database por Tenant** | Alto | Alto | Alta | Média |
| **Schema por Tenant** | Médio | Médio | Média | Alta |
| **Tabela Compartilhada** (Nosso) | Médio | Baixo | Baixa | Muito Alta |

## 🎯 Estrutura de Dados Multi-Tenant

### Entidades Principais

#### 1. Tenant (Loja/Empresa)

```javascript
{
  id: "uuid-v4",
  name: "Minha Loja Varejo",
  slug: "minha-loja-varejo",
  segment: "varejo", // varejo, servicos, food, etc.
  status: "active", // active, inactive, suspended
  config: {
    businessHours: {
      start: "09:00",
      end: "18:00",
      timezone: "America/Sao_Paulo",
      workDays: [1, 2, 3, 4, 5] // Seg-Sex
    },
    language: "pt-BR",
    currency: "BRL",
    autoReply: true,
    greetingMessage: "Olá! Bem-vindo à Minha Loja!",
    maxAccounts: 5,
    features: {
      botVendas: true,
      agendamento: false,
      pagamentos: true
    }
  },
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z"
}
```

#### 2. Tenant Account (Conta WhatsApp)

```javascript
{
  id: "uuid-v4",
  tenantId: "uuid-tenant",
  name: "Atendimento Principal",
  phoneNumber: "5511999999999",
  evolutionInstanceId: "instance-abc123",
  status: "connected", // connected, disconnected, pending
  webhookUrl: "https://api.diix.com/webhook",
  config: {
    maxDailyMessages: 1000,
    enableAutoReply: true,
    transferToHuman: true,
    humanPhoneNumber: "5511988888888"
  },
  createdAt: "2025-01-01T00:00:00Z"
}
```

#### 3. Message (Mensagem)

```javascript
{
  id: "uuid-v4",
  tenantId: "uuid-tenant",
  accountId: "uuid-account",
  fromNumber: "5511999999999",
  toNumber: "5511977777777",
  content: "Olá, gostaria de saber mais sobre...",
  type: "text", // text, image, document, etc.
  direction: "inbound", // inbound | outbound
  status: "delivered", // sent, delivered, read, failed
  metadata: {
    botFlow: "sales",
    step: "greeting",
    customerId: "cust-123"
  },
  createdAt: "2025-01-01T00:00:00Z"
}
```

## 🔧 Implementação do Isolamento

### Middleware de Tenant

```javascript
// middleware/tenantIsolation.js
const TenantRepository = require('../repositories/tenant.repository');

class TenantIsolationMiddleware {
  async handle(req, res, next) {
    try {
      // 1. Extrair tenant ID do header
      const tenantId = req.headers['x-tenant-id'] || 
                       req.headers['tenant-id'] ||
                       req.query.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({
          error: 'TENANT_ID_REQUIRED',
          message: 'É necessário informar o tenant ID'
        });
      }
      
      // 2. Validar e buscar tenant
      const tenant = await TenantRepository.findById(tenantId);
      
      if (!tenant) {
        return res.status(404).json({
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant não encontrado'
        });
      }
      
      // 3. Verificar status do tenant
      if (tenant.status !== 'active') {
        return res.status(403).json({
          error: 'TENANT_INACTIVE',
          message: 'Tenant está inativo ou suspenso'
        });
      }
      
      // 4. Anexar tenant ao request
      req.tenant = tenant;
      req.tenantId = tenant.id;
      
      // 5. Continuar para próxima middleware/controller
      next();
      
    } catch (error) {
      console.error('Tenant isolation error:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Erro ao validar tenant'
      });
    }
  }
}

module.exports = new TenantIsolationMiddleware();
```

### Repository com Escopo por Tenant

```javascript
// repositories/base.repository.js
class BaseRepository {
  constructor(model, tenantId) {
    this.model = model;
    this.tenantId = tenantId;
  }
  
  // Todas as queries são automaticamente filtradas por tenant
  async find(query = {}) {
    return this.model.find({
      ...query,
      tenantId: this.tenantId
    });
  }
  
  async findById(id) {
    return this.model.findOne({
      _id: id,
      tenantId: this.tenantId
    });
  }
  
  async create(data) {
    return this.model.create({
      ...data,
      tenantId: this.tenantId
    });
  }
  
  async update(id, data) {
    return this.model.findOneAndUpdate(
      { _id: id, tenantId: this.tenantId },
      data,
      { new: true }
    );
  }
  
  async delete(id) {
    return this.model.findOneAndDelete({
      _id: id,
      tenantId: this.tenantId
    });
  }
}

// repositories/message.repository.js
class MessageRepository extends BaseRepository {
  constructor(tenantId) {
    super(MessageModel, tenantId);
  }
  
  // Métodos específicos com escopo automático
  async findByConversation(phoneNumber) {
    return this.find({ phoneNumber });
  }
  
  async countByDay(date) {
    const startOfDay = new Date(date.setHours(0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59));
    
    return this.model.countDocuments({
      tenantId: this.tenantId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
  }
}
```

### Service Layer com Validação de Limits

```javascript
// services/whatsapp.service.js
class WhatsAppService {
  constructor(tenant, account) {
    this.tenant = tenant;
    this.account = account;
    this.messageRepo = new MessageRepository(tenant.id);
  }
  
  async sendMessage(toNumber, content, options = {}) {
    // 1. Verificar limites do tenant
    await this.checkLimits();
    
    // 2. Validar configurações
    this.validateConfig(options);
    
    // 3. Enviar via Evolution API
    const result = await EvolutionAPI.sendMessage(
      this.account.evolutionInstanceId,
      toNumber,
      content,
      options
    );
    
    // 4. Salvar mensagem (já com tenantId)
    await this.messageRepo.create({
      accountId: this.account.id,
      toNumber,
      content,
      type: options.type || 'text',
      direction: 'outbound',
      status: 'sent',
      metadata: options.metadata
    });
    
    // 5. Atualizar contador de uso
    await this.incrementUsage();
    
    return result;
  }
  
  async checkLimits() {
    const today = new Date();
    const dailyCount = await this.messageRepo.countByDay(today);
    
    const maxDaily = this.account.config.maxDailyMessages || 1000;
    
    if (dailyCount >= maxDaily) {
      throw new Error(`Limite diário de ${maxDaily} mensagens atingido`);
    }
    
    // Verificar limite do plano do tenant
    const monthlyCount = await this.getMonthlyCount();
    const maxMonthly = this.tenant.config.maxMonthlyMessages || 10000;
    
    if (monthlyCount >= maxMonthly) {
      throw new Error(`Limite mensal de ${maxMonthly} mensagens atingido`);
    }
  }
}
```

## 📋 Operações Multi-Tenant

### Criando um Novo Tenant

```bash
# Via API
curl -X POST https://api.diix.com/api/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_API_KEY" \
  -d '{
    "name": "Nova Loja Fashion",
    "slug": "nova-loja-fashion",
    "segment": "varejo",
    "config": {
      "businessHours": {
        "start": "09:00",
        "end": "18:00",
        "timezone": "America/Sao_Paulo"
      },
      "language": "pt-BR",
      "autoReply": true,
      "maxAccounts": 3
    }
  }'
```

### Vinculando Conta WhatsApp

```bash
curl -X POST https://api.diix.com/api/tenants/{tenantId}/accounts \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: {tenantId}" \
  -H "Authorization: Bearer TENANT_API_KEY" \
  -d '{
    "name": "Atendimento Principal",
    "phoneNumber": "5511999999999",
    "config": {
      "maxDailyMessages": 500,
      "enableAutoReply": true
    }
  }'
```

### Listando Tenants

```bash
# Admin: lista todos os tenants
curl -X GET https://api.diix.com/api/tenants \
  -H "Authorization: Bearer ADMIN_API_KEY"

# Tenant: vê apenas seus dados
curl -X GET https://api.diix.com/api/tenants/me \
  -H "X-Tenant-ID: {tenantId}" \
  -H "Authorization: Bearer TENANT_API_KEY"
```

## 🔐 Segurança e Isolamento

### Regras de Isolamento

1. **Nunca confiar no client**: Sempre validar tenant no backend
2. **Query filtering**: Todas as queries devem incluir `tenantId`
3. **API Keys separadas**: Cada tenant tem sua própria API key
4. **Logs isolados**: Logs incluem tenantId para auditoria
5. **Rate limiting individual**: Limites por tenant, não globais

### Validações Obrigatórias

```javascript
// Em TODOS os controllers
const ensureTenantAccess = (req, res, next) => {
  const requestedTenantId = req.params.tenantId || req.body.tenantId;
  const authenticatedTenantId = req.tenant.id;
  
  // Impede acesso cruzado entre tenants
  if (requestedTenantId && requestedTenantId !== authenticatedTenantId) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Acesso negado a recursos de outro tenant'
    });
  }
  
  next();
};
```

## 📊 Monitoramento por Tenant

### Métricas por Tenant

```javascript
// services/metrics.service.js
class MetricsService {
  async getTenantMetrics(tenantId, period = 'day') {
    const messagesSent = await MessageModel.countDocuments({
      tenantId,
      direction: 'outbound',
      createdAt: { $gte: this.getStartOfPeriod(period) }
    });
    
    const messagesReceived = await MessageModel.countDocuments({
      tenantId,
      direction: 'inbound',
      createdAt: { $gte: this.getStartOfPeriod(period) }
    });
    
    const activeConversations = await ConversationModel.countDocuments({
      tenantId,
      status: 'active'
    });
    
    const avgResponseTime = await this.calculateAvgResponseTime(tenantId);
    
    return {
      tenantId,
      period,
      messagesSent,
      messagesReceived,
      activeConversations,
      avgResponseTime,
      usagePercentage: this.calculateUsagePercentage(tenantId)
    };
  }
}
```

### Dashboard por Tenant

Cada tenant acessa apenas suas métricas:

```
┌─────────────────────────────────────────┐
│  Dashboard - Minha Loja Varejo          │
├─────────────────────────────────────────┤
│  📊 Mensagens Hoje: 245/500             │
│  💬 Conversas Ativas: 12                │
│  ⏱️ Tempo Resp. Médio: 1.2min           │
│  📈 Taxa Conversão: 23%                 │
├─────────────────────────────────────────┤
│  [Gráfico de mensagens por hora]        │
│  [Top produtos mais consultados]        │
│  [Atendentes com melhor performance]    │
└─────────────────────────────────────────┘
```

## 🚀 Melhores Práticas

### ✅ Faça
- Sempre use middleware de tenant isolation
- Inclua tenantId em todas as queries
- Valide limites por tenant
- Logue tenantId em todas as operações
- Use API keys específicas por tenant
- Teste isolamento em testes automatizados

### ❌ Não Faça
- Nunca confie em tenantId vindo do client sem validação
- Não faça queries sem filtro por tenantId
- Não compartilhe cache entre tenants sem namespacing
- Não exponha dados de outros tenants em erros
- Não use rate limiting global (use por tenant)

## 🔍 Debugging e Troubleshooting

### Identificando Vazamento de Dados

```javascript
// Auditoria de queries
const auditQuery = (query, tenantId) => {
  if (!query.tenantId) {
    console.warn('⚠️ Query sem tenantId detectada!', {
      model: query.model,
      filters: query.filters
    });
    throw new Error('Query deve incluir tenantId');
  }
  
  if (query.tenantId !== tenantId) {
    console.error('❌ Tentativa de acesso a tenant incorreto!', {
      expected: tenantId,
      received: query.tenantId
    });
    throw new Error('Acesso a tenant não autorizado');
  }
};
```

### Logs Estruturados

```javascript
// utils/logger.js
const logger = {
  info: (message, context) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      tenantId: context.tenantId,
      message,
      ...context
    }));
  },
  
  error: (message, context) => {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      tenantId: context.tenantId,
      message,
      stack: context.error?.stack,
      ...context
    }));
  }
};

// Uso
logger.info('Mensagem enviada', {
  tenantId: req.tenantId,
  messageId: result.id,
  toNumber: toNumber
});
```

---

**Versão do Documento**: 1.0.0  
**Última Atualização**: Janeiro 2025  
**Responsável**: Equipe de Desenvolvimento DiixWhatsapp

## 🔗 Links Relacionados

- [Arquitetura do Sistema](./02-arquitetura.md)
- [Referência da API](./11-api-reference.md)
- [Configuração de Ambiente](./05-configuracao-ambiente.md)
