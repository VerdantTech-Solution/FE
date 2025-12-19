import React, { useEffect, useState } from 'react';
import VendorSidebar from './VendorSidebar';
import VendorHeader from './VendorHeader';
import { getVendorOrderStatistics, type OrderStatistics } from '@/api/vendordashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingCart, Calendar, TrendingUp, AlertCircle, CheckCircle, XCircle, Package } from 'lucide-react';

const OrderManagementPage: React.FC = () => {
  const [orderStats, setOrderStats] = useState<OrderStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Calculate date range for last 30 days
  const getDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      from: formatDate(thirtyDaysAgo),
      to: formatDate(today),
    };
  };

  const fetchOrderStatistics = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      const { from, to } = getDateRange();
      const stats = await getVendorOrderStatistics(from, to);
      setOrderStats(stats);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.errors?.join(', ') ||
        err?.message ||
        'Có lỗi xảy ra khi tải thống kê đơn hàng';
      setStatsError(errorMessage);
      console.error('Error fetching order statistics:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderStatistics();
  }, []);

  const formatPercentage = (value: number) => {
    if (value === null || value === undefined || isNaN(value)) return '0%';
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number) => {
    if (value === null || value === undefined || isNaN(value)) return '0';
    return value.toLocaleString('vi-VN');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'cancelled':
      case 'refunded':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      paid: 'Đã thanh toán',
      shipped: 'Đã giao hàng',
      delivered: 'Đã hoàn thành',
      cancelled: 'Đã hủy',
      refunded: 'Đã hoàn tiền',
      partialRefund: 'Hoàn tiền một phần',
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
      case 'refunded':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <VendorSidebar />

      <main className="flex-1 flex flex-col overflow-y-auto ml-64">
        <VendorHeader
          title="Quản lý đơn hàng"
          subtitle="Thống kê và quản lý đơn hàng của bạn"
          showNotification={false}
        />

        <div className="space-y-6 p-6">
          {/* Time Range Info */}
          <Card className="border border-gray-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-medium text-gray-700">
                  Thống kê đơn hàng trong 30 ngày gần nhất
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {statsError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-600">{statsError}</p>
              </CardContent>
            </Card>
          )}

          {/* Statistics Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tổng đơn hàng */}
            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-600">
                  <span>Tổng đơn hàng</span>
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(orderStats?.totalOrders ?? 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Tổng số đơn hàng trong khoảng thời gian
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Tỷ lệ hoàn thành */}
            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-600">
                  <span>Tỷ lệ hoàn thành</span>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPercentage(orderStats?.fulfillmentRate ?? 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Tỷ lệ đơn hàng đã giao thành công
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Tỷ lệ hủy */}
            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-600">
                  <span>Tỷ lệ hủy</span>
                  <XCircle className="w-5 h-5 text-red-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPercentage(orderStats?.cancellationRate ?? 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Tỷ lệ đơn hàng bị hủy
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Tỷ lệ hoàn tiền */}
            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-600">
                  <span>Tỷ lệ hoàn tiền</span>
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPercentage(orderStats?.refundRate ?? 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Tỷ lệ đơn hàng được hoàn tiền
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Average Delivery Days */}
          {orderStats && orderStats.averageDeliveryDays > 0 && (
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gray-600" />
                  Thời gian giao hàng trung bình
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(orderStats.averageDeliveryDays)} ngày
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Thời gian trung bình từ khi đặt hàng đến khi giao hàng thành công
                </p>
              </CardContent>
            </Card>
          )}

          {/* Orders by Status */}
          {orderStats && orderStats.ordersByStatus && (
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-600" />
                  Phân bố đơn hàng theo trạng thái
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(orderStats.ordersByStatus).map(([status, count]) => (
                    <div
                      key={status}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span className="text-sm font-medium text-gray-700">
                          {getStatusLabel(status)}
                        </span>
                      </div>
                      <Badge variant={getStatusBadgeVariant(status)}>
                        {formatNumber(count)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrderManagementPage;
