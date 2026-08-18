# DiixWhatsapp - Backend API Only

## 🎯 Visão Geral

**DiixWhatsapp** é uma plataforma completa de automação de vendas e atendimento via WhatsApp, projetada para empresas que desejam escalar suas operações de comunicação com clientes.

Este projeto é **backend-only**, fornecendo uma API RESTful completa para integração com qualquer frontend ou sistema externo.

---

## 📋 Funcionalidades Principais

### Core do Sistema
- ✅ **Arquitetura Multi-Tenant**: Isolamento completo entre lojas/tenants
- ✅ **Bot de Vendas**: Automação inteligente de atendimento e vendas
- ✅ **Múltiplas Contas WhatsApp**: Vincule várias contas por loja
- ✅ **Configurações Personalizadas**: Regras de negócio independentes por tenant
- ✅ **Fluxos Conversacionais**: Jornadas de atendimento customizáveis
- ✅ **Webhooks em Tempo Real**: Integração bidirecional com Evolution API

### Banco de Dados e Performance
- ✅ **PostgreSQL**: Banco de dados principal com Prisma ORM
- ✅ **Redis Integrado**: Cache distribuído e gerenciamento de filas
- ✅ **Health Checks**: Monitoramento contínuo de todas as conexões
- ✅ **Graceful Shutdown**: Encerramento seguro de todas as conexões

### Gestão e Segurança
- ✅ **Autenticação JWT**: Segurança em todas as requisições
- ✅ **Rate Limiting**: Controle de requisições por tenant
- ✅ **Logs de Auditoria**: Rastreabilidade completa das operações
- ✅ **Isolamento de Dados**: Cada tenant acessa apenas seus dados

---

## 🚀 Tecnologias Utilizadas

| Categoria | Tecnologias |
|-----------|-------------|
| Runtime & Framework | Node.js 20.x, Express.js 5.x, ECMAScript 6+ |
| Banco de Dados | PostgreSQL 15+, Prisma ORM |
| Cache | Redis 7+, ioredis |
| API & Integração | Evolution API, WhatsApp Business API |
| Segurança | JWT, bcryptjs, helmet, cors |
| Testes | Jest |

---

## 📦 Instalação

### Pré-requisitos

- Node.js 20.x ou superior
- npm ou yarn
- PostgreSQL
- Redis (opcional, mas recomendado)
- Conta na Evolution API

### Passo a Passo

```bash
# 1. Clonar o repositório
git clone <repository-url>
cd diix-whatsapp

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# 4. Gerar cliente Prisma
npm run db:generate

# 5. Rodar migrações
npm run db:migrate

# 6. Iniciar servidor (desenvolvimento)
npm run dev

# 7. Iniciar servidor (produção)
npm start
```

---

## 🔧 Variáveis de Ambiente

Crie um arquivo `.env` baseado em `.env.example`:

```env
# Servidor
PORT=3000
HOST=localhost
NODE_ENV=development

# Banco de Dados (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/diix_whatsapp?schema=public"

# Redis
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="24h"

# CORS
CORS_ORIGIN=*

# Evolution API
EVOLUTION_API_URL=https://your-evolution-api.com
EVOLUTION_API_KEY=your-api-key
```

---

## 📡 Endpoints da API

### Base URL
```
http://localhost:3000/api/v1
```

### Health Check
```
GET /health
```

### API Info
```
GET /api
```

---

## 🔐 Autenticação

### Login
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "name": "Admin",
      "role": "SUPER_ADMIN",
      "tenant": {...}
    }
  }
}
```

### Uso do Token
Inclua o token no header das requisições:
```
Authorization: Bearer <token>
```

---

## 📚 Rotas da API

### Autenticação
| Método | Endpoint | Descrição | Acesso |
|--------|----------|-----------|--------|
| POST | `/auth/login` | Login de usuário | Público |
| POST | `/auth/register` | Registro de usuário | TENANT_ADMIN, SUPER_ADMIN |
| GET | `/auth/me` | Dados do usuário autenticado | Privado |
| PUT | `/auth/profile` | Atualizar perfil | Privado |
| PUT | `/auth/change-password` | Alterar senha | Privado |

### Administração (SUPER_ADMIN)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/admin/stats` | Estatísticas globais |
| GET | `/admin/tenants` | Listar tenants |
| POST | `/admin/tenants` | Criar tenant |
| GET | `/admin/tenants/:id` | Obter tenant |
| PUT | `/admin/tenants/:id` | Atualizar tenant |
| PUT | `/admin/tenants/:id/block` | Bloquear/Desbloquear tenant |
| DELETE | `/admin/tenants/:id` | Deletar tenant |

### Produtos (Multi-Tenant)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/products` | Listar produtos do tenant |
| GET | `/products/categories` | Listar categorias |
| GET | `/products/:id` | Obter produto |
| POST | `/products` | Criar produto |
| PUT | `/products/:id` | Atualizar produto |
| DELETE | `/products/:id` | Deletar produto |

