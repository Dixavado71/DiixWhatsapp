<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 text-primary mb-4">
          <v-icon start color="primary">mdi-view-dashboard</v-icon>
          Dashboard
        </h1>
      </v-col>
    </v-row>

    <!-- Cards de Métricas -->
    <v-row>
      <v-col cols="12" md="3">
        <v-card class="mb-4" variant="tonal" color="primary">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-subtitle-2 text-medium-emphasis">Tenants Ativos</div>
                <div class="text-h3 font-weight-bold mt-2">12</div>
              </div>
              <v-icon size="48" opacity="0.3">mdi-domain</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="mb-4" variant="tonal" color="secondary">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-subtitle-2 text-medium-emphasis">Contas WhatsApp</div>
                <div class="text-h3 font-weight-bold mt-2">28</div>
              </div>
              <v-icon size="48" opacity="0.3">mdi-message-text</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="mb-4" variant="tonal" color="accent">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-subtitle-2 text-medium-emphasis">Mensagens Hoje</div>
                <div class="text-h3 font-weight-bold mt-2">1,542</div>
              </div>
              <v-icon size="48" opacity="0.3">mdi-chat-processing</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="mb-4" variant="tonal" color="success">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-subtitle-2 text-medium-emphasis">Taxa de Resposta</div>
                <div class="text-h3 font-weight-bold mt-2">98%</div>
              </div>
              <v-icon size="48" opacity="0.3">mdi-chart-line</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Gráficos e Atividades Recentes -->
    <v-row>
      <v-col cols="12" md="8">
        <v-card class="mb-4" variant="tonal">
          <v-card-title class="text-primary">
            <v-icon start color="primary">mdi-chart-timeline-variant</v-icon>
            Mensagens por Hora (Últimas 24h)
          </v-card-title>
          <v-card-text>
            <div class="text-center py-10 text-secondary">
              <v-icon size="64" class="mb-4" opacity="0.5">mdi-chart-bar</v-icon>
              <p>Gráfico será implementado com Chart.js ou ApexCharts</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="mb-4" variant="tonal">
          <v-card-title class="text-secondary">
            <v-icon start color="secondary">mdi-clock-outline</v-icon>
            Atividades Recentes
          </v-card-title>
          <v-card-text>
            <v-timeline density="compact" side="end">
              <v-timeline-item
                v-for="(activity, index) in activities"
                :key="index"
                :dot-color="activity.color"
                size="small"
              >
                <div class="text-subtitle-2">{{ activity.title }}</div>
                <div class="text-caption text-secondary">{{ activity.time }}</div>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Status dos Serviços -->
    <v-row>
      <v-col cols="12">
        <v-card variant="tonal">
          <v-card-title class="text-info">
            <v-icon start color="info">mdi-heart-pulse</v-icon>
            Saúde do Sistema
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="3">
                <v-alert type="success" variant="tonal" density="compact">
                  <strong>API Backend</strong><br>
                  <span class="text-caption">Online - 45ms</span>
                </v-alert>
              </v-col>
              <v-col cols="12" md="3">
                <v-alert type="success" variant="tonal" density="compact">
                  <strong>Banco de Dados</strong><br>
                  <span class="text-caption">PostgreSQL - Conectado</span>
                </v-alert>
              </v-col>
              <v-col cols="12" md="3">
                <v-alert type="success" variant="tonal" density="compact">
                  <strong>Redis</strong><br>
                  <span class="text-caption">Cache ativo</span>
                </v-alert>
              </v-col>
              <v-col cols="12" md="3">
                <v-alert type="warning" variant="tonal" density="compact">
                  <strong>Evolution API</strong><br>
                  <span class="text-caption">Aguardando configuração</span>
                </v-alert>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
const activities = [
  { title: 'Novo tenant criado', time: 'Há 5 minutos', color: 'primary' },
  { title: 'Conta WhatsApp conectada', time: 'Há 15 minutos', color: 'success' },
  { title: 'Bot atualizado', time: 'Há 1 hora', color: 'secondary' },
  { title: 'Backup realizado', time: 'Há 3 horas', color: 'info' },
  { title: 'Relatório gerado', time: 'Há 5 horas', color: 'accent' }
]
</script>
