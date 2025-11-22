import { apiClient } from './apiClient';

// =====================================================
// BATCH INVENTORY (Nhập hàng) - Types & Interfaces
// =====================================================

export interface BatchInventory {
  id: number;
  productId: number;
  sku: string;
  vendorId?: number;
  batchNumber: string;
  lotNumber: string;
  quantity: number;
  unitCostPrice: number;
  expiryDate?: string; // DateOnly format: YYYY-MM-DD
  manufacturingDate?: string; // DateOnly format: YYYY-MM-DD
  qualityCheckStatus: 'NotRequired' | 'Pending' | 'Passed' | 'Failed' | string;
  qualityCheckedBy?: number;
  qualityCheckedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Navigation properties (optional, from backend)
  product?: {
    id: number;
    name: string;
    code: string;
  };
  vendor?: {
    id: number;
    fullName: string;
    email: string;
  };
  productSerials?: ProductSerial[];
  // Flat fields (if backend returns flat structure)
  productName?: string | null;
  vendorName?: string | null;
  qualityCheckedByName?: string | null;
}

export interface ProductSerial {
  id: number;
  batchInventoryId: number;
  productId: number;
  serialNumber: string;
  status: 'Stock' | 'Sold' | 'Refund';
  createdAt: string;
  updatedAt: string;
}

export interface CreateBatchInventoryDTO {
  productId: number;
  sku: string;
  vendorId?: number;
  batchNumber: string;
  lotNumber: string;
  quantity: number;
  unitCostPrice: number;
  expiryDate?: string; // YYYY-MM-DD
  manufacturingDate?: string; // YYYY-MM-DD
  qualityCheckStatus?: 'NotRequired' | 'Pending' | 'Passed' | 'Failed';
  notes?: string;
  // For products with serial numbers (machines), provide serial numbers
  serialNumbers?: string[];
}

export interface UpdateBatchInventoryDTO {
  quantity?: number;
  unitCostPrice?: number;
  expiryDate?: string;
  manufacturingDate?: string;
  qualityCheckStatus?: 'NotRequired' | 'Pending' | 'Passed' | 'Failed';
  qualityCheckedBy?: number;
  notes?: string;
}

// =====================================================
// EXPORT INVENTORY (Xuất hàng) - Types & Interfaces
// =====================================================

export interface ExportInventory {
  id: number;
  productId: number;
  productSerialId?: number; // For machines with serial numbers
  lotNumber?: string; // For fertilizers/materials without serial
  orderId?: number;
  movementType: 'Sale' | 'ReturnToVendor' | 'Damage' | 'Loss' | 'Adjustment';
  notes?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  // Navigation properties
  product?: {
    id: number;
    name: string;
    code: string;
  };
  productSerial?: ProductSerial;
  order?: {
    id: number;
    orderNumber: string;
  };
  createdByUser?: {
    id: number;
    fullName: string;
  };
}

export interface CreateExportInventoryDTO {
  productId: number;
  productSerialId?: number; // Required for machines (category 1,2)
  lotNumber?: string; // Required for fertilizers/materials (category 3,4)
  orderId?: number;
  movementType: 'Sale' | 'ReturnToVendor' | 'Damage' | 'Loss' | 'Adjustment';
  notes?: string;
}

// =====================================================
// API Functions - Batch Inventory (Nhập hàng)
// =====================================================

/**
 * Lấy danh sách batch inventory (nhập hàng) với phân trang
 */
