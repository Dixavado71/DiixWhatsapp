# ===========================================
# Documentação de Banco de Dados e Cache
# DiixWhatsapp - Sistema Multi-Tenant
# ===========================================

Este documento descreve as opções de banco de dados suportadas pelo DiixWhatsapp e como configurá-las corretamente.

---

## 📊 Índice

1. [Visão Geral](#visão-geral)
2. [PostgreSQL](#postgresql)
3. [MongoDB](#mongodb)
4. [Redis (Cache)](#redis-cache)
5. [Comparativo](#comparativo)
6. [Configuração](#configuração)
7. [Migração entre Bancos](#migração-entre-bancos)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O **DiixWhatsapp** suporta dois bancos de dados principais através do **Prisma ORM**:

| Banco de Dados | Tipo | Caso de Uso Recomendado |
|----------------|------|------------------------|
| **PostgreSQL** | Relacional (SQL) | Dados estruturados, transações ACID, integridade referencial |
| **MongoDB**    | Documental (NoSQL) | Flexibilidade de schema, documentos JSON, escalabilidade horizontal |

Além disso, o sistema utiliza **Redis** para:
- Cache de consultas frequentes
- Rate limiting
- Filas de mensagens
- Sessões de usuário

---

## 🐘 PostgreSQL

### Quando Usar

✅ **Recomendado para:**
- Sistemas que exigem integridade referencial forte
- Transações complexas (ACID)
- Relacionamentos complexos entre entidades
- Relatórios e queries analíticas
- Ambiente de produção empresarial

### Características

- **Tipo:** Banco de dados relacional
- **ORM:** Prisma ORM
- **Schema:** Definido em `prisma/schema.prisma`
- **Migrations:** Automáticas via Prisma Migrate

### Configuração

```bash
# .env
DB_PROVIDER=postgresql
DATABASE_URL="postgresql://usuario:senha@localhost:5432/diix_whatsapp?schema=public"
```

### Instalação do PostgreSQL

#### Docker (Recomendado para Desenvolvimento)

```bash
docker run --name diix-postgres \
  -e POSTGRES_USER=diix_user \
  -e POSTGRES_PASSWORD=diix_password \
  -e POSTGRES_DB=diix_whatsapp \
  -p 5432:5432 \
  -d postgres:15-alpine
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Criar banco de dados
sudo -u postgres psql
CREATE DATABASE diix_whatsapp;
CREATE USER diix_user WITH PASSWORD 'diix_password';
GRANT ALL PRIVILEGES ON DATABASE diix_whatsapp TO diix_user;
\q
```

#### Windows/macOS

Baixe em: https://www.postgresql.org/download/

### Comandos Prisma (PostgreSQL)

```bash
# Gerar cliente Prisma
npm run db:generate

# Criar migration
npm run db:migrate

# Abrir Prisma Studio
npm run db:studio

# Seed (popular banco com dados iniciais)
npm run db:seed
```

---

## 🍃 MongoDB

### Quando Usar

✅ **Recomendado para:**
- Schemas flexíveis e em evolução
- Documentos JSON nativos
- Alta escalabilidade horizontal
- Catálogos de produtos variáveis
- Logs e dados de telemetria

### Características

- **Tipo:** Banco de dados documental
- **ORM:** Prisma ORM (com provider MongoDB)
- **Schema:** Definido em `prisma/schema.prisma`
- **Documents:** Armazenados como BSON/JSON

### Configuração

```bash
# .env
DB_PROVIDER=mongodb
MONGODB_URI="mongodb://localhost:27017/diix_whatsapp"
```

### Instalação do MongoDB

#### Docker (Recomendado para Desenvolvimento)

```bash
docker run --name diix-mongodb \
  -p 27017:27017 \
  -d mongo:7
```

#### Linux (Ubuntu/Debian)

```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Windows/macOS

Baixe em: https://www.mongodb.com/try/download/community

### Comandos Prisma (MongoDB)

```bash
# Gerar cliente Prisma
npm run db:generate

# Criar migration (MongoDB usa push)
npx prisma db push

# Abrir Prisma Studio
npm run db:studio
```

### Diferenças no Schema Prisma

Para MongoDB, altere o `provider` no `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mongodb"
  url      = env("MONGODB_URI")
}

// Modelos precisam ter campo _id explícito
model Tenant {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  // ... demais campos
}
```

---

## 🔴 Redis (Cache)

### Quando Usar

✅ **Recomendado para:**
- Cache de consultas frequentes
- Rate limiting de API
- Filas de mensagens em tempo real
- Sessões de usuário
- Contadores e métricas em tempo real

### Configuração

```bash
# .env
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Instalação do Redis

#### Docker (Recomendado)

```bash
docker run --name diix-redis \
  -p 6379:6379 \
  -d redis:7-alpine
```

#### Linux

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

### Utilização no Código

```javascript
import { cache } from './config/redis.js';

// Set no cache (TTL: 1 hora)
await cache.set('tenant:123', tenantData, 3600);

// Get do cache
const tenant = await cache.get('tenant:123');

// Delete do cache
await cache.delete('tenant:123');

// Incrementar contador
const count = await cache.increment('messages:today', 1);

// Pattern delete (remover múltiplas chaves)
await cache.deletePattern('session:*');
```

---

## 📊 Comparativo

| Recurso | PostgreSQL | MongoDB | Redis |
|---------|------------|---------|-------|
| **Tipo** | Relacional | Documental | Key-Value |
| **Schema** | Fixo | Flexível | Nenhum |
| **Transações** | ✅ Completa (ACID) | ✅ Limitada | ❌ |
| **Consultas Complexas** | ✅ Excelente | ⚠️ Limitada | ❌ |
| **Escalabilidade Horizontal** | ⚠️ Moderada | ✅ Excelente | ✅ Excelente |
| **Cache** | ⚠️ Via aplicação | ⚠️ Via aplicação | ✅ Nativo |
| **Velocidade Leitura** | 🟡 Rápida | 🟡 Rápida | 🟢 Muito Rápida |
| **Uso Principal** | Dados estruturados | Documentos JSON | Cache/Filas |

---

## ⚙️ Configuração

### Escolhendo o Banco de Dados

1. **Para maioria dos casos:** Use **PostgreSQL**
   - Mais maduro para sistemas multi-tenant
   - Melhor suporte a transações
   - Integridade referencial garantida

2. **Para flexibilidade:** Use **MongoDB**
   - Schema menos rígido
   - Fácil evolução do modelo de dados
   - Melhor para catálogos variados

3. **Redis:** Sempre use se possível
   - Melhora performance em 10x-100x
   - Reduz carga no banco principal
   - Essencial para rate limiting

### Exemplo de Configuração Completa

#### PostgreSQL + Redis (Recomendado)

```bash
# .env
DB_PROVIDER=postgresql
DATABASE_URL="postgresql://user:pass@localhost:5432/diix_whatsapp?schema=public"

REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### MongoDB + Redis

```bash
# .env
DB_PROVIDER=mongodb
MONGODB_URI="mongodb://localhost:27017/diix_whatsapp"

REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### Apenas PostgreSQL (Sem Redis)

```bash
# .env
DB_PROVIDER=postgresql
DATABASE_URL="postgresql://user:pass@localhost:5432/diix_whatsapp?schema=public"

REDIS_ENABLED=false
```

---

## 🔄 Migração entre Bancos

### PostgreSQL → MongoDB

1. Exporte dados do PostgreSQL:
```bash
npx prisma db seed
# Ou use pg_dump
pg_dump -U user diix_whatsapp > backup.sql
```

2. Altere configuração:
```bash
# .env
DB_PROVIDER=mongodb
MONGODB_URI="mongodb://localhost:27017/diix_whatsapp"
```

3. Ajuste schema para MongoDB:
```prisma
// prisma/schema.prisma
datasource db {
  provider = "mongodb"
  url      = env("MONGODB_URI")
}

// Adicione @db.ObjectId aos IDs
model Tenant {
  id String @id @default(auto()) @map("_id") @db.ObjectId
  // ...
}
```

4. Importe dados:
```bash
# Script personalizado necessário
node scripts/migrate-pg-to-mongo.js
```

### MongoDB → PostgreSQL

Processo inverso, requer transformação de documentos JSON para tabelas relacionais.

---

## 🐛 Troubleshooting

### Erro: "Can't reach database server"

**Solução:**
```bash
# Verifique se o serviço está rodando
docker ps | grep postgres  # ou mongodb

# Teste conexão
psql "postgresql://user:pass@localhost:5432/diix_whatsapp"
# ou
mongosh "mongodb://localhost:27017/diix_whatsapp"
```

### Erro: "Prisma Client não gerado"

**Solução:**
```bash
npm run db:generate
```

### Erro: "Redis connection refused"

**Solução:**
```bash
# Verifique se Redis está rodando
docker ps | grep redis

# Desabilite Redis temporariamente
REDIS_ENABLED=false npm run dev
```

### Performance Lenta

**Soluções:**
1. Habilite Redis para cache
2. Adicione índices nas tabelas/coleções
3. Use conexões pool (já configurado no Prisma)
4. Otimize queries com `select` específico

### Migração Falha

**Solução:**
```bash
# Reset migrations (desenvolvimento apenas!)
npx prisma migrate reset

# Ou force
npx prisma db push --force-reset
```

---

## 📚 Links Úteis

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [Redis Documentation](https://redis.io/docs/)
- [Docker Hub - PostgreSQL](https://hub.docker.com/_/postgres)
- [Docker Hub - MongoDB](https://hub.docker.com/_/mongo)
- [Docker Hub - Redis](https://hub.docker.com/_/redis)

---

**Última atualização:** Dezembro 2024  
**Versão do Documento:** 1.0
