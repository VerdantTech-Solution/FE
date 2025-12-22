import { apiClient, API_BASE_URL } from "./apiClient";

// ==================== OVERVIEW ====================

export interface AdminOverview {
  revenue: AdminRevenueOverview;
  commission: AdminCommissionOverview;
  orders: AdminOrdersOverview;
  users: AdminUsersOverview;
  products: AdminProductsOverview;
  pendingQueues: AdminPendingQueuesOverview;
}

export interface AdminRevenueOverview {
  today: number;
  thisWeek: number;
  thisMonth: number;
  lastMonth: number;
  growthPercent: number;
}

export interface AdminCommissionOverview {
  thisMonth: number;
  lastMonth: number;
  growthPercent: number;
}

export interface AdminOrdersOverview {
  today: number;
  thisWeek: number;
  thisMonth: number;
  pendingShipment: number;
  inTransit: number;
}

export interface AdminUsersOverview {
  totalCustomers: number;
  totalVendors: number;
  newCustomersThisMonth: number;
  newVendorsThisMonth: number;
}

export interface AdminProductsOverview {
  totalActive: number;
  totalInactive: number;
  outOfStock: number;
}

export interface AdminPendingQueuesOverview {
  vendorProfiles: number;
  productRegistrations: number;
  vendorCertificates: number;
  productCertificates: number;
  productUpdateRequests: number;
  supportRequests: number;
  refundRequests: number;
  cashoutRequests: number;
  total: number;
}

export interface AdminOverviewResponse {
  status: boolean;
  statusCode: number | string;
  data: AdminOverview | null;
  errors: string[] | null;
}

/**
 * Lấy thống kê tổng quan toàn hệ thống
 * GET /api/admin-dashboard/overview
 */
export const getAdminDashboardOverview = async (): Promise<AdminOverview> => {
  try {
    console.log('Calling API:', `${API_BASE_URL}/api/admin-dashboard/overview`);
    const response = (await apiClient.get<AdminOverviewResponse>(
      "/api/admin-dashboard/overview",
      {
        headers: {
          accept: "text/plain",
        },
      }
    )) as unknown as AdminOverviewResponse;

    console.log('Raw API response:', response);
    console.log('Response type:', typeof response);
    console.log('Response keys:', response ? Object.keys(response) : 'null');

    if (!response) {
      throw new Error("Không nhận được phản hồi từ máy chủ (admin-dashboard).");
    }

    // Kiểm tra nếu response đã là data trực tiếp (do apiClient interceptor trả về response.data)
    if (response.status === undefined && response.data === undefined) {
      console.log('Response is direct data, not wrapped in APIResponse');
      // Có thể response đã là AdminOverview trực tiếp
      const directData = response as any;
      if (directData.revenue || directData.commission || directData.orders) {
        return directData as AdminOverview;
      }
    }

    if (response.status === false) {
      const message =
        response.errors?.join(", ") ||
        String(response.statusCode) ||
        "Không thể tải thống kê tổng quan admin.";
      throw new Error(message);
    }

    if (!response.data) {
      console.error('Response has no data:', response);
      throw new Error("Dữ liệu tổng quan admin rỗng.");
    }

    console.log('Returning overview data:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error in getAdminDashboardOverview:', error);
    console.error('Error response:', error?.response);
    console.error('Error data:', error?.response?.data);
    throw error;
  }
};

// ==================== REVENUE ====================

export interface AdminRevenueData {
  from: string;
  to: string;
  totalRevenue: number;
  totalCommission: number;
  totalVendorPayout: number;
  totalOrders: number;
  totalTransactions: number;
  averageOrderValue: number;
  paymentMethodBreakdown: AdminPaymentMethodBreakdown;
}

export interface AdminPaymentMethodBreakdown {
  banking: AdminPaymentMethodItem;
  cod: AdminPaymentMethodItem;
}

export interface AdminPaymentMethodItem {
  count: number;
  amount: number;
}

export interface AdminRevenueResponse {
  status: boolean;
  statusCode: number | string;
  data: AdminRevenueData | null;
  errors: string[] | null;
}

