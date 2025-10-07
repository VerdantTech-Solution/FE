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


