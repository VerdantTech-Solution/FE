import { apiClient } from "./apiClient";



export interface VendorDashboardOverview {

  walletBalance: number;

  pendingCashout: number;

  totalRevenueThisMonth: number;

  totalRevenueLastMonth: number;

  revenueGrowthPercent: number;

  totalOrdersThisMonth: number;

  totalOrdersLastMonth: number;

  orderGrowthPercent: number;

  totalProductsActive: number;

  totalProductsOutOfStock: number;

  pendingProductRegistrations: number;

  pendingProductUpdateRequests: number;

  averageRating: number;

  totalReviews: number;

}



export interface VendorDashboardOverviewResponse {

  status: boolean;

  statusCode: string;

  data: VendorDashboardOverview | null;

  errors: string[] | null;

}



/**

 * Lấy thống kê tổng quan nhanh cho vendor: số dư ví, doanh thu, đơn hàng, sản phẩm, rating.

 * GET /api/vendor-dashboard/overview

 */

export const getVendorDashboardOverview = async (): Promise<VendorDashboardOverview> => {

  const response = (await apiClient.get<VendorDashboardOverviewResponse>(

    "/api/vendor-dashboard/overview",

    {

      headers: {

        accept: "text/plain",

      },

    }

  )) as unknown as VendorDashboardOverviewResponse;



  if (!response) {

    throw new Error("Không nhận được phản hồi từ máy chủ (vendor-dashboard).");

  }



  if (response.status === false) {

    const message =

      response.errors?.join(", ") ||

      response.statusCode ||

      "Không thể tải thống kê tổng quan vendor.";

    throw new Error(message);

  }



  if (!response.data) {

    throw new Error("Dữ liệu tổng quan vendor rỗng.");

  }



  return response.data;

};



