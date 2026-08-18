import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // State
  const loading = ref(false)
  const systemConfig = ref({
    dbProvider: 'postgresql',
    redisEnabled: false,
    evolutionApiUrl: '',
    evolutionApiKey: ''
  })
  const tenants = ref([])
  const whatsappAccounts = ref([])

  // Getters
  const isLoading = computed(() => loading.value)
  const getSystemConfig = computed(() => systemConfig.value)
  const getTenants = computed(() => tenants.value)
  const getWhatsappAccounts = computed(() => whatsappAccounts.value)

  // Actions
  function setLoading(value) {
    loading.value = value
  }

  function setSystemConfig(config) {
    systemConfig.value = { ...systemConfig.value, ...config }
  }

  function setTenants(data) {
    tenants.value = data
  }

  function setWhatsappAccounts(data) {
    whatsappAccounts.value = data
  }

  return {
    loading,
    systemConfig,
    tenants,
    whatsappAccounts,
    isLoading,
    getSystemConfig,
    getTenants,
    getWhatsappAccounts,
    setLoading,
    setSystemConfig,
    setTenants,
    setWhatsappAccounts
  }
})
