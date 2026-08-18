<template>
  <v-app-bar color="surface" elevation="2">
    <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
    
    <v-app-bar-title class="text-primary font-weight-bold">
      <v-icon start color="primary">mdi-robot-happy</v-icon>
      DiixWhatsapp
    </v-app-bar-title>

    <v-spacer></v-spacer>

    <v-btn icon variant="text">
      <v-icon>mdi-bell</v-icon>
    </v-btn>

    <v-btn icon variant="text">
      <v-icon>mdi-account-circle</v-icon>
    </v-btn>
  </v-app-bar>

  <v-navigation-drawer
    v-model="drawer"
    :rail="rail"
    color="surface-variant"
    @mouseenter="rail = false"
    @mouseleave="rail = true"
  >
    <v-list density="compact" nav>
      <v-list-item
        prepend-icon="mdi-view-dashboard"
        title="Dashboard"
        to="/"
        rounded="lg"
      ></v-list-item>

      <v-divider class="my-2"></v-divider>

      <v-list-subheader class="text-secondary">Sistema</v-list-subheader>

      <v-list-item
        prepend-icon="mdi-cog"
        title="Configurações"
        to="/configuracao"
        rounded="lg"
      ></v-list-item>

      <v-list-item
        prepend-icon="mdi-domain"
        title="Tenants"
        to="/tenants"
        rounded="lg"
      ></v-list-item>

      <v-divider class="my-2"></v-divider>

      <v-list-subheader class="text-secondary">WhatsApp</v-list-subheader>

      <v-list-item
        prepend-icon="mdi-message-text"
        title="Contas WhatsApp"
        to="/whatsapp"
        rounded="lg"
      ></v-list-item>

      <v-list-item
        prepend-icon="mdi-chat-processing"
        title="Mensagens"
        to="/mensagens"
        rounded="lg"
      ></v-list-item>

      <v-list-item
        prepend-icon="mdi-bot"
        title="Bot & IA"
        to="/bot"
        rounded="lg"
      ></v-list-item>

      <v-divider class="my-2"></v-divider>

      <v-list-subheader class="text-secondary">Análise</v-list-subheader>

      <v-list-item
        prepend-icon="mdi-chart-bar"
        title="Relatórios"
        to="/relatorios"
        rounded="lg"
      ></v-list-item>
    </v-list>

    <template v-slot:append>
      <v-list-item
        prepend-icon="mdi-logout"
        title="Sair"
        rounded="lg"
      ></v-list-item>
    </template>
  </v-navigation-drawer>

  <v-main class="bg-background">
    <router-view />
  </v-main>
</template>

<script setup>
import { ref } from 'vue'

const drawer = ref(true)
const rail = ref(false)
</script>

<style scoped>
.v-toolbar {
  backdrop-filter: blur(10px);
}

.v-navigation-drawer {
  border-right: 1px solid rgba(42, 52, 71, 0.3);
}
</style>
