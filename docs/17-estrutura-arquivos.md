# 📁 Estrutura de Arquivos do Projeto DiixWhatsapp

Este documento descreve a organização completa de arquivos e diretórios do projeto.

## 🌳 Árvore de Diretórios Completa

```
/workspace
│
├── 📄 README.md                    # Documentação principal do projeto
├── 📄 package.json                 # Dependências e scripts NPM
├── 📄 package-lock.json            # Lock das dependências
├── 📄 .env.example                 # Template de variáveis de ambiente
├── 📄 .gitignore                   # Arquivos ignorados pelo Git
│
├── 📂 docs/                        # Documentação completa
│   ├── 📄 README.md               # Índice da documentação
│   ├── 📄 00-getting-started.md   # Guia de inicialização
│   ├── 📄 01-visao-geral.md       # Visão geral do projeto
│   ├── 📄 02-arquitetura.md       # Arquitetura do sistema
│   ├── 📄 03-multi-tenant.md      # Guia multi-tenant
│   ├── 📄 13-estado-atual.md      # Estado atual do desenvolvimento
│   ├── 📄 14-roadmap.md           # Roadmap do projeto
│   ├── 📄 15-changelog.md         # Histórico de versões
│   └── 📄 16-status-instalacao.md # Status da instalação
│
├── 📂 prisma/                      # Configuração do banco de dados
│   └── 📄 schema.prisma           # Schema Prisma (8 models)
│
├── 📂 src/                         # Código fonte principal
│   │
│   ├── 📄 server.js               # Entry point da aplicação
│   ├── 📄 app.js                  # Configuração do Express
│   │
│   ├── 📂 config/                 # Configurações
│   │   ├── 📄 index.js            # Configurações gerais
│   │   └── 📄 database.js         # Conexão com Prisma
│   │
│   ├── 📂 middleware/             # Middlewares
│   │   └── 📄 tenant.js           # Identificação e limites do tenant
│   │
│   ├── 📂 models/                 # Repositories (Data Access Layer)
│   │   ├── 📄 BaseRepository.js   # Repository base genérico
│   │   └── 📄 TenantRepository.js # Repository específico de Tenant
│   │
│   ├── 📂 services/               # Serviços de negócio
│   │   └── 📄 EvolutionApiService.js # Integração com Evolution API
│   │
│   ├── 📂 controllers/            # Controladores HTTP (A FAZER)
│   │   ├── 📄 TenantController.js
│   │   ├── 📄 AccountController.js
│   │   ├── 📄 MessageController.js
│   │   ├── 📄 ConversationController.js
│   │   ├── 📄 OrderController.js
│   │   └── 📄 WebhookController.js
│   │
│   ├── 📂 routes/                 # Rotas da API (A FAZER)
│   │   ├── 📄 index.js            # Agregador de rotas
│   │   ├── 📄 tenant.routes.js
│   │   ├── 📄 account.routes.js
│   │   ├── 📄 message.routes.js
│   │   ├── 📄 conversation.routes.js
│   │   ├── 📄 order.routes.js
│   │   └── 📄 webhook.routes.js
│   │
│   ├── 📂 bot/                    # Lógica do Bot de Vendas (A FAZER)
│   │   ├── 📄 BotStateMachine.js  # Máquina de estados
│   │   ├── 📄 SalesFlow.js        # Fluxo de vendas
│   │   ├── 📄 CatalogService.js   # Catálogo de produtos
│   │   └── 📄 OrderProcessor.js   # Processador de pedidos
│   │
│   ├── 📂 evolution/              # Módulos Evolution API (A FAZER)
│   │   ├── 📄 WebhookHandler.js   # Handler de webhooks
│   │   └── 📄 MessageQueue.js     # Fila de mensagens
│   │
│   ├── 📂 multi-tenant/           # Módulos Multi-Tenant (A FAZER)
│   │   ├── 📄 TenantContext.js    # Contexto do tenant
│   │   └── 📄 IsolationStrategy.js # Estratégia de isolamento
│   │
│   ├── 📂 utils/                  # Utilitários (A FAZER)
│   │   ├── 📄 logger.js           # Logger configurável
│   │   ├── 📄 validators.js       # Validações genéricas
│   │   ├── 📄 helpers.js          # Funções auxiliares
│   │   └── 📄 constants.js        # Constantes do sistema
│   │
│   └── 📂 validators/             # Validações Específicas (A FAZER)
│       ├── 📄 tenant.validator.js
│       ├── 📄 account.validator.js
│       └── 📄 message.validator.js
│
├── 📂 tests/                       # Testes automatizados (A FAZER)
│   ├── 📂 unit/                   # Testes unitários
│   ├── 📂 integration/            # Testes de integração
│   └── 📂 e2e/                    # Testes end-to-end
│
├── 📂 scripts/                     # Scripts utilitários (A FAZER)
│   ├── 📄 seed.js                 # Popula banco com dados iniciais
│   ├── 📄 migrate.js              # Script de migração customizado
│   └── 📄 setup.sh                # Script de setup automático
│
├── 📂 uploads/                     # Arquivos uploadados (Git ignored)
│   ├── 📂 images/
│   ├── 📂 audios/
│   ├── 📂 documents/
│   └── 📂 qrcodes/
│
└── 📂 node_modules/                # Dependências (Git ignored)
```

