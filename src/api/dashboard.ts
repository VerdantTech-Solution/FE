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
  totalRevenue?: number;
  dailyRevenues?: Array<{
    date: string;
    revenue: number;
  }>;
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
  soldQuantity: number;
  product: {
    id: number;
    productCode: string;
    productName: string;
    unitPrice: number;
    images?: Array<{
      imageUrl: string;
      sortOrder: number;
    }>;
    [key: string]: any;
  };
}

export interface BestSellingProductsData {
  from: string;
  to: string;
  products: BestSellingProduct[];
}

export interface BestSellingProductsResponse {
  status: boolean;
  statusCode: string | number;
  data: BestSellingProductsData;
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

// =====================================================
// PRODUCT RATINGS STATISTICS (Vendor only)
// =====================================================

export interface ProductRatingItem {
  id: number;
  productCode: string;
  productName: string;
  slug: string;
  description: string;
  images?: Array<{
    imageUrl: string;
    sortOrder: number;
  }>;
  unitPrice: number;
  warrantyMonths: number;
  ratingAverage: number;
  specifications?: {
    [key: string]: string;
  };
  dimensionsCm?: {
    width?: number;
    height?: number;
    length?: number;
  };
}

export interface ProductRatingsData {
  averageRatingOfVendor: number;
  top3Highest: {
    top1: ProductRatingItem;
    top2: ProductRatingItem;
    top3: ProductRatingItem;
  };
  top3Lowest: {
    top1: ProductRatingItem;
    top2: ProductRatingItem;
    top3: ProductRatingItem;
  };
}

export interface ProductRatingsResponse {
  status: boolean;
  statusCode: string | number;
  data: ProductRatingsData;
  errors: string[];
}

/**
 * Get products rating statistics (Vendor only)
 * Lấy thống kê đánh giá sản phẩm của vendor bao gồm rating trung bình tất cả sản phẩm, 
 * top 3 sản phẩm có rating cao nhất và thấp nhất. Chỉ Vendor có quyền truy cập.
 */
export const getProductRatings = async (): Promise<ProductRatingsResponse> => {
  const url = `/api/Dashboard/products/ratings`;
  const response = await apiClient.get(url);
  return response as unknown as ProductRatingsResponse;
};

// =====================================================
// QUEUE STATISTICS (Admin and Staff only)
// =====================================================

export interface QueueStatistics {
  vendorProfile: number;
  productRegistration: number;
  vendorCertificate: number;
  productCertificate: number;
  request: number;
  total: number;
}

export interface QueueStatisticsResponse {
  status: boolean;
  statusCode: string | number;
  data: QueueStatistics;
  errors: string[];
}

/**
 * Get queue statistics (Admin and Staff only)
 * Lấy số lượng các yêu cầu đang chờ xử lý (VendorProfile, ProductRegistration, 
 * VendorCertificate, ProductCertificate, Request). Admin và Staff có quyền truy cập.
 */
export const getQueueStatistics = async (): Promise<QueueStatisticsResponse> => {
  const url = `/api/Dashboard/queues/statistics`;
  const response = await apiClient.get(url);
  return response as unknown as QueueStatisticsResponse;
};

