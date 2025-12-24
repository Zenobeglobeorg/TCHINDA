import { apiService } from './api.service';

export interface ShopInfo {
  shopName?: string;
  shopDescription?: string;
  shopLogo?: string;
  shopBanner?: string;
  shopAddress?: string;
  shopPhone?: string;
  shopEmail?: string;
  shopCountry?: string;
  businessRegistration?: string;
}

export interface ShopHours {
  monday?: { open: string; close: string; isOpen: boolean };
  tuesday?: { open: string; close: string; isOpen: boolean };
  wednesday?: { open: string; close: string; isOpen: boolean };
  thursday?: { open: string; close: string; isOpen: boolean };
  friday?: { open: string; close: string; isOpen: boolean };
  saturday?: { open: string; close: string; isOpen: boolean };
  sunday?: { open: string; close: string; isOpen: boolean };
  timezone?: string;
}

export interface ProductVariant {
  name: string;
  sku?: string;
  barcode?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  minStock?: number;
  weight?: number;
  images?: string[];
  attributes?: Record<string, any>;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  sku?: string;
  barcode?: string;
  stock: number;
  minStock: number;
  weight?: number;
  dimensions?: { length?: number; width?: number; height?: number };
  images?: string[];
  categoryId?: string;
  tags?: string[];
  attributes?: Record<string, any>;
  seoTitle?: string;
  seoDescription?: string;
  variants?: ProductVariant[];
  status?: string;
  isActive?: boolean;
}

export interface Promotion {
  id?: string;
  name: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  code?: string;
  productId?: string;
  isActive?: boolean;
  usageCount?: number;
}

export interface Sponsorship {
  id?: string;
  productId?: string;
  type: 'PRODUCT' | 'SHOP' | 'CATEGORY';
  level: 'BASIC' | 'PREMIUM' | 'VIP';
  startDate: string;
  endDate: string;
  cost: number;
  currency?: string;
  isActive?: boolean;
  impressions?: number;
  clicks?: number;
  conversions?: number;
}

export interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface SellerStats {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  sales: {
    totalSales: number;
    totalRevenue: number;
    averageOrderValue: number;
    productsSold: number;
  };
  traffic: {
    views: number;
    uniqueVisitors: number;
    pageViews: number;
    bounceRate: number;
  };
  products: {
    total: number;
    viewed: number;
    sold: number;
    conversionRate: number;
  };
  marketing: {
    adSpend: number;
    adImpressions: number;
    adClicks: number;
    adConversions: number;
    roi: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    soldCount: number;
    revenue: number;
  }>;
}

class SellerService {
  // ========== GESTION DE BOUTIQUE ==========

  async getProfile() {
    return apiService.get('/api/seller/profile');
  }

  async updateShopInfo(data: ShopInfo) {
    return apiService.put('/api/seller/shop/info', data);
  }

  async updateShopHours(hours: ShopHours) {
    return apiService.put('/api/seller/shop/hours', hours);
  }

  // ========== GESTION DES PRODUITS ==========

  async createProduct(product: Product) {
    return apiService.post('/api/seller/products', product);
  }

  async updateProduct(productId: string, product: Partial<Product>) {
    return apiService.put(`/api/seller/products/${productId}`, product);
  }

  async deleteProduct(productId: string) {
    return apiService.delete(`/api/seller/products/${productId}`);
  }

  async getProducts(filters?: {
    status?: string;
    isActive?: boolean;
    categoryId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.isActive !== undefined) queryParams.append('isActive', String(filters.isActive));
    if (filters?.categoryId) queryParams.append('categoryId', filters.categoryId);
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.page) queryParams.append('page', String(filters.page));
    if (filters?.limit) queryParams.append('limit', String(filters.limit));

    const query = queryParams.toString();
    return apiService.get(`/api/seller/products${query ? `?${query}` : ''}`);
  }

  async getProductById(productId: string) {
    return apiService.get(`/api/seller/products/${productId}`);
  }

  // ========== GESTION DES PROMOTIONS ==========

  async createPromotion(promotion: Promotion) {
    return apiService.post('/api/seller/promotions', promotion);
  }

  async getPromotions(filters?: {
    productId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (filters?.productId) queryParams.append('productId', filters.productId);
    if (filters?.isActive !== undefined) queryParams.append('isActive', String(filters.isActive));
    if (filters?.page) queryParams.append('page', String(filters.page));
    if (filters?.limit) queryParams.append('limit', String(filters.limit));

    const query = queryParams.toString();
    return apiService.get(`/api/seller/promotions${query ? `?${query}` : ''}`);
  }

  async updatePromotion(promotionId: string, promotion: Partial<Promotion>) {
    return apiService.put(`/api/seller/promotions/${promotionId}`, promotion);
  }

  async deletePromotion(promotionId: string) {
    return apiService.delete(`/api/seller/promotions/${promotionId}`);
  }

  // ========== SYSTÈME DE SPONSORISATION ==========

  async createSponsorship(sponsorship: Sponsorship) {
    return apiService.post('/api/seller/sponsorships', sponsorship);
  }

  async getSponsorships(filters?: {
    type?: string;
    level?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (filters?.type) queryParams.append('type', filters.type);
    if (filters?.level) queryParams.append('level', filters.level);
    if (filters?.isActive !== undefined) queryParams.append('isActive', String(filters.isActive));
    if (filters?.page) queryParams.append('page', String(filters.page));
    if (filters?.limit) queryParams.append('limit', String(filters.limit));

    const query = queryParams.toString();
    return apiService.get(`/api/seller/sponsorships${query ? `?${query}` : ''}`);
  }

  // ========== GESTION DES COMMANDES ==========

  async getOrders(filters?: OrderFilters) {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.paymentStatus) queryParams.append('paymentStatus', filters.paymentStatus);
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.page) queryParams.append('page', String(filters.page));
    if (filters?.limit) queryParams.append('limit', String(filters.limit));

    const query = queryParams.toString();
    return apiService.get(`/api/seller/orders${query ? `?${query}` : ''}`);
  }

  async updateOrderStatus(orderId: string, status: string, trackingNumber?: string) {
    return apiService.put(`/api/seller/orders/${orderId}/status`, {
      status,
      trackingNumber,
    });
  }

  // ========== STATISTIQUES AVANCÉES ==========

  async getStats(period?: 'DAILY' | 'WEEKLY' | 'MONTHLY', startDate?: string, endDate?: string) {
    const queryParams = new URLSearchParams();
    if (period) queryParams.append('period', period);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const query = queryParams.toString();
    return apiService.get(`/api/seller/stats${query ? `?${query}` : ''}`);
  }

  async recordDailyStats() {
    return apiService.post('/api/seller/stats/daily');
  }
}

export const sellerService = new SellerService();

