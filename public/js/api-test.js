/**
 * DiixWhatsapp API - Client JavaScript para Frontend
 * Biblioteca completa para interagir com a API REST
 */

const API_BASE_URL = window.location.origin + '/api/v1';

// Armazenar token JWT
let authToken = localStorage.getItem('diix_token') || '';

// Função para salvar token
function saveToken(token) {
  authToken = token;
  localStorage.setItem('diix_token', token);
  if (typeof updateAuthStatus === 'function') updateAuthStatus();
}

// Função para limpar token
function clearToken() {
  authToken = '';
  localStorage.removeItem('diix_token');
  if (typeof updateAuthStatus === 'function') updateAuthStatus();
}

// Atualizar status da autenticação na UI
function updateAuthStatus() {
  const statusEl = document.getElementById('auth-status');
  const tokenInput = document.getElementById('token-input');
  
  if (statusEl && tokenInput) {
    if (authToken) {
      statusEl.textContent = '✅ Autenticado';
      statusEl.className = 'auth-status authenticated';
      tokenInput.value = authToken.substring(0, 50) + '...';
    } else {
      statusEl.textContent = '❌ Não autenticado';
      statusEl.className = 'auth-status not-authenticated';
      tokenInput.value = '';
    }
  }
}

// Função genérica para fazer requisições à API
async function apiRequest(endpoint, method = 'GET', data = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Adicionar token se existir
  if (authToken) {
    options.headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Adicionar body se for POST/PUT/PATCH
  if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    // Throw error para respostas não-ok
    if (!response.ok) {
      const error = new Error(result.message || 'Erro na requisição');
      error.response = { status: response.status, data: result };
      throw error;
    }
    
    return {
      success: true,
      status: response.status,
      data: result
    };
  } catch (error) {
    if (error.response) {
      throw error;
    }
    return {
      success: false,
      status: 0,
      error: error.message
    };
  }
}

// Funções específicas para cada endpoint
const DiixAPI = {
  // Health Check
  health: () => fetch('/health').then(r => r.json()),
  
  // Auth
  login: async (email, password) => {
    const url = `${API_BASE_URL}/auth/login`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();
    if (!response.ok) {
      const error = new Error(result.message || 'Login falhou');
      error.response = { status: response.status, data: result };
      throw error;
    }
    return { data: result, status: response.status };
  },
  
  register: (data) => apiRequest('/auth/register', 'POST', data),
  
  getMe: async () => {
    const result = await apiRequest('/auth/me');
    return { data: result.data, status: result.status };
  },
  
  updateProfile: (data) => apiRequest('/auth/profile', 'PUT', data),
  
  changePassword: (currentPassword, newPassword) => 
    apiRequest('/auth/change-password', 'PUT', { currentPassword, newPassword }),
  
  // Products
  getProducts: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const result = await apiRequest(`/products${queryString ? '?' + queryString : ''}`);
    return { data: result.data, status: result.status };
  },
  
  getProduct: (id) => apiRequest(`/products/${id}`),
  
  createProduct: (data) => apiRequest('/products', 'POST', data),
  
  updateProduct: (id, data) => apiRequest(`/products/${id}`, 'PUT', data),
  
  deleteProduct: (id) => apiRequest(`/products/${id}`, 'DELETE'),
  
  getCategories: async () => {
    const result = await apiRequest('/products/categories');
    return { data: result.data, status: result.status };
  },
  
  // Admin (requer SUPER_ADMIN)
  getAdminStats: async () => {
    const result = await apiRequest('/admin/stats');
    return { data: result.data, status: result.status };
  },
  
  getTenants: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const result = await apiRequest(`/admin/tenants${queryString ? '?' + queryString : ''}`);
    return { data: result.data, status: result.status };
  },
  
  getTenant: (id) => apiRequest(`/admin/tenants/${id}`),
  
  createTenant: async (data) => {
    const result = await apiRequest('/admin/tenants', 'POST', data);
    return { data: result.data, status: result.status };
  },
  
  updateTenant: (id, data) => apiRequest(`/admin/tenants/${id}`, 'PUT', data),
  
  toggleTenantBlock: async (id) => {
    const result = await apiRequest(`/admin/tenants/${id}/block`, 'PUT');
    return { data: result.data, status: result.status };
  },
  
  deleteTenant: async (id) => {
    const result = await apiRequest(`/admin/tenants/${id}`, 'DELETE');
    return { data: result.data, status: result.status };
  },
};

// Expor funções globalmente
window.DiixAPI = DiixAPI;
window.saveToken = saveToken;
window.clearToken = clearToken;
window.apiRequest = apiRequest;

// Alias para compatibilidade
window.API = DiixAPI;

// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  if (typeof updateAuthStatus === 'function') {
    updateAuthStatus();
  }
  console.log('🚀 DiixWhatsapp API Client pronto!');
  console.log('Use window.DiixAPI para fazer requisições');
  console.log('Exemplos:');
  console.log('  await DiixAPI.health()');
  console.log('  await DiixAPI.login("email@test.com", "senha")');
  console.log('  await DiixAPI.getTenants()');
});
