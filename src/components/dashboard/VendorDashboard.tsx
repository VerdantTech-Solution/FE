import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  DollarSign, 
  TrendingUp,
  Loader2,
  Calendar
} from 'lucide-react';
import {
  getRevenue,
  getBestSellingProducts,
  getRevenueLast7Days,
  type RevenueData,
  type BestSellingProduct,
  type RevenueLast7DaysData
} from '@/api/dashboard';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export const VendorDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  
  // Revenue states
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [revenueLast7Days, setRevenueLast7Days] = useState<RevenueLast7DaysData[]>([]);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  // Best selling products states
  const [bestSellingProducts, setBestSellingProducts] = useState<BestSellingProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchRevenue();
    fetchRevenueLast7Days();
    fetchBestSellingProducts();
  }, [selectedPeriod, customDateFrom, customDateTo]);

  const formatRevenue = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <p className="text-xs text-gray-500 mt-1">Top 5 bán chạy của bạn</p>
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
                onClick={() => setSelectedPeriod('day')}
              >
                Hôm nay
              </Button>
              <Button
                variant={selectedPeriod === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('week')}
              >
                Tuần này
              </Button>
              <Button
                variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('month')}
              >
                Tháng này
              </Button>
              <Button
                variant={selectedPeriod === 'year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('year')}
              >
                Năm nay
              </Button>
              <Button
                variant={selectedPeriod === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('custom')}
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

      {/* Best Selling Products */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Top 5 sản phẩm bán chạy của bạn</CardTitle>
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
  );
};
