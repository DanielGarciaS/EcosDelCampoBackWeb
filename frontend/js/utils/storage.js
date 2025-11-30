// ===== UTILIDADES PARA LOCALSTORAGE =====
// Centraliza todas las operaciones de almacenamiento local

import CONFIG from '../config.js';

const Storage = {
  // ===== TOKEN =====
  saveToken(token) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN_TIMESTAMP, Date.now().toString());
  },

  getToken() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
  },

  getTokenTimestamp() {
    const timestamp = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN_TIMESTAMP);
    return timestamp ? parseInt(timestamp) : null;
  },

  isTokenExpired() {
    const timestamp = this.getTokenTimestamp();
    if (!timestamp) return true;
    
    const now = Date.now();
    const elapsed = now - timestamp;
    return elapsed >= CONFIG.TOKEN_EXPIRY;
  },

  removeToken() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN_TIMESTAMP);
  },

  // ===== USER =====
  saveUser(user) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getUser() {
    const user = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  removeUser() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
  },

  // ===== AUTH STATUS =====
  isAuthenticated() {
    return this.getToken() !== null && this.getUser() !== null;
  },

  getUserRole() {
    const user = this.getUser();
    return user ? user.role : null;
  },

  // ===== LOGOUT =====
  clearAll() {
    this.removeToken();
    this.removeUser();
  }
};

export default Storage;