export interface VendorRevenueData {
  from: string;
  to: string;
  totalGrossRevenue: number;
  totalCommission: number;
  totalNetRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface VendorRevenueResponse {
  status: boolean;
  statusCode: string;
  data: VendorRevenueData | null;
  errors: string[] | null;
}

/**
 * Lấy doanh thu của vendor theo khoảng thời gian (gross, commission, net).
 * GET /api/vendor-dashboard/revenue?from={date}&to={date}
 */
export const getVendorRevenue = async (
  from: string,
  to: string
): Promise<VendorRevenueData> => {
  const response = (await apiClient.get<VendorRevenueResponse>(
    "/api/vendor-dashboard/revenue",
    {
      params: {
        from,
        to,
      },
      headers: {
        accept: "text/plain",
      },
    }
  )) as unknown as VendorRevenueResponse;

  if (!response) {
    throw new Error("Không nhận được phản hồi từ máy chủ (vendor-dashboard revenue).");
  }

  if (response.status === false) {
    const message =
      response.errors?.join(", ") ||
      response.statusCode ||
      "Không thể tải thống kê doanh thu vendor.";
    throw new Error(message);
  }

  if (!response.data) {
    throw new Error("Dữ liệu doanh thu vendor rỗng.");
  }

  return response.data;
};

export interface DailyRevenueItem {
  date: string;
  grossRevenue: number;
  netRevenue: number;
  orderCount: number;
}

export interface DailyRevenueData {
  from: string;
  to: string;
  dailyRevenues: DailyRevenueItem[];
  totalGrossRevenue: number;
  totalNetRevenue: number;
  totalOrders: number;
}

export interface DailyRevenueResponse {
  status: boolean;
  statusCode: string;
  data: DailyRevenueData | null;
  errors: string[] | null;
}

/**
 * Lấy doanh thu theo ngày trong khoảng thời gian (tối đa 90 ngày) cho biểu đồ.
 * GET /api/vendor-dashboard/revenue/daily?from={date}&to={date}
 */
export const getVendorDailyRevenue = async (
  from: string,
  to: string
): Promise<DailyRevenueData> => {
  const response = (await apiClient.get<DailyRevenueResponse>(
    "/api/vendor-dashboard/revenue/daily",
    {
      params: {
        from,
        to,
      },
      headers: {
        accept: "text/plain",
      },
    }
  )) as unknown as DailyRevenueResponse;

  if (!response) {
    throw new Error("Không nhận được phản hồi từ máy chủ (vendor-dashboard daily revenue).");
  }

  if (response.status === false) {
    const message =
      response.errors?.join(", ") ||
      response.statusCode ||
      "Không thể tải thống kê doanh thu theo ngày.";
    throw new Error(message);
  }

  if (!response.data) {
    throw new Error("Dữ liệu doanh thu theo ngày rỗng.");
  }

  return response.data;
};

export interface MonthlyRevenueItem {
  month: number; // 1-12
  year: number;
  grossRevenue: number;
  commission: number;
  netRevenue: number;
  orderCount: number;
}

export interface MonthlyRevenueResponse {
  status: boolean;
  statusCode: string;
  data: MonthlyRevenueItem[] | null;
  errors: string[] | null;
}

/**
 * Lấy doanh thu theo tháng trong năm cho biểu đồ yearly.
 * GET /api/vendor-dashboard/revenue/monthly?year={year}
 */
export const getVendorMonthlyRevenue = async (
  year: number
): Promise<MonthlyRevenueItem[]> => {
  const response = (await apiClient.get<MonthlyRevenueResponse>(
    "/api/vendor-dashboard/revenue/monthly",
    {
      params: {
        year,
      },
      headers: {
        accept: "text/plain",
      },
    }
  )) as unknown as MonthlyRevenueResponse;

  if (!response) {
    throw new Error("Không nhận được phản hồi từ máy chủ (vendor-dashboard monthly revenue).");
  }

  if (response.status === false) {
    const message =
      response.errors?.join(", ") ||
      response.statusCode ||
      "Không thể tải thống kê doanh thu theo tháng.";
    throw new Error(message);
  }

  if (!response.data || !Array.isArray(response.data)) {
    return [];
  }

  return response.data;
};

export interface OrderStatisticsByStatus {
  pending: number;
  processing: number;
  paid: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  refunded: number;
  partialRefund: number;
}

export interface OrderStatistics {
  from: string;
  to: string;
  totalOrders: number;
  ordersByStatus: OrderStatisticsByStatus;
  fulfillmentRate: number;
  cancellationRate: number;
  refundRate: number;
  averageDeliveryDays: number;
}

export interface OrderStatisticsResponse {
  status: boolean;
  statusCode: string;
  data: OrderStatistics | null;
  errors: string[] | null;
}

/**
 * Lấy thống kê đơn hàng của vendor theo trạng thái và khoảng thời gian.
 * GET /api/vendor-dashboard/orders/statistics?from={date}&to={date}
 */
export const getVendorOrderStatistics = async (
  from?: string,
  to?: string
): Promise<OrderStatistics> => {
  const response = (await apiClient.get<OrderStatisticsResponse>(
    "/api/vendor-dashboard/orders/statistics",
    {
      params: {
        ...(from && { from }),
        ...(to && { to }),
      },
      headers: {
        accept: "text/plain",
      },
    }
  )) as unknown as OrderStatisticsResponse;

  if (!response) {
    throw new Error("Không nhận được phản hồi từ máy chủ (vendor-dashboard order statistics).");
  }

  if (response.status === false) {
    const message =
      response.errors?.join(", ") ||
      response.statusCode ||
      "Không thể tải thống kê đơn hàng.";
    throw new Error(message);
  }

  if (!response.data) {
    throw new Error("Dữ liệu thống kê đơn hàng rỗng.");
  }

  return response.data;
};

export interface ProductCategoryDistribution {
  categoryId: number;
  categoryName: string;
  productCount: number;
  percentage: number;
}

export interface ProductStatistics {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  totalStockQuantity: number;
  totalStockValue: number;
  categoryDistribution: ProductCategoryDistribution[];
}

export interface ProductStatisticsResponse {
  status: boolean;
  statusCode: string;
  data: ProductStatistics | null;
  errors: string[] | null;
}

/**
 * Lấy thống kê sản phẩm của vendor: active, hết hàng, tồn kho, phân bố theo danh mục.
 * GET /api/vendor-dashboard/products/statistics
 */
export const getVendorProductStatistics = async (): Promise<ProductStatistics> => {
  const response = (await apiClient.get<ProductStatisticsResponse>(
    "/api/vendor-dashboard/products/statistics",
    {
      headers: {
        accept: "text/plain",
      },
    }
  )) as unknown as ProductStatisticsResponse;

  if (!response) {
    throw new Error("Không nhận được phản hồi từ máy chủ (vendor-dashboard product statistics).");
  }

  if (response.status === false) {
    const message =
      response.errors?.join(", ") ||
      response.statusCode ||
      "Không thể tải thống kê sản phẩm.";
    throw new Error(message);
  }

  if (!response.data) {
    throw new Error("Dữ liệu thống kê sản phẩm rỗng.");
  }

  return response.data;
};

// ----------------------------- WALLET STATISTICS -----------------------------

export interface WalletTransactionSummary {
  totalTopup: number;
  totalCashout: number;
  topupCount: number;
  cashoutCount: number;
}

export interface PendingCreditsSummary {
  amount: number;
  orderCount: number;
}

export interface WalletStatistics {
  currentBalance: number;
  pendingCashout: number;
  availableBalance: number;
  from: string;
  to: string;
  transactionSummary: WalletTransactionSummary;
  pendingCredits: PendingCreditsSummary;
  recentTransactions: any[]; // Có thể mở rộng kiểu chi tiết khi backend ổn định
}

export interface WalletStatisticsResponse {
  status: boolean;
  statusCode: string;
  data: WalletStatistics | null;
  errors: string[] | null;
}

/**
 * Thống kê ví vendor: số dư, pending cashout, tổng nạp/rút, giao dịch gần đây.
 * GET /api/vendor-dashboard/wallet/statistics?from={date}&to={date}
 */
export const getVendorWalletStatistics = async (
  from?: string,
  to?: string
): Promise<WalletStatistics> => {
  const response = (await apiClient.get<WalletStatisticsResponse>(
    "/api/vendor-dashboard/wallet/statistics",
    {
      params: {
        ...(from && { from }),
        ...(to && { to }),
      },
      headers: {
        accept: "text/plain",
      },
    }
  )) as unknown as WalletStatisticsResponse;

  if (!response) {
    throw new Error("Không nhận được phản hồi từ máy chủ (vendor-wallet statistics).");
  }

  if (response.status === false) {
    const message =
      response.errors?.join(", ") ||
      response.statusCode ||
      "Không thể tải thống kê ví vendor.";
    throw new Error(message);
  }

  if (!response.data) {
    throw new Error("Dữ liệu thống kê ví vendor rỗng.");
  }

  return response.data;
};

// Transaction types
export interface VendorTransaction {
  transactionId: number;
  transactionType: string;
  amount: number;
  status: string;
  createdAt: string;
  description: string;
  performer: string;
  processor: string;
}

export interface TransactionPaginatedData {
  data: VendorTransaction[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface TransactionResponse {
  status: boolean;
  statusCode: string;
  data: TransactionPaginatedData | null;
  errors: string[] | null;
}

/**
 * Lấy danh sách giao dịch của vendor với phân trang
 * GET /api/vendor-dashboard/transactions
 */
export const getVendorTransactions = async (
  from: string,
  to: string,
  page: number = 1,
  pageSize: number = 10
): Promise<TransactionPaginatedData> => {
  const response = (await apiClient.get<TransactionResponse>(
    "/api/vendor-dashboard/transactions",
    {
      params: {
        from,
        to,
        page,
        pageSize,
      },
      headers: {
        accept: "text/plain",
      },
    }
  )) as unknown as TransactionResponse;

  if (!response) {
    throw new Error("Không nhận được phản hồi từ máy chủ.");
  }

  if (response.status === false) {
    const message =
      response.errors?.join(", ") ||
      response.statusCode ||
      "Không thể tải danh sách giao dịch.";
    throw new Error(message);
  }

  if (!response.data) {
    throw new Error("Dữ liệu giao dịch rỗng.");
  }

  return response.data;
};

/**
 * Xuất lịch sử giao dịch ra file Excel
 * GET /api/vendor-dashboard/transactions/export
 */
export const exportVendorTransactions = async (
  from: string,
  to: string
): Promise<Blob> => {
  // Import axios directly to bypass interceptor
  const axios = (await import("axios")).default;
  const token = localStorage.getItem('authToken');
  
  const url = `${(await import("./apiClient")).API_BASE_URL}/api/vendor-dashboard/transactions/export`;
  console.log('Export API URL:', url);
  console.log('Export params:', { from, to });
  
  const response = await axios.get(
    url,
    {
      params: {
        from,
        to,
      },
      responseType: "blob",
      headers: {
        accept: "*/*",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    }
  );

  console.log('Export response size:', response.data.size);
  return response.data;
};
