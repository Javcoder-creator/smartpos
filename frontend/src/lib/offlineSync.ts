/**
 * SMARTPOS Offline Storage & Synchronization Engine (IndexedDB)
 * Ensures seamless cashier operations even during total internet outages
 */

const DB_NAME = 'smartpos_offline_db';
const DB_VERSION = 1;
const STORE_PRODUCTS = 'products';
const STORE_PENDING_SALES = 'pending_sales';

export interface OfflineProduct {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  sellingPrice: number;
  costPrice: number;
  unit: string;
}

export interface PendingSale {
  id: string; // client uuid
  branchId: string;
  customerId?: string;
  shiftId?: string;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  payments: Array<{ method: string; amount: number }>;
  totalAmount: number;
  createdAt: string;
  isSynced: boolean;
}

class OfflineSyncEngine {
  private db: IDBDatabase | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result as IDBDatabase;

        if (!db.objectStoreNames.contains(STORE_PRODUCTS)) {
          db.createObjectStore(STORE_PRODUCTS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORE_PENDING_SALES)) {
          const salesStore = db.createObjectStore(STORE_PENDING_SALES, { keyPath: 'id' });
          salesStore.createIndex('isSynced', 'isSynced', { unique: false });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve(this.db!);
      };

      request.onerror = (err) => {
        console.error('IndexedDB open error:', err);
        reject(err);
      };
    });
  }

  /**
   * Cache products locally for offline search & scanning
   */
  async cacheProducts(products: OfflineProduct[]): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PRODUCTS, 'readwrite');
      const store = tx.objectStore(STORE_PRODUCTS);
      store.clear();

      products.forEach((prod) => store.put(prod));

      tx.oncomplete = () => resolve();
      tx.onerror = (err) => reject(err);
    });
  }

  /**
   * Retrieve all locally cached products
   */
  async getCachedProducts(): Promise<OfflineProduct[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PRODUCTS, 'readonly');
      const store = tx.objectStore(STORE_PRODUCTS);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (err) => reject(err);
    });
  }

  /**
   * Store sale created while offline
   */
  async savePendingSale(sale: PendingSale): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PENDING_SALES, 'readwrite');
      const store = tx.objectStore(STORE_PENDING_SALES);
      store.put(sale);

      tx.oncomplete = () => resolve();
      tx.onerror = (err) => reject(err);
    });
  }

  /**
   * Get all unsynced sales
   */
  async getUnsyncedSales(): Promise<PendingSale[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PENDING_SALES, 'readonly');
      const store = tx.objectStore(STORE_PENDING_SALES);
      const req = store.getAll();

      req.onsuccess = () => {
        const sales = (req.result || []) as PendingSale[];
        resolve(sales.filter((s) => !s.isSynced));
      };
      req.onerror = (err) => reject(err);
    });
  }

  /**
   * Mark sale as successfully synced
   */
  async markSaleAsSynced(saleId: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PENDING_SALES, 'readwrite');
      const store = tx.objectStore(STORE_PENDING_SALES);
      store.delete(saleId);

      tx.oncomplete = () => resolve();
      tx.onerror = (err) => reject(err);
    });
  }
}

export const offlineSync = new OfflineSyncEngine();