/**
 * Lấy doanh thu hệ thống theo khoảng thời gian
 * GET /api/admin-dashboard/revenue?from={date}&to={date}
 */
export const getAdminRevenue = async (
  from: string,
  to: string
): Promise<AdminRevenueData> => {
  const response = (await apiClient.get<AdminRevenueResponse>(
    "/api/admin-dashboard/revenue",
    {
      params: {
        from,
        to,
      },
      headers: {
        accept: "text/plain",
      },
    }
  )) as unknown as AdminRevenueResponse;

  if (!response) {
    throw new Error("Không nhận được phản hồi từ máy chủ (admin-dashboard revenue).");
  }

  if (response.status === false) {
    const message =
      response.errors?.join(", ") ||
      String(response.statusCode) ||
      "Không thể tải thống kê doanh thu admin.";
    throw new Error(message);
  }

  if (!response.data) {
    throw new Error("Dữ liệu doanh thu admin rỗng.");
  }

  return response.data;
};

// ==================== DAILY REVENUE ====================

export interface AdminDailyRevenueItem {
  date: string;
  revenue: number;
  commission: number;
  orderCount: number;
  transactionCount: number;
}

export interface AdminDailyRevenueData {
  from: string;
  to: string;
  dailyRevenues: AdminDailyRevenueItem[];
  totalRevenue: number;
  totalCommission: number;
  totalOrders: number;
}

export interface AdminDailyRevenueResponse {
  status: boolean;
  statusCode: number | string;
  data: AdminDailyRevenueData | null;
  errors: string[] | null;
}

/**
 * Lấy doanh thu hệ thống theo ngày trong khoảng thời gian (tối đa 90 ngày)
 * GET /api/admin-dashboard/revenue/daily?from={date}&to={date}
 */
export const getAdminDailyRevenue = async (
  from: string,
  to: string
): Promise<AdminDailyRevenueData> => {
  const response = (await apiClient.get<AdminDailyRevenueResponse>(
    "/api/admin-dashboard/revenue/daily",
    {
      params: {
        from,
        to,
      },
      headers: {
        accept: "text/plain",
      },
    }
  )) as unknown as AdminDailyRevenueResponse;

  if (!response) {
    throw new Error("Không nhận được phản hồi từ máy chủ (admin-dashboard daily revenue).");
  }

  if (response.status === false) {
    const message =
      response.errors?.join(", ") ||
      String(response.statusCode) ||
      "Không thể tải thống kê doanh thu theo ngày.";
    throw new Error(message);
  }

  if (!response.data) {
    throw new Error("Dữ liệu doanh thu theo ngày rỗng.");
  }

  return response.data;
};

// ==================== MONTHLY REVENUE ====================

export interface AdminMonthlyRevenueItem {
  month: number;
  monthName: string;
  revenue: number;
  commission: number;
  orderCount: number;
}

export interface AdminMonthlyRevenueData {
  year: number;
  monthlyRevenues: AdminMonthlyRevenueItem[];
  totalRevenue: number;
  totalCommission: number;
  totalOrders: number;
}

export interface AdminMonthlyRevenueResponse {
  status: boolean;
  statusCode: number | string;
  data: AdminMonthlyRevenueData | null;
  errors: string[] | null;
}

/**
 * Lấy doanh thu hệ thống theo tháng trong năm
 * GET /api/admin-dashboard/revenue/monthly?year={year}
 */
export const getAdminMonthlyRevenue = async (
  year: number
): Promise<AdminMonthlyRevenueData> => {
  const response = (await apiClient.get<AdminMonthlyRevenueResponse>(
    "/api/admin-dashboard/revenue/monthly",
    {
      params: {
        year,
      },
      headers: {
        accept: "text/plain",
      },
    }
  )) as unknown as AdminMonthlyRevenueResponse;

  if (!response) {
    throw new Error("Không nhận được phản hồi từ máy chủ (admin-dashboard monthly revenue).");
  }

  if (response.status === false) {
    const message =
      response.errors?.join(", ") ||
      String(response.statusCode) ||
      "Không thể tải thống kê doanh thu theo tháng.";
    throw new Error(message);
  }

  if (!response.data) {
    throw new Error("Dữ liệu doanh thu theo tháng rỗng.");
  }

  return response.data;
};

