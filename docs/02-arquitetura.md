# Arquitetura do Sistema DiixWhatsapp

## 🏗️ Visão Geral da Arquitetura

O DiixWhatsapp utiliza uma arquitetura **multi-tenant** baseada em **Node.js** com **Express**, projetada para escalabilidade, manutenibilidade e isolamento de dados entre diferentes lojas/segmentos.

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENTES                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │  Loja A  │  │  Loja B  │  │  Loja C  │  │  Loja N  │            │
│  │  Varejo  │  │ Serviços │  │   Food   │  │   ...    │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
└───────┼─────────────┼─────────────┼─────────────┼──────────────────┘
        │             │             │             │
        └─────────────┴──────┬──────┴─────────────┘
                             │
                    ┌────────▼────────┐
                    │  Load Balancer  │ (Opcional - Produção)
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
│   Instância 1  │  │   Instância 2  │  │   Instância N  │
│   Node.js +    │  │   Node.js +    │  │   Node.js +    │
│   Express      │  │   Express      │  │   Express      │
└───────┬────────┘  └───────┬────────┘  └───────┬────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
│  Evolution API │  │    Database    │  │  Cache/Redis   │
│   (WhatsApp)   │  │   (PostgreSQL) │  │   (Sessions)   │
└────────────────┘  └────────────────┘  └────────────────┘
```

## 📦 Componentes da Arquitetura

### 1. Camada de Apresentação (API REST)
**Responsabilidade**: Receber requisições HTTP e gerenciar autenticação

```javascript
// Estrutura básica
src/
├── routes/           # Definição de rotas
├── controllers/      # Lógica de controle
├── middleware/       # Autenticação, validação, tenant isolation
└── config/           # Configurações do Express
```

**Principais endpoints**:
- `POST /api/webhook` - Recebe eventos da Evolution API
- `GET /api/tenants` - Gerenciamento de tenants
- `POST /api/messages/send` - Envio de mensagens
- `GET /api/status` - Health check

### 2. Camada de Negócio (Services)
**Responsabilidade**: Implementar regras de negócio e fluxos

```javascript
src/services/
├── tenant/           # Isolamento e gestão multi-tenant
├── whatsapp/         # Integração com Evolution API
├── bot/              # Fluxos do bot de vendas
├── attendance/       # Gestão de atendimento
└── notification/     # Sistema de notificações
```

### 3. Camada de Dados (Models & Repositories)
**Responsabilidade**: Persistência e acesso a dados

```javascript
src/models/           # Definição de modelos
src/repositories/     # Acesso ao banco de dados
src/database/         # Configuração e migrations
```

### 4. Camada de Integração (Evolution API)
**Responsabilidade**: Comunicação com WhatsApp via Evolution API

```javascript
src/integrations/
├── evolution/        # Cliente Evolution API
├── webhook/          # Processador de webhooks
└── queue/            # Fila de mensagens
```

## 🔐 Estratégia Multi-Tenant

### Modelo de Isolamento: Database Compartilhado, Schema Separado

Cada tenant possui:
- **ID único** (`tenant_id`)
- **Configurações específicas** (JSONB)
- **Contas WhatsApp vinculadas**
- **Regras de negócio personalizadas**

```sql
-- Exemplo de estrutura
tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  segment VARCHAR(100),
  config JSONB,
  created_at TIMESTAMP
)

tenant_accounts (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  account_name VARCHAR(255),
  evolution_instance_id VARCHAR(255),
  phone_number VARCHAR(20),
  status VARCHAR(50)
)

