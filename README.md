# DiixWhatsapp - Sistema Multi-Loja para WhatsApp

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![ECMAScript](https://img.shields.io/badge/ECMAScript-6-yellow.svg)](https://es6features.github.io/)
[![Evolution API](https://img.shields.io/badge/Evolution-API-orange.svg)](https://evolution-api.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://postgresql.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7+-green.svg)](https://mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7+-red.svg)](https://redis.io/)

---

## 🎯 Apresentação do Projeto

**DiixWhatsapp** é uma plataforma completa de automação de vendas e atendimento via WhatsApp, projetada para empresas que desejam escalar suas operações de comunicação com clientes. 

Desenvolvido em **Node.js** com **Express** e utilizando a poderosa **Evolution API**, o sistema se destaca por sua arquitetura **multi-tenant**, permitindo que múltiplas lojas ou segmentos de negócio utilizem a mesma infraestrutura, cada um com configurações, contas WhatsApp e regras de atendimento completamente independentes.

### 💡 Por Que Escolher o DiixWhatsapp?

| Benefício | Descrição |
|-----------|-----------|
| 🏪 **Multi-Loja** | Gerencie várias lojas/segmentos em uma única instalação |
| 🤖 **Bot Inteligente** | Fluxos de conversa personalizáveis para cada negócio |
| 🔗 **Integração Poderosa** | Evolution API para conexão estável com WhatsApp |
| 🗄️ **Banco Flexível** | Escolha entre PostgreSQL ou MongoDB conforme sua necessidade |
| ⚡ **Performance** | Redis integrado para cache e filas de alta velocidade |
| 🎯 **Segmentação** | Configurações específicas por tipo de negócio (varejo, serviços, food, etc.) |
| 📊 **Analytics** | Métricas detalhadas de atendimento e conversão por tenant |

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
- ✅ **PostgreSQL ou MongoDB**: Escolha o banco que melhor atende seu caso de uso
- ✅ **Redis Integrado**: Cache distribuído e gerenciamento de filas
- ✅ **Health Checks**: Monitoramento contínuo de todas as conexões
- ✅ **Graceful Shutdown**: Encerramento seguro de todas as conexões

### Gestão e Segurança
- ✅ **Autenticação por API Key**: Segurança em todas as requisições
- ✅ **Rate Limiting**: Controle de requisições por tenant
- ✅ **Logs de Auditoria**: Rastreabilidade completa das operações
- ✅ **Isolamento de Dados**: Cada tenant acessa apenas seus dados

---

## 🚀 Tecnologias Utilizadas

<table>
  <tr>
    <td align="center">
      <strong>Runtime & Framework</strong><br/>
      Node.js 20.x<br/>
      Express.js 4.x<br/>
      ECMAScript 6+
    </td>
    <td align="center">
      <strong>Bancos de Dados</strong><br/>
      PostgreSQL 15+<br/>
      MongoDB 7+<br/>
      Redis 7+
    </td>
    <td align="center">
      <strong>API & Integração</strong><br/>
      Evolution API<br/>
      WhatsApp Business API
    </td>
    <td align="center">
      <strong>Ferramentas</strong><br/>
      Prisma ORM<br/>
      ioredis<br/>
      Jest (testes)
    </td>
  </tr>
</table>

---

## 📦 Instalação Rápida

### Pré-requisitos

- Node.js 20.x ou superior
- npm ou yarn
- PostgreSQL **OU** MongoDB (sua escolha)
- Redis (opcional, mas recomendado)
- Conta na Evolution API

### Passo a Passo

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/diix-whatsapp.git
cd diix-whatsapp

# 2. Instale as dependências
npm install

# 3. Configure o ambiente
cp .env.example .env

# 4. Edite .env com suas credenciais
nano .env

# 5. Gere o Prisma Client
npm run db:generate

# 6. Execute migrations (se usar PostgreSQL)
npm run db:migrate

# 7. Inicie o servidor
npm run dev  # Desenvolvimento
npm start    # Produção
```

> 📖 **Guia Completo de Instalação**: [docs/00-getting-started.md](./docs/00-getting-started.md)

---

## 🏗️ Arquitetura Multi-Tenant

O DiixWhatsapp foi projetado desde o início para suportar múltiplos tenants (lojas/segmentos) com isolamento completo de dados e configurações:

```
┌─────────────────────────────────────────────────────┐
│              Servidor Express (Node.js)             │
├─────────────────────────────────────────────────────┤
│  Middleware Multi-Tenant (Identificação & Validação)│
├──────────┬──────────────┬──────────────┬───────────┤
│  Loja A  │   Loja B     │   Loja C     │  Loja D   │
│  Varejo  │   Serviços   │   Food       │  E-commerce│
├──────────┼──────────────┼──────────────┼───────────┤
│ Contas   │ Contas       │ Contas       │ Contas    │
│ Configs  │ Configs      │ Configs      │ Configs   │
│ Fluxos   │ Fluxos       │ Fluxos       │ Fluxos    │
└──────────┴──────────────┴──────────────┴───────────┘
                      │
        ┌─────────────┴─────────────┐
        │   Evolution API Gateway   │
        └─────────────┬─────────────┘
                      │
        ┌─────────────┴─────────────┐
        │  DB: PostgreSQL ou MongoDB│
        │  Cache: Redis             │
        └───────────────────────────┘
```

### Cada Tenant Possui:
- 🔑 **ID Único** para identificação e isolamento
- ⚙️ **Configurações Específicas** do segmento
- 📱 **Contas WhatsApp** vinculadas e independentes
- 🤖 **Fluxos de Atendimento** personalizados
- 📊 **Métricas e Logs** segregados
- 🔒 **Regras de Acesso** próprias

> 📘 **Guia Completo Multi-Tenant**: [docs/03-multi-tenant.md](./docs/03-multi-tenant.md)

---

## 🗄️ Escolha Seu Banco de Dados

Uma das grandes vantagens do DiixWhatsapp é a flexibilidade de escolher o banco de dados que melhor se adapta ao seu caso de uso:

### PostgreSQL (Recomendado Para)
✅ Dados relacionais complexos  
✅ Transações ACID críticas  
✅ Consultas SQL avançadas  
✅ Integridade referencial forte  

### MongoDB (Recomendado Para)
✅ Dados semi-estruturados  
✅ Escalabilidade horizontal  
✅ Schema flexível  
✅ Alto volume de leituras  

### Redis (Opcional mas Recomendado)
⚡ Cache de sessões e dados frequentes  
⚡ Filas de mensagens assíncronas  
⚡ Rate limiting distribuído  
⚡ Sessions em tempo real  

> 📖 **Guia Completo de Bancos de Dados e Redis**: [docs/04-banco-dados-redis.md](./docs/04-banco-dados-redis.md)

---

## 📁 Estrutura do Projeto

```
diix-whatsapp/
├── docs/                       # Documentação completa
│   ├── README.md               # Índice da documentação
│   ├── 00-getting-started.md   # Guia de instalação
│   ├── 01-visao-geral.md       # Visão geral do projeto
│   ├── 02-arquitetura.md       # Arquitetura detalhada
│   ├── 03-multi-tenant.md      # Guia multi-tenant
│   ├── 04-banco-dados-redis.md # PostgreSQL, MongoDB, Redis
│   ├── 13-estado-atual.md      # Status do desenvolvimento
│   ├── 14-roadmap.md           # Roadmap futuro
│   └── 15-changelog.md         # Histórico de versões
├── src/
│   ├── config/                 # Configurações do sistema
│   │   ├── index.js            # Configurações gerais
│   │   ├── database.js         # Conexão DB (Postgres/Mongo)
│   │   └── redis.js            # Conexão Redis
│   ├── middleware/             # Middlewares
│   │   └── tenant.js           # Identificação e validação tenant
│   ├── models/                 # Modelos e Repositórios
│   │   ├── BaseRepository.js   # Repository pattern base
│   │   └── TenantRepository.js # Repositório de tenants
│   ├── services/               # Regras de negócio
│   │   └── EvolutionApiService.js # Integração Evolution API
│   ├── controllers/            # Controladores HTTP
│   ├── routes/                 # Definição de rotas
│   └── utils/                  # Utilitários
├── prisma/
│   └── schema.prisma           # Schema do banco de dados
├── tests/                      # Testes automatizados
├── scripts/                    # Scripts utilitários
├── uploads/                    # Arquivos temporários
├── .env.example                # Exemplo de variáveis de ambiente
├── .gitignore                  # Git ignore
├── package.json                # Dependências e scripts
└── README.md                   # Este arquivo
```

> 📂 **Estrutura Detalhada de Arquivos**: [docs/17-estrutura-arquivos.md](./docs/17-estrutura-arquivos.md)

---

## 🔌 API Endpoints Principais

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `POST` | `/api/webhook` | Webhook da Evolution API | API Key |
| `GET` | `/api/tenants` | Listar todos os tenants | API Key |
| `POST` | `/api/tenants` | Criar novo tenant | API Key |
| `GET` | `/api/tenants/:id` | Detalhes de um tenant | API Key |
| `GET` | `/api/tenants/:id/accounts` | Contas WhatsApp do tenant | API Key |
| `POST` | `/api/tenants/:id/accounts` | Vincular conta WhatsApp | API Key |
| `POST` | `/api/messages/send` | Enviar mensagem | API Key + Tenant |
| `GET` | `/api/status` | Status do serviço | Público |
| `GET` | `/health` | Health check completo | Público |

### Exemplo: Enviar Mensagem

```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: loja-varejo-01" \
  -H "Authorization: Bearer SUA_API_KEY" \
  -d '{
    "phoneNumber": "5511999999999",
    "message": "Olá! Bem-vindo à nossa loja!",
    "accountId": "conta-principal"
  }'
```

> 📖 **Referência Completa da API**: [docs/12-api-reference.md](./docs/12-api-reference.md) *(Em desenvolvimento)*

---

## ⚙️ Configuração Multi-Tenant

### Criando um Novo Tenant

```bash
curl -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUA_API_KEY" \
  -d '{
    "name": "Minha Loja de Varejo",
    "segment": "varejo",
    "config": {
      "businessHours": "09:00-18:00",
      "timezone": "America/Sao_Paulo",
      "language": "pt-BR",
      "autoReply": true,
      "maxAccounts": 5
    }
  }'
```

### Vinculando Conta WhatsApp

```bash
curl -X POST http://localhost:3000/api/tenants/loja-varejo-01/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUA_API_KEY" \
  -d '{
    "accountName": "Atendimento Principal",
    "evolutionInstanceId": "instance-123",
    "phoneNumber": "5511999999999"
  }'
