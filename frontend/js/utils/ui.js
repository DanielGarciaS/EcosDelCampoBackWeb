/**
 * UI Utilities for EcosDelCampo
 * Handles Toasts, Modals, and Loading States
 */

const UI = {
  // ===== TOAST NOTIFICATIONS =====
  showToast: (message, type = 'success') => {
    // Create container if not exists
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} fade-in-up`;

    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('fade-in-up');
      toast.classList.add('fade-out');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  },

  // ===== CUSTOM CONFIRM MODAL =====
  showConfirmModal: (title, message, onConfirm) => {
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'modal active custom-confirm-modal';

    modal.innerHTML = `
      <div class="modal-content fade-in-scale">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="close-modal" aria-label="Cerrar">&times;</button>
        </div>
        <div class="modal-body">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary cancel-btn">Cancelar</button>
          <button class="btn btn-primary confirm-btn">Confirmar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event Listeners
    const close = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('.close-modal').onclick = close;
    modal.querySelector('.cancel-btn').onclick = close;

    modal.querySelector('.confirm-btn').onclick = () => {
      onConfirm();
      close();
    };

    // Close on click outside
    modal.onclick = (e) => {
      if (e.target === modal) close();
    };
  },

  // ===== LOADING SPINNER =====
  getSpinner: () => {
    return `
      <div class="spinner-container fade-in">
        <div class="spinner"></div>
        <p class="spinner-text">Cargando...</p>
      </div>
    `;
  }
};

export default UI;
