// ===== API DE PEDIDOS =====
import CONFIG from '../config.js';
import apiFetch from '../utils/fetch.js';

const OrdersAPI = {

  async create(orderData) {
    try {
      // ✅ Intentar enviar al servidor
      const response = await apiFetch(CONFIG.ENDPOINTS.ORDERS, {
        method: 'POST',
        body: JSON.stringify(orderData)
      });

      // ✅ Si status === 0 o 503, es error de red/offline
      if (response.status === 0 || response.status === 503) {
        throw new Error('Offline');
      }

      // Parsear JSON
      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.order, offline: false };
      } else {
        return {
          success: false,
          error: data.message || data.error || 'Error al crear pedido',
          offline: false
        };
      }

    } catch (error) {
      console.error('❌ Catch en create order:', error.message);

      // ✅ SI ESTÁ OFFLINE, LANZAR ERROR PARA QUE EL DASHBOARD LO MANEJE
      if (!navigator.onLine || error.message === 'Offline' || error.message.includes('Network error')) {
        throw new Error('Offline');
      }

      // ✅ ERROR GENÉRICO
      return {
        success: false,
        error: error.message || 'Error de conexión',
        offline: false
      };
    }
  },

  async getIncoming() {
    try {
      const response = await apiFetch(CONFIG.ENDPOINTS.ORDERS_INCOMING);

      if (response.ok) {
        const orders = await response.json();
        return { success: true, data: orders };
      } else {
        const data = await response.json();
        return { success: false, error: data.message || 'Error al obtener pedidos' };
      }
    } catch (error) {
      console.error('Error en getIncoming:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  async getMy() {
    try {
      const response = await apiFetch(CONFIG.ENDPOINTS.ORDERS_MY);

      if (response.ok) {
        const orders = await response.json();
        return { success: true, data: orders };
      } else {
        const data = await response.json();
        return { success: false, error: data.message || 'Error al obtener pedidos' };
      }
    } catch (error) {
      console.error('Error en getMy:', error);
      return { success: false, error: 'Error de conexión' };
    }
  },

  async updateStatus(orderId, status) {
    try {
      const endpoint = CONFIG.ENDPOINTS.ORDERS_UPDATE_STATUS.replace(':id', orderId);
      const response = await apiFetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.order };
      } else {
        return { success: false, error: data.message || 'Error al actualizar estado' };
      }
    } catch (error) {
      console.error('Error en updateStatus:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }
};

export default OrdersAPI;
