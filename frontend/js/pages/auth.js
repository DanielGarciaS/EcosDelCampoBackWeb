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

// ===== SEGURIDAD UI (Toggle Password & Strength Meter) =====
function setupSecurityUI() {
  const passwordInputs = document.querySelectorAll('input[type="password"]');

  passwordInputs.forEach(input => {
    // 1. Toggle Visibility
    const wrapper = document.createElement('div');
    wrapper.className = 'password-wrapper';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'password-toggle';
    toggleBtn.innerHTML = '👁️';
    toggleBtn.onclick = () => {
      const type = input.type === 'password' ? 'text' : 'password';
      input.type = type;
      toggleBtn.innerHTML = type === 'password' ? '👁️' : '🔒';
    };
    wrapper.appendChild(toggleBtn);

    // 2. Strength Meter (Solo para Registro)
    if (input.id === 'password' && document.getElementById('registerForm')) {
      const meter = document.createElement('div');
      meter.className = 'password-strength';
      meter.innerHTML = `
        <div class="strength-bar"><div class="strength-fill"></div></div>
        <p class="strength-text">Seguridad: Baja</p>
        <ul class="strength-requirements">
          <li id="req-length">Mínimo 8 caracteres</li>
          <li id="req-upper">Una mayúscula</li>
          <li id="req-lower">Una minúscula</li>
          <li id="req-number">Un número</li>
          <li id="req-symbol">Un símbolo</li>
        </ul>
      `;
      input.parentNode.appendChild(meter);

      input.addEventListener('input', () => {
        const val = input.value;
        const reqs = {
          length: val.length >= 8,
          upper: /[A-Z]/.test(val),
          lower: /[a-z]/.test(val),
          number: /[0-9]/.test(val),
          symbol: /[\W]/.test(val)
        };

        // Actualizar lista
        document.getElementById('req-length').className = reqs.length ? 'valid' : '';
        document.getElementById('req-upper').className = reqs.upper ? 'valid' : '';
        document.getElementById('req-lower').className = reqs.lower ? 'valid' : '';
        document.getElementById('req-number').className = reqs.number ? 'valid' : '';
        document.getElementById('req-symbol').className = reqs.symbol ? 'valid' : '';

        // Calcular Score
        const score = Object.values(reqs).filter(Boolean).length;
        const fill = meter.querySelector('.strength-fill');
        const text = meter.querySelector('.strength-text');

        fill.style.width = `${(score / 5) * 100}%`;

        if (score <= 2) {
          fill.style.backgroundColor = '#EF4444'; // Rojo
          text.textContent = 'Seguridad: Débil';
        } else if (score <= 4) {
          fill.style.backgroundColor = '#F59E0B'; // Amarillo
          text.textContent = 'Seguridad: Media';
        } else {
          fill.style.backgroundColor = '#10B981'; // Verde
          text.textContent = 'Seguridad: Fuerte';
        }
      });
    }
  });
}

// Inicializar UI de seguridad al cargar
document.addEventListener('DOMContentLoaded', setupSecurityUI);

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

    // Obtener datos del formulario
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.getElementById('role').value;

    // Validación Frontend Estricta
    if (!name || !email || !password || !role) {
      showError('Por favor completa todos los campos');
      return;
    }

    // Validar requisitos de password
    const strongPassword =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[\W]/.test(password);

    if (!strongPassword) {
      showError('La contraseña no cumple con los requisitos de seguridad.');
      return;
    }

    // Deshabilitar botón
    if (registerBtn) {
      registerBtn.disabled = true;
      registerBtn.textContent = 'Creando cuenta...';
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
