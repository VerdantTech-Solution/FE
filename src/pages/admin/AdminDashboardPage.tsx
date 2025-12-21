import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminHeader } from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import { 
  getAdminDashboardOverview, 
  getAdminRevenue,
  getAdminDailyRevenue,
  getAdminOrderStatistics,
  getAdminUserStatistics,
  getAdminProductStatistics,
  getAdminBestSellingProducts,
  getAdminTopVendors,
  getAdminTransactionStatistics,
  type AdminOverview,
  type AdminRevenueData,
  type AdminDailyRevenueData,
  type AdminOrderStatistics,
  type AdminUserStatistics,
  type AdminProductStatistics,
  type AdminBestSellingProducts,
  type AdminTopVendors,
  type AdminTransactionStatistics
} from "@/api/admin-dashboard";
import { Loader2, DollarSign, Package, Users, ShoppingBag, CreditCard, AlertCircle, Calendar } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const AdminDashboardPage = () => {
  console.log('AdminDashboardPage component rendered');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Revenue statistics state
  const [revenueData, setRevenueData] = useState<AdminRevenueData | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<'7days' | '30days' | 'custom'>('7days');
  
  // Chart data state
  const [dailyRevenueData, setDailyRevenueData] = useState<AdminDailyRevenueData | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  // Additional statistics states
  const [orderStats, setOrderStats] = useState<AdminOrderStatistics | null>(null);
  const [orderStatsLoading, setOrderStatsLoading] = useState(false);
  const [orderStatsError, setOrderStatsError] = useState<string | null>(null);

  const [userStats, setUserStats] = useState<AdminUserStatistics | null>(null);
  const [userStatsLoading, setUserStatsLoading] = useState(false);
  const [userStatsError, setUserStatsError] = useState<string | null>(null);

  const [productStats, setProductStats] = useState<AdminProductStatistics | null>(null);
  const [productStatsLoading, setProductStatsLoading] = useState(false);
  const [productStatsError, setProductStatsError] = useState<string | null>(null);

  const [bestSellingProducts, setBestSellingProducts] = useState<AdminBestSellingProducts | null>(null);
  const [bestSellingLoading, setBestSellingLoading] = useState(false);
  const [bestSellingError, setBestSellingError] = useState<string | null>(null);

  const [topVendors, setTopVendors] = useState<AdminTopVendors | null>(null);
  const [topVendorsLoading, setTopVendorsLoading] = useState(false);
  const [topVendorsError, setTopVendorsError] = useState<string | null>(null);

  const [transactionStats, setTransactionStats] = useState<AdminTransactionStatistics | null>(null);
  const [transactionStatsLoading, setTransactionStatsLoading] = useState(false);
  const [transactionStatsError, setTransactionStatsError] = useState<string | null>(null);
  
  // Date range state - default to last 7 days
  const getDateRange = (range: '7days' | '30days') => {
    const now = new Date();
    let from: Date, to: Date = new Date(now);

    switch (range) {
      case '7days':
        from = new Date(now);
        from.setDate(now.getDate() - 7);
        break;
      case '30days':
        from = new Date(now);
        from.setDate(now.getDate() - 30);
        break;
    }

    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    };
  };

  const [dateRange, setDateRange] = useState(getDateRange('7days'));
  const [customDateRange, setCustomDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching admin dashboard overview...');
        const data = await getAdminDashboardOverview();
        console.log('Admin overview data received:', data);
        setOverview(data);
      } catch (err: any) {
        console.error('Error fetching admin overview:', err);
        console.error('Error details:', {
          message: err?.message,
          response: err?.response,
          data: err?.response?.data,
          status: err?.response?.status
        });
        setError(err?.message || "Không thể tải thống kê tổng quan admin");
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  useEffect(() => {
    const fetchRevenue = async () => {
      if (!dateRange.from || !dateRange.to) return;
      
      try {
        setRevenueLoading(true);
        setRevenueError(null);
        const data = await getAdminRevenue(dateRange.from, dateRange.to);
        setRevenueData(data);
      } catch (err: any) {
        setRevenueError(err?.message || "Không thể tải thống kê doanh thu");
      } finally {
        setRevenueLoading(false);
      }
    };

    fetchRevenue();
  }, [dateRange.from, dateRange.to]);

  // Fetch chart data based on selected range
  useEffect(() => {
    const fetchChartData = async () => {
      if (!dateRange.from || !dateRange.to) return;

      try {
        setChartLoading(true);
        setChartError(null);
        const data = await getAdminDailyRevenue(dateRange.from, dateRange.to);
        setDailyRevenueData(data);
      } catch (err: any) {
        setChartError(err?.message || "Không thể tải dữ liệu biểu đồ");
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();
  }, [dateRange.from, dateRange.to, selectedRange]);

  // Fetch order statistics
  useEffect(() => {
    const fetchOrderStats = async () => {
      if (!dateRange.from || !dateRange.to) return;
      
      try {
        setOrderStatsLoading(true);
        setOrderStatsError(null);
        const data = await getAdminOrderStatistics(dateRange.from, dateRange.to);
        setOrderStats(data);
      } catch (err: any) {
        setOrderStatsError(err?.message || "Không thể tải thống kê đơn hàng");
      } finally {
        setOrderStatsLoading(false);
      }
    };

    fetchOrderStats();
  }, [dateRange.from, dateRange.to]);

  // Fetch user statistics
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setUserStatsLoading(true);
        setUserStatsError(null);
        const data = await getAdminUserStatistics(dateRange.from, dateRange.to);
        setUserStats(data);
      } catch (err: any) {
        setUserStatsError(err?.message || "Không thể tải thống kê người dùng");
      } finally {
        setUserStatsLoading(false);
      }
    };

    fetchUserStats();
  }, [dateRange.from, dateRange.to]);

  // Fetch product statistics
  useEffect(() => {
    const fetchProductStats = async () => {
      try {
        setProductStatsLoading(true);
        setProductStatsError(null);
        const data = await getAdminProductStatistics();
        setProductStats(data);
      } catch (err: any) {
        setProductStatsError(err?.message || "Không thể tải thống kê sản phẩm");
      } finally {
        setProductStatsLoading(false);
      }
    };

    fetchProductStats();
  }, []);

  // Fetch best selling products
  useEffect(() => {
    const fetchBestSelling = async () => {
      if (!dateRange.from || !dateRange.to) return;
      
      try {
        setBestSellingLoading(true);
        setBestSellingError(null);
        const data = await getAdminBestSellingProducts(dateRange.from, dateRange.to, 10);
        setBestSellingProducts(data);
      } catch (err: any) {
        setBestSellingError(err?.message || "Không thể tải top sản phẩm bán chạy");
      } finally {
        setBestSellingLoading(false);
      }
    };

    fetchBestSelling();
  }, [dateRange.from, dateRange.to]);

  // Fetch top vendors
  useEffect(() => {
    const fetchTopVendors = async () => {
      if (!dateRange.from || !dateRange.to) return;
      
      try {
        setTopVendorsLoading(true);
        setTopVendorsError(null);
        const data = await getAdminTopVendors(dateRange.from, dateRange.to, 10);
        setTopVendors(data);
      } catch (err: any) {
        setTopVendorsError(err?.message || "Không thể tải top vendors");
      } finally {
        setTopVendorsLoading(false);
      }
    };

    fetchTopVendors();
  }, [dateRange.from, dateRange.to]);

  // Fetch transaction statistics
  useEffect(() => {
    const fetchTransactionStats = async () => {
      if (!dateRange.from || !dateRange.to) return;
      
      try {
        setTransactionStatsLoading(true);
        setTransactionStatsError(null);
        const data = await getAdminTransactionStatistics(dateRange.from, dateRange.to);
        setTransactionStats(data);
      } catch (err: any) {
        setTransactionStatsError(err?.message || "Không thể tải thống kê giao dịch");
      } finally {
        setTransactionStatsLoading(false);
      }
    };

    fetchTransactionStats();
  }, [dateRange.from, dateRange.to]);

  const handleRangeChange = (range: '7days' | '30days' | 'custom') => {
    setSelectedRange(range);
    if (range === 'custom') {
      // Keep current custom dates if they exist, otherwise use current month
      if (customDateRange.from && customDateRange.to) {
        setDateRange({
          from: customDateRange.from,
          to: customDateRange.to,
        });
      } else {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const newRange = {
          from: firstDay.toISOString().split('T')[0],
          to: lastDay.toISOString().split('T')[0],
        };
        setCustomDateRange(newRange);
        setDateRange(newRange);
      }
    } else {
      const newRange = getDateRange(range);
      setDateRange(newRange);
    }
  };

  const handleCustomDateChange = (field: 'from' | 'to', value: string) => {
    const newCustomRange = { ...customDateRange, [field]: value };
    setCustomDateRange(newCustomRange);
    
    if (selectedRange === 'custom' && newCustomRange.from && newCustomRange.to) {
      setDateRange({
        from: newCustomRange.from,
        to: newCustomRange.to,
      });
    }
  };

  // Generate chart data from API data
  const chartData = useMemo(() => {
    if (dailyRevenueData && dailyRevenueData.dailyRevenues.length > 0) {
      return dailyRevenueData.dailyRevenues.map(item => {
        const date = new Date(item.date);
        return {
          date: date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
          revenue: item.revenue,
          commission: item.commission,
          orders: item.orderCount,
        };
      });
    }

    return [];
  }, [dailyRevenueData]);

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "0 ₫";
    }
    return value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  };

  const formatNumber = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "0";
    }
    return value.toLocaleString("vi-VN");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 flex flex-col ml-64">
        <AdminHeader
          title="Tổng quan hệ thống"
          subtitle="Thống kê toàn hệ thống: doanh thu, đơn hàng, người dùng, sản phẩm và hàng đợi"
        />

        <main className="flex-1 p-4 overflow-y-auto space-y-4">
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4 text-red-600 text-sm">
                {error}
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-600">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Đang tải thống kê...
            </div>
          ) : overview ? (
            <>
              {/* Hàng 1: Doanh thu & Hoa hồng */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Doanh thu tháng này</span>
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(overview.revenue.thisMonth)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Trước: {formatCurrency(overview.revenue.lastMonth)}
                        </p>
                      </div>
                      <div
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          (overview.revenue.growthPercent ?? 0) >= 0
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {(overview.revenue.growthPercent ?? 0) >= 0 ? "+" : ""}
                        {overview.revenue.growthPercent !== undefined && overview.revenue.growthPercent !== null
                          ? overview.revenue.growthPercent.toFixed(1)
                          : "0"}%
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Hoa hồng tháng này</span>
                      <CreditCard className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(overview.commission.thisMonth)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Trước: {formatCurrency(overview.commission.lastMonth)}
                        </p>
                      </div>
                      <div
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          (overview.commission.growthPercent ?? 0) >= 0
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {(overview.commission.growthPercent ?? 0) >= 0 ? "+" : ""}
                        {overview.commission.growthPercent !== undefined && overview.commission.growthPercent !== null
                          ? overview.commission.growthPercent.toFixed(1)
                          : "0"}%
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Đơn hàng tháng này</span>
                      <ShoppingBag className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {formatNumber(overview.orders.thisMonth)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Chờ: {formatNumber(overview.orders.pendingShipment)} | Giao: {formatNumber(overview.orders.inTransit)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Hàng 2: Người dùng & Sản phẩm */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Tổng khách hàng</span>
                      <Users className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {formatNumber(overview.users.totalCustomers)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Mới: {formatNumber(overview.users.newCustomersThisMonth)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Tổng nhà cung cấp</span>
                      <Users className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {formatNumber(overview.users.totalVendors)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Mới: {formatNumber(overview.users.newVendorsThisMonth)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Sản phẩm hoạt động</span>
                      <Package className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {formatNumber(overview.products.totalActive)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Hết: {formatNumber(overview.products.outOfStock)} | Tắt: {formatNumber(overview.products.totalInactive)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Hàng 3: Hàng đợi chờ xử lý */}
              <Card className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-gray-600">Hàng đợi chờ xử lý</span>
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-sm text-gray-600">Hồ sơ nhà cung cấp</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatNumber(overview.pendingQueues.vendorProfiles)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Đăng ký sản phẩm</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatNumber(overview.pendingQueues.productRegistrations)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Yêu cầu cập nhật</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatNumber(overview.pendingQueues.productUpdateRequests)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Yêu cầu hỗ trợ</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatNumber(overview.pendingQueues.supportRequests)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Yêu cầu hoàn tiền</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatNumber(overview.pendingQueues.refundRequests)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Yêu cầu rút tiền</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatNumber(overview.pendingQueues.cashoutRequests)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Chứng chỉ nhà cung cấp</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatNumber(overview.pendingQueues.vendorCertificates)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Chứng chỉ sản phẩm</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatNumber(overview.pendingQueues.productCertificates)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-xs text-gray-600">Tổng chờ xử lý</p>
                    <p className="text-xl font-bold text-orange-600">
                      {formatNumber(overview.pendingQueues.total)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Phần thống kê doanh thu theo thời gian */}
              <Card className="border border-gray-200 bg-gray-900 text-white">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-white mb-1">
                        Doanh thu hệ thống
                      </CardTitle>
                      <p className="text-xs text-gray-400">
                        {selectedRange === '7days' && 'Tổng cho 7 ngày qua'}
                        {selectedRange === '30days' && 'Tổng cho 30 ngày qua'}
                        {selectedRange === 'custom' && 'Tổng cho khoảng thời gian đã chọn'}
                      </p>
                    </div>
                    <div className="flex gap-1 bg-gray-800 p-0.5 rounded">
                      <button
                        onClick={() => handleRangeChange('30days')}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                          selectedRange === '30days'
                            ? 'bg-gray-700 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        30 ngày
                      </button>
                      <button
                        onClick={() => handleRangeChange('7days')}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                          selectedRange === '7days'
                            ? 'bg-gray-700 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        7 ngày
                      </button>
                      <button
                        onClick={() => handleRangeChange('custom')}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                          selectedRange === 'custom'
                            ? 'bg-gray-700 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Tùy chọn
                      </button>
                    </div>
                  </div>
                  
                  {/* Custom Date Range Picker */}
                  {selectedRange === 'custom' && (
                    <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-gray-700">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="custom-from-date" className="text-gray-300 text-sm">
                            Từ ngày
                          </Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              id="custom-from-date"
                              type="date"
                              value={customDateRange.from || dateRange.from}
                              onChange={(e) => handleCustomDateChange('from', e.target.value)}
                              className="pl-10 bg-gray-800 border-gray-700 text-white"
                              max={customDateRange.to || dateRange.to}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="custom-to-date" className="text-gray-300 text-sm">
                            Đến ngày
                          </Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              id="custom-to-date"
                              type="date"
                              value={customDateRange.to || dateRange.to}
                              onChange={(e) => handleCustomDateChange('to', e.target.value)}
                              className="pl-10 bg-gray-800 border-gray-700 text-white"
                              min={customDateRange.from || dateRange.from}
                              max={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  {revenueLoading || chartLoading ? (
                    <div className="flex items-center justify-center py-12 text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      Đang tải thống kê doanh thu...
                    </div>
                  ) : revenueError || chartError ? (
                    <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                      {revenueError || chartError}
                    </div>
                  ) : revenueData ? (
                    <>
                      {/* Chart */}
                      {chartLoading ? (
                        <div className="flex items-center justify-center h-64 text-gray-400">
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Đang tải biểu đồ...
                        </div>
                      ) : chartError ? (
                        <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
                          {chartError}
                        </div>
                      ) : chartData.length > 0 ? (
                        <div className="h-48 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                              <XAxis 
                                dataKey="date" 
                                stroke="#9ca3af"
                                style={{ fontSize: '12px' }}
                              />
                              <YAxis 
                                stroke="#9ca3af"
                                style={{ fontSize: '12px' }}
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#1f2937', 
                                  border: '1px solid #374151',
                                  borderRadius: '8px',
                                  color: '#fff'
                                }}
                                formatter={(value: number) => formatCurrency(value)}
                              />
                              <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                strokeWidth={2}
                                name="Doanh thu"
                              />
                              <Area
                                type="monotone"
                                dataKey="commission"
                                stroke="#f59e0b"
                                fillOpacity={1}
                                fill="url(#colorCommission)"
                                strokeWidth={2}
                                name="Hoa hồng"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-64 text-gray-400">
                          Không có dữ liệu để hiển thị
                        </div>
                      )}

                      {/* Statistics Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Tổng doanh thu</p>
                          <p className="text-lg font-bold text-white">
                            {formatCurrency(
                              dailyRevenueData?.totalRevenue ?? revenueData?.totalRevenue ?? 0
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Hoa hồng</p>
                          <p className="text-lg font-bold text-amber-400">
                            {formatCurrency(
                              dailyRevenueData?.totalCommission ?? revenueData?.totalCommission ?? 0
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Cho vendor</p>
                          <p className="text-lg font-bold text-green-400">
                            {formatCurrency(
                              revenueData?.totalVendorPayout ?? 0
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Đơn hàng</p>
                          <p className="text-lg font-bold text-white">
                            {formatNumber(
                              dailyRevenueData?.totalOrders ?? revenueData?.totalOrders ?? 0
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">TB/đơn</p>
                          <p className="text-lg font-bold text-white">
                            {formatCurrency(
                              revenueData?.averageOrderValue ?? 0
                            )}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>

              {/* Grid 2 cột cho Order Stats & User Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Order Statistics */}
                {orderStatsLoading ? (
                  <Card className="border border-gray-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center py-8 text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Đang tải...
                      </div>
                    </CardContent>
                  </Card>
                ) : orderStatsError ? (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-4 text-red-600 text-xs">
                      {orderStatsError}
                    </CardContent>
                  </Card>
                ) : orderStats ? (
                  <Card className="border border-gray-200">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-700">Thống kê đơn hàng</span>
                        <ShoppingBag className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Tổng: <span className="font-bold text-gray-900">{formatNumber(orderStats.totalOrders)}</span></span>
                          <span className="text-gray-600">Hoàn thành: <span className="font-bold text-green-600">{orderStats.fulfillmentRate.toFixed(1)}%</span></span>
                          <span className="text-gray-600">Hủy: <span className="font-bold text-red-600">{orderStats.cancellationRate.toFixed(1)}%</span></span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1.5 border-t">
                          <span className="text-gray-500">Đã TT: <span className="font-semibold text-gray-900">{formatNumber(orderStats.ordersByStatus.paid)}</span></span>
                          <span className="text-gray-500">Đã giao: <span className="font-semibold text-gray-900">{formatNumber(orderStats.ordersByStatus.delivered)}</span></span>
                          <span className="text-gray-500">Chuyển: <span className="font-semibold text-gray-900">{formatNumber(orderStats.ordersByStatus.shipped)}</span></span>
                          <span className="text-gray-500">Chờ: <span className="font-semibold text-gray-900">{formatNumber(orderStats.ordersByStatus.pending)}</span></span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {/* User Statistics */}
                {userStatsLoading ? (
                  <Card className="border border-gray-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center py-8 text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Đang tải...
                      </div>
                    </CardContent>
                  </Card>
                ) : userStatsError ? (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-4 text-red-600 text-xs">
                      {userStatsError}
                    </CardContent>
                  </Card>
                ) : userStats ? (
                  <Card className="border border-gray-200">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-700">Thống kê người dùng</span>
                        <Users className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">KH: <span className="font-bold text-gray-900">{formatNumber(userStats.customers.total)}</span></span>
                          <span className="text-gray-600">Vendors: <span className="font-bold text-gray-900">{formatNumber(userStats.vendors.total)}</span></span>
                          <span className="text-gray-600">NV: <span className="font-bold text-gray-900">{formatNumber(userStats.staff.total)}</span></span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1.5 border-t">
                          <span className="text-gray-500">KH hoạt động: {formatNumber(userStats.customers.active)}</span>
                          <span className="text-gray-500">Vendors xác thực: {formatNumber(userStats.vendors.verified)}</span>
                          <span className="text-gray-500">NV hoạt động: {formatNumber(userStats.staff.active)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>

              {/* Grid 2 cột cho Product Stats & Transaction Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Product Statistics */}
                {productStatsLoading ? (
                  <Card className="border border-gray-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center py-8 text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Đang tải...
                      </div>
                    </CardContent>
                  </Card>
                ) : productStatsError ? (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-4 text-red-600 text-xs">
                      {productStatsError}
                    </CardContent>
                  </Card>
                ) : productStats ? (
                  <Card className="border border-gray-200">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-700">Thống kê sản phẩm</span>
                        <Package className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Tổng: <span className="font-bold text-gray-900">{formatNumber(productStats.totalProducts)}</span></span>
                          <span className="text-gray-600">Hoạt động: <span className="font-bold text-green-600">{formatNumber(productStats.activeProducts)}</span></span>
                          <span className="text-gray-600">Hết: <span className="font-bold text-red-600">{formatNumber(productStats.outOfStockProducts)}</span></span>
                        </div>
                        {productStats.vendorDistribution && (
                          <div className="flex items-center justify-between text-xs pt-1.5 border-t">
                            <span className="text-gray-500">Vendors có SP: {formatNumber(productStats.vendorDistribution.vendorsWithProducts)}</span>
                            <span className="text-gray-500">TB/vendor: {productStats.vendorDistribution.averageProductsPerVendor.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {/* Transaction Statistics */}
                {transactionStatsLoading ? (
                  <Card className="border border-gray-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center py-8 text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Đang tải...
                      </div>
                    </CardContent>
                  </Card>
                ) : transactionStatsError ? (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-4 text-red-600 text-xs">
                      {transactionStatsError}
                    </CardContent>
                  </Card>
                ) : transactionStats ? (
                  <Card className="border border-gray-200">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-700">Thống kê giao dịch</span>
                        <CreditCard className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Vào: <span className="font-bold text-green-600">{formatCurrency(transactionStats.summary.totalInflow)}</span></span>
                          <span className="text-gray-600">Ra: <span className="font-bold text-red-600">{formatCurrency(transactionStats.summary.totalOutflow)}</span></span>
                          <span className="text-gray-600">Ròng: <span className={`font-bold ${transactionStats.summary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(transactionStats.summary.netFlow)}</span></span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1.5 border-t">
                          <span className="text-gray-500">TT: {formatNumber(transactionStats.byType.paymentIn.count)}</span>
                          <span className="text-gray-500">Nạp: {formatNumber(transactionStats.byType.walletTopup.count)}</span>
                          <span className="text-gray-500">Rút: {formatNumber(transactionStats.byType.walletCashout.count)}</span>
                          <span className="text-gray-500">Hoàn: {formatNumber(transactionStats.byType.refund.count)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>

              {/* Grid 2 cột cho Best Selling Products & Top Vendors */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Best Selling Products */}
                {bestSellingLoading ? (
                  <Card className="border border-gray-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center py-8 text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Đang tải...
                      </div>
                    </CardContent>
                  </Card>
                ) : bestSellingError ? (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-4 text-red-600 text-xs">
                      {bestSellingError}
                    </CardContent>
                  </Card>
                ) : bestSellingProducts && bestSellingProducts.products.length > 0 ? (
                  <Card className="border border-gray-200">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-700">Top 10 SP bán chạy</span>
                        <Package className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b text-xs">
                              <th className="text-left p-1.5">STT</th>
                              <th className="text-left p-1.5">Tên SP</th>
                              <th className="text-right p-1.5">Bán</th>
                              <th className="text-right p-1.5">Doanh thu</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bestSellingProducts.products.slice(0, 5).map((product) => (
                              <tr key={product.productId} className="border-b hover:bg-gray-50">
                                <td className="p-1.5">{product.rank}</td>
                                <td className="p-1.5 font-medium truncate max-w-[150px]" title={product.productName}>{product.productName}</td>
                                <td className="p-1.5 text-right">{formatNumber(product.soldQuantity)}</td>
                                <td className="p-1.5 text-right">{formatCurrency(product.totalRevenue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {/* Top Vendors */}
                {topVendorsLoading ? (
                  <Card className="border border-gray-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center py-8 text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Đang tải...
                      </div>
                    </CardContent>
                  </Card>
                ) : topVendorsError ? (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-4 text-red-600 text-xs">
                      {topVendorsError}
                    </CardContent>
                  </Card>
                ) : topVendors && topVendors.vendors.length > 0 ? (
                  <Card className="border border-gray-200">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-700">Top 10 vendors</span>
                        <Users className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b text-xs">
                              <th className="text-left p-1.5">STT</th>
                              <th className="text-left p-1.5">Công ty</th>
                              <th className="text-right p-1.5">Doanh thu</th>
                              <th className="text-right p-1.5">Đơn</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topVendors.vendors.slice(0, 5).map((vendor) => (
                              <tr key={vendor.vendorId} className="border-b hover:bg-gray-50">
                                <td className="p-1.5">{vendor.rank}</td>
                                <td className="p-1.5 font-medium truncate max-w-[150px]" title={vendor.companyName}>{vendor.companyName}</td>
                                <td className="p-1.5 text-right">{formatCurrency(vendor.grossRevenue)}</td>
                                <td className="p-1.5 text-right">{formatNumber(vendor.orderCount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-20 text-gray-600">
              Không có dữ liệu tổng quan.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

