# DiixWhatsapp - Sistema Multi-Loja para WhatsApp

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![ECMAScript](https://img.shields.io/badge/ECMAScript-6-yellow.svg)](https://es6features.github.io/)
[![Evolution API](https://img.shields.io/badge/Evolution-API-orange.svg)](https://evolution-api.com/)

## 📋 Sobre o Projeto

Sistema de bot para vendas e atendimento no WhatsApp, desenvolvido em **Node.js** com **Express**, utilizando a **Evolution API**. Projetado com arquitetura **multi-tenant**, permitindo que múltiplas lojas/segmentos utilizem o mesmo sistema de atendimento e vendas, cada um com suas configurações e contas cadastradas independentes.

### ✨ Funcionalidades Principais

- 🏪 **Multi-Loja/Multi-Tenant**: Suporte a várias lojas com segmentos e usos diferentes
- 🤖 **Bot de Vendas**: Automação de vendas e atendimento via WhatsApp
- 🔗 **Integração Evolution API**: Conexão robusta com a API do WhatsApp
- 👥 **Contas Cadastradas**: Gerenciamento de múltiplas contas por loja
- 🎯 **Segmentação**: Configurações personalizadas por tipo de negócio
- 💬 **Atendimento Automatizado**: Respostas automáticas e fluxo de conversação

## 🚀 Tecnologias Utilizadas

- **Runtime**: Node.js 20.x
- **Framework**: Express.js 4.x
- **Padrão**: ECMAScript 6 (ES6+)
- **API WhatsApp**: Evolution API
- **Arquitetura**: Multi-tenant

## 📦 Instalação

### Pré-requisitos

- Node.js 20.x ou superior
- npm ou yarn
- Conta na Evolution API
- Acesso à API do WhatsApp Business

### Passos para Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/diix-whatsapp.git
cd diix-whatsapp
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com suas credenciais:
```env
# Servidor
PORT=3000
NODE_ENV=development

# Evolution API
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-chave-api

# Banco de Dados (se aplicável)
DATABASE_URL=sua-url-do-banco

# Configurações Multi-tenant
DEFAULT_TENANT_ID=loja-padrao
```

5. Inicie o servidor:
```bash
npm start
# ou para desenvolvimento
npm run dev
```

## 🏗️ Arquitetura Multi-Tenant

O sistema foi projetado para atender múltiplas lojas/segmentos simultaneamente:

```
┌─────────────────────────────────────────┐
│         Servidor Express (Node.js)      │
├─────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │ Loja A  │  │ Loja B  │  │ Loja C  │ │
│  │Varejo   │  │Serviços │  │Food     │ │
│  ├─────────┤  ├─────────┤  ├─────────┤ │
│  │Contas   │  │Contas   │  │Contas   │ │
│  │Config   │  │Config   │  │Config   │ │
│  └─────────┘  └─────────┘  └─────────┘ │
├─────────────────────────────────────────┤
│         Evolution API Gateway           │
└─────────────────────────────────────────┘
```

### Estrutura de Tenants

Cada loja/tenant possui:
- **ID único** para identificação
- **Configurações específicas** do segmento
- **Contas WhatsApp** vinculadas
- **Fluxos de atendimento** personalizados
- **Regras de negócio** independentes

## 📁 Estrutura do Projeto

```
diix-whatsapp/
├── src/
│   ├── controllers/          # Controladores das rotas
│   ├── services/             # Serviços de negócio
│   │   ├── whatsapp/         # Serviços WhatsApp
│   │   ├── tenant/           # Gerenciamento multi-tenant
│   │   └── bot/              # Lógica do bot
│   ├── models/               # Modelos de dados
│   ├── routes/               # Definição de rotas
│   ├── middleware/           # Middlewares (auth, tenant, etc.)
│   ├── config/               # Configurações
│   └── utils/                # Utilitários
├── .env.example
├── .env
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Rotas Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/webhook` | Webhook da Evolution API |
| `GET` | `/api/tenants` | Listar tenants/lojas |
| `POST` | `/api/tenants` | Criar novo tenant |
| `GET` | `/api/tenants/:id/accounts` | Contas do tenant |
| `POST` | `/api/messages/send` | Enviar mensagem |
| `GET` /api/status | Verificar status | Status do serviço |

### Exemplo de Uso - Enviar Mensagem

```javascript
POST /api/messages/send
Content-Type: application/json
X-Tenant-ID: loja-varejo-01

{
  "phoneNumber": "5511999999999",
  "message": "Olá! Bem-vindo à nossa loja!",
  "accountId": "conta-principal"
}
```

## ⚙️ Configuração Multi-Tenant

### Criando um Novo Tenant

```javascript
POST /api/tenants
{
  "name": "Minha Loja",
  "segment": "varejo",
  "config": {
    "businessHours": "09:00-18:00",
    "timezone": "America/Sao_Paulo",
    "language": "pt-BR",
    "autoReply": true
  }
}
```

### Vinculando Conta WhatsApp

```javascript
POST /api/tenants/:tenantId/accounts
{
  "accountName": "Atendimento Principal",
  "evolutionInstanceId": "instance-id",
  "phoneNumber": "5511999999999"
}
```

## 🤖 Fluxo do Bot

O bot segue um fluxo personalizável por tenant:

1. **Saudação Inicial**: Boas-vindas automatizada
2. **Identificação**: Reconhecimento do cliente
3. **Menu de Opções**: Catálogo/produtos/serviços
4. **Atendimento**: Processo de venda ou suporte
5. **Finalização**: Encerramento e feedback

## 🔐 Segurança

- Autenticação via API Key
- Validação de tenant em todas as requisições
- Criptografia de dados sensíveis
- Rate limiting por tenant
- Logs de auditoria

## 📊 Monitoramento

- Logs detalhados por tenant
- Métricas de atendimento
- Status das conexões WhatsApp
- Performance por segmento

## 🛠️ Desenvolvimento

### Scripts Disponíveis

```bash
npm start          # Inicia em produção
npm run dev        # Inicia em desenvolvimento com hot-reload
npm test           # Executa testes
npm run lint       # Verifica código com ESLint
npm run build      # Compila para produção
```

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, leia o guia de contribuição antes de enviar PRs.

## 📞 Suporte

Para dúvidas e suporte:
- Email: suporte@diixwhatsapp.com
- Documentação: [Wiki do Projeto](https://github.com/seu-usuario/diix-whatsapp/wiki)

## 🙏 Agradecimentos

- [Evolution API](https://evolution-api.com/) - Pela incrível API de WhatsApp
- [Express.js](https://expressjs.com/) - Framework web Node.js
- Comunidade Node.js Brasil

---

**DiixWhatsapp** - Transformando atendimento e vendas no WhatsApp para múltiplos negócios! 🚀
