import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: 'Dashboard' }
  },
  {
    path: '/configuracao',
    name: 'Configuracao',
    component: () => import('@/views/ConfiguracaoView.vue'),
    meta: { title: 'Configurações do Sistema' }
  },
  {
    path: '/tenants',
    name: 'Tenants',
    component: () => import('@/views/TenantsView.vue'),
    meta: { title: 'Gerenciar Tenants' }
  },
  {
    path: '/whatsapp',
    name: 'WhatsApp',
    component: () => import('@/views/WhatsAppView.vue'),
    meta: { title: 'Contas WhatsApp' }
  },
  {
    path: '/mensagens',
    name: 'Mensagens',
    component: () => import('@/views/MensagensView.vue'),
    meta: { title: 'Mensagens' }
  },
  {
    path: '/bot',
    name: 'Bot',
    component: () => import('@/views/BotView.vue'),
    meta: { title: 'Configuração do Bot' }
  },
  {
    path: '/relatorios',
    name: 'Relatorios',
    component: () => import('@/views/RelatoriosView.vue'),
    meta: { title: 'Relatórios' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} - DiixWhatsapp`
  next()
})

export default router