```

> 📘 **Guia Completo de Configuração**: [docs/03-multi-tenant.md](./docs/03-multi-tenant.md)

---

## 🤖 Fluxo do Bot de Vendas

O bot segue um fluxo personalizável por tenant, adaptando-se ao segmento de cada loja:

```
1. 📞 Saudação Inicial
   └─→ Boas-vindas personalizadas por segmento

2. 🔍 Identificação do Cliente
   └─→ Reconhecimento ou cadastro rápido

3. 📋 Menu de Opções
   └─→ Catálogo/produtos/serviços disponíveis

4. 💬 Atendimento Especializado
   └─→ Processo de venda ou suporte técnico

5. ✅ Finalização
   └─→ Confirmação, pagamento e feedback

6. 📊 Pós-Venda
   └─→ Acompanhamento e fidelização
```

> 📖 **Fluxo Completo do Bot**: [docs/08-fluxo-bot.md](./docs/08-fluxo-bot.md) *(Em desenvolvimento)*

---

## 🔐 Segurança e Compliance

- 🔑 **Autenticação**: API Key em todas as requisições
- 🛡️ **Validação de Tenant**: Isolamento garantido em cada request
- 🔒 **Criptografia**: Dados sensíveis criptografados
- 🚦 **Rate Limiting**: Controle de requisições por tenant
- 📝 **Logs de Auditoria**: Todas as operações são registradas
- 🇧🇷 **LGPD**: Conformidade com Lei Geral de Proteção de Dados

> 📖 **Políticas de Segurança**: [docs/20-seguranca.md](./docs/20-seguranca.md) *(Em desenvolvimento)*  
> 📖 **Conformidade LGPD**: [docs/21-lgpd.md](./docs/21-lgpd.md) *(Em desenvolvimento)*

---

## 📊 Monitoramento e Logs

- 📈 **Métricas por Tenant**: Performance individualizada
- 🔔 **Status das Conexões**: WhatsApp, DB e Redis em tempo real
- 📝 **Logs Detalhados**: Rastreabilidade completa
- ⚠️ **Alertas**: Notificações de falhas e anomalias
- 📉 **Dashboard**: Visão geral do sistema

> 📖 **Guia de Monitoramento**: [docs/18-monitoramento.md](./docs/18-monitoramento.md) *(Em desenvolvimento)*

---

## 🛠️ Desenvolvimento

### Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento com hot-reload
npm start            # Produção
npm test             # Executa testes
npm run lint         # Verifica código com ESLint
npm run build        # Compila para produção
npm run db:migrate   # Cria migrations no banco
npm run db:generate  # Gera Prisma Client
npm run db:studio    # Abre GUI do Prisma Studio
```