export const getBatchInventories = async (params?: {
  page?: number;
  pageSize?: number;
  productId?: number;
  vendorId?: number;
}): Promise<{
  data: BatchInventory[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}> => {
  try {
    const response = await apiClient.get('/api/BatchInventory', {
      params: {
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
        productId: params?.productId,
        vendorId: params?.vendorId,
      },
    });

    // Handle different response structures
    // Case 1: Response is an array directly (apiClient unwraps response.data)
    if (Array.isArray(response)) {
      return {
        data: response,
        currentPage: params?.page || 1,
        pageSize: params?.pageSize || 20,
        totalPages: Math.ceil(response.length / (params?.pageSize || 20)),
        totalRecords: response.length,
      };
    }

    // Case 2: Response has data property with array
    if (response && response.data && Array.isArray(response.data)) {
      return {
        data: response.data,
        currentPage: response.currentPage ?? params?.page ?? 1,
        pageSize: response.pageSize ?? params?.pageSize ?? 20,
        totalPages: response.totalPages ?? Math.ceil(response.data.length / (params?.pageSize || 20)),
        totalRecords: response.totalRecords ?? response.data.length,
      };
    }

    // Case 3: Response is PagedResponse object
    if (response && typeof response === 'object' && 'data' in response) {
      return response as any;
    }

    return {
      data: [],
      currentPage: 1,
      pageSize: 20,
      totalPages: 0,
      totalRecords: 0,
    };
  } catch (error) {
    console.error('Get batch inventories error:', error);
    throw error;
  }
};

/**
 * Lấy chi tiết batch inventory theo ID
 */
export const getBatchInventoryById = async (id: number): Promise<BatchInventory> => {
  try {
    const response = await apiClient.get(`/api/BatchInventory/${id}`);
    // Handle different response structures
    if (Array.isArray(response)) {
      return response[0];
    }
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data;
    }
    return response as BatchInventory;
  } catch (error) {
    console.error('Get batch inventory by id error:', error);
    throw error;
  }
};

/**
 * Lấy batch inventories theo product ID
 */
export const getBatchInventoriesByProduct = async (
  productId: number,
  params?: { page?: number; pageSize?: number }
): Promise<{
  data: BatchInventory[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}> => {
  try {
    const response = await apiClient.get(`/api/BatchInventory/product/${productId}`, {
      params: {
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
      },
    });

    if (Array.isArray(response)) {
      return {
        data: response,
        currentPage: params?.page || 1,
        pageSize: params?.pageSize || 20,
        totalPages: Math.ceil(response.length / (params?.pageSize || 20)),
        totalRecords: response.length,
      };
    }

    if (response && response.data && Array.isArray(response.data)) {
      return {
        data: response.data,
        currentPage: response.currentPage ?? params?.page ?? 1,
        pageSize: response.pageSize ?? params?.pageSize ?? 20,
        totalPages: response.totalPages ?? Math.ceil(response.data.length / (params?.pageSize || 20)),
        totalRecords: response.totalRecords ?? response.data.length,
      };
    }

    return {
      data: [],
      currentPage: 1,
      pageSize: 20,
      totalPages: 0,
      totalRecords: 0,
    };
  } catch (error) {
    console.error('Get batch inventories by product error:', error);
    throw error;
  }
};

/**
 * Lấy batch inventories theo vendor ID
 */
export const getBatchInventoriesByVendor = async (
  vendorId: number,
  params?: { page?: number; pageSize?: number }
): Promise<{
  data: BatchInventory[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}> => {
  try {
    const response = await apiClient.get(`/api/BatchInventory/vendor/${vendorId}`, {
      params: {
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
      },
    });

    if (Array.isArray(response)) {
      return {
        data: response,
        currentPage: params?.page || 1,
        pageSize: params?.pageSize || 20,
        totalPages: Math.ceil(response.length / (params?.pageSize || 20)),
        totalRecords: response.length,
      };
    }

    if (response && response.data && Array.isArray(response.data)) {
      return {
        data: response.data,
        currentPage: response.currentPage ?? params?.page ?? 1,
        pageSize: response.pageSize ?? params?.pageSize ?? 20,
        totalPages: response.totalPages ?? Math.ceil(response.data.length / (params?.pageSize || 20)),
        totalRecords: response.totalRecords ?? response.data.length,
      };
    }

    return {
      data: [],
      currentPage: 1,
      pageSize: 20,
      totalPages: 0,
      totalRecords: 0,
    };
  } catch (error) {
    console.error('Get batch inventories by vendor error:', error);
    throw error;
  }
};

/**
 * Tạo batch inventory mới (nhập hàng)
 */
export const createBatchInventory = async (
  data: CreateBatchInventoryDTO
): Promise<BatchInventory> => {
  try {
    const response = await apiClient.post('/api/BatchInventory', data);
    // Handle different response structures
    if (Array.isArray(response)) {
      return response[0];
    }
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data;
    }
    return response as BatchInventory;
  } catch (error) {
    console.error('Create batch inventory error:', error);
    throw error;
  }
};

/**
 * Cập nhật batch inventory
 */
export const updateBatchInventory = async (
  id: number,
  data: UpdateBatchInventoryDTO
): Promise<BatchInventory> => {
  try {
    console.log('Updating batch inventory:', id, data);
    // Try PUT first, if fails try PATCH
    let response;
    try {
      response = await apiClient.put(`/api/BatchInventory/${id}`, data);
    } catch (putError: any) {
      // If PUT returns 405 (Method Not Allowed), try PATCH
      if (putError?.response?.status === 405) {
        console.log('PUT not allowed, trying PATCH...');
        response = await apiClient.patch(`/api/BatchInventory/${id}`, data);
      } else {
        throw putError;
      }
    }
    // Handle different response structures
    if (Array.isArray(response)) {
      return response[0];
    }
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data;
    }
    return response as BatchInventory;
  } catch (error) {
    console.error('Update batch inventory error:', error);
    throw error;
  }
};

