import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { VendorHeader } from "./VendorHeader";
import VendorSidebar from "./VendorSidebar";
import {
  getVendorDashboardOverview,
  getVendorRevenue,
  getVendorDailyRevenue,
  type VendorDashboardOverview,
  type VendorRevenueData,
  type DailyRevenueData,
} from "@/api/vendordashboard";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Star,
  Package,
  CreditCard,
  ShoppingBag,
  Calendar,
  CheckCircle2,
  XCircle,
  Crown,
  X,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const VendorDashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<VendorDashboardOverview | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment notification state
  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "cancelled" | null
  >(null);
  const [paymentAmount, setPaymentAmount] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);

  // Revenue statistics state
  const [revenueData, setRevenueData] = useState<VendorRevenueData | null>(
    null
  );
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<
    "7days" | "30days" | "custom"
  >("7days");

  // Chart data state
  const [dailyRevenueData, setDailyRevenueData] =
    useState<DailyRevenueData | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  // Date range state - default to last 7 days
  const getDateRange = (range: "7days" | "30days") => {
    const now = new Date();
    let from: Date,
      to: Date = new Date(now);

    switch (range) {
      case "7days":
        from = new Date(now);
        from.setDate(now.getDate() - 7);
        break;
      case "30days":
        from = new Date(now);
        from.setDate(now.getDate() - 30);
        break;
    }

    return {
      from: from.toISOString().split("T")[0],
      to: to.toISOString().split("T")[0],
    };
  };

  const [dateRange, setDateRange] = useState(getDateRange("7days"));
  const [customDateRange, setCustomDateRange] = useState({ from: "", to: "" });

  // Check for payment status in URL params
  useEffect(() => {
    const payment = searchParams.get("payment");
    const amount = searchParams.get("amount");
    const code =
      searchParams.get("orderCode") || searchParams.get("order_code");

    if (payment === "success") {
      setPaymentStatus("success");
      setPaymentAmount(amount);
      setOrderCode(code);
      // Clear the URL params after reading
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("payment");
      newParams.delete("amount");
      newParams.delete("orderCode");
      newParams.delete("order_code");
      newParams.delete("description");
      newParams.delete("id");
      newParams.delete("cancel");
      newParams.delete("status");
      setSearchParams(newParams, { replace: true });
    } else if (payment === "cancelled") {
      setPaymentStatus("cancelled");
      setOrderCode(code);
      // Clear the URL params after reading
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("payment");
      newParams.delete("orderCode");
      newParams.delete("order_code");
      newParams.delete("description");
      newParams.delete("id");
      newParams.delete("cancel");
      newParams.delete("status");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const dismissPaymentNotification = () => {
    setPaymentStatus(null);
    setPaymentAmount(null);
    setOrderCode(null);
  };

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getVendorDashboardOverview();
        setOverview(data);
      } catch (err: any) {
        setError(err?.message || "Không thể tải thống kê tổng quan vendor");
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
        const data = await getVendorRevenue(dateRange.from, dateRange.to);
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
        // Use daily data for both 7 days and 30 days
        const data = await getVendorDailyRevenue(dateRange.from, dateRange.to);
        setDailyRevenueData(data);
      } catch (err: any) {
        setChartError(err?.message || "Không thể tải dữ liệu biểu đồ");
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();
  }, [dateRange.from, dateRange.to, selectedRange]);

  const handleRangeChange = (range: "7days" | "30days" | "custom") => {
    setSelectedRange(range);
    if (range === "custom") {
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
          from: firstDay.toISOString().split("T")[0],
          to: lastDay.toISOString().split("T")[0],
        };
        setCustomDateRange(newRange);
        setDateRange(newRange);
      }
    } else {
      const newRange = getDateRange(range);
      setDateRange(newRange);
    }
  };

  const handleCustomDateChange = (field: "from" | "to", value: string) => {
    const newCustomRange = { ...customDateRange, [field]: value };
    setCustomDateRange(newCustomRange);

    if (
      selectedRange === "custom" &&
      newCustomRange.from &&
      newCustomRange.to
    ) {
      setDateRange({
        from: newCustomRange.from,
        to: newCustomRange.to,
      });
    }
  };

  // Generate chart data from API data
  const chartData = useMemo(() => {
    if (dailyRevenueData && dailyRevenueData.dailyRevenues.length > 0) {
      // Format daily data for chart
      return dailyRevenueData.dailyRevenues.map((item) => {
        const date = new Date(item.date);
        // Calculate commission from gross and net
        const commission = item.grossRevenue - item.netRevenue;
        return {
          date: date.toLocaleDateString("vi-VN", {
            month: "short",
            day: "numeric",
          }),
          gross: item.grossRevenue,
          net: item.netRevenue,
          commission: commission,
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
    return value.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
  };

  const formatNumber = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "0";
    }
    return value.toLocaleString("vi-VN");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <VendorSidebar />

      <div className="flex-1 flex flex-col ml-64">
        <VendorHeader
          title="Tổng quan nhà cung cấp"
          subtitle="Thống kê nhanh về ví, doanh thu, đơn hàng và đánh giá"
        />

        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Payment Success Notification */}
          {paymentStatus === "success" && (
            <Card className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-800 mb-1">
                        Đăng ký gói duy trì thành công!
                      </h3>
                      <p className="text-green-700 mb-2">
                        Cảm ơn bạn! Subscription của bạn đã được kích hoạt thành
                        công.
                      </p>
                      {orderCode && (
                        <p className="text-sm text-green-600">
                          Mã giao dịch:{" "}
                          <span className="font-semibold">#{orderCode}</span>
                        </p>
                      )}
                      {paymentAmount && (
                        <p className="text-lg font-bold text-green-800 mt-2">
                          {parseInt(paymentAmount).toLocaleString("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          })}
                        </p>
                      )}
                      <div className="flex gap-3 mt-4">
                        <Button
                          size="sm"
                          onClick={() => navigate("/vendor/subscription")}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Crown className="w-4 h-4 mr-2" />
                          Xem gói của tôi
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={dismissPaymentNotification}
                          className="border-green-300 text-green-700 hover:bg-green-100"
                        >
                          Đóng
                        </Button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={dismissPaymentNotification}
                    className="text-green-600 hover:text-green-800 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Cancelled Notification */}
          {paymentStatus === "cancelled" && (
            <Card className="border-2 border-red-300 bg-gradient-to-r from-red-50 to-orange-50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                      <XCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-red-800 mb-1">
                        Thanh toán đã bị hủy
                      </h3>
                      <p className="text-red-700 mb-2">
                        Bạn đã hủy quá trình thanh toán subscription. Gói chưa
                        được kích hoạt.
                      </p>
                      {orderCode && (
                        <p className="text-sm text-red-600">
                          Mã giao dịch:{" "}
                          <span className="font-semibold">{orderCode}</span>
                        </p>
                      )}
                      <div className="flex gap-3 mt-4">
                        <Button
                          size="sm"
                          onClick={() => navigate("/vendor/subscription")}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Thử lại đăng ký
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={dismissPaymentNotification}
                          className="border-red-300 text-red-700 hover:bg-red-100"
                        >
                          Đóng
                        </Button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={dismissPaymentNotification}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

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
              {/* Hàng 1: Ví & Doanh thu */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-600">
                      <span>Số dư ví</span>
                      <CreditCard className="w-5 h-5 text-green-600" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(overview.walletBalance)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Số dư khả dụng hiện tại trong ví của bạn
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-600">
                      <span>Yêu cầu rút tiền đang chờ</span>
                      <ShoppingBag className="w-5 h-5 text-amber-600" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(overview.pendingCashout)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Tổng số tiền đang chờ xử lý rút về
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-600">
                      <span>Đánh giá trung bình</span>
                      <Star className="w-5 h-5 text-yellow-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {overview.averageRating !== undefined &&
                          overview.averageRating !== null
                            ? overview.averageRating.toFixed(2)
                            : "0.00"}{" "}
                          / 5
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatNumber(overview.totalReviews)} lượt đánh giá
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Hàng 2: Doanh thu & Đơn hàng */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-600">
                      <span>Doanh thu tháng này</span>
                      {(overview.revenueGrowthPercent ?? 0) >= 0 ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(overview.totalRevenueThisMonth)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Tháng trước:{" "}
                          {formatCurrency(overview.totalRevenueLastMonth)}
                        </p>
                      </div>
                      <div
                        className={`text-sm font-semibold px-3 py-1 rounded-full ${
                          (overview.revenueGrowthPercent ?? 0) >= 0
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {(overview.revenueGrowthPercent ?? 0) >= 0 ? "+" : ""}
                        {overview.revenueGrowthPercent !== undefined &&
                        overview.revenueGrowthPercent !== null
                          ? overview.revenueGrowthPercent.toFixed(2)
                          : "0.00"}
                        %
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-600">
                      <span>Đơn hàng tháng này</span>
                      {(overview.orderGrowthPercent ?? 0) >= 0 ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatNumber(overview.totalOrdersThisMonth)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Tháng trước:{" "}
                          {formatNumber(overview.totalOrdersLastMonth)} đơn
                        </p>
                      </div>
                      <div
                        className={`text-sm font-semibold px-3 py-1 rounded-full ${
                          (overview.orderGrowthPercent ?? 0) >= 0
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {(overview.orderGrowthPercent ?? 0) >= 0 ? "+" : ""}
                        {overview.orderGrowthPercent !== undefined &&
                        overview.orderGrowthPercent !== null
                          ? overview.orderGrowthPercent.toFixed(2)
                          : "0.00"}
                        %
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Hàng 3: Sản phẩm & yêu cầu */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-600">
                      <span>Sản phẩm đang hoạt động</span>
                      <Package className="w-5 h-5 text-green-600" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(overview.totalProductsActive)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Số sản phẩm hiện có thể bán
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-600">
                      <span>Sản phẩm hết hàng</span>
                      <Package className="w-5 h-5 text-red-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(overview.totalProductsOutOfStock)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Cần bổ sung tồn kho cho các sản phẩm này
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-600">
                      <span>Yêu cầu chờ xử lý</span>
                      <ShoppingBag className="w-5 h-5 text-blue-600" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          Đơn đăng ký sản phẩm
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatNumber(overview.pendingProductRegistrations)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Yêu cầu cập nhật
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatNumber(overview.pendingProductUpdateRequests)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Phần thống kê doanh thu theo thời gian */}
              <Card className="border border-gray-200 bg-gray-900 text-white">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-white mb-1">
                        Tổng doanh thu
                      </CardTitle>
                      <p className="text-sm text-gray-400">
                        {selectedRange === "7days" && "Tổng cho 7 ngày qua"}
                        {selectedRange === "30days" && "Tổng cho 30 ngày qua"}
                        {selectedRange === "custom" &&
                          "Tổng cho khoảng thời gian đã chọn"}
                      </p>
                    </div>
                    <div className="flex gap-1 bg-gray-800 p-1 rounded-lg">
                      <button
                        onClick={() => handleRangeChange("30days")}
                        className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                          selectedRange === "30days"
                            ? "bg-gray-700 text-white"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        30 ngày
                      </button>
                      <button
                        onClick={() => handleRangeChange("7days")}
                        className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                          selectedRange === "7days"
                            ? "bg-gray-700 text-white"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        7 ngày
                      </button>
                      <button
                        onClick={() => handleRangeChange("custom")}
                        className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                          selectedRange === "custom"
                            ? "bg-gray-700 text-white"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Tùy chọn
                      </button>
                    </div>
                  </div>

                  {/* Custom Date Range Picker */}
                  {selectedRange === "custom" && (
                    <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-gray-700">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="custom-from-date"
                            className="text-gray-300 text-sm"
                          >
                            Từ ngày
                          </Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              id="custom-from-date"
                              type="date"
                              value={customDateRange.from || dateRange.from}
                              onChange={(e) =>
                                handleCustomDateChange("from", e.target.value)
                              }
                              className="pl-10 bg-gray-800 border-gray-700 text-white"
                              max={customDateRange.to || dateRange.to}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="custom-to-date"
                            className="text-gray-300 text-sm"
                          >
                            Đến ngày
                          </Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              id="custom-to-date"
                              type="date"
                              value={customDateRange.to || dateRange.to}
                              onChange={(e) =>
                                handleCustomDateChange("to", e.target.value)
                              }
                              className="pl-10 bg-gray-800 border-gray-700 text-white"
                              min={customDateRange.from || dateRange.from}
                              max={new Date().toISOString().split("T")[0]}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
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
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={chartData}
                              margin={{
                                top: 10,
                                right: 10,
                                left: 0,
                                bottom: 0,
                              }}
                            >
                              <defs>
                                <linearGradient
                                  id="colorGross"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="#3b82f6"
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="#3b82f6"
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                                <linearGradient
                                  id="colorNet"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="#10b981"
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="#10b981"
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                              </defs>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#374151"
                              />
                              <XAxis
                                dataKey="date"
                                stroke="#9ca3af"
                                style={{ fontSize: "12px" }}
                              />
                              <YAxis
                                stroke="#9ca3af"
                                style={{ fontSize: "12px" }}
                                tickFormatter={(value) =>
                                  `${(value / 1000).toFixed(0)}k`
                                }
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#1f2937",
                                  border: "1px solid #374151",
                                  borderRadius: "8px",
                                  color: "#fff",
                                }}
                                formatter={(value: number) =>
                                  formatCurrency(value)
                                }
                              />
                              <Area
                                type="monotone"
                                dataKey="gross"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorGross)"
                                strokeWidth={2}
                              />
                              <Area
                                type="monotone"
                                dataKey="net"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorNet)"
                                strokeWidth={2}
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
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">
                            Tổng doanh thu
                          </p>
                          <p className="text-xl font-bold text-white">
                            {formatCurrency(
                              dailyRevenueData?.totalGrossRevenue ??
                                revenueData?.totalGrossRevenue ??
                                0
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Hoa hồng</p>
                          <p className="text-xl font-bold text-amber-400">
                            {formatCurrency(
                              dailyRevenueData
                                ? dailyRevenueData.totalGrossRevenue -
                                    dailyRevenueData.totalNetRevenue
                                : revenueData?.totalCommission ?? 0
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">
                            Doanh thu thực
                          </p>
                          <p className="text-xl font-bold text-green-400">
                            {formatCurrency(
                              dailyRevenueData?.totalNetRevenue ??
                                revenueData?.totalNetRevenue ??
                                0
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">
                            Tổng đơn hàng
                          </p>
                          <p className="text-xl font-bold text-white">
                            {formatNumber(
                              dailyRevenueData?.totalOrders ??
                                revenueData?.totalOrders ??
                                0
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">
                            Giá trị TB/đơn
                          </p>
                          <p className="text-xl font-bold text-white">
                            {formatCurrency(
                              dailyRevenueData &&
                                dailyRevenueData.totalOrders > 0
                                ? dailyRevenueData.totalGrossRevenue /
                                    dailyRevenueData.totalOrders
                                : revenueData?.averageOrderValue ?? 0
                            )}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
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

export default VendorDashboardPage;
