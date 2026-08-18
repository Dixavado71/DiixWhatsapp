# Changelog - DiixWhatsapp

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), 
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não Lançado] - 2025-01-XX

### Adicionado
- Estrutura inicial do projeto multi-tenant
- Integração com Evolution API v1.8
- Middleware de isolamento por tenant
- CRUD completo de tenants e contas WhatsApp
- Sistema básico de bot com saudação e menu
- Webhook handler para mensagens inbound/outbound
- Modelos de dados (Tenant, TenantAccount, Message)
- Repositórios com escopo automático por tenant
- Services layer com validação de limites
- API REST com autenticação via API Key
- Documentação completa (README, docs/)
- Estado atual do projeto detalhado
- Roadmap Q1-Q4 2025

### Em Desenvolvimento
- Bot de vendas avançado com carrinho (70%)
- Dashboard administrativo (40%)
- Transferência para atendente humano (60%)
- Sistema de testes automatizados (30% coverage)

### Modificado
- N/A

### Removido
- N/A

### Corrigido
- N/A

### Segurança
- Implementação de rate limiting por tenant
- Validação de origem de webhooks
- Sanitização de inputs da API
- Logs estruturados com tenant ID

---

## [1.0.0-alpha] - 2025-01-15

### Adicionado
- **Estrutura do Projeto**
  - Setup inicial com Node.js 20.x e Express 4.x
  - Configuração ECMAScript 6+
  - Estrutura de diretórios organizada (MVC + Services + Repositories)
  
- **Multi-Tenant Core**
  - Modelo de dados multi-tenant com MongoDB
  - Middleware `tenantIsolation` para validação em todas as rotas
  - BaseRepository com filtragem automática por tenantId
  - Configurações personalizáveis por tenant (JSONB)
  - Limits e quotas individuais por tenant
  
- **Evolution API Integration**
  - Cliente Evolution API configurado
  - Webhook handler processando eventos:
    - `messages.upsert` (mensagens recebidas)
    - `messages.update` (status de entrega)
    - `connection.update` (status da conexão)
  - Envio de mensagens texto, imagem, documento, áudio
  - Retry automático com backoff exponencial
  - Fila de mensagens outbound
  
- **Gestão de Contas**
  - CRUD completo de TenantAccount
  - Múltiplas contas WhatsApp por tenant
  - Status de conexão em tempo real
  - Configurações individuais por conta
  - Limites diários/mensais por conta
  
- **Sistema de Mensagens**
  - Modelo Message com histórico completo
  - Status tracking (sent, delivered, read, failed)
  - Metadados de conversação (bot flow, step, customer ID)
  - Auditoria completa de todas as mensagens
  
- **Bot Básico**
  - Flow de saudação automática personalizável
  - Menu interativo com opções configuráveis
  - Detecção de palavras-chave simples
  - Respostas automáticas baseadas em patterns
  - Encaminhamento básico para humano
  
- **API REST**
  - Endpoints de Tenants:
    - `POST /api/tenants` - Criar tenant
    - `GET /api/tenants` - Listar tenants (admin)
    - `GET /api/tenants/:id` - Detalhes do tenant
    - `PUT /api/tenants/:id` - Atualizar tenant
    - `DELETE /api/tenants/:id` - Remover tenant
  
  - Endpoints de Contas:
    - `GET /api/tenants/:id/accounts` - Listar contas
    - `POST /api/tenants/:id/accounts` - Criar conta
    - `PUT /api/accounts/:id` - Atualizar conta
    - `DELETE /api/accounts/:id` - Remover conta
  
  - Endpoints de Mensagens:
    - `POST /api/messages/send` - Enviar mensagem
    - `GET /api/messages` - Listar mensagens (filtrado por tenant)
  
  - Outros Endpoints:
    - `POST /api/webhook` - Receber eventos Evolution API
    - `GET /api/status` - Health check do sistema
  
  - Autenticação:
    - API Keys por tenant
    - Middleware de validação de autenticação
    - Headers customizados (`X-Tenant-ID`, `Authorization`)

- **Configuração & Infra**
  - Variáveis de ambiente (.env.example)
  - Configuração de banco de dados MongoDB
  - Setup de Redis para cache/sessions
  - Dockerfile para containerização
  - docker-compose.yml para desenvolvimento
  
- **Documentação**
  - README.md principal completo
  - docs/README.md - Índice de documentação
  - docs/01-visao-geral.md - Visão detalhada do projeto
  - docs/02-arquitetura.md - Arquitetura e diagramas
  - docs/03-multi-tenant.md - Guia completo multi-tenant
  - docs/13-estado-atual.md - Status atual do desenvolvimento
  - docs/14-roadmap.md - Roadmap 2025 completo

### Segurança
- Headers de segurança (Helmet.js)
- Rate limiting por tenant/IP
- Validação de schema de inputs
- Logs de auditoria
- Criptografia de dados sensíveis

### Dependências Principais
```json
{
  "express": "4.18.2",
  "mongoose": "8.0.3",
  "redis": "4.6.12",
  "dotenv": "16.3.1",
  "cors": "2.8.5",
  "helmet": "7.1.0",
  "express-rate-limit": "7.1.5",
  "axios": "1.6.5",
  "uuid": "9.0.1",
  "winston": "3.11.0"
}
```

### Conhecido
- Coverage de testes em 32% (meta: 80% até Março 2025)
- Dashboard em desenvolvimento (40% completo)
- Bot de vendas avançado em implementação (70%)

---

## [0.1.0] - 2024-12-01

### Adicionado
- Pesquisa e validação de arquitetura multi-tenant
- Proof of Concept com Evolution API
- Modelagem inicial de dados
- Definição de stack tecnológico

---

## Tipos de Mudanças

- **Adicionado**: Para novas funcionalidades.
- **Modificado**: Para mudanças em funcionalidades existentes.
- **Deprecated**: Para funcionalidades que serão removidas em breve.
- **Removido**: Para funcionalidades removidas.
- **Corrigido**: Para correções de bugs.
- **Segurança**: Para melhorias de segurança.

---

## Versões

- **[Não Lançado]**: Funcionalidades em desenvolvimento ativo
- **[1.0.0-alpha]**: Primeira versão alpha com core funcional
- **[0.1.0]**: Prova de conceito e pesquisa inicial

---

## Notas de Versão

### 1.0.0-alpha
Esta é a primeira versão alpha do DiixWhatsapp, contendo:
- ✅ Arquitetura multi-tenant completamente funcional
- ✅ Integração total com Evolution API
- ✅ Bot básico operacional
- 🔄 Features avançadas em desenvolvimento
- 📋 Documentação completa disponível

**Pré-requisitos**:
- Node.js 20.x
- MongoDB 6.x
- Redis 7.x
- Evolution API 1.8.x

**Upgrade**: N/A (versão inicial)

---

**Mais informações**:
- [Estado Atual](./13-estado-atual.md)
- [Roadmap](./14-roadmap.md)
- [Arquitetura](./02-arquitetura.md)

---

*Este changelog é atualizado a cada release significativa. Para mudanças menores e correções, consulte o [log de commits](https://github.com/diixwhatsapp/diix-whatsapp/commits/main).*