/**
 * Chạy quality check cho batch inventory
 */
export const qualityCheckBatchInventory = async (
  id: number,
  data: {
    qualityCheckStatus: 'Pending' | 'Passed' | 'Failed';
    notes?: string;
  }
): Promise<BatchInventory> => {
  try {
    const response = await apiClient.post(`/api/BatchInventory/${id}/quality-check`, data);
    // Handle different response structures
    if (Array.isArray(response)) {
      return response[0];
    }
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data;
    }
    return response as BatchInventory;
  } catch (error) {
    console.error('Quality check batch inventory error:', error);
    throw error;
  }
};

/**
 * Xóa batch inventory
 */
export const deleteBatchInventory = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`/api/BatchInventory/${id}`);
  } catch (error) {
    console.error('Delete batch inventory error:', error);
    throw error;
  }
};

// =====================================================
// API Functions - Export Inventory (Xuất hàng)
// =====================================================

/**
 * Lấy danh sách export inventory (xuất hàng) với phân trang
 */
export const getExportInventories = async (params?: {
  page?: number;
  pageSize?: number;
  productId?: number;
  movementType?: string;
}): Promise<{
  data: ExportInventory[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}> => {
  try {
    const response = await apiClient.get('/api/ExportInventory', {
      params: {
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
        productId: params?.productId,
        movementType: params?.movementType,
      },
    });

    // Handle different response structures
    // Case 1: Response is an array directly (apiClient unwraps response.data)
    if (Array.isArray(response)) {
      return {
        data: response,
        currentPage: params?.page || 1,
        pageSize: params?.pageSize || 20,
        totalPages: Math.ceil(response.length / (params?.pageSize || 20)),
        totalRecords: response.length,
      };
    }

    // Case 2: Response has data property with array
    if (response && response.data && Array.isArray(response.data)) {
      return {
        data: response.data,
        currentPage: response.currentPage ?? params?.page ?? 1,
        pageSize: response.pageSize ?? params?.pageSize ?? 20,
        totalPages: response.totalPages ?? Math.ceil(response.data.length / (params?.pageSize || 20)),
        totalRecords: response.totalRecords ?? response.data.length,
      };
    }

    // Case 3: Response is PagedResponse object
    if (response && typeof response === 'object' && 'data' in response) {
      return response as any;
    }

    return {
      data: [],
      currentPage: 1,
      pageSize: 20,
      totalPages: 0,
      totalRecords: 0,
    };
  } catch (error) {
    console.error('Get export inventories error:', error);
    throw error;
  }
};

/**
 * Lấy chi tiết export inventory theo ID
 */
export const getExportInventoryById = async (id: number): Promise<ExportInventory> => {
  try {
    const response = await apiClient.get(`/api/ExportInventory/${id}`);
    return response.data || response;
  } catch (error) {
    console.error('Get export inventory by id error:', error);
    throw error;
  }
};

/**
 * Tạo export inventory mới (xuất hàng)
 */
export const createExportInventory = async (
  data: CreateExportInventoryDTO
): Promise<ExportInventory> => {
  try {
    const response = await apiClient.post('/api/ExportInventory', data);
    return response.data || response;
  } catch (error) {
    console.error('Create export inventory error:', error);
    throw error;
  }
};

/**
 * Lấy danh sách serial numbers có sẵn cho một sản phẩm
 */
export const getAvailableProductSerials = async (
  productId: number,
  lotNumber?: string
): Promise<ProductSerial[]> => {
  try {
    const response = await apiClient.get(`/api/BatchInventory/product-serial/available`, {
      params: {
        productId,
        lotNumber,
      },
    });
    return response.data || response || [];
  } catch (error) {
    console.error('Get available product serials error:', error);
    throw error;
  }
};

