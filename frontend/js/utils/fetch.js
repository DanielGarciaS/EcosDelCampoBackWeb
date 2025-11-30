// ===== FETCH CON AUTO-REFRESH DE TOKEN =====
import CONFIG from '../config.js';
import Storage from './storage.js';

const apiFetch = async (endpoint, options = {}) => {
  const url = `${CONFIG.API_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json'
  };

  const token = Storage.getToken();
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const finalOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    },
    credentials: 'include'
  };

  try {
    let response = await fetch(url, finalOptions);

    // Si es 403 (token expirado), intentar refresh
    if (response.status === 403 && Storage.isAuthenticated()) {
      console.log('🔄 Token expirado, refrescando...');
      const refreshed = await refreshToken();

      if (refreshed) {
        const newToken = Storage.getToken();
        finalOptions.headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, finalOptions);
      } else {
        Storage.clearAll();
        window.location.href = '/pages/login.html';
        throw new Error('Sesión expirada');
      }
    }

    return response;

  } catch (error) {
    // ✅ AQUÍ SE CAPTURA: fetch failed (OFFLINE)
    console.error('❌ Error en apiFetch:', error.message);

    // Devolver respuesta fake con status 0 (indicador de error de red)
    return {
      ok: false,
      status: 0,
      statusText: 'Network Error',
      json: async () => ({
        message: 'Error de conexión - Offline',
        error: error.message
      })
    };
  }
};

async function refreshToken() {
  try {
    const response = await fetch(`${CONFIG.API_URL}${CONFIG.ENDPOINTS.REFRESH}`, {
      method: 'POST',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      Storage.saveToken(data.token);
      console.log('✅ Token refrescado exitosamente');
      return true;
    } else {
      console.error('❌ Error al refrescar token:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error de red al refrescar token:', error);
    return false;
  }
}

export default apiFetch;
