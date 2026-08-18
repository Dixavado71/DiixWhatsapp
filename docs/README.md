# Documentação DiixWhatsapp

Bem-vindo à documentação oficial do projeto **DiixWhatsapp**. Este diretório contém toda a documentação técnica, processos, guias e informações sobre o estado atual do projeto.

---

## 🎯 Como Usar Esta Documentação

Esta documentação foi organizada para atender diferentes perfis de usuários. Selecione seu perfil abaixo para navegar pelos documentos mais relevantes:

### 👤 Sou Novo no Projeto
Comece por aqui se você está conhecendo o projeto agora:
1. [📖 Getting Started](./00-getting-started.md) - Guia rápido de instalação e configuração
2. [🎯 Visão Geral](./01-visao-geral.md) - Entenda o propósito e objetivos do projeto
3. [🏗️ Arquitetura](./02-arquitetura.md) - Compreenda como o sistema funciona
4. [🏢 Multi-Tenant](./03-multi-tenant.md) - Saiba como funciona o modelo multi-loja

### 👨‍💻 Sou Desenvolvedor
Documentação técnica para desenvolvimento:
1. [🏗️ Arquitetura do Sistema](./02-arquitetura.md) - Diagramas e fluxos técnicos
2. [🗄️ Bancos de Dados & Redis](./04-banco-dados-redis.md) ⭐ - PostgreSQL, MongoDB e Redis
3. [🌐 Dashboard EJS](./DASHBOARD_ADMIN.md) ⭐ NOVO - Dashboard admin com EJS
4. [📚 Documentação API com Swagger](./API_EJS_SETUP.md) ⭐ NOVO - Swagger UI e OpenAPI
5. [📝 Padrões de Código](./11-padroes-codigo.md) - Boas práticas e convenções
6. [🔌 API Reference](./12-api-reference.md) - Documentação completa da API
7. [🧪 Estratégia de Testes](./13-testes.md) - Como testar o código
8. [📁 Estrutura de Arquivos](./17-estrutura-arquivos.md) - Organização do código

### 🔧 Sou Administrador/Configurador
Guias para configuração e deploy:
1. [⚙️ Configuração de Ambiente](./06-configuracao-ambiente.md) - Variáveis e secrets
2. [🗄️ Bancos de Dados & Redis](./04-banco-dados-redis.md) ⭐ - Escolha e configuração de DBs
3. [🏢 Guia Multi-Tenant](./03-multi-tenant.md) - Configuração de tenants e lojas
4. [🔗 Evolution API](./07-evolution-api.md) - Integração com WhatsApp
5. [🌐 Dashboard Admin](./DASHBOARD_ADMIN.md) - Uso do painel administrativo
6. [📚 Swagger UI](./API_EJS_SETUP.md) - Documentação interativa da API
7. [📦 Deploy em Produção](./17-deploy.md) - Guia completo de deploy
8. [🔍 Monitoramento](./18-monitoramento.md) - Logs, métricas e alertas
9. [🔧 Troubleshooting](./19-troubleshooting.md) - Solução de problemas comuns

### 💼 Sou Operador de Atendimento
Documentação operacional:
1. [🔄 Fluxo do Bot](./08-fluxo-bot.md) - Como funciona o atendimento automatizado
2. [💬 Processo de Atendimento](./09-atendimento.md) - Guia para operadores
3. [💰 Fluxo de Vendas](./10-vendas.md) - Conversão e fechamento de vendas

### 📊 Sou Gestor/Stakeholder
Informações de alto nível sobre o projeto:
1. [🎯 Visão Geral](./01-visao-geral.md) - Objetivos e casos de uso
2. [📊 Estado Atual](./13-estado-atual.md) - Status do desenvolvimento
3. [🗺️ Roadmap](./14-roadmap.md) - Próximas funcionalidades e timeline
4. [📋 Changelog](./15-changelog.md) - Histórico de versões e mudanças

---

## 📚 Índice Completo de Documentação

### 📘 Fundamentos do Projeto
| Documento | Descrição | Status |
|-----------|-----------|--------|
| [00-getting-started.md](./00-getting-started.md) | Guia rápido de instalação e primeiros passos | ✅ Completo |
| [01-visao-geral.md](./01-visao-geral.md) | Visão geral, objetivos e casos de uso | ✅ Completo |
| [02-arquitetura.md](./02-arquitetura.md) | Arquitetura do sistema, diagramas e fluxos | ✅ Completo |
| [03-multi-tenant.md](./03-multi-tenant.md) | Guia completo de arquitetura multi-tenant | ✅ Completo |
| [04-banco-dados-redis.md](./04-banco-dados-redis.md) ⭐ | PostgreSQL, MongoDB e Redis - escolha e configuração | ✅ Completo |