### Testes

```bash
npm test             # Roda todos os testes
npm run test:watch   # Modo watch durante desenvolvimento
npm run test:coverage # Gera relatório de cobertura
```

---

## 📚 Documentação Completa

A documentação completa do projeto está organizada no diretório [`docs/`](./docs/):

### 📘 Para Começar
- [📖 Getting Started](./docs/00-getting-started.md) - Guia passo a passo de instalação
- [🎯 Visão Geral](./docs/01-visao-geral.md) - Objetivos e casos de uso
- [🏗️ Arquitetura](./docs/02-arquitetura.md) - Diagramas e fluxos do sistema

### 🔧 Configuração
- [🏢 Multi-Tenant](./docs/03-multi-tenant.md) - Guia completo de multi-tenancy
- [🗄️ Bancos de Dados & Redis](./docs/04-banco-dados-redis.md) - PostgreSQL, MongoDB e Redis ⭐
- [⚙️ Configuração de Ambiente](./docs/06-configuracao-ambiente.md) - Variáveis e secrets

### 🤖 Operação
- [🔄 Fluxo do Bot](./docs/08-fluxo-bot.md) - Jornada de atendimento
- [💬 Processo de Atendimento](./docs/09-atendimento.md) - Guia para operadores
- [💰 Fluxo de Vendas](./docs/10-vendas.md) - Conversão e fechamento

