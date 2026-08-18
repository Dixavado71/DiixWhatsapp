<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 text-primary mb-4">
          <v-icon start color="primary">mdi-cog</v-icon>
          Configurações do Sistema
        </h1>
      </v-col>
    </v-row>

    <v-row>
      <!-- Configuração do Banco de Dados -->
      <v-col cols="12" md="6">
        <v-card class="mb-4" variant="tonal">
          <v-card-title class="text-secondary">
            <v-icon start color="secondary">mdi-database</v-icon>
            Banco de Dados
          </v-card-title>
          <v-card-text>
            <v-select
              v-model="config.dbProvider"
              :items="dbProviders"
              label="Provider de Banco de Dados"
              prepend-inner-icon="mdi-database"
              variant="outlined"
              color="secondary"
            ></v-select>

            <v-alert type="info" variant="tonal" class="mt-3" density="compact">
              <strong>PostgreSQL:</strong> Ideal para dados estruturados e transações.<br>
              <strong>MongoDB:</strong> Ideal para documentos flexíveis e histórico.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Configuração do Redis -->
      <v-col cols="12" md="6">
        <v-card class="mb-4" variant="tonal">
          <v-card-title class="text-accent">
            <v-icon start color="accent">mdi-lightning-bolt</v-icon>
            Redis Cache
          </v-card-title>
          <v-card-text>
            <v-switch
              v-model="config.redisEnabled"
              label="Habilitar Redis"
              color="accent"
              inset
            ></v-switch>

            <v-text-field
              v-if="config.redisEnabled"
              v-model="config.redisUrl"
              label="URL do Redis"
              placeholder="redis://localhost:6379"
              prepend-inner-icon="mdi-redis"
              variant="outlined"
              class="mt-3"
            ></v-text-field>

            <v-alert type="success" variant="tonal" class="mt-3" density="compact" v-if="config.redisEnabled">
              Redis melhora performance com cache e filas de processamento.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- Configuração Evolution API -->
      <v-col cols="12">
        <v-card class="mb-4" variant="tonal">
          <v-card-title class="text-primary">
            <v-icon start color="primary">mdi-api</v-icon>
            Evolution API (WhatsApp)
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="config.evolutionApiUrl"
                  label="URL da Evolution API"
                  placeholder="http://localhost:8080"
                  prepend-inner-icon="mdi-link"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="config.evolutionApiKey"
                  label="API Key"
                  type="password"
                  prepend-inner-icon="mdi-key"
                  variant="outlined"
                  :append-inner-icon="showApiKey ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showApiKey = !showApiKey"
                  :type="showApiKey ? 'text' : 'password'"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-btn
              color="primary"
              class="mt-3"
              prepend-icon="mdi-check"
              @click="saveConfig"
              :loading="saving"
            >
              Salvar Configurações
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- Status do Sistema -->
      <v-col cols="12">
        <v-card variant="tonal">
          <v-card-title class="text-info">
            <v-icon start color="info">mdi-server</v-icon>
            Status dos Serviços
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-alert
                  :type="status.database ? 'success' : 'error'"
                  variant="tonal"
                  :icon="status.database ? 'mdi-check-circle' : 'mdi-alert-circle'"
                >
                  <strong>Banco de Dados</strong><br>
                  {{ status.database ? 'Conectado' : 'Desconectado' }}
                </v-alert>
              </v-col>
              <v-col cols="12" md="4">
                <v-alert
                  :type="status.redis ? 'success' : 'warning'"
                  variant="tonal"
                  :icon="status.redis ? 'mdi-check-circle' : 'mdi-alert'"
                >
                  <strong>Redis</strong><br>
                  {{ config.redisEnabled ? (status.redis ? 'Ativo' : 'Inativo') : 'Desabilitado' }}
                </v-alert>
              </v-col>
              <v-col cols="12" md="4">
                <v-alert
                  :type="status.evolutionApi ? 'success' : 'error'"
                  variant="tonal"
                  :icon="status.evolutionApi ? 'mdi-check-circle' : 'mdi-alert-circle'"
                >
                  <strong>Evolution API</strong><br>
                  {{ status.evolutionApi ? 'Conectado' : 'Desconectado' }}
                </v-alert>
              </v-col>
            </v-row>

            <v-btn
              variant="outlined"
              color="info"
              prepend-icon="mdi-refresh"
              class="mt-3"
              @click="checkStatus"
              :loading="checkingStatus"
            >
              Verificar Status
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const showApiKey = ref(false)
const saving = ref(false)
const checkingStatus = ref(false)

const dbProviders = [
  { title: 'PostgreSQL', value: 'postgresql' },
  { title: 'MongoDB', value: 'mongodb' }
]

const config = reactive({
  dbProvider: 'postgresql',
  redisEnabled: false,
  redisUrl: 'redis://localhost:6379',
  evolutionApiUrl: '',
  evolutionApiKey: ''
})

const status = reactive({
  database: false,
  redis: false,
  evolutionApi: false
})

const saveConfig = async () => {
  saving.value = true
  try {
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000))
    appStore.setSystemConfig(config)
    alert('Configurações salvas com sucesso!')
  } catch (error) {
    alert('Erro ao salvar configurações')
  } finally {
    saving.value = false
  }
}

const checkStatus = async () => {
  checkingStatus.value = true
  try {
    // Simular verificação de status
    await new Promise(resolve => setTimeout(resolve, 1000))
    status.database = true
    status.redis = config.redisEnabled
    status.evolutionApi = !!config.evolutionApiUrl
  } catch (error) {
    console.error('Erro ao verificar status:', error)
  } finally {
    checkingStatus.value = false
  }
}

onMounted(() => {
  const savedConfig = appStore.getSystemConfig
  if (savedConfig.dbProvider) {
    Object.assign(config, savedConfig)
  }
  checkStatus()
})
</script>