### 🔧 Configuração e Instalação
| Documento | Descrição | Status |
|-----------|-----------|--------|
| [05-instalacao.md](./05-instalacao.md) | Guia passo a passo de instalação detalhada | 🔄 Em revisão |
| [06-configuracao-ambiente.md](./06-configuracao-ambiente.md) | Configuração de variáveis de ambiente e secrets | 🔄 Em revisão |
| [07-evolution-api.md](./07-evolution-api.md) | Integração e configuração da Evolution API | 🔄 Em revisão |

### 🌐 Frontend & Dashboard (EJS) ⭐ NOVO
| Documento | Descrição | Status |
|-----------|-----------|--------|
| [DASHBOARD_ADMIN.md](./DASHBOARD_ADMIN.md) | Dashboard administrativo com EJS + JWT | ✅ Completo |
| [API_EJS_SETUP.md](./API_EJS_SETUP.md) | Swagger UI e documentação OpenAPI | ✅ Completo |
| [BACKEND_ONLY.md](../BACKEND_ONLY.md) | Backend puro sem frontend Vue.js | ✅ Completo |

### 🤖 Processos e Fluxos Operacionais
| Documento | Descrição | Status |
|-----------|-----------|--------|
| [08-fluxo-bot.md](./08-fluxo-bot.md) | Fluxo completo do bot de vendas e atendimento | ❌ Planejado |
| [09-atendimento.md](./09-atendimento.md) | Processo de atendimento e melhores práticas | ❌ Planejado |
| [10-vendas.md](./10-vendas.md) | Fluxo de vendas, conversão e follow-up | ❌ Planejado |

### 👨‍💻 Desenvolvimento Técnico
| Documento | Descrição | Status |
|-----------|-----------|--------|
| [11-padroes-codigo.md](./11-padroes-codigo.md) | Padrões de código, boas práticas e convenções | ❌ Planejado |
| [12-api-reference.md](./12-api-reference.md) | Referência completa da API com exemplos | ❌ Planejado |
| [13-testes.md](./13-testes.md) | Estratégia de testes unitários e integração | ❌ Planejado |

### 📈 Gestão do Projeto
| Documento | Descrição | Status |
|-----------|-----------|--------|
| [13-estado-atual.md](./13-estado-atual.md) | Status atual do desenvolvimento e métricas | ✅ Completo |
| [14-roadmap.md](./14-roadmap.md) | Roadmap detalhado com milestones e OKRs | ✅ Completo |
| [15-changelog.md](./15-changelog.md) | Histórico de versões no padrão Keep a Changelog | ✅ Completo |

### 🚀 Operações e Produção
| Documento | Descrição | Status |
|-----------|-----------|--------|
| [16-status-instalacao.md](./16-status-instalacao.md) | Status da instalação atual do projeto | ✅ Completo |
| [17-estrutura-arquivos.md](./17-estrutura-arquivos.md) | Estrutura detalhada de diretórios e arquivos | ✅ Completo |
| [17-deploy.md](./17-deploy.md) | Guia completo de deploy em produção | ❌ Planejado |
| [18-monitoramento.md](./18-monitoramento.md) | Monitoramento, logs, métricas e alertas | ❌ Planejado |
| [19-troubleshooting.md](./19-troubleshooting.md) | Solução de problemas comuns e debugging | ❌ Planejado |

### 🔐 Segurança e Compliance
| Documento | Descrição | Status |
|-----------|-----------|--------|
| [20-seguranca.md](./20-seguranca.md) | Políticas de segurança e melhores práticas | ❌ Planejado |
| [21-lgpd.md](./21-lgpd.md) | Conformidade com Lei Geral de Proteção de Dados | ❌ Planejado |

---

## 🆕 Novidades na Versão 2.0.0 - Backend + Dashboard EJS

### Principais Atualizações
- ✅ **Backend Completo**: API REST multi-tenant totalmente funcional
- ✅ **Dashboard Admin EJS**: Interface administrativa moderna com autenticação JWT
- ✅ **Swagger UI Integrado**: Documentação interativa OpenAPI 3.0
- ✅ **Páginas EJS**: Landing page, documentação, login e dashboard
- ✅ **JavaScript Client**: API client no navegador para testes rápidos
- ✅ **CI/CD Atualizado**: GitHub Actions corrigido para Node.js 22.x

### Novos Documentos
- 📄 [DASHBOARD_ADMIN.md](./DASHBOARD_ADMIN.md) ⭐ - Guia completo do dashboard admin
- 📄 [API_EJS_SETUP.md](./API_EJS_SETUP.md) ⭐ - Swagger UI e documentação OpenAPI
- 📄 [BACKEND_ONLY.md](../BACKEND_ONLY.md) ⭐ - Backend puro sem frontend Vue.js

