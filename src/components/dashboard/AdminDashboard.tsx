import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  DollarSign, 
  Package, 
  ShoppingCart,
  AlertCircle,
  TrendingUp,
  Loader2,
  Calendar
} from 'lucide-react';
import {
  getRevenue,
  getOrderStatistics,
  getBestSellingProducts,
  getQueueStatistics,
  getRevenueLast7Days,
  type RevenueData,
  type OrderStatistics,
  type BestSellingProduct,
  type QueueStatistics,
  type RevenueLast7DaysData
} from '@/api/dashboard';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line
} from 'recharts';

interface AdminDashboardProps {
  selectedPeriod?: string;
  setSelectedPeriod?: (period: string) => void;
}

export const AdminDashboard = ({ selectedPeriod = 'month', setSelectedPeriod }: AdminDashboardProps) => {
  // Revenue states
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [revenueLast7Days, setRevenueLast7Days] = useState<RevenueLast7DaysData[]>([]);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  // Order statistics states
  const [orderStats, setOrderStats] = useState<OrderStatistics | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Best selling products states
  const [bestSellingProducts, setBestSellingProducts] = useState<BestSellingProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Queue statistics states
  const [queueStats, setQueueStats] = useState<QueueStatistics | null>(null);
  const [isLoadingQueues, setIsLoadingQueues] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);

  // Date range for custom period
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  
  const [customDateFrom, setCustomDateFrom] = useState<string>(formatDate(startOfMonth));
  const [customDateTo, setCustomDateTo] = useState<string>(formatDate(today));

  // Calculate date range based on selected period
  const getDateRange = (period: string): { from: string; to: string } => {
    const today = new Date();
    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    let from: Date;
    let to: Date = new Date(today);

    switch (period) {
      case 'day':
        from = new Date(today);
        to = new Date(today);
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        from = weekStart;
        to = new Date(today);
        break;
      case 'month':
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        to = new Date(today);
        break;
      case 'year':
        from = new Date(today.getFullYear(), 0, 1);
        to = new Date(today);
        break;
      case 'custom':
        from = new Date(customDateFrom);
        to = new Date(customDateTo);
        break;
      default:
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        to = new Date(today);
    }

    return {
      from: formatDate(from),
      to: formatDate(to),
    };
  };

  // Fetch revenue data
  const fetchRevenue = async () => {
    setIsLoadingRevenue(true);
    setRevenueError(null);
    try {
      const dateRange = getDateRange(selectedPeriod);
      const response = await getRevenue({ from: dateRange.from, to: dateRange.to });
      if (response.status && response.data) {
        setRevenueData(response.data);
      } else {
        setRevenueError('Không thể tải dữ liệu doanh thu');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.errors?.join(", ") || err?.message || "Có lỗi xảy ra khi tải doanh thu";
      setRevenueError(errorMessage);
      setRevenueData(null);
    } finally {
      setIsLoadingRevenue(false);
    }
  };

  // Fetch revenue last 7 days
  const fetchRevenueLast7Days = async () => {
    try {
      const response = await getRevenueLast7Days();
      if (response.status && response.data) {
        setRevenueLast7Days(response.data);
      }
    } catch (err) {
      console.error("Error fetching revenue last 7 days:", err);
    }
  };

  // Fetch order statistics
  const fetchOrderStatistics = async () => {
    setIsLoadingOrders(true);
    setOrderError(null);
    try {
      const dateRange = getDateRange(selectedPeriod);
      const response = await getOrderStatistics({ from: dateRange.from, to: dateRange.to });
      if (response.status && response.data) {
        setOrderStats(response.data);
      } else {
        setOrderError('Không thể tải thống kê đơn hàng');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.errors?.join(", ") || err?.message || "Có lỗi xảy ra khi tải thống kê đơn hàng";
      setOrderError(errorMessage);
      setOrderStats(null);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Fetch best selling products
  const fetchBestSellingProducts = async () => {
    setIsLoadingProducts(true);
    setProductsError(null);
    try {
      const dateRange = getDateRange(selectedPeriod);
      const response = await getBestSellingProducts({ from: dateRange.from, to: dateRange.to });
      if (response.status && response.data) {
        setBestSellingProducts(response.data);
      } else {
        setProductsError('Không thể tải sản phẩm bán chạy');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.errors?.join(", ") || err?.message || "Có lỗi xảy ra khi tải sản phẩm bán chạy";
      setProductsError(errorMessage);
      setBestSellingProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Fetch queue statistics
  const fetchQueueStatistics = async () => {
    setIsLoadingQueues(true);
    setQueueError(null);
    try {
      const response = await getQueueStatistics();
      if (response.status && response.data) {
        setQueueStats(response.data);
      } else {
        setQueueError('Không thể tải thống kê hàng đợi');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.errors?.join(", ") || err?.message || "Có lỗi xảy ra khi tải thống kê hàng đợi";
      setQueueError(errorMessage);
      setQueueStats(null);
    } finally {
      setIsLoadingQueues(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
    fetchRevenueLast7Days();
    fetchOrderStatistics();
    fetchBestSellingProducts();
    fetchQueueStatistics();
  }, [selectedPeriod, customDateFrom, customDateTo]);

  const formatRevenue = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Prepare order statistics chart data
  const orderChartData = orderStats ? [
    { name: 'Đã thanh toán', value: orderStats.paid || 0 },
    { name: 'Đã giao hàng', value: orderStats.shipped || 0 },
    { name: 'Đã hoàn thành', value: orderStats.delivered || 0 },
    { name: 'Đã hủy', value: orderStats.cancelled || 0 },
    { name: 'Đã hoàn tiền', value: orderStats.refunded || 0 },
  ] : [];

  const totalQueueRequests = queueStats ? 
    (queueStats.vendorProfile || 0) +
    (queueStats.productRegistration || 0) +
    (queueStats.vendorCertificate || 0) +
    (queueStats.productCertificate || 0) +
    (queueStats.request || 0) : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoadingRevenue ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : revenueError ? (
              <p className="text-sm text-red-600">{revenueError}</p>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900">
                  {revenueData?.revenue ? formatRevenue(revenueData.revenue) : '0₫'}
                </div>
                <p className="text-xs text-gray-500 mt-1">Khoảng thời gian đã chọn</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tổng đơn hàng</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : orderError ? (
              <p className="text-sm text-red-600">{orderError}</p>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900">
                  {orderStats?.total || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Tất cả trạng thái</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Yêu cầu chờ xử lý</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {isLoadingQueues ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : queueError ? (
              <p className="text-sm text-red-600">{queueError}</p>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900">
                  {totalQueueRequests}
                </div>
                <p className="text-xs text-gray-500 mt-1">Cần xử lý ngay</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Best Selling Products Count */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Top sản phẩm</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {isLoadingProducts ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : productsError ? (
              <p className="text-sm text-red-600">{productsError}</p>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900">
                  {Array.isArray(bestSellingProducts) ? bestSellingProducts.length : 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Top 5 bán chạy</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Period Selector */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">Chọn khoảng thời gian</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={selectedPeriod === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod?.('day')}
              >
                Hôm nay
              </Button>
              <Button
                variant={selectedPeriod === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod?.('week')}
              >
                Tuần này
              </Button>
              <Button
                variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod?.('month')}
              >
                Tháng này
              </Button>
              <Button
                variant={selectedPeriod === 'year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod?.('year')}
              >
                Năm nay
              </Button>
              <Button
                variant={selectedPeriod === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod?.('custom')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Tùy chọn
              </Button>
            </div>
          </div>
          {selectedPeriod === 'custom' && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label htmlFor="date-from" className="text-sm font-medium text-gray-700 mb-2 block">
                  Từ ngày
                </Label>
                <Input
                  id="date-from"
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  max={customDateTo || undefined}
                />
              </div>
              <div>
                <Label htmlFor="date-to" className="text-sm font-medium text-gray-700 mb-2 block">
                  Đến ngày
                </Label>
                <Input
                  id="date-to"
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  min={customDateFrom || undefined}
                />
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Revenue Last 7 Days Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Doanh thu 7 ngày gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={revenueLast7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getDate()}/${date.getMonth() + 1}`;
                }}
              />
              <YAxis 
                stroke="#6b7280"
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toString();
                }}
              />
              <Tooltip 
                formatter={(value: number) => [formatRevenue(value), 'Doanh thu']}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString('vi-VN');
                }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Statistics Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Thống kê đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : orderError ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-sm text-red-600">{orderError}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={orderChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Best Selling Products */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Top 5 sản phẩm bán chạy</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingProducts ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : productsError ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-sm text-red-600">{productsError}</p>
              </div>
            ) : !Array.isArray(bestSellingProducts) || bestSellingProducts.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-sm text-gray-500">Không có dữ liệu</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bestSellingProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.productName || `Sản phẩm ${index + 1}`}</p>
                        <p className="text-sm text-gray-500">Đã bán: {product.totalSold || 0}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {product.revenue ? formatRevenue(product.revenue) : '0₫'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Queue Statistics */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Thống kê yêu cầu chờ xử lý</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingQueues ? (
            <div className="flex items-center justify-center h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : queueError ? (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-sm text-red-600">{queueError}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Vendor Profile</p>
                <p className="text-2xl font-bold text-blue-600">{queueStats?.vendorProfile || 0}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Đăng ký sản phẩm</p>
                <p className="text-2xl font-bold text-green-600">{queueStats?.productRegistration || 0}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Chứng chỉ Vendor</p>
                <p className="text-2xl font-bold text-yellow-600">{queueStats?.vendorCertificate || 0}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Chứng chỉ sản phẩm</p>
                <p className="text-2xl font-bold text-purple-600">{queueStats?.productCertificate || 0}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Yêu cầu khác</p>
                <p className="text-2xl font-bold text-red-600">{queueStats?.request || 0}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
