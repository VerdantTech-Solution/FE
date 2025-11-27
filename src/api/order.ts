import { apiClient } from './apiClient';

export interface OrderDetailPreviewItem {
  productId: number;
  quantity: number;
  discountAmount?: number;
}

export type OrderPaymentMethod = 'Banking' | 'COD' | 'Wallet';

export interface CreateOrderPreviewRequest {
  taxAmount?: number;
  discountAmount?: number;
  addressId: number;
  orderPaymentMethod: OrderPaymentMethod;
  notes?: string;
  orderDetails: OrderDetailPreviewItem[];
}

export interface CreateOrderPreviewResponse<TData = string> {
  status: boolean;
  statusCode: string | number;
  data: TData;
  errors: string[];
}

export const createOrderPreview = async (
  payload: CreateOrderPreviewRequest
): Promise<CreateOrderPreviewResponse> => {
  try {
    const response = await apiClient.post('/api/Order/preview', payload);
    return response as unknown as CreateOrderPreviewResponse;
  } catch (error: any) {
    console.error('Error creating order preview:', error);
    
    // Case 1: Error is already the response data (from interceptor)
    if (error && typeof error === 'object' && 'status' in error) {
      return error as CreateOrderPreviewResponse;
    }
    
    // Case 2: Error has response.data (direct axios error)
    if (error?.response?.data && typeof error.response.data === 'object' && 'status' in error.response.data) {
      return error.response.data as CreateOrderPreviewResponse;
    }
    
    // Case 3: Error is a simple object with errors array
    if (error && typeof error === 'object' && 'errors' in error) {
      const errorResponse: CreateOrderPreviewResponse = {
        status: false,
        statusCode: error.statusCode || 'BadRequest',
        data: '' as any,
        errors: Array.isArray(error.errors) ? error.errors : [error.message || 'Không thể tạo bản xem trước đơn hàng']
      };
      return errorResponse;
    }
    
    // Case 4: Create error response from any error
    const errorResponse: CreateOrderPreviewResponse = {
      status: false,
      statusCode: 'Error',
      data: '' as any,
      errors: [error?.message || error?.toString() || 'Không thể tạo bản xem trước đơn hàng']
    };
    
    return errorResponse;
  }
};

// ===== Shipping Option =====
export interface ShippingOption {
  id?: number | string;
  priceTableId?: number | string;
  shippingDetailId?: number | string;
  carrierName?: string;
  carrierLogo?: string;
  service?: string;
  expected?: string;
  expectedTxt?: string;
  totalAmount: number;
}


// ===== Create Order From Preview =====
export interface CreateOrderFromPreviewRequest {
  priceTableId: number;
}

export interface OrderProductSummary {
  id: number;
  productCode: string;
  productName: string;
  slug?: string;
  description?: string;
  unitPrice: number;
  images?: any;
  warrantyMonths?: number;
  ratingAverage?: number;
  categoryId?: number;
}

export interface OrderDetailItem {
  id: number;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  subtotal: number;
  createdAt: string;
  product: OrderProductSummary;
}

export interface OrderAddress {
  id: number;
  locationAddress?: string;
  province?: string;
  district?: string;
  commune?: string;
  provinceCode?: number;
  districtCode?: number;
  communeCode?: number;
  latitude?: number;
  longitude?: number;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface OrderEntity {
  id: number;
  customerId: number;
  status: string;
  subtotal: number;
  taxAmount: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  shippingMethod: string;
  orderPaymentMethod: OrderPaymentMethod;
  trackingNumber: string | null;
  notes: string;
  cancelledReason: string | null;
  cancelledAt: string | null;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  address: OrderAddress;
  orderDetails: OrderDetailItem[];
  width?: number;
  height?: number;
  length?: number;
  weight?: number;
}

export type CreateOrderFromPreviewResponse = CreateOrderPreviewResponse<OrderEntity>;

export const createOrderFromPreview = async (
  orderPreviewId: string,
  payload: CreateOrderFromPreviewRequest
): Promise<CreateOrderFromPreviewResponse> => {
  try {
    console.log('Creating order from preview:', {
      orderPreviewId,
      payload,
      url: `/api/Order/${orderPreviewId}`
    });
    
    const response = await apiClient.post(`/api/Order/${orderPreviewId}`, payload);
    
    console.log('Order creation API response:', response);
    
    return response as unknown as CreateOrderFromPreviewResponse;
  } catch (error: any) {
    console.error('Error creating order from preview:', error);
    
    // Case 1: Error is already the response data (from interceptor)
    if (error && typeof error === 'object' && 'status' in error) {
      return error as CreateOrderFromPreviewResponse;
    }
    
    // Case 2: Error has response.data (direct axios error)
    if (error?.response?.data && typeof error.response.data === 'object' && 'status' in error.response.data) {
      return error.response.data as CreateOrderFromPreviewResponse;
    }
    
    // Case 3: Error is a simple object with errors array
    if (error && typeof error === 'object' && 'errors' in error) {
      const errorResponse: CreateOrderFromPreviewResponse = {
        status: false,
        statusCode: error.statusCode || 'BadRequest',
        data: {} as OrderEntity,
        errors: Array.isArray(error.errors) ? error.errors : [error.message || 'Không thể tạo đơn hàng']
      };
      return errorResponse;
    }
    
    // Case 4: Create error response from any error
    const errorResponse: CreateOrderFromPreviewResponse = {
      status: false,
      statusCode: 'Error',
      data: {} as OrderEntity,
      errors: [error?.message || error?.toString() || 'Không thể tạo đơn hàng']
    };
    
    return errorResponse;
  }
};

// ===== Get All Orders =====
export interface OrderCustomer {
  id: number;
  email: string;
  role: string;
  fullName: string;
  phoneNumber: string;
  isVerified: boolean;
  avatarUrl: string | null;
  status: string;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  userAddresses?: any[];
}

export interface OrderWithCustomer extends OrderEntity {
  customer: OrderCustomer;
}

export interface GetAllOrdersResponse {
  status: boolean;
  statusCode: string;
  data: {
    data: OrderWithCustomer[];
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  errors: string[];
}

export const getAllOrders = async (
  page: number = 1,
  pageSize: number = 10,
  status?: string
): Promise<GetAllOrdersResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  
  if (status) {
    params.append('status', status);
  }
  
