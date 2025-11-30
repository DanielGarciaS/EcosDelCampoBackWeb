// ===== API DE AUTENTICACIÓN =====
// Funciones para login, register y logout

import CONFIG from '../config.js';
import Storage from '../utils/storage.js';
import apiFetch from '../utils/fetch.js';

const AuthAPI = {
  /**
   * Registrar nuevo usuario
   * @param {Object} userData - {name, email, password, role}
   * @returns {Promise<Object>} - {success, data, error}
   */
  async register(userData) {
    try {
      const response = await apiFetch(CONFIG.ENDPOINTS.REGISTER, {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Guardar token y usuario
        Storage.saveToken(data.token);
        Storage.saveUser(data.user);
        
        return { success: true, data: data.user };
      } else {
        return { success: false, error: data.message || 'Error al registrar' };
      }
    } catch (error) {
      console.error('Error en register:', error);
      return { success: false, error: 'Error de conexión. Verifica que el servidor esté corriendo.' };
    }
  },

  /**
   * Iniciar sesión
   * @param {Object} credentials - {email, password}
   * @returns {Promise<Object>} - {success, data, error}
   */
  async login(credentials) {
    try {
      const response = await apiFetch(CONFIG.ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Guardar token y usuario
        Storage.saveToken(data.token);
        Storage.saveUser(data.user);
        
        return { success: true, data: data.user };
      } else {
        return { success: false, error: data.message || 'Credenciales inválidas' };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: 'Error de conexión. Verifica que el servidor esté corriendo.' };
    }
  },

  /**
   * Cerrar sesión
   */
  logout() {
    Storage.clearAll();
    window.location.href = '/index.html';
  },

  /**
   * Verificar si usuario está autenticado
   * @returns {boolean}
   */
  isAuthenticated() {
    return Storage.isAuthenticated();
  },

  /**
   * Obtener usuario actual
   * @returns {Object|null}
   */
  getCurrentUser() {
    return Storage.getUser();
  },

  /**
   * Verificar si usuario tiene un rol específico
   * @param {string} role - 'farmer' o 'buyer'
   * @returns {boolean}
   */
  hasRole(role) {
    const user = Storage.getUser();
    return user && user.role === role;
  }
};

export default AuthAPI;
