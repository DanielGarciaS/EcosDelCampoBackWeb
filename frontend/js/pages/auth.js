// ===== LÓGICA DE AUTENTICACIÓN =====
import AuthAPI from '../api/auth.js';

const currentPage = window.location.pathname;

// ===== COMÚN PARA AMBAS PÁGINAS =====
const errorMessage = document.getElementById('errorMessage');

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}

function hideError() {
  errorMessage.textContent = '';
  errorMessage.style.display = 'none';
}

// ===== LOGIN =====
if (currentPage.includes('login.html')) {
  const loginForm = document.getElementById('loginForm');
  const loginBtn = document.getElementById('loginBtn');
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    
    // Deshabilitar botón
    loginBtn.disabled = true;
    loginBtn.textContent = 'Iniciando...';
    
    // Obtener datos del formulario
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    // Validación básica
    if (!email || !password) {
      showError('Por favor completa todos los campos');
      loginBtn.disabled = false;
      loginBtn.textContent = 'Entrar';
      return;
    }
    
    // Llamar API
    const result = await AuthAPI.login({ email, password });
    
    if (result.success) {
      // Login exitoso → redirigir al dashboard
      window.location.href = '/pages/dashboard.html';
    } else {
      // Mostrar error
      showError(result.error);
      loginBtn.disabled = false;
      loginBtn.textContent = 'Entrar';
    }
  });
}

// ===== REGISTRO =====
if (currentPage.includes('register.html')) {
  const registerForm = document.getElementById('registerForm');
  const registerBtn = document.getElementById('registerBtn');
  
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    
    // Deshabilitar botón
    registerBtn.disabled = true;
    registerBtn.textContent = 'Creando cuenta...';
    
    // Obtener datos del formulario
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.getElementById('role').value;
    
    // Validación básica
    if (!name || !email || !password || !role) {
      showError('Por favor completa todos los campos');
      registerBtn.disabled = false;
      registerBtn.textContent = 'Crear Cuenta';
      return;
    }
    
    if (password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres');
      registerBtn.disabled = false;
      registerBtn.textContent = 'Crear Cuenta';
      return;
    }
    
    // Llamar API
    const result = await AuthAPI.register({ name, email, password, role });
    
    if (result.success) {
      // Registro exitoso → redirigir al dashboard
      alert('✅ Cuenta creada exitosamente');
      window.location.href = '/pages/dashboard.html';
    } else {
      // Mostrar error
      showError(result.error);
      registerBtn.disabled = false;
      registerBtn.textContent = 'Crear Cuenta';
    }
  });
}