// ==================== ORDER STATISTICS ====================

export interface AdminOrdersByStatus {
  pending: number;
  processing: number;
  paid: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  refunded: number;
  partialRefund: number;
}

export interface AdminOrdersByPaymentMethod {
  banking: number;
  cod: number;
}

export interface AdminOrdersByCourier {
  courierId: number;
  courierName: string;
  orderCount: number;
  percentage: number;
}

export interface AdminOrderStatistics {
  from: string;
  to: string;
  totalOrders: number;
  ordersByStatus: AdminOrdersByStatus;
  fulfillmentRate: number;
  cancellationRate: number;
  refundRate: number;
  averageDeliveryDays: number;
  ordersByPaymentMethod: AdminOrdersByPaymentMethod;
  ordersByCourier: AdminOrdersByCourier[];
}

export interface AdminOrderStatisticsResponse {
  status: boolean;
  statusCode: number | string;
  data: AdminOrderStatistics | null;
  errors: string[] | null;
}

/**
 * Lấy thống kê đơn hàng toàn hệ thống
 * GET /api/admin-dashboard/orders/statistics?from={date}&to={date}
 */
export const getAdminOrderStatistics = async (
  from: string,
  to: string
): Promise<AdminOrderStatistics> => {
  const response = (await apiClient.get<AdminOrderStatisticsResponse>(
    "/api/admin-dashboard/orders/statistics",
    {
      params: {
        from,
        to,
      },
      headers: {
        accept: "text/plain",
      },
    }
  )) as unknown as AdminOrderStatisticsResponse;

  if (!response) {
    throw new Error("Không nhận được phản hồi từ máy chủ (admin-dashboard order statistics).");
  }

  if (response.status === false) {
    const message =
      response.errors?.join(", ") ||
      String(response.statusCode) ||
      "Không thể tải thống kê đơn hàng.";
    throw new Error(message);
  }

  if (!response.data) {
    throw new Error("Dữ liệu thống kê đơn hàng rỗng.");
  }

  return response.data;
};

// ==================== USER STATISTICS ====================

export interface AdminCustomerStatistics {
  total: number;
  active: number;
  inactive: number;
  newThisPeriod: number;
  growthPercent: number;
}

export interface AdminVendorUserStatistics {
  total: number;
  verified: number;
  pendingVerification: number;
  newThisPeriod: number;
}

export interface AdminStaffStatistics {
  total: number;
  active: number;
}

export interface AdminRegistrationTrend {
  date: string;
  customers: number;
  vendors: number;
}

export interface AdminUserStatistics {
  from: string;
  to: string;
  customers: AdminCustomerStatistics;
  vendors: AdminVendorUserStatistics;
  staff: AdminStaffStatistics;
  registrationTrend: AdminRegistrationTrend[];
}

export interface AdminUserStatisticsResponse {
  status: boolean;
  statusCode: number | string;
  data: AdminUserStatistics | null;
  errors: string[] | null;
}

/**
 * Lấy thống kê người dùng
 * GET /api/admin-dashboard/users/statistics?from={date}&to={date}
 */
export const getAdminUserStatistics = async (
  from?: string,
  to?: string
): Promise<AdminUserStatistics> => {
  const response = (await apiClient.get<AdminUserStatisticsResponse>(
    "/api/admin-dashboard/users/statistics",
    {
      params: {
        ...(from && { from }),
        ...(to && { to }),
      },
      headers: {
        accept: "text/plain",
      },
    }
  )) as unknown as AdminUserStatisticsResponse;

  if (!response) {
    throw new Error("Không nhận được phản hồi từ máy chủ (admin-dashboard user statistics).");
  }

  if (response.status === false) {
    const message =
      response.errors?.join(", ") ||
      String(response.statusCode) ||
      "Không thể tải thống kê người dùng.";
    throw new Error(message);
  }

  if (!response.data) {
    throw new Error("Dữ liệu thống kê người dùng rỗng.");
  }

  return response.data;
};

