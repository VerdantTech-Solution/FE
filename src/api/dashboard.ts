import { apiClient } from './apiClient';

export interface OrderStatisticsResponse {
  status: boolean;
  statusCode: string | number;
  data: OrderStatistics;
  errors: string[];
}

export interface OrderStatistics {
  from?: string;
  to?: string;
  total?: number;
  paid?: number;
  shipped?: number;
  cancelled?: number;
  delivered?: number;
  refunded?: number;
}

export interface GetOrderStatisticsParams {
  from?: string; // date string
  to?: string; // date string
}

/**
 * Get order statistics by time range
 * Lấy thống kê số lượng đơn hàng theo trạng thái (Paid, Shipped, Cancelled, Delivered, Refunded) trong khoảng thời gian chỉ định.
 * Chỉ Admin có quyền truy cập.
 */
export const getOrderStatistics = async (
  params?: GetOrderStatisticsParams
): Promise<OrderStatisticsResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params?.from) {
    queryParams.append('from', params.from);
  }
  
  if (params?.to) {
    queryParams.append('to', params.to);
  }
  
  const queryString = queryParams.toString();
  const url = `/api/Dashboard/orders/statistics${queryString ? `?${queryString}` : ''}`;
  
  const response = await apiClient.get(url);
  return response as unknown as OrderStatisticsResponse;
};

export interface RevenueResponse {
  status: boolean;
  statusCode: string | number;
  data: RevenueData;
  errors: string[];
}

export interface RevenueData {
  from?: string;
  to?: string;
  revenue?: number;
}

export interface GetRevenueParams {
  from?: string; // date string
  to?: string; // date string
}

/**
 * Get revenue by time range
 * Lấy tổng doanh thu từ các giao dịch PaymentIn đã hoàn thành trong khoảng thời gian chỉ định.
 * Có thể sử dụng cho cả Admin và Vendor. Admin sẽ thấy tổng doanh thu toàn hệ thống, Vendor chỉ thấy doanh thu của mình.
 */
export const getRevenue = async (
  params?: GetRevenueParams
): Promise<RevenueResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params?.from) {
    queryParams.append('from', params.from);
  }
  
  if (params?.to) {
    queryParams.append('to', params.to);
  }
  
  const queryString = queryParams.toString();
  const url = `/api/Dashboard/revenue${queryString ? `?${queryString}` : ''}`;
  
  const response = await apiClient.get(url);
  return response as unknown as RevenueResponse;
};

export interface BestSellingProduct {
  productId?: string;
  productName?: string;
  totalSold?: number;
  revenue?: number;
  imageUrl?: string;
}

export interface BestSellingProductsResponse {
  status: boolean;
  statusCode: string | number;
  data: BestSellingProduct[];
  errors: string[];
}

export interface GetBestSellingProductsParams {
  from?: string; // date string
  to?: string; // date string
}

/**
 * Get Top 5 Best Selling Products By Time Range
 * Có thể sử dụng cho cả Admin và Vendor. Admin sẽ thấy top 5 toàn hệ thống, Vendor chỉ thấy sản phẩm của mình.
 */
export const getBestSellingProducts = async (
  params?: GetBestSellingProductsParams
): Promise<BestSellingProductsResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params?.from) {
    queryParams.append('from', params.from);
  }
  
  if (params?.to) {
    queryParams.append('to', params.to);
  }
  
  const queryString = queryParams.toString();
  const url = `/api/Dashboard/best-selling-products${queryString ? `?${queryString}` : ''}`;
  
  const response = await apiClient.get(url);
  return response as unknown as BestSellingProductsResponse;
};

export interface QueueStatistics {
  vendorProfile?: number;
  productRegistration?: number;
  vendorCertificate?: number;
  productCertificate?: number;
  request?: number;
}

export interface QueueStatisticsResponse {
  status: boolean;
  statusCode: string | number;
  data: QueueStatistics;
  errors: string[];
}

/**
 * Get Queue Statistics
 * Lấy số lượng các yêu cầu đang chờ xử lý (VendorProfile, ProductRegistration, VendorCertificate, ProductCertificate, Request).
 * Chỉ Admin có quyền truy cập.
 */
export const getQueueStatistics = async (): Promise<QueueStatisticsResponse> => {
  const response = await apiClient.get('/api/Dashboard/queues/statistics');
  return response as unknown as QueueStatisticsResponse;
};

export interface RevenueLast7DaysData {
  date: string;
  revenue: number;
}

export interface RevenueLast7DaysResponse {
  status: boolean;
  statusCode: string | number;
  data: RevenueLast7DaysData[];
  errors: string[];
}

/**
 * Get Revenue Last 7 Days
 * Có thể sử dụng cho cả Admin và Vendor. Admin sẽ thấy tổng doanh thu toàn hệ thống theo ngày, Vendor chỉ thấy doanh thu của mình.
 */
export const getRevenueLast7Days = async (): Promise<RevenueLast7DaysResponse> => {
  const response = await apiClient.get('/api/Dashboard/revenue/last-7-days');
  return response as unknown as RevenueLast7DaysResponse;
};

