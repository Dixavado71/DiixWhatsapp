<template>
  <v-app class="app-background">
    <!-- Top App Bar -->
    <v-app-bar color="surface" elevation="0" height="70" class="app-bar-custom">
      <div class="d-flex align-center px-4 w-100">
        <!-- Menu Toggle -->
        <v-btn icon variant="text" @click="drawer = !drawer" class="mr-2">
          <v-icon>mdi-menu</v-icon>
        </v-btn>

        <!-- Logo -->
        <div class="d-flex align-center ml-2">
          <div class="logo-container mr-3">
            <v-icon size="32" color="primary">mdi-robot-happy</v-icon>
          </div>
          <div>
            <h1 class="text-h6 font-weight-bold text-primary mb-0">DiixWhatsapp</h1>
            <p class="text-caption text-secondary mb-0">Painel Administrativo</p>
          </div>
        </div>

        <v-spacer></v-spacer>

        <!-- Search Bar -->
        <v-text-field
          v-model="searchQuery"
          placeholder="Buscar..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          class="search-field mr-4"
          style="max-width: 300px;"
        ></v-text-field>

        <!-- Notifications -->
        <v-badge :content="notificationsCount" color="error" :model-value="notificationsCount > 0">
          <v-btn icon variant="text" class="mr-2">
            <v-icon>mdi-bell-outline</v-icon>
          </v-btn>
        </v-badge>

        <!-- User Menu -->
        <v-menu location="bottom end">
          <template v-slot:activator="{ props }">
            <v-btn icon variant="text" v-bind="props" class="ml-2">
              <v-avatar size="36" class="border-primary border-opacity-20">
                <v-img src="https://ui-avatars.com/api/?name=Admin&background=00bcd4&color=fff" alt="User"></v-img>
              </v-avatar>
            </v-btn>
          </template>
          <v-list density="compact" class="user-menu">
            <v-list-subheader class="text-secondary">Minha Conta</v-list-subheader>
            <v-list-item prepend-icon="mdi-account" title="Perfil" value="profile"></v-list-item>
            <v-list-item prepend-icon="mdi-cog" title="Configurações" value="settings"></v-list-item>
            <v-divider class="my-2"></v-divider>
            <v-list-item prepend-icon="mdi-logout" title="Sair" value="logout" color="error"></v-list-item>
          </v-list>
        </v-menu>
      </div>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail && $vuetify.display.mdAndUp"
      expand-on-hover
      rail-width="80"
      color="surface-variant"
      border="0"
      class="nav-drawer-custom"
    >
      <!-- Tenant Selector -->
      <div class="pa-4 tenant-selector-container">
        <v-select
          v-model="selectedTenant"
          :items="tenants"
          label="Tenant"
          item-title="name"
          item-value="id"
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-domain"
          hide-details
          class="tenant-selector"
        ></v-select>
      </div>

      <v-divider class="mx-4"></v-divider>

      <!-- Navigation Items -->
      <v-list density="compact" nav class="py-4">
        <!-- Main Section -->
        <v-list-subheader class="text-secondary text-uppercase text-caption font-weight-bold px-4">
          <v-icon start size="small">mdi-view-dashboard</v-icon>
          <span v-if="!rail || !expanded">Principal</span>
        </v-list-subheader>

        <v-list-item
          v-for="item in mainItems"
          :key="item.title"
          :prepend-icon="item.icon"
          :title="item.title"
          :to="item.to"
          rounded="xl"
          class="mx-2 my-1 nav-item"
          active-class="nav-item-active"
        >
          <template v-slot:prepend>
            <v-icon :color="isActive(item.to) ? 'primary' : 'secondary'" class="mr-3">{{ item.icon }}</v-icon>
          </template>
        </v-list-item>

        <v-divider class="my-4 mx-4"></v-divider>

        <!-- WhatsApp Section -->
        <v-list-subheader class="text-secondary text-uppercase text-caption font-weight-bold px-4">
          <v-icon start size="small">mdi-message</v-icon>
          <span v-if="!rail || !expanded">WhatsApp</span>
        </v-list-subheader>

        <v-list-item
          v-for="item in whatsappItems"
          :key="item.title"
          :prepend-icon="item.icon"
          :title="item.title"
          :to="item.to"
          rounded="xl"
          class="mx-2 my-1 nav-item"
          active-class="nav-item-active"
        >
          <template v-slot:prepend>
            <v-icon :color="isActive(item.to) ? 'primary' : 'secondary'" class="mr-3">{{ item.icon }}</v-icon>
          </template>
          <v-badge
            v-if="item.badge"
            :content="item.badge"
            color="primary"
            inline
            class="ml-auto"
          ></v-badge>
        </v-list-item>

        <v-divider class="my-4 mx-4"></v-divider>

        <!-- Management Section -->
        <v-list-subheader class="text-secondary text-uppercase text-caption font-weight-bold px-4">
          <v-icon start size="small">mdi-tools</v-icon>
          <span v-if="!rail || !expanded">Gestão</span>
        </v-list-subheader>

        <v-list-item
          v-for="item in managementItems"
          :key="item.title"
          :prepend-icon="item.icon"
          :title="item.title"
          :to="item.to"
          rounded="xl"
          class="mx-2 my-1 nav-item"
          active-class="nav-item-active"
        >
          <template v-slot:prepend>
            <v-icon :color="isActive(item.to) ? 'primary' : 'secondary'" class="mr-3">{{ item.icon }}</v-icon>
          </template>
        </v-list-item>

        <v-divider class="my-4 mx-4"></v-divider>

        <!-- Analytics Section -->
        <v-list-subheader class="text-secondary text-uppercase text-caption font-weight-bold px-4">
          <v-icon start size="small">mdi-chart-line</v-icon>
          <span v-if="!rail || !expanded">Análise</span>
        </v-list-subheader>

        <v-list-item
          v-for="item in analyticsItems"
          :key="item.title"
          :prepend-icon="item.icon"
          :title="item.title"
          :to="item.to"
          rounded="xl"
          class="mx-2 my-1 nav-item"
          active-class="nav-item-active"
        >
          <template v-slot:prepend>
            <v-icon :color="isActive(item.to) ? 'primary' : 'secondary'" class="mr-3">{{ item.icon }}</v-icon>
          </template>
        </v-list-item>
      </v-list>

      <!-- System Status Footer -->
      <template v-slot:append>
        <div class="pa-4 system-status">
          <v-alert type="info" variant="tonal" density="compact" class="mb-2">
            <div class="d-flex align-center">
              <v-icon size="small" class="mr-2">mdi-server</v-icon>
              <span class="text-caption">API Online</span>
              <v-chip size="x-small" color="success" class="ml-auto">v1.0</v-chip>
            </div>
          </v-alert>
          
          <v-btn
            block
            variant="tonal"
            color="error"
            prepend-icon="mdi-logout"
            size="small"
            @click="logout"
          >
            Sair do Sistema
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main class="main-content">
      <v-container fluid class="pa-6">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </v-container>
    </v-main>

    <!-- Quick Actions FAB -->
    <v-speed-dial
      v-model="fab"
      fixed
      location="bottom right"
      transition="slide-y-reverse-transition"
      class="mr-4 mb-4"
    >
      <template v-slot:activator="{ props: activatorProps }">
        <v-btn
          v-bind="activatorProps"
          :icon="fab ? 'mdi-close' : 'mdi-plus'"
          size="large"
          color="primary"
          class="elevation-4"
        ></v-btn>
      </template>

      <v-btn
        size="small"
        color="primary"
        prepend-icon="mdi-plus"
        @click="$router.push('/tenants')"
      >
        Novo Tenant
      </v-btn>

      <v-btn
        size="small"
        color="secondary"
        prepend-icon="mdi-message-text"
        @click="$router.push('/whatsapp')"
      >
        Nova Conta WhatsApp
      </v-btn>

      <v-btn
        size="small"
        color="accent"
        prepend-icon="mdi-bot"
        @click="$router.push('/bot')"
      >
        Configurar Bot
      </v-btn>
    </v-speed-dial>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const appStore = useAppStore()

