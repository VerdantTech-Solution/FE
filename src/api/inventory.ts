import { apiClient, API_BASE_URL } from './apiClient';
import axios from 'axios';

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
  sku?: string; // Optional - backend tự động tạo nếu không có
  vendorId?: number;
  batchNumber: string;
  lotNumber: string;
  quantity: number;
  unitCostPrice: number;
  expiryDate?: string; // YYYY-MM-DD
  manufacturingDate?: string; // YYYY-MM-DD
  qualityCheckStatus?: 'NotRequired' | 'Pending' | 'Passed' | 'Failed';
  notes?: string;
  // serialNumbers: chỉ gửi khi category có serialRequired = true hoặc categoryId 1,2
  serialNumbers?: string[];
}

export interface CreateProductSerialDTO {
  batchInventoryId: number;
  productId: number;
  serialNumber: string;
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
  quantity?: number;
  productSerialId?: number; // For machines with serial numbers
  productSerialNumber?: string | null;
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
    name?: string;
    code?: string;
    productName?: string;
    productCode?: string;
    images?: string[] | string;
    publicUrl?: string;
    image?: string;
  };
  productSerial?: ProductSerial;
  order?: {
    id: number;
    orderNumber: string;
  };
  createdByUser?: {
    id: number;
    fullName: string;
    email?: string;
    avatarUrl?: string | null;
  };
  createdByDetail?: {
    id: number;
    email: string;
    role: string;
    fullName: string;
    phoneNumber?: string;
    avatarUrl?: string | null;
  };
}

export interface CreateExportInventoryDTO {
  productId: number;
  quantity: number;
  productSerialNumber?: string; // Required for machines (category 1,2) - serial number as string
  productSerialId?: number; // Alternative: ID of ProductSerial (for backward compatibility)
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

    console.log('getBatchInventories raw response:', response);

    // Handle different response structures
    // Case 1: Response is an array directly (apiClient unwraps response.data)
    // NOTE: If backend returns array, it means no pagination metadata, 
    // so we can't know total records - this is a backend issue
    if (Array.isArray(response)) {
      console.warn('Backend returned array without pagination metadata. Cannot determine total records.');
      const currentPage = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      // If we got full page, assume there might be more pages
      const totalPages = response.length === pageSize ? Math.max(currentPage + 1, 2) : currentPage;
      return {
        data: response,
        currentPage,
        pageSize,
        totalPages,
        totalRecords: response.length === pageSize ? currentPage * pageSize : (currentPage - 1) * pageSize + response.length,
      };
    }

