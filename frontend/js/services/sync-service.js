// ===== SYNC SERVICE - SINCRONIZAR PEDIDOS OFFLINE =====
// Envía al servidor los pedidos guardados cuando vuelve la conexión

import offlineStorage from '../utils/offline-storage.js';
import OrdersAPI from '../api/orders.js';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.setupListeners();
  }

  // ===== SETUP LISTENERS =====
  setupListeners() {
    window.addEventListener('online', () => {
      console.log('📡 Conexión restaurada - iniciando sincronización');
      this.syncOfflineOrders();
    });

    if (!navigator.onLine) {
      console.log('📵 Sin conexión');
    }
  }

  // ===== SINCRONIZAR TODOS LOS PEDIDOS OFFLINE =====
  async syncOfflineOrders() {
    if (this.isSyncing) {
      console.log('⏳ Sincronización ya en progreso');
      return;
    }

    this.isSyncing = true;

    try {
      const pendingOrders = await offlineStorage.getPendingOrders();

      if (pendingOrders.length === 0) {
        console.log('✅ No hay pedidos offline pendientes');
        this.isSyncing = false;
        return;
      }

      console.log(`🔄 Sincronizando ${pendingOrders.length} pedido(s)...`);

      for (const offlineOrder of pendingOrders) {
        await this.syncSingleOrder(offlineOrder);
      }

      console.log('✅ Sincronización completada');
      window.dispatchEvent(new Event('orders-synced'));
    } catch (error) {
      console.error('❌ Error en sincronización:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // ===== SINCRONIZAR UN PEDIDO =====
  async syncSingleOrder(offlineOrder) {
    try {
      const { id, productId, quantity, price, farmerId } = offlineOrder;

      const result = await OrdersAPI.create({
        productId,
        quantity,
        price,
        farmerId
      });

      if (result.success) {
        await offlineStorage.markAsSynced(id, result.data._id);
        console.log(`✅ Pedido ${id} sincronizado`);
      } else {
        console.error(`❌ Error sincronizando pedido ${id}:`, result.error);
      }
    } catch (error) {
      console.error('❌ Error en syncSingleOrder:', error);
    }
  }
}

// Exportar instancia singleton
const syncService = new SyncService();
export default syncService;
