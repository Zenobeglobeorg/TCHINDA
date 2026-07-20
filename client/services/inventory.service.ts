import { apiService } from './api.service';

export interface Warehouse {
  id: string;
  name: string;
  location?: string;
  managerName?: string;
  isActive: boolean;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  variantId?: string;
  warehouseId?: string;
  type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';
  quantity: number;
  previousStock: number;
  newStock: number;
  reference?: string;
  reason?: string;
  createdAt: string;
  product?: { name: string; sku: string };
  variant?: { name: string; sku: string };
  warehouse?: { name: string };
  user?: { firstName: string; lastName: string };
}

class InventoryService {
  // Entrepôts
  async getWarehouses() {
    return apiService.get('/api/inventory/warehouses');
  }

  async createWarehouse(data: Partial<Warehouse>) {
    return apiService.post('/api/inventory/warehouses', data);
  }

  async updateWarehouse(id: string, data: Partial<Warehouse>) {
    return apiService.put(`/api/inventory/warehouses/${id}`, data);
  }

  // Mouvements
  async getMovements(params?: any) {
    return apiService.get('/api/inventory/movements', params);
  }

  async recordMovement(data: Partial<StockMovement>) {
    return apiService.post('/api/inventory/movements', data);
  }

  // Alertes
  async getAlerts() {
    return apiService.get('/api/inventory/alerts');
  }

  // Import
  async importProducts(fileUri: string, fileName: string, fileType: string) {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: fileType,
    } as any);

    return apiService.post('/api/inventory/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export const inventoryService = new InventoryService();
