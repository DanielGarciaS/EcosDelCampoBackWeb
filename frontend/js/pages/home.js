// ===== LÓGICA HOME PAGE =====
import AuthAPI from '../api/auth.js';

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('✅ Service Worker registrado'))
    .catch(err => console.error('❌ Error SW:', err));
}

// Redireccionar si ya está autenticado
if (AuthAPI.isAuthenticated()) {
  window.location.href = '/pages/dashboard.html';
}