    // Case 2: Response has data property with array and pagination metadata
    if (response && typeof response === 'object') {
      const paginatedResponse = response as any;
      
      // Check if response has nested data structure (response.data.data)
      let dataArray: BatchInventory[] = [];
      let totalPages = 1;
      let totalRecords = 0;
      let currentPage = params?.page || 1;
      let pageSize = params?.pageSize || 20;

      if (Array.isArray(paginatedResponse.data)) {
        dataArray = paginatedResponse.data;
        totalPages = paginatedResponse.totalPages ?? paginatedResponse.totalPage ?? 1;
        totalRecords = paginatedResponse.totalRecords ?? paginatedResponse.totalCount ?? paginatedResponse.total ?? 0;
        currentPage = paginatedResponse.currentPage ?? paginatedResponse.page ?? params?.page ?? 1;
        pageSize = paginatedResponse.pageSize ?? paginatedResponse.pageSize ?? params?.pageSize ?? 20;
      } else if (paginatedResponse.data && Array.isArray(paginatedResponse.data.data)) {
        // Nested structure: { data: { data: [], totalPages: X, totalRecords: Y } }
        dataArray = paginatedResponse.data.data;
        totalPages = paginatedResponse.data.totalPages ?? paginatedResponse.data.totalPage ?? 1;
        totalRecords = paginatedResponse.data.totalRecords ?? paginatedResponse.data.totalCount ?? paginatedResponse.data.total ?? 0;
        currentPage = paginatedResponse.data.currentPage ?? paginatedResponse.data.page ?? params?.page ?? 1;
        pageSize = paginatedResponse.data.pageSize ?? params?.pageSize ?? 20;
      }

      // If we have data but no totalRecords, try to calculate from data length
      if (dataArray.length > 0 && totalRecords === 0) {
        // If we got a full page, there might be more pages
        if (dataArray.length === pageSize) {
          totalRecords = dataArray.length; // At least this many, but probably more
          totalPages = Math.max(currentPage + 1, totalPages); // Allow navigation to next page
        } else {
          // Partial page means this is the last page
          totalRecords = (currentPage - 1) * pageSize + dataArray.length;
          totalPages = currentPage;
        }
      }

      return {
        data: dataArray,
        currentPage,
        pageSize,
        totalPages: totalPages || 1,
        totalRecords: totalRecords || dataArray.length,
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

    console.log('getBatchInventoriesByProduct raw response:', response);

    if (Array.isArray(response)) {
      console.warn('Backend returned array without pagination metadata. Cannot determine total records.');
      return {
        data: response,
        currentPage: params?.page || 1,
        pageSize: params?.pageSize || 20,
        totalPages: 1,
        totalRecords: response.length,
      };
    }

    if (response && typeof response === 'object') {
      const paginatedResponse = response as any;
      
      let dataArray: BatchInventory[] = [];
      let totalPages = 1;
      let totalRecords = 0;

      if (Array.isArray(paginatedResponse.data)) {
        dataArray = paginatedResponse.data;
        totalPages = paginatedResponse.totalPages ?? paginatedResponse.totalPage ?? 1;
        totalRecords = paginatedResponse.totalRecords ?? paginatedResponse.totalCount ?? paginatedResponse.total ?? 0;
      } else if (paginatedResponse.data && Array.isArray(paginatedResponse.data.data)) {
        dataArray = paginatedResponse.data.data;
        totalPages = paginatedResponse.data.totalPages ?? paginatedResponse.data.totalPage ?? 1;
        totalRecords = paginatedResponse.data.totalRecords ?? paginatedResponse.data.totalCount ?? paginatedResponse.data.total ?? 0;
      }

      if (dataArray.length > 0 && totalRecords === 0) {
        const currentPage = paginatedResponse.currentPage ?? paginatedResponse.page ?? params?.page ?? 1;
        const pageSize = paginatedResponse.pageSize ?? params?.pageSize ?? 20;
        if (dataArray.length === pageSize) {
          // Full page, might be more pages
          totalRecords = dataArray.length;
          totalPages = Math.max(currentPage + 1, totalPages);
        } else {
          // Partial page means this is the last page
          totalRecords = (currentPage - 1) * pageSize + dataArray.length;
          totalPages = currentPage;
        }
      }

      return {
        data: dataArray,
        currentPage: paginatedResponse.currentPage ?? paginatedResponse.page ?? params?.page ?? 1,
        pageSize: paginatedResponse.pageSize ?? params?.pageSize ?? 20,
        totalPages: totalPages || 1,
        totalRecords: totalRecords || dataArray.length,
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

    console.log('getBatchInventoriesByVendor raw response:', response);

    if (Array.isArray(response)) {
      console.warn('Backend returned array without pagination metadata. Cannot determine total records.');
      const currentPage = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const totalPages = response.length === pageSize ? Math.max(currentPage + 1, 2) : currentPage;
      return {
        data: response,
        currentPage,
        pageSize,
        totalPages,
        totalRecords: response.length === pageSize ? currentPage * pageSize : (currentPage - 1) * pageSize + response.length,
      };
    }

    if (response && typeof response === 'object') {
      const paginatedResponse = response as any;
      
      let dataArray: BatchInventory[] = [];
      let totalPages = 1;
      let totalRecords = 0;

      if (Array.isArray(paginatedResponse.data)) {
        dataArray = paginatedResponse.data;
        totalPages = paginatedResponse.totalPages ?? paginatedResponse.totalPage ?? 1;
        totalRecords = paginatedResponse.totalRecords ?? paginatedResponse.totalCount ?? paginatedResponse.total ?? 0;
      } else if (paginatedResponse.data && Array.isArray(paginatedResponse.data.data)) {
        dataArray = paginatedResponse.data.data;
        totalPages = paginatedResponse.data.totalPages ?? paginatedResponse.data.totalPage ?? 1;
        totalRecords = paginatedResponse.data.totalRecords ?? paginatedResponse.data.totalCount ?? paginatedResponse.data.total ?? 0;
      }

      if (dataArray.length > 0 && totalRecords === 0) {
        const currentPage = paginatedResponse.currentPage ?? paginatedResponse.page ?? params?.page ?? 1;
        const pageSize = paginatedResponse.pageSize ?? params?.pageSize ?? 20;
        if (dataArray.length === pageSize) {
          // Full page, might be more pages
          totalRecords = dataArray.length;
          totalPages = Math.max(currentPage + 1, totalPages);
        } else {
          // Partial page means this is the last page
          totalRecords = (currentPage - 1) * pageSize + dataArray.length;
          totalPages = currentPage;
        }
      }

      return {
        data: dataArray,
        currentPage: paginatedResponse.currentPage ?? paginatedResponse.page ?? params?.page ?? 1,
        pageSize: paginatedResponse.pageSize ?? params?.pageSize ?? 20,
        totalPages: totalPages || 1,
        totalRecords: totalRecords || dataArray.length,
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
 * Backend tự động tạo product serials nếu có serialNumbers trong request
 */
export const createBatchInventory = async (
  data: CreateBatchInventoryDTO
): Promise<BatchInventory> => {
  try {
    // Chuẩn bị request data - chỉ gửi serialNumbers nếu có và không rỗng
    const requestData: any = {
      productId: data.productId,
      batchNumber: data.batchNumber,
      lotNumber: data.lotNumber,
      quantity: data.quantity,
      unitCostPrice: data.unitCostPrice,
    };
    
    // Chỉ gửi SKU nếu có (backend tự động tạo nếu không có)
    if (data.sku && data.sku.trim()) {
      requestData.sku = data.sku;
    }
    
    if (data.vendorId) {
      requestData.vendorId = data.vendorId;
    }
    if (data.expiryDate) {
      requestData.expiryDate = data.expiryDate;
    }
    if (data.manufacturingDate) {
      requestData.manufacturingDate = data.manufacturingDate;
    }
    if (data.qualityCheckStatus) {
      requestData.qualityCheckStatus = data.qualityCheckStatus;
    }
    if (data.notes) {
      requestData.notes = data.notes;
    }
    // Chỉ gửi serialNumbers nếu có và không rỗng
    if (data.serialNumbers && data.serialNumbers.length > 0) {
      const validSerials = data.serialNumbers.filter(s => s.trim());
      if (validSerials.length > 0) {
        requestData.serialNumbers = validSerials;
      }
    }
    
    console.log('Creating batch inventory:', requestData);
    const response = await apiClient.post('/api/BatchInventory', requestData);
    
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
 * Tạo product serial mới
 * Được gọi sau khi batch inventory đã được tạo
 * Thử các endpoint khác nhau vì /api/ProductSerial có thể không tồn tại
 */
export const createProductSerial = async (
  data: CreateProductSerialDTO
): Promise<ProductSerial> => {
  try {
    console.log('Creating product serial:', data);
    
    // Thử endpoint 1: /api/BatchInventory/{id}/product-serial
    try {
      const response = await apiClient.post(
        `/api/BatchInventory/${data.batchInventoryId}/product-serial`, 
        {
          productId: data.productId,
          serialNumber: data.serialNumber
        }
      );
      
      if (Array.isArray(response)) {
        return response[0];
      }
      if (response && typeof response === 'object' && 'data' in response) {
        return response.data;
      }
      return response as ProductSerial;
    } catch (err1: any) {
      console.log('Endpoint /api/BatchInventory/{id}/product-serial failed, trying alternatives...');
      
      // Thử endpoint 2: /api/BatchInventory/{id}/serials
      try {
        const response = await apiClient.post(
          `/api/BatchInventory/${data.batchInventoryId}/serials`, 
          {
            productId: data.productId,
            serialNumber: data.serialNumber
          }
        );
        
        if (Array.isArray(response)) {
          return response[0];
        }
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data;
        }
        return response as ProductSerial;
      } catch (err2: any) {
        console.log('Endpoint /api/BatchInventory/{id}/serials failed, trying /api/ProductSerial...');
        
        // Thử endpoint 3: /api/ProductSerial (original)
        const response = await apiClient.post('/api/ProductSerial', data);
        
        if (Array.isArray(response)) {
          return response[0];
        }
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data;
        }
        return response as ProductSerial;
      }
    }
  } catch (error: any) {
    console.error('Create product serial error:', error);
    console.error('All endpoints failed. Please check backend API documentation.');
    throw new Error(`Không thể tạo product serial. Endpoint không tồn tại hoặc có lỗi: ${error?.message || 'Unknown error'}`);
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
      return (response as { data: BatchInventory }).data;
    }
    return response as unknown as BatchInventory;
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
    qualityCheckedByUserId: number;
    notes?: string;
  }
): Promise<BatchInventory> => {
  try {
    // Chuẩn bị request body theo API spec: { id, status, qualityCheckedByUserId, notes }
    const requestBody = {
      id: id,
      status: data.qualityCheckStatus, // API dùng 'status' thay vì 'qualityCheckStatus'
      qualityCheckedByUserId: data.qualityCheckedByUserId,
      notes: data.notes || undefined,
    };

    console.log('Quality check request body:', requestBody);
    const response = await apiClient.post(`/api/BatchInventory/${id}/quality-check`, requestBody);
    console.log('Quality check response:', response);
    
    // Handle different response structures
    // If response is a BatchInventory object (has id and qualityCheckStatus)
    if (response && typeof response === 'object' && !Array.isArray(response) && 'id' in response && 'qualityCheckStatus' in response) {
      return response as unknown as BatchInventory;
    }
    
    // If response has data property
    if (response && typeof response === 'object' && 'data' in response) {
      const data = (response as { data: any }).data;
      if (data && typeof data === 'object' && 'id' in data) {
        return data as unknown as BatchInventory;
      }
    }
    
    // If response is an array
    if (Array.isArray(response) && response.length > 0) {
      return response[0] as unknown as BatchInventory;
    }
    
    // If response only has message (success but no data), fetch the updated item
    if (response && typeof response === 'object' && 'message' in response && !('id' in response)) {
      console.log('Response only has message, fetching updated item...');
      // Fetch the updated item to get the latest data
      const updatedItem = await getBatchInventoryById(id);
      return updatedItem;
    }
    
    // Fallback: try to return response as BatchInventory
    return response as unknown as BatchInventory;
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
      headers: {
        Accept: 'application/json, text/plain',
      },
    });

    const unwrapPayload = (raw: any): any => {
      let current = raw;
      while (current && typeof current === 'object' && !Array.isArray(current)) {
        // Axios/FETCH style { data, status, ... }
        if ('data' in current && ('status' in current || 'statusText' in current)) {
          current = (current as any).data;
          continue;
        }

        // Backend convention { status, data }
        if ('status' in current && 'data' in current) {
          current = (current as any).data;
          continue;
        }

        // Nested { data: { data: [] } }
        if (
          'data' in current &&
          current.data &&
          typeof current.data === 'object' &&
          !Array.isArray(current.data) &&
          ('data' in current.data || 'items' in current.data)
        ) {
          current = current.data;
          continue;
        }

        break;
      }
      return current;
    };

    const buildResult = (items: ExportInventory[], meta?: any) => ({
      data: items,
      currentPage: meta?.currentPage ?? params?.page ?? 1,
      pageSize: meta?.pageSize ?? params?.pageSize ?? 20,
      totalPages:
        meta?.totalPages ??
        (items.length > 0 ? Math.ceil(items.length / (params?.pageSize || 20)) : 0),
      totalRecords: meta?.totalRecords ?? items.length,
    });

    const payload = unwrapPayload(response);

    if (Array.isArray(payload)) {
      return buildResult(payload);
    }

    if (payload && typeof payload === 'object') {
      if (Array.isArray((payload as any).data)) {
        return buildResult((payload as any).data, payload);
      }

      if (Array.isArray((payload as any).items)) {
        return buildResult((payload as any).items, payload);
      }

      if (
        payload.data &&
        typeof payload.data === 'object' &&
        Array.isArray((payload.data as any).data)
      ) {
        return buildResult((payload.data as any).data, payload.data);
      }
    }

    return buildResult([]);
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
    // Handle different response structures
    if (Array.isArray(response)) {
      return response[0];
    }
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data;
    }
    return response as ExportInventory;
  } catch (error) {
    console.error('Get export inventory by id error:', error);
    throw error;
  }
};

/**
 * Tạo export inventory mới (xuất hàng)
 * API nhận array của CreateExportInventoryDTO
 * movementType không được là 'Sale' (chỉ dùng khi xuất hàng bán qua OrderService)
 */
export const createExportInventory = async (
  data: CreateExportInventoryDTO | CreateExportInventoryDTO[]
): Promise<ExportInventory | ExportInventory[]> => {
  try {
    // Đảm bảo gửi array
    const payload = (Array.isArray(data) ? data : [data]).map(item => ({
      ...item,
      quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
    }));
    
    // Validate: không cho phép movementType = 'Sale'
    const invalidItems = payload.filter(item => item.movementType === 'Sale');
    if (invalidItems.length > 0) {
      throw new Error('MovementType không được là "Sale". Chỉ được sử dụng khi xuất hàng bán qua OrderService.');
    }

    // Validate: quantity bắt buộc > 0
    const invalidQuantity = payload.filter(item => !item.quantity || item.quantity <= 0);
    if (invalidQuantity.length > 0) {
      throw new Error('Số lượng phải lớn hơn 0 cho tất cả các sản phẩm xuất kho.');
    }
    
    const response = await apiClient.post('/api/ExportInventory', payload);
    
    // Handle different response structures
    if (Array.isArray(response)) {
      return response;
    }
    if (response && typeof response === 'object') {
      if ('data' in response) {
        const responseData = (response as any).data;
        if (Array.isArray(responseData)) {
          return responseData;
        }
        if (responseData && typeof responseData === 'object' && 'data' in responseData) {
          return Array.isArray(responseData.data) ? responseData.data : [responseData.data];
        }
        if (responseData) {
          return [responseData as ExportInventory];
        }
      }
      if ('status' in response && !('data' in response)) {
        // Một số API trả về { status, statusCode, data: string }
        return response as any;
      }
    }
    return Array.isArray(response) ? response : [response as unknown as ExportInventory];
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

// =====================================================
// EXCEL IMPORT APIs
// =====================================================

export interface BatchInventoryImportResponseDTO {
  totalRows: number;
  successfulCount: number;
  failedCount: number;
  results: BatchInventoryImportRowResultDTO[];
}

export interface BatchInventoryImportRowResultDTO {
  rowNumber: number;
  isSuccess: boolean;
  batchInventoryId?: number;
  batchNumber?: string;
  errorMessage?: string;
}

// Import Batch Inventories from Excel
export const importBatchInventoriesFromExcel = async (
  file: File
): Promise<BatchInventoryImportResponseDTO> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/api/BatchInventory/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  // Handle APIResponse wrapper if exists
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as any).data;
  }

  return response as BatchInventoryImportResponseDTO;
};

// Download Excel Template for Batch Inventory
export const downloadBatchInventoryTemplate = async (): Promise<void> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/BatchInventory/import/template`, {
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'BatchInventory_Import_Template.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading template:', error);
    throw error;
  }
};