// ==================== PRODUCT STATISTICS ====================

export interface AdminCategoryDistribution {
  categoryId: number;
  categoryName: string;
  productCount: number;
  percentage: number;
  activeCount: number;
  outOfStockCount: number;
}

export interface AdminVendorProductDistribution {
  vendorsWithProducts: number;
  averageProductsPerVendor: number;
  topVendorProductCount: number;
}

export interface AdminProductStatistics {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  categoryDistribution: AdminCategoryDistribution[];
  vendorDistribution: AdminVendorProductDistribution;
}

export interface AdminProductStatisticsResponse {
  status: boolean;
  statusCode: number | string;
  data: AdminProductStatistics | null;
  errors: string[] | null;
}

/**
 * Lấy thống kê sản phẩm toàn hệ thống
 * GET /api/admin-dashboard/products/statistics
 */
export const getAdminProductStatistics = async (): Promise<AdminProductStatistics> => {
  const response = (await apiClient.get<AdminProductStatisticsResponse>(
    "/api/admin-dashboard/products/statistics",
    {
      headers: {
        accept: "text/plain",
      },
    }
  )) as unknown as AdminProductStatisticsResponse;

  if (!response) {
    throw new Error("Không nhận được phản hồi từ máy chủ (admin-dashboard product statistics).");
  }

  if (response.status === false) {
    const message =
      response.errors?.join(", ") ||
      String(response.statusCode) ||
      "Không thể tải thống kê sản phẩm.";
    throw new Error(message);
  }

  if (!response.data) {
    throw new Error("Dữ liệu thống kê sản phẩm rỗng.");
  }

  return response.data;
};

// ==================== BEST SELLING PRODUCTS ====================

export interface AdminBestSellingProductItem {
  rank: number;
  productId: number;
  productCode: string;
  productName: string;
  vendorId: number;
  vendorName: string;
  imageUrl?: string;
  unitPrice: number;
  soldQuantity: number;
  totalRevenue: number;
  commissionEarned: number;
  stockQuantity: number;
  ratingAverage: number;
}

export interface AdminBestSellingProducts {
  from: string;
  to: string;
  products: AdminBestSellingProductItem[];
}

export interface AdminBestSellingProductsResponse {
  status: boolean;
  statusCode: number | string;
  data: AdminBestSellingProducts | null;
  errors: string[] | null;
}

/**
 * Lấy top sản phẩm bán chạy nhất toàn hệ thống
 * GET /api/admin-dashboard/products/best-selling?from={date}&to={date}&limit={limit}
 */
export const getAdminBestSellingProducts = async (
  from?: string,
  to?: string,
  limit: number = 10
): Promise<AdminBestSellingProducts> => {
  const response = (await apiClient.get<AdminBestSellingProductsResponse>(
    "/api/admin-dashboard/products/best-selling",
    {
      params: {
        ...(from && { from }),
        ...(to && { to }),
        limit,
      },
      headers: {
        accept: "text/plain",
      },
    }
  )) as unknown as AdminBestSellingProductsResponse;

  if (!response) {
    throw new Error("Không nhận được phản hồi từ máy chủ (admin-dashboard best selling products).");
  }

  if (response.status === false) {
    const message =
      response.errors?.join(", ") ||
      String(response.statusCode) ||
      "Không thể tải top sản phẩm bán chạy.";
    throw new Error(message);
  }

  if (!response.data) {
    throw new Error("Dữ liệu top sản phẩm bán chạy rỗng.");
  }

  return response.data;
};

// ==================== VENDOR STATISTICS ====================

export interface AdminVendorsByStatus {
  active: number;
  inactive: number;
  suspended: number;
}

export interface AdminVendorStatistics {
  from: string;
  to: string;
  totalVendors: number;
  verifiedVendors: number;
  pendingVerification: number;
  vendorsByStatus: AdminVendorsByStatus;
  totalVendorRevenue: number;
  totalCommissionCollected: number;
  averageRevenuePerVendor: number;
}

