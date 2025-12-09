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

/**
 * Get revenue for last 7 days
 * Lấy doanh thu 7 ngày gần nhất. Admin sẽ thấy tổng doanh thu toàn hệ thống theo ngày, Vendor chỉ thấy doanh thu của mình.
 */
export const getRevenueLast7Days = async (): Promise<RevenueResponse> => {
  const url = `/api/Dashboard/revenue/last-7-days`;
  const response = await apiClient.get(url);
  return response as unknown as RevenueResponse;
};

export interface BestSellingProduct {
  productId?: string;
  productName?: string;
  totalSales?: number;
  totalRevenue?: number;
  quantity?: number;
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
 * Get top 5 best selling products by time range
 * Lấy top 5 sản phẩm bán chạy nhất trong khoảng thời gian. Admin sẽ thấy top 5 toàn hệ thống, Vendor chỉ thấy sản phẩm của mình.
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

