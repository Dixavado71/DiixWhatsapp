# Documentação do Frontend - DiixWhatsapp

## 📚 Visão Geral

Esta documentação cobre o painel administrativo frontend do DiixWhatsapp, construído com Vue 3, Vuetify e tema Dark Cyber.

## 📑 Índice

1. [Arquitetura](#arquitetura)
2. [Tema e Design](#tema-e-design)
3. [Configuração](#configuracao)
4. [Rotas e Navegação](#rotas-e-navegacao)
5. [Gerenciamento de Estado](#gerenciamento-de-estado)
6. [Componentes](#componentes)
7. [Integração com API](#integracao-com-api)
8. [Deploy](#deploy)

---

## Arquitetura

### Estrutura do Projeto

```
frontend/
├── src/
│   ├── api/                  # Camada de integração com backend
│   │   └── index.js          # Configuração do Axios
│   ├── assets/               # Recursos estáticos
│   ├── components/           # Componentes reutilizáveis
│   ├── layouts/              # Layouts estruturais
│   │   └── DefaultLayout.vue # Layout principal
│   ├── router/               # Configuração de rotas
│   │   └── index.js          # Definição das rotas
│   ├── stores/               # Stores Pinia
│   │   └── app.js            # Store global da aplicação
│   ├── utils/                # Utilitários
│   ├── views/                # Views (páginas)
│   │   ├── DashboardView.vue
│   │   ├── ConfiguracaoView.vue
│   │   ├── TenantsView.vue
│   │   ├── WhatsAppView.vue
│   │   ├── MensagensView.vue
│   │   ├── BotView.vue
│   │   └── RelatoriosView.vue
│   ├── plugins/              # Plugins do Vue
│   │   └── vuetify.js        # Configuração do Vuetify
│   ├── App.vue               # Componente raiz
│   └── main.js               # Entry point
├── index.html
├── vite.config.js
└── package.json
```

### Padrões Utilizados

- **Composition API**: `setup()` com `<script setup>`
- **Pinia Store**: Gerenciamento de estado centralizado
- **Vue Router**: Roteamento baseado em histórico
- **Axios Interceptors**: Tratamento global de requisições/respostas

---

## Tema e Design

### Paleta de Cores Dark Cyber

| Cor | Hex | Uso |
|-----|-----|-----|
| Background | `#0a0e1a` | Fundo principal |
| Surface | `#121826` | Cards e superfícies |
| Surface Variant | `#1a2332` | Elementos secundários |
| Primary | `#00bcd4` | Ações principais (Ciano) |
| Secondary | `#7c4dff` | Ações secundárias (Roxo) |
| Accent | `#00e5ff` | Destaques (Ciano brilhante) |
| Success | `#66bb6a` | Status positivo |
| Warning | `#ffb74d` | Alertas |
| Error | `#ff5252` | Erros |
| Info | `#4fc3f7` | Informações |

### Tipografia

- **Fonte Principal**: Roboto (padrão Material Design)
- **Ícones**: Material Design Icons (@mdi/font)

### Efeitos Visuais

- **Glassmorphism**: Backdrop blur no app bar
- **Scrollbars Customizadas**: Estilizadas para o tema escuro
- **Transições**: Animações suaves entre estados
- **Elevação**: Sombras sutis para profundidade

---

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do frontend:

```bash
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000/ws
```

### Proxy de Desenvolvimento

Configurado em `vite.config.js`:

```javascript
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

### Configuração do Vuetify

Localização: `src/plugins/vuetify.js`

O Vuetify é configurado com:
- Tema customizado darkCyber
- Componentes globais
- Diretivas
- Defaults para componentes comuns

---

## Rotas e Navegação

### Mapa de Rotas

```javascript
[
  { path: '/', name: 'Dashboard' },
  { path: '/configuracao', name: 'Configuracao' },
  { path: '/tenants', name: 'Tenants' },
  { path: '/whatsapp', name: 'WhatsApp' },
  { path: '/mensagens', name: 'Mensagens' },
  { path: '/bot', name: 'Bot' },
  { path: '/relatorios', name: 'Relatorios' }
]
```

### Guards de Navegação

```javascript
router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} - DiixWhatsapp`
  // TODO: Implementar verificação de autenticação
  next()
})
```

---

## Gerenciamento de Estado

### Pinia Store

Localização: `src/stores/app.js`

#### State

```javascript
{
  loading: boolean,
  systemConfig: {
    dbProvider: string,
    redisEnabled: boolean,
    evolutionApiUrl: string,
    evolutionApiKey: string
  },
  tenants: array,
  whatsappAccounts: array
}
```

#### Getters

- `isLoading`
- `getSystemConfig`
- `getTenants`
- `getWhatsappAccounts`

#### Actions

- `setLoading(value)`
- `setSystemConfig(config)`
- `setTenants(data)`
- `setWhatsappAccounts(data)`

### Uso em Componentes

```vue
<script setup>
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const config = appStore.getSystemConfig
</script>
```

---

## Componentes

### DefaultLayout

**Localização**: `src/layouts/DefaultLayout.vue`

**Funcionalidades**:
- App Bar fixo superior
- Navigation Drawer retrátil (rail mode)
- Menu de navegação categorizado
- Botão de logout

**Categorias do Menu**:
1. Sistema (Dashboard, Configurações, Tenants)
2. WhatsApp (Contas, Mensagens, Bot)
3. Análise (Relatórios)

### DashboardView

**Métricas Exibidas**:
- Tenants Ativos
- Contas WhatsApp
- Mensagens Hoje
- Taxa de Resposta

**Seções**:
- Cards de métricas
- Gráfico de mensagens (placeholder)
- Timeline de atividades
- Saúde do sistema

### ConfiguracaoView

**Funcionalidades**:
- Seleção de provider de banco de dados
- Toggle para habilitar Redis
- Campos para Evolution API
- Verificação de status em tempo real
- Salvamento de configurações

---

## Integração com API

### Axios Configuration

**Localização**: `src/api/index.js`

```javascript
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})
```

### Interceptors

#### Request

Adiciona token JWT automaticamente:

```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

#### Response

Trata erros 401 (não autorizado):

```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

### Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Health check |
| POST | `/auth/login` | Login |
| GET | `/config` | Obter configurações |
| PUT | `/config` | Atualizar configurações |
| GET | `/tenants` | Listar tenants |
| POST | `/tenants` | Criar tenant |
| GET | `/whatsapp` | Listar contas |
| POST | `/whatsapp/send` | Enviar mensagem |

---

## Deploy

### Build de Produção

```bash
npm run build
```

**Output**: Diretório `dist/` com arquivos otimizados.

### Preview Local

```bash
npm run preview
```

### Variáveis para Produção

```bash
# .env.production
VITE_API_URL=https://api.diixwhatsapp.com
VITE_WS_URL=wss://api.diixwhatsapp.com/ws
```

### Docker (Opcional)

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

```nginx
server {
  listen 80;
  server_name admin.diixwhatsapp.com;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://backend:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

---

## Performance

### Otimizações Implementadas

- **Code Splitting**: Lazy loading de views
- **Tree Shaking**: Remoção de código não utilizado
- **Minificação**: CSS e JS minificados
- **Cache Busting**: Hash nos nomes dos arquivos

### Boas Práticas

- Usar `v-memo` para componentes pesados
- Implementar virtual scrolling para listas grandes
- Lazy load de imagens e componentes
- Debounce/throttle em inputs e scrolls

---

## Testes (Planejado)

### Vitest + Testing Library

```bash
npm install -D vitest @testing-library/vue @testing-library/jest-dom
```

### Exemplo de Teste

```javascript
import { render, screen } from '@testing-library/vue'
import DashboardView from '@/views/DashboardView.vue'

test('exibe métricas do dashboard', () => {
  render(DashboardView)
  expect(screen.getByText('Tenants Ativos')).toBeInTheDocument()
})
```

---

## Troubleshooting

### Problemas Comuns

#### Erro: "Cannot find module"

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

#### Erro de CORS

Verificar configuração do proxy em `vite.config.js`.

#### Build falhando

```bash
# Verificar versão do Node
node --version  # Requer >= 18

# Atualizar dependências
npm update
```

---

## Contribuição

### Padrões de Código

- Use `<script setup>` para Composition API
- Nomear arquivos em PascalCase para componentes
- Seguir convenções do ESLint
- Comitar mensagens em português

### Estrutura de Commits

```
feat: adicionar nova funcionalidade
fix: corrigir bug
docs: atualizar documentação
style: formatar código
refactor: refatorar código
test: adicionar testes
chore: atualizar dependências
```

---

**DiixWhatsapp Frontend Documentation**  
*Versão 1.0.0 - Agosto 2026*