// State
const drawer = ref(true)
const rail = ref(false)
const expanded = ref(false)
const fab = ref(false)
const searchQuery = ref('')
const selectedTenant = ref(null)
const notificationsCount = ref(3)

// Navigation Items
const mainItems = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/' },
  { title: 'Configurações', icon: 'mdi-cog', to: '/configuracao' }
]

const whatsappItems = [
  { title: 'Contas WhatsApp', icon: 'mdi-message-text', to: '/whatsapp' },
  { title: 'Mensagens', icon: 'mdi-chat-processing', to: '/mensagens', badge: 12 },
  { title: 'Bot & IA', icon: 'mdi-robot', to: '/bot' }
]

const managementItems = [
  { title: 'Tenants', icon: 'mdi-domain', to: '/tenants' },
  { title: 'Conversas', icon: 'mdi-account-group', to: '/conversas' }
]

const analyticsItems = [
  { title: 'Relatórios', icon: 'mdi-chart-bar', to: '/relatorios' },
  { title: 'Métricas', icon: 'mdi-analytics', to: '/metricas' }
]

// Computed
const tenants = computed(() => appStore.getTenants)

// Methods
const isActive = (path) => {
  return route.path === path
}

const logout = () => {
  // Implement logout logic
  console.log('Logout clicked')
}