messages (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  account_id UUID REFERENCES tenant_accounts(id),
  from_number VARCHAR(20),
  to_number VARCHAR(20),
  content TEXT,
  direction VARCHAR(10), -- 'inbound' | 'outbound'
  status VARCHAR(50),
  created_at TIMESTAMP
)
```

### Middleware de Isolamento

```javascript
// middleware/tenantIsolation.js
const tenantIsolation = async (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'];
  
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID required' });
  }
  
  const tenant = await TenantRepository.findById(tenantId);
  
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  
  req.tenant = tenant;
  next();
};
```

## 🔄 Fluxo de Mensagens

### 1. Mensagem Entrante (Inbound)

```
WhatsApp → Evolution API → Webhook → DiixWhatsapp
                                    │
                                    ▼
                          [Middleware Tenant]
                                    │
                                    ▼
                          [Identificar Conta]
                                    │
                                    ▼
                          [Processar Bot/Atendimento]
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
            [Resposta Automática]          [Encaminhar Humano]
```

### 2. Mensagem Saínte (Outbound)

```
[Bot/Sistema] → [Fila de Mensagens] → [Evolution API] → WhatsApp
                      │
                      ▼
            [Rate Limiting por Tenant]
                      │
                      ▼
            [Log e Auditoria]
```

## 📊 Diagrama de Sequência - Processamento de Mensagem

```
Cliente     Evolution API    DiixWhatsapp       Database       Bot Service
  │              │                │                 │               │
  │──Msg───────► │                │                 │               │
  │              │──Webhook─────►│                 │               │
  │              │                │                 │               │
  │              │                │─Query Tenant──►│               │
  │              │                │◄─Tenant Data───│               │
  │              │                │                 │               │
  │              │                │─Identificar Fluxo─────────────►│
  │              │                │◄─Ação/Resposta─────────────────│
  │              │                │                 │               │
  │              │                │─Save Message──►│               │
  │              │                │                 │               │
  │              │                │─Send Msg─────► │               │
  │              │◄───────────────│                 │               │
  │◄─Resposta────│                │                 │               │
  │              │                │                 │               │
```

## 🔧 Tecnologias e Ferramentas

### Stack Principal
| Componente | Tecnologia | Versão | Justificativa |
|-----------|-----------|--------|---------------|
| Runtime | Node.js | 20.x | Performance e ecossistema |
| Framework | Express | 4.x | Leve e flexível |
| Linguagem | JavaScript | ES6+ | Moderno e amplamente adotado |
| API WhatsApp | Evolution API | Latest | Open source e robusta |

### Banco de Dados
| Componente | Tecnologia | Uso |
|-----------|-----------|-----|
| Principal | PostgreSQL | Dados transacionais |
| Cache | Redis | Sessions e rate limiting |
| Logs | Elasticsearch (opcional) | Busca e análise de logs |

### Infraestrutura
| Componente | Tecnologia | Ambiente |
|-----------|-----------|----------|
| Containerização | Docker | Todos |
| Orquestração | Kubernetes | Produção |
| CI/CD | GitHub Actions | Desenvolvimento |
| Monitoramento | Prometheus + Grafana | Produção |

## 📁 Estrutura de Diretórios Completa

```
diix-whatsapp/
├── src/
│   ├── index.js                 # Entry point
│   ├── app.js                   # Configuração do Express
│   │
│   ├── config/                  # Configurações
│   │   ├── database.js
│   │   ├── evolution.js
│   │   ├── redis.js
│   │   └── multiTenant.js
│   │
│   ├── routes/                  # Rotas da API
│   │   ├── index.js
│   │   ├── webhook.routes.js
│   │   ├── tenant.routes.js
│   │   ├── message.routes.js
│   │   └── account.routes.js
│   │
│   ├── controllers/             # Controladores
│   │   ├── webhook.controller.js
│   │   ├── tenant.controller.js
│   │   ├── message.controller.js
│   │   └── account.controller.js
│   │
│   ├── services/                # Regras de negócio
│   │   ├── tenant.service.js
│   │   ├── whatsapp.service.js
│   │   ├── bot.service.js
│   │   ├── attendance.service.js
│   │   └── notification.service.js
│   │
│   ├── models/                  # Modelos de dados
│   │   ├── Tenant.js
│   │   ├── TenantAccount.js
│   │   ├── Message.js
│   │   └── BotFlow.js
│   │
│   ├── repositories/            # Acesso a dados
│   │   ├── tenant.repository.js
│   │   ├── account.repository.js
│   │   └── message.repository.js
│   │
│   ├── middleware/              # Middlewares
│   │   ├── auth.js
│   │   ├── tenantIsolation.js
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js
│   │
│   ├── integrations/            # Integrações externas
│   │   └── evolution/
│   │       ├── client.js
│   │       ├── webhook.handler.js
│   │       └── message.queue.js
│   │
│   ├── utils/                   # Utilitários
│   │   ├── logger.js
│   │   ├── validators.js
│   │   └── helpers.js
│   │
│   └── flows/                   # Fluxos do bot
│       ├── greeting.flow.js
│       ├── sales.flow.js
│       ├── support.flow.js
│       └── menu.flow.js
│
├── tests/                       # Testes automatizados
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docker/                      # Configurações Docker
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── docker-compose.prod.yml
│
├── docs/                        # Documentação
│   └── (esta pasta)
│
├── .env.example                 # Variáveis de ambiente exemplo
├── .env                         # Variáveis de ambiente (gitignore)
├── package.json
├── jest.config.js
└── README.md
```

## 🚀 Padrões de Projeto Utilizados

### 1. Repository Pattern
Isola a lógica de acesso a dados dos serviços.

```javascript
// repositories/tenant.repository.js
class TenantRepository {
  async findById(id) { /* ... */ }
  async create(data) { /* ... */ }
  async update(id, data) { /* ... */ }
}
```

### 2. Service Layer
Centraliza regras de negócio.

```javascript
// services/tenant.service.js
class TenantService {
  constructor(tenantRepository) {
    this.repository = tenantRepository;
  }
  
