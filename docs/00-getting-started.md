# 🚀 Guia de Inicialização do Projeto DiixWhatsapp

Este guia fornece os passos completos para configurar e iniciar o projeto **DiixWhatsapp** em seu ambiente de desenvolvimento.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** >= 20.x ([Download](https://nodejs.org/))
- **PostgreSQL** >= 14.x ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))
- **Evolution API** (instância rodando) ([Docs](https://evolution-api.com/))

### Verificar versões

```bash
node -v          # Deve ser v20.x ou superior
npm -v           # Deve ser 9.x ou superior
psql --version   # Deve ser 14.x ou superior
```

---

## 🛠️ Passo a Passo de Configuração

### 1. Clonar o Repositório

```bash
cd /workspace
git clone <url-do-repositorio> .
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e ajuste as variáveis:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Servidor
NODE_ENV=development
PORT=3000
HOST=localhost

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/diix_whatsapp?schema=public"

# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua_chave_aqui

# JWT Secret
JWT_SECRET=seu_segredo_super_forte_mude_em_producao
JWT_EXPIRES_IN=7d

# Multi-Tenant
DEFAULT_TENANT_LIMIT_ACCOUNTS=5
DEFAULT_TENANT_LIMIT_MESSAGES=1000

# Redis (Opcional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Webhook URL
WEBHOOK_URL=http://localhost:3000/webhook

# Log Level
LOG_LEVEL=debug

# Upload Directory
UPLOAD_DIR=./uploads
```

### 4. Configurar Banco de Dados

#### 4.1 Criar Banco de Dados PostgreSQL

```bash
# Acessar PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE diix_whatsapp;

# Criar usuário (opcional)
CREATE USER diix_user WITH PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE diix_whatsapp TO diix_user;

# Sair
\q
```

#### 4.2 Gerar Cliente Prisma

```bash
npm run db:generate
```

#### 4.3 Rodar Migrations

```bash
npm run db:migrate
```

Isso criará todas as tabelas necessárias no banco de dados:
- `Tenant` (Lojas/Empresas)
- `User` (Usuários)
- `WhatsAppAccount` (Contas WhatsApp)
- `Message` (Mensagens)
- `Conversation` (Conversas)
- `Order` (Pedidos/Vendas)
- `TenantConfig` (Configurações)
- `AuditLog` (Logs de Auditoria)

### 5. Configurar Evolution API

Certifique-se de ter uma instância da Evolution API rodando. Consulte a documentação oficial:

👉 [Documentação Evolution API](https://evolution-api.com/)

#### Configuração mínima:

```env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua_api_key
```

### 6. Iniciar o Servidor

#### Modo Desenvolvimento (com hot-reload):

```bash
npm run dev
```

#### Modo Produção:

```bash
npm start
```

---

## ✅ Verificando a Instalação

Após iniciar o servidor, você deve ver:

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 DiixWhatsapp API                                     ║
║                                                           ║
║   Servidor rodando em: http://localhost:3000              ║
║   Ambiente: development                                   ║
║                                                           ║
║   Endpoints:                                              ║
║   - Health:   /health                                     ║
║   - API:      /api/v1                                     ║
║   - Webhook:  /webhook                                    ║
║   - Docs:     /docs                                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### Testar Health Check

```bash
curl http://localhost:3000/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "timestamp": "2025-01-XX...",
  "uptime": 123.456,
  "environment": "development"
}
```

---

## 📁 Estrutura do Projeto

```
/workspace
├── docs/                    # Documentação completa
│   ├── README.md
│   ├── 01-visao-geral.md
│   ├── 02-arquitetura.md
│   ├── 03-multi-tenant.md
│   ├── 13-estado-atual.md
│   ├── 14-roadmap.md
│   └── 15-changelog.md
├── prisma/
│   └── schema.prisma        # Schema do banco de dados
├── src/
│   ├── config/              # Configurações
│   │   ├── index.js         # Config geral
│   │   └── database.js      # Conexão DB
│   ├── controllers/         # Controladores
│   ├── middleware/          # Middlewares
│   │   └── tenant.js        # Multi-tenant
│   ├── models/              # Repositories
│   │   ├── BaseRepository.js
│   │   └── TenantRepository.js
│   ├── routes/              # Rotas da API
│   ├── services/            # Serviços
│   │   └── EvolutionApiService.js
│   ├── utils/               # Utilitários
│   ├── validators/          # Validações
│   ├── bot/                 # Lógica do Bot
│   ├── evolution/           # Integração Evolution
│   ├── multi-tenant/        # Módulos multi-tenant
│   ├── app.js               # App Express
│   └── server.js            # Entry point
├── tests/                   # Testes
├── scripts/                 # Scripts utilitários
├── uploads/                 # Arquivos uploadados
├── .env.example             # Exemplo de env
├── .gitignore               # Git ignore
├── package.json             # Dependências
└── README.md                # Doc principal
```

---

## 🔧 Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia em modo desenvolvimento (hot-reload) |
| `npm start` | Inicia em modo produção |
| `npm test` | Roda testes unitários |
| `npm run test:watch` | Roda testes em watch mode |
| `npm run lint` | Verifica código com ESLint |
| `npm run lint:fix` | Corrige problemas de lint |
| `npm run db:migrate` | Cria/executa migrations |
| `npm run db:generate` | Gera cliente Prisma |
| `npm run db:seed` | Popula banco com dados iniciais |
| `npm run db:studio` | Abre Prisma Studio (GUI) |

---

## 🎯 Primeiros Passos Após Instalação

### 1. Criar Primeiro Tenant

Use o script de seed ou crie manualmente via API:

```bash
POST http://localhost:3000/api/v1/tenants
Content-Type: application/json

{
  "name": "Minha Loja",
  "slug": "minha-loja",
  "email": "contato@minhaloja.com.br",
  "phone": "+5511999999999",
  "plan": "basic"
}
```

### 2. Criar Conta WhatsApp

```bash
POST http://localhost:3000/api/v1/accounts
X-Tenant-ID: <tenant-id>
Content-Type: application/json

{
  "name": "Atendimento Principal",
  "phoneNumber": "+5511999999999"
}
```

### 3. Conectar WhatsApp

A API retornará um QR Code para escanear com o WhatsApp.

---

## 🐛 Solução de Problemas

### Erro: "DATABASE_URL não definida"

**Solução:** Verifique se o arquivo `.env` existe e contém a variável `DATABASE_URL`.

### Erro: "Prisma Client não gerado"

**Solução:** Execute `npm run db:generate`.

### Erro: "Evolution API indisponível"

**Solução:** Verifique se a Evolution API está rodando e se a URL/API Key estão corretas.

### Erro: "Porta 3000 já em uso"

**Solução:** Altere a porta no `.env` ou encerre o processo usando:

```bash
lsof -ti:3000 | xargs kill
```

---

## 📚 Próximos Passos

1. 📖 Leia a [documentação completa](./docs/README.md)
2. 🔍 Explore a [arquitetura do sistema](./docs/02-arquitetura.md)
3. 🏢 Entenda o modelo [multi-tenant](./docs/03-multi-tenant.md)
4. 🤖 Configure o [bot de vendas](./docs/04-bot-vendas.md)
5. 📊 Veja o [estado atual do projeto](./docs/13-estado-atual.md)

---

## 🆘 Suporte

- 📧 Email: suporte@diixwhatsapp.com
- 📚 Docs: `/docs`
- 🐛 Issues: GitHub Issues
- 💬 Discord: [link do discord]

---

**Versão:** 1.0.0-alpha  
**Última atualização:** Janeiro 2025