const loadTenants = async () => {
  try {
    // Fetch tenants from API
    // const response = await api.get('/tenants')
    // appStore.setTenants(response.data)
    
    // Mock data for now
    appStore.setTenants([
      { id: '1', name: 'Loja Exemplo', slug: 'loja-exemplo' },
      { id: '2', name: 'Empresa Demo', slug: 'empresa-demo' }
    ])
  } catch (error) {
    console.error('Erro ao carregar tenants:', error)
  }
}

onMounted(() => {
  loadTenants()
})
</script>

<style scoped>
.app-background {
  background: linear-gradient(135deg, #0a0e1a 0%, #121826 100%);
}

.app-bar-custom {
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(42, 52, 71, 0.3);
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(0, 188, 212, 0.1) 0%, rgba(124, 77, 255, 0.1) 100%);
  border: 1px solid rgba(0, 188, 212, 0.2);
}

.search-field :deep(.v-field) {
  background: rgba(18, 24, 38, 0.5);
  border-color: rgba(42, 52, 71, 0.5);
}

.user-menu {
  background: rgba(18, 24, 38, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(42, 52, 71, 0.3);
}

.nav-drawer-custom {
  border-right: 1px solid rgba(42, 52, 71, 0.3) !important;
  background: linear-gradient(180deg, #121826 0%, #1a2332 100%);
}

.tenant-selector-container {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin: 12px;
}

.tenant-selector :deep(.v-field) {
  background: rgba(0, 188, 212, 0.05);
  border-color: rgba(0, 188, 212, 0.3);
}

.nav-item {
  transition: all 0.3s ease;
  border-radius: 12px !important;
  margin-left: 8px !important;
  margin-right: 8px !important;
}

.nav-item:hover {
  background: rgba(0, 188, 212, 0.1);
}

.nav-item-active {
  background: linear-gradient(135deg, rgba(0, 188, 212, 0.15) 0%, rgba(124, 77, 255, 0.15) 100%) !important;
  border-left: 3px solid #00bcd4;
}

.system-status {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin: 12px;
  padding: 12px !important;
}

.main-content {
  background: transparent;
}

/* FAB Button */
.v-speed-dial__content .v-btn {
  box-shadow: 0 4px 20px rgba(0, 188, 212, 0.4);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .search-field {
    display: none;
  }
}
</style>
