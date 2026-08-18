# Frontend - DiixWhatsapp Admin Panel

## 🎨 Visão Geral

Painel administrativo moderno construído com **Vue 3**, **Vuetify 4** e **Pinia**, apresentando um tema **Dark Cyber** com tons de azul, ciano e roxo.

## 🚀 Tecnologias

- **Vue 3** - Framework progressivo com Composition API
- **Vuetify 4** - Framework de UI Material Design
- **Pinia** - Gerenciamento de estado
- **Vue Router** - Roteamento
- **Axios** - Cliente HTTP
- **Vite** - Build tool ultra-rápido
- **Sass** - Pré-processador CSS

## 🎨 Tema Dark Cyber

O tema foi cuidadosamente projetado com:

- **Background**: `#0a0e1a` (Azul muito escuro)
- **Surface**: `#121826` (Azul escuro)
- **Primary**: `#00bcd4` (Ciano vibrante)
- **Secondary**: `#7c4dff` (Roxo elétrico)
- **Accent**: `#00e5ff` (Ciano brilhante)

## 📁 Estrutura de Diretórios

```
frontend/
├── src/
│   ├── api/              # Configuração do Axios e endpoints
│   ├── assets/           # Imagens, fontes, etc.
│   ├── components/       # Componentes reutilizáveis
│   ├── layouts/          # Layouts da aplicação
│   ├── router/           # Configuração de rotas
│   ├── stores/           # Stores Pinia (estado global)
│   ├── utils/            # Funções utilitárias
│   ├── views/            # Views/Páginas da aplicação
│   ├── plugins/          # Plugins (Vuetify)
│   ├── App.vue           # Componente raiz
│   └── main.js           # Entry point
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🛠️ Instalação

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 🌐 Rotas Disponíveis

| Rota | Nome | Descrição |
|------|------|-----------|
| `/` | Dashboard | Visão geral do sistema |
| `/configuracao` | Configurações | Configurar DB, Redis, Evolution API |
| `/tenants` | Tenants | Gerenciar tenants multi-loja |
| `/whatsapp` | WhatsApp | Contas WhatsApp conectadas |
| `/mensagens` | Mensagens | Histórico de mensagens |
| `/bot` | Bot & IA | Configuração do bot |
| `/relatorios` | Relatórios | Métricas e relatórios |

## ⚙️ Configurações do Sistema

A página de configurações permite:

### Banco de Dados
- Escolher entre **PostgreSQL** ou **MongoDB**
- Configurar string de conexão
- Verificar status da conexão

### Redis
- Habilitar/desabilitar cache
- Configurar URL do Redis
- Monitorar status

### Evolution API
- Configurar URL da API
- Definir API Key
- Testar conexão

## 🎯 Funcionalidades Implementadas

### ✅ Concluídas
- [x] Setup do Vue 3 + Vite
- [x] Configuração do Vuetify com tema customizado
- [x] Roteamento básico
- [x] Store Pinia para estado global
- [x] Layout responsivo com drawer
- [x] Dashboard com métricas
- [x] Página de configurações completa
- [x] Integração com API backend (proxy)

### 🔄 Em Desenvolvimento
- [ ] CRUD completo de tenants
- [ ] Gerenciamento de contas WhatsApp
- [ ] Visualizador de mensagens em tempo real
- [ ] Configuração de fluxos do bot
- [ ] Relatórios avançados com gráficos
- [ ] Autenticação e autorização

### 📋 Planejado
- [ ] Gráficos com Chart.js/ApexCharts
- [ ] Notificações em tempo real (WebSocket)
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Modo claro/escuro alternável
- [ ] Internacionalização (i18n)
- [ ] PWA (Progressive Web App)

## 🔌 Proxy API

O Vite está configurado com proxy para o backend:

```javascript
// vite.config.js
server: {
  port: 3001,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  }
}
```

Isso permite que o frontend chame `/api/*` e seja redirecionado para o backend na porta 3000.

## 🎨 Componentes Principais

### DefaultLayout
Layout principal com:
- App Bar superior
- Navigation Drawer (retrátil)
- Menu de navegação
- Rodapé com logout

### DashboardView
- Cards de métricas
- Timeline de atividades
- Status dos serviços
- Gráficos (placeholder)

### ConfiguracaoView
- Seleção de banco de dados
- Toggle para Redis
- Campos para Evolution API
- Verificação de status em tempo real

## 📦 Dependências

```json
{
  "vue": "^3.4.0",
  "vue-router": "^4.2.5",
  "pinia": "^2.1.7",
  "vuetify": "^3.4.0",
  "@mdi/font": "^7.4.47",
  "axios": "^1.6.0"
}
```

## 🔧 Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento (porta 3001)
npm run build    # Build para produção
npm run preview  # Preview da build de produção
```

## 🌟 Destaques do Design

- **Tema Cyberpunk**: Cores neon sobre fundo escuro
- **Glassmorphism**: Efeitos de desfoque no app bar
- **Animações Suaves**: Transições fluidas
- **Responsivo**: Adapta-se a mobile e desktop
- **Acessível**: Contraste adequado e ARIA labels

## 📝 Próximos Passos

1. Implementar autenticação JWT
2. Criar componentes reutilizáveis
3. Integrar com API real do backend
4. Adicionar gráficos reais
5. Implementar WebSocket para tempo real
6. Criar testes unitários

## 📄 Licença

MIT - Parte do projeto DiixWhatsapp

---

**DiixWhatsapp Frontend** - Painel Admin Moderno  
*Versão 1.0.0 - Agosto 2026*