---

## 📊 Resumo por Diretório

| Diretório | Finalidade | Status | Arquivos |
|-----------|------------|--------|----------|
| `docs/` | Documentação | ✅ Completo | 9 |
| `prisma/` | Banco de dados | ✅ Completo | 1 |
| `src/config/` | Configurações | ✅ Completo | 2 |
| `src/middleware/` | Middlewares | ✅ Completo | 1 |
| `src/models/` | Repositories | ✅ Completo | 2 |
| `src/services/` | Serviços | ✅ Completo | 1 |
| `src/controllers/` | Controladores | ❌ Pendente | 0/6 |
| `src/routes/` | Rotas | ❌ Pendente | 0/7 |
| `src/bot/` | Bot de vendas | ❌ Pendente | 0/4 |
| `src/evolution/` | Evolution API | ❌ Pendente | 0/2 |
| `src/multi-tenant/` | Multi-tenant | ❌ Pendente | 0/2 |
| `src/utils/` | Utilitários | ❌ Pendente | 0/4 |
| `src/validators/` | Validações | ❌ Pendente | 0/3 |
| `tests/` | Testes | ❌ Pendente | 0 |
| `scripts/` | Scripts | ❌ Pendente | 0/3 |
| `uploads/` | Uploads | ⚠️ Vazio | - |

**Total:** 16/44 arquivos implementados (~36%)

---

## 📝 Descrição dos Arquivos Principais

### Raiz (`/`)

#### `README.md`
Documentação principal com visão geral, instalação rápida, funcionalidades e links.

#### `package.json`
Configuração do projeto NPM com:
- Nome, versão, descrição
- Dependências de produção e desenvolvimento
- Scripts NPM (dev, start, test, db:migrate, etc.)
- Metadata do projeto

#### `.env.example`
Template de variáveis de ambiente para copiar e configurar.

#### `.gitignore`
Arquivos e diretórios ignorados pelo Git (node_modules, .env, uploads, etc.)

---

### Documentação (`docs/`)

| Arquivo | Descrição | Linhas |
|---------|-----------|--------|
| `README.md` | Índice e navegação | ~100 |
| `00-getting-started.md` | Guia passo-a-passo de instalação | ~340 |
| `01-visao-geral.md` | Visão geral, casos de uso, funcionalidades | ~150 |
| `02-arquitetura.md` | Arquitetura, diagramas, padrões | ~440 |
| `03-multi-tenant.md` | Guia completo multi-tenant | ~550 |
| `13-estado-atual.md` | Status do desenvolvimento | ~410 |
| `14-roadmap.md` | Roadmap Q1-Q4 2025 | ~420 |
| `15-changelog.md` | Histórico de versões | ~220 |
| `16-status-instalacao.md` | Status da instalação | ~280 |

**Total:** ~2.500 linhas de documentação

---

### Banco de Dados (`prisma/`)

#### `schema.prisma`
Schema completo com 8 models:
1. **Tenant** - Lojas/empresas multi-tenant
2. **User** - Usuários do sistema
3. **WhatsAppAccount** - Contas WhatsApp
4. **Message** - Mensagens
5. **Conversation** - Conversas/atendimentos
6. **Order** - Pedidos/vendas
7. **TenantConfig** - Configurações por tenant
8. **AuditLog** - Logs de auditoria

