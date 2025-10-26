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
  const response = await apiClient.post('/api/Order/preview', payload);
  return response as unknown as CreateOrderPreviewResponse;
};


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
  images?: string[] | null;
  warrantyMonths?: number;
  ratingAverage?: number;
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
}

export type CreateOrderFromPreviewResponse = CreateOrderPreviewResponse<OrderEntity>;

export const createOrderFromPreview = async (
  orderPreviewId: string,
  payload: CreateOrderFromPreviewRequest
): Promise<CreateOrderFromPreviewResponse> => {
  console.log('Creating order from preview:', {
    orderPreviewId,
    payload,
    url: `/api/Order/${orderPreviewId}`
  });
  
  const response = await apiClient.post(`/api/Order/${orderPreviewId}`, payload);
  
  console.log('Order creation API response:', response);
  
  return response as unknown as CreateOrderFromPreviewResponse;
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
  address: any[];
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

// ===== Get My Orders =====
export type GetMyOrdersResponse = CreateOrderPreviewResponse<OrderEntity[]>;

export const getMyOrders = async (): Promise<GetMyOrdersResponse> => {
  const response = await apiClient.get('/api/Order/me');
  return response as unknown as GetMyOrdersResponse;
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