  const response = await apiClient.get(`/api/Order?${params.toString()}`);
  return response as unknown as GetAllOrdersResponse;
};

// ===== Get Orders By User ID =====
export const getOrdersByUser = async (
  userId: number,
  page: number = 1,
  pageSize: number = 10
): Promise<GetAllOrdersResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  const response = await apiClient.get(`/api/Order/user/${userId}?${params.toString()}`);
  return response as unknown as GetAllOrdersResponse;
};

// ===== Get My Orders =====
export type GetMyOrdersResponse = CreateOrderPreviewResponse<OrderEntity[]>;

export const getMyOrders = async (): Promise<GetMyOrdersResponse> => {
  const response = await apiClient.get('/api/Order/me');
  return response as unknown as GetMyOrdersResponse;
};

// ===== Get Order By ID =====
export type GetOrderByIdResponse = CreateOrderPreviewResponse<OrderWithCustomer>;

export const getOrderById = async (
  orderId: number
): Promise<GetOrderByIdResponse> => {
  const response = await apiClient.get(`/api/Order/${orderId}`);
  return response as unknown as GetOrderByIdResponse;
};

// ===== Update Order =====
export interface UpdateOrderRequest {
  notes?: string;
  cancelledReason?: string;
}

export type UpdateOrderResponse = CreateOrderPreviewResponse<string>;

export const updateOrder = async (
  orderId: number,
  payload: UpdateOrderRequest
): Promise<UpdateOrderResponse> => {
  const response = await apiClient.patch(`/api/Order/${orderId}`, payload);
  return response as unknown as UpdateOrderResponse;
};

// ===== Update Order Status =====
export type OrderStatus = "Pending" | "Paid" | "Processing" | "Shipped" | "Delivered" | "Cancelled" | "Refunded";

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  cancelledReason?: string;
}

export const updateOrderStatus = async (
  orderId: number,
  payload: UpdateOrderStatusRequest
): Promise<UpdateOrderResponse> => {
  try {
    const response = await apiClient.put(`/api/Order/${orderId}`, payload);
    return response as unknown as UpdateOrderResponse;
  } catch (error: any) {
    console.error('Update order status error:', error);
    
    // Case 1: Error is already the response data (from interceptor)
    if (error && typeof error === 'object' && 'status' in error) {
      return error as UpdateOrderResponse;
    }
    
    // Case 2: Error has response.data (direct axios error)
    if (error?.response?.data && typeof error.response.data === 'object' && 'status' in error.response.data) {
      return error.response.data as UpdateOrderResponse;
    }
    
    // Case 3: Error is a simple object with errors array
    if (error && typeof error === 'object' && 'errors' in error) {
      const errorResponse: UpdateOrderResponse = {
        status: false,
        statusCode: error.statusCode || 'BadRequest',
        data: '',
        errors: Array.isArray(error.errors) ? error.errors : [error.message || 'Không thể cập nhật trạng thái đơn hàng']
      };
      return errorResponse;
    }
    
    // Case 4: Create error response from any error
    const errorResponse: UpdateOrderResponse = {
      status: false,
      statusCode: 'Error',
      data: '',
      errors: [error?.message || error?.toString() || 'Không thể cập nhật trạng thái đơn hàng']
    };
    
    return errorResponse;
  }
};

// ===== Ship Order =====
export interface ShipOrderItem {
  productId: number;
  serialNumber?: string;
  lotNumber?: string;
}

export type ShipOrderRequest = ShipOrderItem[];

export const shipOrder = async (
  orderId: number,
  payload: ShipOrderRequest
): Promise<UpdateOrderResponse> => {
  try {
    const response = await apiClient.post(`/api/Order/${orderId}/ship`, payload);
    return response as unknown as UpdateOrderResponse;
  } catch (error: any) {
    console.error('Error shipping order:', error);
    
    // Case 1: Error is already the response data (from interceptor)
    if (error && typeof error === 'object' && 'status' in error) {
      return error as UpdateOrderResponse;
    }
    
    // Case 2: Error has response.data (direct axios error)
    if (error?.response?.data && typeof error.response.data === 'object' && 'status' in error.response.data) {
      return error.response.data as UpdateOrderResponse;
    }
    
    // Case 3: Error is a simple object with errors array
    if (error && typeof error === 'object' && 'errors' in error) {
      const errorResponse: UpdateOrderResponse = {
        status: false,
        statusCode: error.statusCode || 'BadRequest',
        data: '',
        errors: Array.isArray(error.errors) ? error.errors : [error.message || 'Không thể gửi đơn hàng']
      };
      return errorResponse;
    }
    
    // Case 4: Create error response from any error
    const errorResponse: UpdateOrderResponse = {
      status: false,
      statusCode: 'Error',
      data: '',
      errors: [error?.message || error?.toString() || 'Không thể gửi đơn hàng']
    };
    
    return errorResponse;
  }
};