### 👨‍💻 Desenvolvimento
- [📝 Padrões de Código](./docs/11-padroes-codigo.md) - Boas práticas
- [🔌 API Reference](./docs/12-api-reference.md) - Documentação da API
- [🧪 Testes](./docs/13-testes.md) - Estratégia de testes

### 📈 Estado do Projeto
- [📊 Estado Atual](./docs/13-estado-atual.md) - Status do desenvolvimento
- [🗺️ Roadmap](./docs/14-roadmap.md) - Próximas funcionalidades
- [📋 Changelog](./docs/15-changelog.md) - Histórico de versões

### 🚀 Operações
- [📦 Deploy](./docs/17-deploy.md) - Guia de produção
- [🔍 Monitoramento](./docs/18-monitoramento.md) - Logs e métricas
- [🔧 Troubleshooting](./docs/19-troubleshooting.md) - Solução de problemas

> 📂 **Índice Completo da Documentação**: [docs/README.md](./docs/README.md)

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, leia nosso guia de contribuição antes de enviar PRs.

### Como Contribuir
1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📞 Suporte e Comunidade

- 📧 **Email**: suporte@diixwhatsapp.com
- 📖 **Documentação**: [docs/](./docs/)
- 🐛 **Issues**: [GitHub Issues](https://github.com/seu-usuario/diix-whatsapp/issues)
- 💬 **Discussões**: [GitHub Discussions](https://github.com/seu-usuario/diix-whatsapp/discussions)

---

## 🙏 Agradecimentos

- [Evolution API](https://evolution-api.com/) - Pela incrível API de WhatsApp
- [Express.js](https://expressjs.com/) - Framework web Node.js
- [Prisma](https://prisma.io/) - ORM moderno e flexível
- [Redis](https://redis.io/) - Cache e filas de alta performance
- Comunidade Node.js Brasil

---

## 🚀 Status do Projeto

| Componente | Status | Progresso |
|------------|--------|-----------|
| Estrutura e Configuração | ✅ Completo | 100% |
| Banco de Dados (Postgres/Mongo) | ✅ Completo | 100% |
| Redis Integration | ✅ Completo | 100% |
| Middleware Multi-Tenant | ✅ Completo | 100% |
| Serviços Evolution API | ✅ Completo | 100% |
| Controllers e Rotas | 🔄 Em Desenvolvimento | 45% |
| Bot de Vendas | 🔄 Em Desenvolvimento | 30% |
| Webhooks | 🔄 Em Desenvolvimento | 40% |
| Testes Automatizados | ❌ Planejado | 0% |
| **Total Geral** | 🔄 **Em Desenvolvimento** | **~55%** |

> 📊 **Estado Detalhado do Projeto**: [docs/13-estado-atual.md](./docs/13-estado-atual.md)  
> 🗺️ **Roadmap Completo**: [docs/14-roadmap.md](./docs/14-roadmap.md)

---

<div align="center">

**DiixWhatsapp** - Transformando atendimento e vendas no WhatsApp para múltiplos negócios! 🚀

[⬆ Voltar ao topo](#diixwhatsapp---sistema-multi-loja-para-whatsapp)

</div>
