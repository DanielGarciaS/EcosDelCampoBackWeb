// ===== CONFIGURACIÓN GLOBAL =====
// Centraliza todas las URLs y constantes de la app

const CONFIG = {
  // URL base del backend
  API_URL: '/api',

  // Endpoints específicos
  ENDPOINTS: {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',

    // Products
    PRODUCTS: '/products',
    MY_PRODUCTS: '/products/my',

    // Orders
    ORDERS: '/orders',
    ORDERS_INCOMING: '/orders/incoming',
    ORDERS_MY: '/orders/my',
    ORDERS_UPDATE_STATUS: '/orders/:id'  // ✅ CORREGIDO: Quitado /status
  },

  // Tiempos de expiración (en milisegundos)
  TOKEN_EXPIRY: 15 * 60 * 1000, // 15 minutos
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 días

  // Keys para localStorage
  STORAGE_KEYS: {
    TOKEN: 'token',
    USER: 'user',
    TOKEN_TIMESTAMP: 'token_timestamp'
  },

  // Roles de usuario
  ROLES: {
    FARMER: 'farmer',
    BUYER: 'buyer'
  }
};

// Exportar para usar en otros archivos
export default CONFIG;