  async createTenant(data) {
    // Validações, regras, etc.
    return this.repository.create(data);
  }
}
```

### 3. Factory Pattern
Cria fluxos de bot dinamicamente.

```javascript
// flows/bot.factory.js
class BotFactory {
  static getFlow(type, tenant) {
    switch(type) {
      case 'sales': return new SalesFlow(tenant);
      case 'support': return new SupportFlow(tenant);
      default: return new DefaultFlow(tenant);
    }
  }
}
```

### 4. Observer Pattern
Para webhooks e eventos.

```javascript
// integrations/evolution/webhook.handler.js
class WebhookHandler {
  constructor() {
    this.listeners = [];
  }
  
  subscribe(listener) {
    this.listeners.push(listener);
  }
  
  notify(event) {
    this.listeners.forEach(l => l.handle(event));
  }
}
```

## 🔒 Segurança

### Medidas Implementadas
1. **Autenticação API Key** por tenant
2. **Validação de origem** dos webhooks
3. **Rate limiting** por tenant/IP
4. **Sanitização de inputs**
5. **Logs de auditoria** de todas as ações
6. **Criptografia** de dados sensíveis

### Headers de Segurança
```javascript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  next();
});
```

## 📈 Escalabilidade

### Horizontal
- Múltiplas instâncias Node.js
- Load balancer distribuindo requisições
- Session store compartilhada (Redis)

### Vertical
- Aumento de recursos (CPU, RAM)
- Otimização de queries
- Cache estratégico

### Considerações Multi-Tenant
- Isolamento de performance por tenant
- Rate limiting individual
- Filas separadas por prioridade

---

**Versão do Documento**: 1.0.0  
**Última Atualização**: Janeiro 2025  
**Responsável**: Equipe de Arquitetura DiixWhatsapp

## 🔗 Links Relacionados

- [Visão Geral](./01-visao-geral.md)
- [Guia Multi-Tenant](./03-multi-tenant.md)
- [Referência da API](./11-api-reference.md)
