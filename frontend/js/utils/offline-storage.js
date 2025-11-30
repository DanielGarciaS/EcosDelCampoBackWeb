// ===== OFFLINE STORAGE - INDEXEDDB =====
// Maneja almacenamiento local de pedidos para sincronización offline

const DB_NAME = 'EcosDelCampo';
const DB_VERSION = 1;
const STORE_NAME = 'pending_orders';

class OfflineStorage {
  constructor() {
    this.db = null;
  }

  // ===== INICIALIZAR BD =====
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB inicializada');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('📦 Object Store creado');
        }
      };
    });
  }

  // ===== GUARDAR PEDIDO OFFLINE =====
  async savePendingOrder(orderData) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const offlineOrder = {
        ...orderData,
        status: 'offline_pending',
        timestamp: Date.now(),
        synced: false
      };

      const request = store.add(offlineOrder);

      request.onsuccess = () => {
        console.log('💾 Pedido guardado localmente:', offlineOrder);
        resolve({ id: request.result, ...offlineOrder });
      };

      request.onerror = () => reject(request.error);
    });
  }

  // ===== OBTENER PEDIDOS PENDIENTES =====
  async getPendingOrders() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('status');
      const range = IDBKeyRange.only('offline_pending');

      const request = index.getAll(range);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // ===== MARCAR COMO SINCRONIZADO =====
  async markAsSynced(offlineId, serverId) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.get(offlineId);

      request.onsuccess = () => {
        const data = request.result;
        data.status = 'synced';
        data.serverId = serverId;
        data.syncedAt = Date.now();

        const updateRequest = store.put(data);
        updateRequest.onsuccess = () => {
          console.log('✅ Pedido marcado como sincronizado');
          resolve(data);
        };
        updateRequest.onerror = () => reject(updateRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // ===== ELIMINAR PEDIDO OFFLINE =====
  async removePendingOrder(offlineId) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.delete(offlineId);

      request.onsuccess = () => {
        console.log('🗑️ Pedido offline eliminado');
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }
}

// Exportar instancia singleton
const offlineStorage = new OfflineStorage();
export default offlineStorage;
