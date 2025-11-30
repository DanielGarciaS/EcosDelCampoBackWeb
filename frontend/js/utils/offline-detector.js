// ===== OFFLINE DETECTOR =====
// Detecta cambios de estado online/offline

class OfflineDetector {
  constructor() {
    this.isOnline = navigator.onLine;
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🟢 ONLINE');
      document.body.classList.remove('offline');
      document.body.classList.add('online');
      window.dispatchEvent(new Event('app:online'));
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('🔴 OFFLINE');
      document.body.classList.remove('online');
      document.body.classList.add('offline');
      window.dispatchEvent(new Event('app:offline'));
    });

    if (this.isOnline) {
      document.body.classList.add('online');
    } else {
      document.body.classList.add('offline');
    }
  }

  getStatus() {
    return this.isOnline ? 'online' : 'offline';
  }
}

const offlineDetector = new OfflineDetector();
export default offlineDetector;