export interface AdminVendorStatisticsResponse {
  status: boolean;
  statusCode: number | string;
  data: AdminVendorStatistics | null;
  errors: string[] | null;
}

/**
 * Lấy thống kê vendors
 * GET /api/admin-dashboard/vendors/statistics?from={date}&to={date}
 */
export const getAdminVendorStatistics = async (
  from?: string,
  to?: string
): Promise<AdminVendorStatistics> => {
  const response = (await apiClient.get<AdminVendorStatisticsResponse>(
    "/api/admin-dashboard/vendors/statistics",
    {
      params: {
        ...(from && { from }),
        ...(to && { to }),
      },
      headers: {
        accept: "text/plain",
      },
    }
  )) as unknown as AdminVendorStatisticsResponse;

  if (!response) {
    throw new Error("Không nhận được phản hồi từ máy chủ (admin-dashboard vendor statistics).");
  }

  if (response.status === false) {
    const message =
      response.errors?.join(", ") ||
      String(response.statusCode) ||
      "Không thể tải thống kê vendors.";
    throw new Error(message);
  }

  if (!response.data) {
    throw new Error("Dữ liệu thống kê vendors rỗng.");
  }

  return response.data;
};

// ==================== TOP VENDORS ====================

export interface AdminTopVendorItem {
  rank: number;
  vendorId: number;
  companyName: string;
  slug: string;
  verifiedAt?: string;
  grossRevenue: number;
  netRevenue: number;
  commissionPaid: number;
  orderCount: number;
  productCount: number;
  averageRating: number;
  walletBalance: number;
}

export interface AdminTopVendors {
  from: string;
  to: string;
  vendors: AdminTopVendorItem[];
}

export interface AdminTopVendorsResponse {
  status: boolean;
  statusCode: number | string;
  data: AdminTopVendors | null;
  errors: string[] | null;
}

/**
 * Lấy top vendors có doanh thu cao nhất
 * GET /api/admin-dashboard/vendors/top-performers?from={date}&to={date}&limit={limit}
 */
export const getAdminTopVendors = async (
  from?: string,
  to?: string,
  limit: number = 10
): Promise<AdminTopVendors> => {
  const response = (await apiClient.get<AdminTopVendorsResponse>(
    "/api/admin-dashboard/vendors/top-performers",
    {
      params: {
        ...(from && { from }),
        ...(to && { to }),
        limit,
      },
      headers: {
        accept: "text/plain",
      },
    }
  )) as unknown as AdminTopVendorsResponse;

  if (!response) {
    throw new Error("Không nhận được phản hồi từ máy chủ (admin-dashboard top vendors).");
  }

  if (response.status === false) {
    const message =
      response.errors?.join(", ") ||
      String(response.statusCode) ||
      "Không thể tải top vendors.";
    throw new Error(message);
  }

  if (!response.data) {
    throw new Error("Dữ liệu top vendors rỗng.");
  }

  return response.data;
};

// ==================== TRANSACTION STATISTICS ====================

export interface AdminTransactionSummary {
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
}

export interface AdminPaymentInTransactions {
  count: number;
  completedAmount: number;
  pendingAmount: number;
  failedCount: number;
}

export interface AdminWalletTopupTransactions {
  count: number;
  completedAmount: number;
}

export interface AdminWalletCashoutTransactions {
  count: number;
  completedAmount: number;
  pendingCount: number;
  pendingAmount: number;
}

export interface AdminRefundTransactions {
  count: number;
  completedAmount: number;
  pendingCount: number;
  pendingAmount: number;
}

export interface AdminTransactionByType {
  paymentIn: AdminPaymentInTransactions;
  walletTopup: AdminWalletTopupTransactions;
  walletCashout: AdminWalletCashoutTransactions;
  refund: AdminRefundTransactions;
}

export interface AdminDailyTransactionTrend {
  date: string;
  inflow: number;
  outflow: number;
  transactionCount: number;
}

export interface AdminTransactionStatistics {
  from: string;
  to: string;
  summary: AdminTransactionSummary;
  byType: AdminTransactionByType;
  dailyTrend: AdminDailyTransactionTrend[];
}