---

### Código Fonte (`src/`)

#### Core

##### `server.js`
Entry point da aplicação:
- Inicializa conexão com banco de dados
- Inicia servidor Express
- Configura graceful shutdown
- Exibe banner informativo

##### `app.js`
Configuração do Express:
- Middlewares de segurança (helmet, cors)
- Body parsers
- Logger (morgan)
- Health check
- Error handler global

---

#### Config (`config/`)

##### `index.js`
Configurações gerais da aplicação:
- Servidor (port, host, env)
- Database URL
- Evolution API (url, apiKey)
- JWT (secret, expiresIn)
- Multi-tenant limits
- Redis config
- Webhook URL
- Log level
- Upload directory

##### `database.js`
Configuração do Prisma Client:
- Instância singleton
- Logging configurado

---

#### Middleware (`middleware/`)

##### `tenant.js`
Middlewares multi-tenant:
- `identifyTenant` - Identifica tenant por header, subdomínio ou path
- `checkTenantLimits` - Valida limites do tenant
- `auditLog` - Registra auditoria (placeholder)

---

#### Models (`models/`)

##### `BaseRepository.js`
Classe base para repositories:
- findAll()
- findById()
- create()
- update()
- delete()
- count()
- findPaginated()

##### `TenantRepository.js`
Repository específico para Tenant:
- findBySlug()
- findByIdWithRelations()
- checkLimits()
- updateStatus()
- listAll()

---

#### Services (`services/`)

##### `EvolutionApiService.js`
Serviço completo de integração com Evolution API:
- createInstance()
- connectInstance()
- getQrCode()
- sendTextMessage()
- sendImageMessage()
- sendAudioMessage()
- sendDocumentMessage()
- sendButtonMessage()
- sendListMessage()
- deleteInstance()
- checkConnection()
- logoutInstance()
- listInstances()

---

### Diretórios Pendentes

#### Controllers (`controllers/`)
Controladores HTTP para cada resource da API.

#### Routes (`routes/`)
Definição de rotas RESTful.

#### Bot (`bot/`)
Máquina de estados e fluxos de venda.

#### Evolution (`evolution/`)
Handlers específicos da Evolution API.

#### Multi-Tenant (`multi-tenant/`)
Módulos avançados de isolamento.

#### Utils (`utils/`)
Funções utilitárias e helpers.

#### Validators (`validators/`)
Validações de entrada específicas.

---

## 🔄 Fluxo de Dados

```
Request HTTP
    ↓
Middleware (CORS, Helmet, Morgan)
    ↓
Middleware identifyTenant → Extrai tenant do request
    ↓
Middleware checkTenantLimits → Valida limites
    ↓
Router → Rota específica
    ↓
Controller → Lógica HTTP
    ↓
Service → Regras de negócio
    ↓
Repository → Acesso a dados
    ↓
Prisma → Banco de dados
    ↓
Response HTTP
```

---

## 📦 Dependências do Projeto

### Produção (9 pacotes)
- express
- cors
- dotenv
- helmet
- morgan
- uuid
- axios
- dayjs
- @prisma/client

### Desenvolvimento (5 pacotes)
- nodemon
- jest
- eslint
- @babel/preset-env
- babel-jest

### Sistema
- prisma (CLI)

---

## 🎯 Próximos Arquivos a Criar

### Prioridade Alta
1. `src/controllers/TenantController.js`
2. `src/controllers/AccountController.js`
3. `src/routes/index.js`
4. `src/routes/tenant.routes.js`
5. `src/routes/account.routes.js`
6. `src/validators/tenant.validator.js`

### Prioridade Média
7. `src/bot/BotStateMachine.js`
8. `src/evolution/WebhookHandler.js`
9. `src/utils/logger.js`
10. `scripts/seed.js`

### Prioridade Baixa
11. Testes unitários
12. Testes de integração
13. Scripts de deploy

---

## 📈 Estatísticas

- **Diretórios principais:** 16
- **Arquivos implementados:** 16
- **Arquivos pendentes:** ~28
- **Linhas de código (estimado):** ~800
- **Linhas de documentação:** ~2.500
- **Progresso geral:** ~36%

---

**Última atualização:** Janeiro 2025  
**Versão:** 1.0.0-alpha
