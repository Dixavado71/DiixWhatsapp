// ===========================================
// Dashboard Admin JavaScript
// ===========================================

let currentUser = null;
let currentStats = null;
let allTenants = [];

document.addEventListener('DOMContentLoaded', async function() {
  // Check authentication
  const token = localStorage.getItem('diix_token');
  if (!token) {
    window.location.href = '/login';
    return;
  }

  // Load user data
  await loadUserData();
  
  // Load dashboard stats
  await loadDashboardStats();
  
  // Setup event listeners
  setupEventListeners();
});

// ===========================================
// User Data & Authentication
// ===========================================

async function loadUserData() {
  try {
    const response = await DiixAPI.getMe();
    currentUser = response.data;
    
    // Update UI with user info
    document.getElementById('userName').textContent = currentUser.name || currentUser.email;
    document.getElementById('userRole').textContent = currentUser.role || 'ADMIN';
    
    // Set avatar initial
    const initial = (currentUser.name || currentUser.email).charAt(0).toUpperCase();
    document.getElementById('userAvatar').textContent = initial;
    
    // Check if user is admin
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'TENANT_ADMIN') {
      showToast('Você não tem permissão para acessar esta área.', 'error');
      setTimeout(() => {
        localStorage.removeItem('diix_token');
        window.location.href = '/login';
      }, 2000);
      return;
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('diix_token');
      window.location.href = '/login';
    }
  }
}

async function loadDashboardStats() {
  try {
    const response = await DiixAPI.getAdminStats();
    currentStats = response.data;
    
    // Update stat cards
    if (currentStats.tenants !== undefined) {
      document.getElementById('totalTenants').textContent = currentStats.tenants.total || 0;
      document.getElementById('activeTenants').textContent = currentStats.tenants.active || 0;
    }
    
    if (currentStats.products !== undefined) {
      document.getElementById('totalProducts').textContent = currentStats.products.total || 0;
    }
    
    if (currentStats.users !== undefined) {
      document.getElementById('totalUsers').textContent = currentStats.users.total || 0;
    }
    
    // Update platform stats section
    updatePlatformStats(currentStats);
  } catch (error) {
    console.error('Error loading stats:', error);
    document.getElementById('platformStats').innerHTML = `
      <div class="error-message">Erro ao carregar estatísticas: ${error.message}</div>
    `;
  }
}

function updatePlatformStats(stats) {
  const html = `
    <div class="stats-detail">
      <div class="stat-row">
        <span class="stat-label">Tenants Ativos:</span>
        <span class="stat-value">${stats.tenants?.active || 0}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Tenants Bloqueados:</span>
        <span class="stat-value">${stats.tenants?.blocked || 0}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Total de Produtos:</span>
        <span class="stat-value">${stats.products?.total || 0}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Categorias:</span>
        <span class="stat-value">${stats.products?.categories || 0}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Última Atualização:</span>
        <span class="stat-value">${new Date().toLocaleString('pt-BR')}</span>
      </div>
    </div>
  `;
  document.getElementById('platformStats').innerHTML = html;
}

// ===========================================
// Navigation & Sections
// ===========================================

function setupEventListeners() {
  // Sidebar navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const section = this.dataset.section;
      showSection(section);
    });
  });

  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // Menu toggle for mobile
  document.getElementById('menuToggle').addEventListener('click', toggleSidebar);

  // Modal controls
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('newTenantBtn').addEventListener('click', openNewTenantModal);
  document.getElementById('tenantForm').addEventListener('submit', handleTenantSubmit);

  // Close modal when clicking outside
  document.getElementById('tenantModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeModal();
    }
  });
}

function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });

  // Remove active from nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  // Show selected section
  const targetSection = document.getElementById(`${sectionName}Section`);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // Update nav item
  const navItem = document.querySelector(`[data-section="${sectionName}"]`);
  if (navItem) {
    navItem.classList.add('active');
  }

  // Update page title
  const titles = {
    dashboard: 'Dashboard',
    tenants: 'Gerenciamento de Tenants',
    products: 'Gerenciamento de Produtos',
    users: 'Gerenciamento de Usuários',
    settings: 'Configurações'
  };
  document.getElementById('pageTitle').textContent = titles[sectionName] || 'Dashboard';

  // Load section data
  if (sectionName === 'tenants') {
    loadTenants();
  } else if (sectionName === 'products') {
    loadProducts();
  }

  // Close sidebar on mobile
  if (window.innerWidth <= 1024) {
    document.querySelector('.sidebar').classList.remove('show');
  }
}

function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('show');
}

function handleLogout() {
  if (confirm('Tem certeza que deseja sair?')) {
    localStorage.removeItem('diix_token');
    localStorage.removeItem('diix_saved_email');
    window.location.href = '/login';
  }
}

