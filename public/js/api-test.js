/**
 * DiixWhatsapp API - Teste Interativo de Endpoints
 * Script opcional para testar endpoints diretamente do navegador
 */

const API_BASE_URL = window.location.origin + '/api/v1';

// Armazenar token JWT
let authToken = localStorage.getItem('diix_auth_token') || '';

// Função para salvar token
function saveToken(token) {
  authToken = token;
  localStorage.setItem('diix_auth_token', token);
  updateAuthStatus();
}

// Função para limpar token
function clearToken() {
  authToken = '';
  localStorage.removeItem('diix_auth_token');
  updateAuthStatus();
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
    
    return {
      success: response.ok,
      status: response.status,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      error: error.message
    };
  }
}

// Funções específicas para cada endpoint
const API = {
  // Health Check
  health: () => fetch('/health').then(r => r.json()),
  
  // Auth
  login: (email, password) => apiRequest('/auth/login', 'POST', { email, password }),
  register: (data) => apiRequest('/auth/register', 'POST', data),
  getMe: () => apiRequest('/auth/me'),
  updateProfile: (data) => apiRequest('/auth/profile', 'PUT', data),
  changePassword: (currentPassword, newPassword) => 
    apiRequest('/auth/change-password', 'PUT', { currentPassword, newPassword }),
  
  // Products
  getProducts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/products${queryString ? '?' + queryString : ''}`);
  },
  getProduct: (id) => apiRequest(`/products/${id}`),
  createProduct: (data) => apiRequest('/products', 'POST', data),
  updateProduct: (id, data) => apiRequest(`/products/${id}`, 'PUT', data),
  deleteProduct: (id) => apiRequest(`/products/${id}`, 'DELETE'),
  getCategories: () => apiRequest('/products/categories'),
  
  // Admin (requer SUPER_ADMIN)
  getStats: () => apiRequest('/admin/stats'),
  getTenants: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/tenants${queryString ? '?' + queryString : ''}`);
  },
  getTenant: (id) => apiRequest(`/admin/tenants/${id}`),
  createTenant: (data) => apiRequest('/admin/tenants', 'POST', data),
  updateTenant: (id, data) => apiRequest(`/admin/tenants/${id}`, 'PUT', data),
  blockTenant: (id) => apiRequest(`/admin/tenants/${id}/block`, 'PUT'),
  deleteTenant: (id) => apiRequest(`/admin/tenants/${id}`, 'DELETE'),
};

// Expor funções globalmente
window.DiixAPI = API;
window.saveToken = saveToken;
window.clearToken = clearToken;
window.apiRequest = apiRequest;
window.updateAuthStatus = updateAuthStatus;

// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  updateAuthStatus();
  console.log('🚀 DiixWhatsapp API Client pronto!');
  console.log('Use window.DiixAPI para fazer requisições');
  console.log('Exemplo: await DiixAPI.health()');
});