---

## 🗄️ Modelo de Dados

### Principais Entidades

#### Tenant
- `id`, `name`, `slug`, `email`, `phone`
- `plan`, `status`, `maxAccounts`, `maxMessages`
- `trialEndsAt`, `createdAt`, `updatedAt`

#### User
- `id`, `tenantId`, `email`, `password`, `name`
- `role` (SUPER_ADMIN, TENANT_ADMIN, ATTENDANT, VIEWER)
- `status`, `lastLogin`, `createdAt`, `updatedAt`

#### WhatsAppAccount
- `id`, `tenantId`, `name`, `instanceId`, `phoneNumber`
- `status`, `webhookUrl`, `apiKey`, `qrcode`
- `lastConnection`, `createdAt`, `updatedAt`

#### Product
- `id`, `tenantId`, `name`, `description`, `sku`
- `price`, `costPrice`, `stock`, `category`
- `images`, `active`, `featured`, `metadata`
- `createdAt`, `updatedAt`

#### Message
- `id`, `tenantId`, `accountId`, `direction`
- `fromNumber`, `toNumber`, `content`, `messageType`
- `status`, `metadata`, `conversationId`
- `createdAt`, `updatedAt`

#### Conversation
- `id`, `tenantId`, `accountId`, `contactNumber`
- `contactName`, `status`, `stage`, `assignedTo`
- `metadata`, `createdAt`, `updatedAt`

#### Order
- `id`, `tenantId`, `conversationId`, `customerId`
- `customerName`, `customerPhone`, `totalAmount`
- `status`, `items`, `paymentMethod`, `paymentStatus`
- `notes`, `createdAt`, `updatedAt`

---

## 🔒 Roles e Permissões

### SUPER_ADMIN
- Acesso total à plataforma
- Gerencia todos os tenants
- Visualiza estatísticas globais
- Pode acessar dados de qualquer tenant

### TENANT_ADMIN
- Gerencia seu próprio tenant
- Cria usuários no seu tenant
- Gerencia produtos e configurações
- Visualiza relatórios do seu tenant

### ATTENDANT
- Atende clientes no WhatsApp
- Visualiza conversas do seu tenant
- Gerencia pedidos
- Acesso limitado a configurações

### VIEWER
- Apenas visualização de dados
- Sem permissão de edição
- Relatórios e dashboards

---

## 🧪 Testes

```bash
# Rodar todos os testes
npm test

# Rodar testes em modo watch
npm run test:watch

# Rodar lint
npm run lint

# Corrigir lint
npm run lint:fix
```

---

## 🛠️ Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor em modo desenvolvimento (nodemon) |
| `npm start` | Inicia servidor em produção |
| `npm test` | Roda testes com Jest |
| `npm run test:watch` | Roda testes em modo watch |
| `npm run lint` | Verifica código com ESLint |
| `npm run lint:fix` | Corrige problemas de lint |
| `npm run db:migrate` | Roda migrações do banco |
| `npm run db:generate` | Gera cliente Prisma |
| `npm run db:seed` | Popula banco com dados iniciais |
| `npm run db:studio` | Abre Prisma Studio |

---

## 📊 Arquitetura

```
┌─────────────────────────────────────────────┐
│              Client/API Consumer            │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│           Express Server (app.js)           │
│  - Security (helmet, cors)                  │
│  - Authentication (JWT)                     │
│  - Rate Limiting                            │
│  - Request Logging (morgan)                 │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│              API Routes                     │
│  - /api/v1/auth/*                           │
│  - /api/v1/admin/*                          │
│  - /api/v1/products/*                       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│              Controllers                    │
│  - auth.controller.js                       │
│  - admin.controller.js                      │
│  - product.controller.js                    │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│              Services                       │
│  - EvolutionApiService.js                   │
│  - TenantRepository.js                      │
│  - BaseRepository.js                        │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
┌─────────────────┐ ┌─────────────────┐
│   PostgreSQL    │ │     Redis       │
│   (Prisma ORM)  │ │    (Cache)      │
└─────────────────┘ └─────────────────┘
```

---

## 🚀 Deploy

### Produção

1. Configure variáveis de ambiente para produção
2. Defina `NODE_ENV=production`
3. Use um processo manager como PM2:
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name diix-whatsapp
   pm2 save
   pm2 startup
   ```

### Docker (Opcional)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run db:generate

EXPOSE 3000

CMD ["node", "src/server.js"]
```

---

## 📝 Changelog

Veja [CHANGELOG.md](docs/15-changelog.md) para histórico de mudanças.

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.

---

## 📞 Suporte

Para dúvidas e suporte, abra uma issue no repositório ou entre em contato com a equipe.
