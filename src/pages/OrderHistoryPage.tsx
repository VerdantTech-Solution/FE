import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { getAllOrders, type OrderWithCustomer } from '@/api/order';
import { ChevronLeft, ChevronRight, Package, Calendar, MapPin, CreditCard, Truck } from 'lucide-react';

const currency = (v: number) => v.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'processing':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'shipped':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'refunded':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusText = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'Chờ xử lý';
    case 'confirmed':
      return 'Đã xác nhận';
    case 'processing':
      return 'Đang xử lý';
    case 'shipped':
      return 'Đã giao hàng';
    case 'delivered':
      return 'Đã giao';
    case 'cancelled':
      return 'Đã hủy';
    case 'refunded':
      return 'Đã hoàn tiền';
    default:
      return status;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatAddress = (address: any) => {
  if (!address) return 'Không có địa chỉ';
  const parts = [
    address.locationAddress,
    address.commune,
    address.district,
    address.province
  ].filter(Boolean);
  return parts.join(', ');
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const loadOrders = async (page: number = 1, status?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getAllOrders(page, pageSize, status);
      
      if (response.status) {
        setOrders(response.data.data);
        setCurrentPage(response.data.currentPage);
        setTotalPages(response.data.totalPages);
        setTotalRecords(response.data.totalRecords);
      } else {
        setError(response.errors?.[0] || 'Không thể tải danh sách đơn hàng');
      }
    } catch (e: any) {
      setError(e?.message || 'Lỗi khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(1, selectedStatus === 'all' ? undefined : selectedStatus);
  }, [selectedStatus]);

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadOrders(page, selectedStatus === 'all' ? undefined : selectedStatus);
  };

  const handlePageSizeChange = (size: string) => {
    setPageSize(parseInt(size));
    setCurrentPage(1);
    loadOrders(1, selectedStatus === 'all' ? undefined : selectedStatus);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 mt-[100px] flex items-center justify-center">
        <div className="text-center">
          <Spinner variant="circle-filled" size={60} className="text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Đang tải...</h3>
          <p className="text-gray-500">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-[100px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Lịch sử đơn hàng</h1>
          <p className="text-gray-600">Quản lý và theo dõi tất cả đơn hàng</p>
        </motion.div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="Pending">Chờ xử lý</SelectItem>
                <SelectItem value="Confirmed">Đã xác nhận</SelectItem>
                <SelectItem value="Processing">Đang xử lý</SelectItem>
                <SelectItem value="Shipped">Đã giao hàng</SelectItem>
                <SelectItem value="Delivered">Đã giao</SelectItem>
                <SelectItem value="Cancelled">Đã hủy</SelectItem>
                <SelectItem value="Refunded">Đã hoàn tiền</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5/trang</SelectItem>
                <SelectItem value="10">10/trang</SelectItem>
                <SelectItem value="20">20/trang</SelectItem>
                <SelectItem value="50">50/trang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-6">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có đơn hàng</h3>
                <p className="text-gray-500">
                  {selectedStatus !== 'all' 
                    ? `Không có đơn hàng nào với trạng thái "${getStatusText(selectedStatus)}"`
                    : 'Chưa có đơn hàng nào được tạo'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <CardTitle className="text-lg">Đơn hàng #{order.id}</CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={`px-3 py-1 ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </Badge>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {currency(order.totalAmount)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.orderDetails.length} sản phẩm
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Customer Info */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Khách hàng</span>
                        </div>
                        <div className="pl-6">
                          <p className="font-medium text-gray-900">{order.customer.fullName}</p>
                          <p className="text-sm text-gray-500">{order.customer.email}</p>
                          <p className="text-sm text-gray-500">{order.customer.phoneNumber}</p>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Địa chỉ giao hàng</span>
                        </div>
                        <div className="pl-6">
                          <p className="text-sm text-gray-900">{formatAddress(order.address)}</p>
                        </div>
                      </div>

                      {/* Payment & Shipping */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Thanh toán & Vận chuyển</span>
                        </div>
                        <div className="pl-6 space-y-1">
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">Phương thức:</span> {order.orderPaymentMethod}
                          </p>
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">Vận chuyển:</span> {order.shippingMethod}
                          </p>
                          {order.trackingNumber && (
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Mã vận đơn:</span> {order.trackingNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Sản phẩm</h4>
                      <div className="space-y-2">
                        {order.orderDetails.map((detail) => (
                          <div key={detail.id} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-3">
                              {detail.product.images && detail.product.images.length > 0 && (
                                <img
                                  src={Array.isArray(detail.product.images) 
                                    ? detail.product.images[0]?.imageUrl || detail.product.images[0]
                                    : detail.product.images
                                  }
                                  alt={detail.product.productName}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                              )}
                              <div>
                                <p className="font-medium text-gray-900">{detail.product.productName}</p>
                                <p className="text-sm text-gray-500">
                                  {currency(detail.unitPrice)} × {detail.quantity}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">
                                {currency(detail.subtotal)}
                              </p>
                              {detail.discountAmount > 0 && (
                                <p className="text-sm text-green-600">
                                  -{currency(detail.discountAmount)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex justify-end">
                        <div className="w-full sm:w-80 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tạm tính:</span>
                            <span>{currency(order.subtotal)}</span>
                          </div>
                          {order.discountAmount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Giảm giá:</span>
                              <span className="text-green-600">-{currency(order.discountAmount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Thuế:</span>
                            <span>{currency(order.taxAmount)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Phí vận chuyển:</span>
                            <span>{currency(order.shippingFee)}</span>
                          </div>
                          <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                            <span>Tổng cộng:</span>
                            <span>{currency(order.totalAmount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Hiển thị {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalRecords)} 
              trong tổng số {totalRecords} đơn hàng
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}