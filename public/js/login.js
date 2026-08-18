// ===========================================
// Login Page JavaScript
// ===========================================

document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberCheckbox = document.getElementById('remember');
  const errorMessage = document.getElementById('errorMessage');
  const loginBtn = document.getElementById('loginBtn');
  const btnText = loginBtn.querySelector('.btn-text');
  const btnLoading = loginBtn.querySelector('.btn-loading');

  // Check if already logged in
  if (localStorage.getItem('diix_token')) {
    window.location.href = '/dashboard';
    return;
  }

  // Load saved email if "remember me" was checked
  const savedEmail = localStorage.getItem('diix_saved_email');
  if (savedEmail) {
    emailInput.value = savedEmail;
    rememberCheckbox.checked = true;
  }

  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Hide previous errors
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';

    // Show loading state
    loginBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-block';

    try {
      const response = await DiixAPI.login(email, password);
      
      if (response.data && response.data.token) {
        const token = response.data.token;
        
        // Save token
        localStorage.setItem('diix_token', token);
        
        // Save email if remember me is checked
        if (rememberCheckbox.checked) {
          localStorage.setItem('diix_saved_email', email);
        } else {
          localStorage.removeItem('diix_saved_email');
        }

        // Show success message
        showToast('Login realizado com sucesso!', 'success');

        // Redirect to dashboard after short delay
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        throw new Error('Token não recebido na resposta');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMsg = 'Erro ao fazer login. Verifique suas credenciais.';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMsg = 'E-mail ou senha inválidos.';
        } else if (error.response.status === 403) {
          errorMsg = 'Acesso negado. Você não tem permissão para acessar o painel admin.';
        } else if (error.response.data && error.response.data.message) {
          errorMsg = error.response.data.message;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }

      errorMessage.textContent = errorMsg;
      errorMessage.style.display = 'block';
      
      // Shake animation on error
      loginBtn.classList.add('shake');
      setTimeout(() => loginBtn.classList.remove('shake'), 500);
    } finally {
      // Reset button state
      loginBtn.disabled = false;
      btnText.style.display = 'inline-block';
      btnLoading.style.display = 'none';
    }
  });
});

// Toast notification helper
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