export interface AdminTransactionStatisticsResponse {
  status: boolean;
  statusCode: number | string;
  data: AdminTransactionStatistics | null;
  errors: string[] | null;
}

/**
 * Lấy thống kê giao dịch tài chính
 * GET /api/admin-dashboard/transactions/statistics?from={date}&to={date}
 */
export const getAdminTransactionStatistics = async (
  from: string,
  to: string
): Promise<AdminTransactionStatistics> => {
  const response = (await apiClient.get<AdminTransactionStatisticsResponse>(
    "/api/admin-dashboard/transactions/statistics",
    {
      params: {
        from,
        to,
      },
      headers: {
        accept: "text/plain",
      },
    }
  )) as unknown as AdminTransactionStatisticsResponse;

  if (!response) {
    throw new Error("Không nhận được phản hồi từ máy chủ (admin-dashboard transaction statistics).");
  }

  if (response.status === false) {
    const message =
      response.errors?.join(", ") ||
      String(response.statusCode) ||
      "Không thể tải thống kê giao dịch.";
    throw new Error(message);
  }

  if (!response.data) {
    throw new Error("Dữ liệu thống kê giao dịch rỗng.");
  }

  return response.data;
};

// ==================== QUEUE STATISTICS ====================

export interface AdminQueueItem {
  pendingCount: number;
  oldestPendingDate?: string;
  averageWaitDays: number;
}

export interface AdminQueueByVendor {
  vendorId: number;
  vendorName: string;
  count: number;
}

export interface AdminProductRegistrationQueue extends AdminQueueItem {
  byVendor: AdminQueueByVendor[];
}

export interface AdminRequestQueue extends AdminQueueItem {
  inReviewCount: number;
}

export interface AdminRefundQueue extends AdminQueueItem {
  inReviewCount: number;
  totalPendingAmount: number;
}

export interface AdminCashoutQueue extends AdminQueueItem {
  totalPendingAmount: number;
}

export interface AdminQueueStatistics {
  vendorProfiles: AdminQueueItem;
  productRegistrations: AdminProductRegistrationQueue;
  productUpdateRequests: AdminQueueItem;
  vendorCertificates: AdminQueueItem;
  productCertificates: AdminQueueItem;
  supportRequests: AdminRequestQueue;
  refundRequests: AdminRefundQueue;
  cashoutRequests: AdminCashoutQueue;
}

export interface AdminQueueStatisticsResponse {
  status: boolean;
  statusCode: number | string;
  data: AdminQueueStatistics | null;
  errors: string[] | null;
}

/**
 * Lấy chi tiết các hàng đợi chờ xử lý
 * GET /api/admin-dashboard/queues/statistics
 */
export const getAdminQueueStatistics = async (): Promise<AdminQueueStatistics> => {
  const response = (await apiClient.get<AdminQueueStatisticsResponse>(
    "/api/admin-dashboard/queues/statistics",
    {
      headers: {
        accept: "text/plain",
      },
    }
  )) as unknown as AdminQueueStatisticsResponse;

  if (!response) {
    throw new Error("Không nhận được phản hồi từ máy chủ (admin-dashboard queue statistics).");
  }

  if (response.status === false) {
    const message =
      response.errors?.join(", ") ||
      String(response.statusCode) ||
      "Không thể tải thống kê hàng đợi.";
    throw new Error(message);
  }

  if (!response.data) {
    throw new Error("Dữ liệu thống kê hàng đợi rỗng.");
  }

  return response.data;
};

// ==================== EXPORT TRANSACTIONS ====================

/**
 * Export lịch sử giao dịch
 * GET /api/admin-dashboard/export-transactions?from={date}&to={date}
 */
export const exportAdminTransactions = async (
  from: string,
  to: string
): Promise<Blob> => {
  const response = await apiClient.get(
    "/api/admin-dashboard/export-transactions",
    {
      params: {
        from,
        to,
      },
      responseType: "blob",
      headers: {
        accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    }
  );

  return response as unknown as Blob;
};