### Melhorias na Infraestrutura
- 🔧 **EJS View Engine**: Template engine configurado no Express
- 🔧 **Assets Estáticos**: CSS e JavaScript organizados em `/public`
- 🔧 **Autenticação JWT**: Login seguro com tokens persistentes
- 🔧 **Multi-Tenant**: Controle total via dashboard administrativo
- 🔧 **Testes Corrigidos**: Jest configurado para ES Modules

### Frontend Removido
- ❌ Vue.js 3 removido (backend-only focus)
- ❌ Vuetify removido
- ❌ Build de frontend removido do package.json
- ✅ **Substituído por**: EJS + Vanilla JS + CSS moderno

---

## 🆕 Novidades na Versão 1.1.0 (Legado)

### Principais Atualizações
- ✅ **Suporte a Múltiplos Bancos de Dados**: Escolha entre PostgreSQL e MongoDB conforme sua necessidade
- ✅ **Integração Redis**: Cache distribuído e gerenciamento de filas para alta performance
- ✅ **Documentação Completa de DBs**: Guia comparativo e de configuração para PostgreSQL, MongoDB e Redis
- ✅ **Configuração Flexível**: Environment variables unificadas para fácil troca de providers
- ✅ **Graceful Shutdown Melhorado**: Encerramento seguro de todas as conexões (DB, Redis, Express)
- ✅ **Health Checks**: Monitoramento contínuo de saúde de todas as conexões

### Novos Documentos (v1.1.0)
- 📄 [04-banco-dados-redis.md](./04-banco-dados-redis.md) - Guia completo de bancos de dados e Redis
- 📄 [16-status-instalacao.md](./16-status-instalacao.md) - Status detalhado da instalação
- 📄 [17-estrutura-arquivos.md](./17-estrutura-arquivos.md) - Estrutura completa do projeto

### Melhorias na Infraestrutura (v1.1.0)
- 🔧 Conexão dinâmica de banco de dados baseada em `DB_PROVIDER`
- 🔧 Retry lógico exponencial para conexões falhas
- 🔧 Singleton pattern para Redis e Database connections
- 🔧 Scripts npm atualizados para gerenciamento de DBs

---

## 📋 Convenções de Documentação

### Numeração de Arquivos
- **Documentos numerados** (00-, 01-, 02-, etc.): Seguem uma ordem lógica de leitura e categorias temáticas
  - `00-09`: Fundamentos e configuração
  - `10-19`: Processos e desenvolvimento
  - `20-29`: Segurança e compliance

### Status dos Documentos
- ✅ **Completo**: Documento finalizado e revisado
- 🔄 **Em Revisão**: Em atualização ou revisão técnica
- ❌ **Planejado**: Ainda será desenvolvido

### Formatação
- Todos os documentos usam formato **Markdown** (`.md`)
- **Links relativos** para facilitar navegação entre documentos
- **Exemplos práticos** de código sempre que aplicável
- **Diagramas ASCII** para ilustrar arquiteturas e fluxos
- **Tabelas comparativas** para auxiliar decisões técnicas

### Marcadores Especiais
- ⭐ **NOVO**: Documentos recém-adicionados ou significativamente atualizados
- 🔄 **EM REVISÃO**: Documentos sendo atualizados
- ❌ **PLANEJADO**: Documentos futuros

---

## 🔄 Manutenção da Documentação

Esta documentação é mantida atualizada com o desenvolvimento do projeto. Sempre que uma nova funcionalidade for implementada ou um processo for alterado, os documentos correspondentes devem ser revisados e atualizados.

### Responsabilidades
- **Desenvolvedores**: Atualizar documentação técnica ao implementar features
- **Administradores**: Revisar guias de configuração e deploy
- **Gestores**: Manter roadmap e status atualizados

### Como Contribuir
1. Verifique se o tópico já existe em algum documento
2. Crie ou edite o arquivo apropriado seguindo a numeração temática
3. Mantenha o padrão de formatação Markdown estabelecido
4. Adicione exemplos práticos quando possível
5. Atualize este índice (README.md) se adicionar novos documentos
6. Revise ortografia e clareza do texto

---

## 📞 Suporte da Documentação

Encontrou erros ou tem sugestões de melhoria?

- 📧 **Email**: suporte@diixwhatsapp.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/seu-usuario/diix-whatsapp/issues)
- 💬 **Discussões**: [GitHub Discussions](https://github.com/seu-usuario/diix-whatsapp/discussions)

---

<div align="center">

**Última atualização**: Janeiro 2025  
**Versão da documentação**: 2.0.0  
**Projeto**: DiixWhatsapp v2.0.0 - Backend + Dashboard EJS  

[⬆ Voltar ao topo](#documentação-diixwhatsapp)

</div>
