// ===== API DE PRODUCTOS =====
import CONFIG from '../config.js';
import apiFetch from '../utils/fetch.js';

const ProductsAPI = {
  /**
   * Obtener catálogo público (todos los productos activos)
   * @returns {Promise<Object>} - {success, data, error}
   */
  async getCatalog() {
    try {
      const response = await apiFetch(CONFIG.ENDPOINTS.PRODUCTS);

      if (response.ok) {
        const products = await response.json();
        return { success: true, data: products };
      } else {
        const error = await response.json();
        return { success: false, error: error.message || 'Error al obtener catálogo' };
      }
    } catch (error) {
      console.error('Error en getCatalog:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * Obtener productos del farmer actual
   * @returns {Promise<Object>} - {success, data, error}
   */
  async getMyProducts() {
    try {
      const response = await apiFetch(CONFIG.ENDPOINTS.MY_PRODUCTS);

      if (response.ok) {
        const products = await response.json();
        return { success: true, data: products };
      } else {
        const error = await response.json();
        return { success: false, error: error.message || 'Error al obtener productos' };
      }
    } catch (error) {
      console.error('Error en getMyProducts:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * Publicar nuevo producto (solo farmers)
   * @param {Object} productData - {name, description, price, stock, unit, image?}
   * @returns {Promise<Object>} - {success, data, error}
   */
  async create(productData) {
    try {
      const response = await apiFetch(CONFIG.ENDPOINTS.PRODUCTS, {
        method: 'POST',
        body: JSON.stringify(productData)
      });



      // ✅ Si status === 0 o 503, es error de red/offline
      if (response.status === 0 || response.status === 503) {
        throw new Error('Offline');
      }

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.product };
      } else {
        return { success: false, error: data.message || 'Error al publicar producto' };
      }
    } catch (error) {
      console.error('Error en create product:', error);

      // ✅ SI ESTÁ OFFLINE, LANZAR ERROR PARA QUE EL DASHBOARD LO MANEJE
      if (!navigator.onLine ||
        error.message === 'Offline' ||
        error.message.includes('Network error') ||
        error.message.includes('Failed to fetch')) {
        throw new Error('Offline');
      }

      return { success: false, error: 'Error de conexión' };
    }
  }
};

export default ProductsAPI;