// ===========================================
// Tenants Management
// ===========================================

async function loadTenants() {
  try {
    const response = await DiixAPI.getTenants();
    allTenants = response.data.tenants || response.data || [];
    
    renderTenantsTable(allTenants);
  } catch (error) {
    console.error('Error loading tenants:', error);
    document.getElementById('tenantsTableBody').innerHTML = `
      <tr>
        <td colspan="7" class="text-center">Erro ao carregar tenants: ${error.message}</td>
      </tr>
    `;
  }
}

function renderTenantsTable(tenants) {
  const tbody = document.getElementById('tenantsTableBody');
  
  if (!tenants || tenants.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">Nenhum tenant encontrado</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = tenants.map(tenant => `
    <tr>
      <td>${tenant.id.substring(0, 8)}...</td>
      <td><strong>${tenant.name}</strong></td>
      <td><code>${tenant.slug}</code></td>
      <td><span class="status-badge ${tenant.plan}">${tenant.plan}</span></td>
      <td>
        <span class="status-badge ${tenant.blocked ? 'blocked' : 'active'}">
          ${tenant.blocked ? 'Bloqueado' : 'Ativo'}
        </span>
      </td>
      <td>${new Date(tenant.createdAt).toLocaleDateString('pt-BR')}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn edit" onclick="editTenant('${tenant.id}')">Editar</button>
          <button class="action-btn block" onclick="toggleTenantBlock('${tenant.id}', ${tenant.blocked})">
            ${tenant.blocked ? 'Desbloquear' : 'Bloquear'}
          </button>
          <button class="action-btn delete" onclick="deleteTenant('${tenant.id}')">Excluir</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openNewTenantModal() {
  document.getElementById('modalTitle').textContent = 'Novo Tenant';
  document.getElementById('tenantForm').reset();
  document.getElementById('tenantModal').classList.add('show');
}

function closeModal() {
  document.getElementById('tenantModal').classList.remove('show');
}

async function handleTenantSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = {
    name: formData.get('name'),
    slug: formData.get('slug'),
    plan: formData.get('plan'),
    maxUsers: parseInt(formData.get('maxUsers')),
    maxProducts: parseInt(formData.get('maxProducts'))
  };

  try {
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    const response = await DiixAPI.createTenant(data);
    
    showToast('Tenant criado com sucesso!', 'success');
    closeModal();
    loadTenants();
    loadDashboardStats();
  } catch (error) {
    console.error('Error creating tenant:', error);
    showToast(`Erro ao criar tenant: ${error.message}`, 'error');
  } finally {
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = false;
    btn.textContent = 'Salvar';
  }
}

async function toggleTenantBlock(tenantId, currentlyBlocked) {
  if (!confirm(`Tem certeza que deseja ${currentlyBlocked ? 'desbloquear' : 'bloquear'} este tenant?`)) {
    return;
  }

  try {
    await DiixAPI.toggleTenantBlock(tenantId);
    showToast(`Tenant ${currentlyBlocked ? 'desbloqueado' : 'bloqueado'} com sucesso!`, 'success');
    loadTenants();
    loadDashboardStats();
  } catch (error) {
    console.error('Error toggling tenant block:', error);
    showToast(`Erro: ${error.message}`, 'error');
  }
}

async function deleteTenant(tenantId) {
  if (!confirm('ATENÇÃO: Esta ação não pode ser desfeita. Tem certeza que deseja excluir este tenant?')) {
    return;
  }

  try {
    await DiixAPI.deleteTenant(tenantId);
    showToast('Tenant excluído com sucesso!', 'success');
    loadTenants();
    loadDashboardStats();
  } catch (error) {
    console.error('Error deleting tenant:', error);
    showToast(`Erro ao excluir tenant: ${error.message}`, 'error');
  }
}

function editTenant(tenantId) {
  // TODO: Implement edit functionality
  showToast('Funcionalidade de edição em desenvolvimento', 'info');
}

// ===========================================
// Products Management
// ===========================================

async function loadProducts() {
  const tbody = document.getElementById('productsTableBody');
  
  if (allTenants.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">Nenhum tenant disponível para carregar produtos</td>
      </tr>
    `;
    return;
  }

  // For now, show message to select tenant
  // In a full implementation, you would add tenant selector and load products per tenant
  tbody.innerHTML = `
    <tr>
      <td colspan="7" class="text-center">
        <p>Selecione um tenant específico para visualizar seus produtos.</p>
        <p style="color: #718096; font-size: 13px; margin-top: 8px;">
          Funcionalidade completa em desenvolvimento...
        </p>
      </td>
    </tr>
  `;
}

// ===========================================
// Utility Functions
// ===========================================

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Make showSection available globally for inline onclick handlers
window.showSection = showSection;
