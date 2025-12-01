// ===== LÓGICA DE AUTENTICACIÓN =====
import AuthAPI from '../api/auth.js';
import UI from '../utils/ui.js';

const errorMessage = document.getElementById('errorMessage');

function showError(message) {
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }
}

function hideError() {
  if (errorMessage) {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
  }
}

// ===== LOGIN =====
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  const loginBtn = document.getElementById('loginBtn');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    // Deshabilitar botón
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.textContent = 'Iniciando...';
    }

    // Obtener datos del formulario
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    // Validación básica
    if (!email || !password) {
      showError('Por favor completa todos los campos');
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Entrar';
      }
      return;
    }

    // Llamar API
    try {
      const result = await AuthAPI.login({ email, password });

      if (result.success) {
        // Login exitoso → redirigir al dashboard
        window.location.href = '/pages/dashboard.html';
      } else {
        // Mostrar error
        showError(result.error || 'Error desconocido');
        if (loginBtn) {
          loginBtn.disabled = false;
          loginBtn.textContent = 'Entrar';
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      showError('Error de conexión. Intenta de nuevo.');
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Entrar';
      }
    }
  });
}

// ===== REGISTRO =====
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  const registerBtn = document.getElementById('registerBtn');

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    // Deshabilitar botón
    if (registerBtn) {
      registerBtn.disabled = true;
      registerBtn.textContent = 'Creando cuenta...';
    }

    // Obtener datos del formulario
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.getElementById('role').value;

    // Validación básica
    if (!name || !email || !password || !role) {
      showError('Por favor completa todos los campos');
      if (registerBtn) {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Crear Cuenta';
      }
      return;
    }

    if (password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres');
      if (registerBtn) {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Crear Cuenta';
      }
      return;
    }

    // Llamar API
    try {
      const result = await AuthAPI.register({ name, email, password, role });

      if (result.success) {
        // Registro exitoso → redirigir al dashboard
        UI.showToast('✅ Cuenta creada exitosamente', 'success');
        setTimeout(() => {
          window.location.href = '/pages/dashboard.html';
        }, 1500);
      } else {
        // Mostrar error
        showError(result.error || 'Error desconocido');
        if (registerBtn) {
          registerBtn.disabled = false;
          registerBtn.textContent = 'Crear Cuenta';
        }
      }
    } catch (error) {
      console.error('Register error:', error);
      showError('Error de conexión. Intenta de nuevo.');
      if (registerBtn) {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Crear Cuenta';
      }
    }
  });
}
