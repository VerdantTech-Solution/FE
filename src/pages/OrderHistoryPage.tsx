import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog';
import { getMyOrders, updateOrder, type OrderEntity, type UpdateOrderRequest } from '@/api/order';
import { 
  Package, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Truck, 
  ArrowLeft,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Box,
  Package2
} from 'lucide-react';

const currency = (v: number) => v.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'Confirmed':
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    case 'Shipped':
      return <Truck className="h-4 w-4 text-purple-500" />;
    case 'Delivered':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'Cancelled':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'Pending':
      return 'Đang duyệt';
    case 'Confirmed':
      return 'Đã xác nhận';
    case 'Shipped':
      return 'Đang giao';
    case 'Delivered':
      return 'Đã giao';
    case 'Cancelled':
      return 'Đã hủy';
    default:
      return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Confirmed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Shipped':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Delivered':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Tab configuration
const ORDER_TABS = [
  { id: 'pending', label: 'Đang chờ duyệt', status: 'Pending', icon: Clock },
  { id: 'confirmed', label: 'Đã duyệt', status: 'Confirmed', icon: CheckCircle },
  { id: 'packaging', label: 'Đang đóng gói', status: 'Packaging', icon: Box },
  { id: 'shipped', label: 'Đang giao', status: 'Shipped', icon: Truck },
  { id: 'cancelled', label: 'Đã hủy', status: 'Cancelled', icon: XCircle },
  { id: 'all', label: 'Đơn đã đặt', status: 'all', icon: Package2 },
];

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [cancelledReason, setCancelledReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getMyOrders();
        if (!response.status) {
          setError(response.errors?.[0] || 'Không thể tải lịch sử đơn hàng');
          return;
        }
        setOrders(response.data || []);
      } catch (e: any) {
        setError(e?.message || 'Không thể tải lịch sử đơn hàng');
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  const canCancelOrder = (order: OrderEntity) => {
    return order.status === 'Pending' || order.status === 'Confirmed';
  };

  const handleCancelOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setCancelledReason('');
    setCancelDialogOpen(true);
  };

  const confirmCancelOrder = async () => {
    if (!selectedOrderId || !cancelledReason.trim()) return;

    try {
      setCancelling(true);
      const payload: UpdateOrderRequest = {
        cancelledReason: cancelledReason.trim()
      };
      
      const response = await updateOrder(selectedOrderId, payload);
      if (!response.status) {
        setError(response.errors?.[0] || 'Không thể hủy đơn hàng');
        return;
      }

      // Refresh orders list
      const ordersResponse = await getMyOrders();
      if (ordersResponse.status) {
        setOrders(ordersResponse.data || []);
      }

      setCancelDialogOpen(false);
      setSelectedOrderId(null);
      setCancelledReason('');
    } catch (e: any) {
      setError(e?.message || 'Không thể hủy đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  // Filter orders based on active tab
  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') {
      return orders;
    }
    const activeTabConfig = ORDER_TABS.find(tab => tab.id === activeTab);
    if (!activeTabConfig) return orders;
    
    return orders.filter(order => order.status === activeTabConfig.status);
  }, [orders, activeTab]);

  // Get order counts for each tab
  const getOrderCount = (tabId: string) => {
    if (tabId === 'all') return orders.length;
    const tabConfig = ORDER_TABS.find(tab => tab.id === tabId);
    if (!tabConfig) return 0;
    return orders.filter(order => order.status === tabConfig.status).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 mt-[100px] flex items-center justify-center">
        <div className="text-center">
          <Spinner variant="circle-filled" size={60} className="text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Đang tải lịch sử đơn hàng...</h3>
          <p className="text-gray-500">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 mt-[100px] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-600 mb-2">Lỗi tải dữ liệu</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-green-600 hover:bg-green-700">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50 mt-[100px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-gray-100 rounded-full"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900">Lịch sử đơn hàng</h1>
              <p className="text-gray-600 mt-2">Theo dõi tất cả đơn hàng của bạn</p>
            </div>
          </div>
        </motion.div>

        {/* Order Status Tabs */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex flex-wrap gap-2 bg-green-50 p-2 rounded-xl">
            {ORDER_TABS.map((tab) => {
              const Icon = tab.icon;
              const count = getOrderCount(tab.id);
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200
                    ${isActive 
                      ? 'bg-white text-gray-900 shadow-sm border border-green-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span className={`
                      px-2 py-0.5 rounded-full text-xs font-semibold
                      ${isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {filteredOrders.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {activeTab === 'all' ? 'Chưa có đơn hàng nào' : 'Không có đơn hàng nào'}
            </h3>
            <p className="text-gray-600 mb-8">
              {activeTab === 'all' 
                ? 'Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay!' 
                : `Không có đơn hàng nào ở trạng thái "${ORDER_TABS.find(tab => tab.id === activeTab)?.label}"`
              }
            </p>
            {activeTab === 'all' && (
              <Button 
                onClick={() => navigate('/marketplace')}
                className="bg-green-600 hover:bg-green-700 px-8 py-3"
              >
                Mua sắm ngay
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <Package className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-gray-900">
                            Đơn hàng #{order.id}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {formatDate(order.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`px-3 py-1 ${getStatusColor(order.status)}`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            <span className="font-medium">{getStatusText(order.status)}</span>
                          </div>
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Chi tiết
                        </Button>
                        {canCancelOrder(order) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            <X className="h-4 w-4" />
                            Hủy đơn
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Order Info */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-green-600" />
                            Thông tin thanh toán
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Phương thức:</span>
                              <span className="font-medium">{order.orderPaymentMethod}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Vận chuyển:</span>
                              <span className="font-medium">{order.shippingMethod}</span>
                            </div>
                            {order.trackingNumber && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Mã vận đơn:</span>
                                <span className="font-medium font-mono">{order.trackingNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-green-600" />
                            Địa chỉ giao hàng
                          </h4>
                          <p className="text-sm text-gray-700">
                            {[
                              order.address?.locationAddress,
                              order.address?.commune,
                              order.address?.district,
                              order.address?.province,
                            ].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>

                      {/* Products */}
                      <div className="lg:col-span-2">
                        <h4 className="font-semibold text-gray-900 mb-3">Sản phẩm ({order.orderDetails.length})</h4>
                        <div className="space-y-3">
                          {order.orderDetails.map((detail) => (
                            <div key={detail.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{detail.product.productName}</h5>
                                <p className="text-sm text-gray-600">Mã: {detail.product.productCode}</p>
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-sm text-gray-600">Số lượng: {detail.quantity}</span>
                                  <span className="text-sm text-gray-600">
                                    Đơn giá: {currency(detail.unitPrice)}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-gray-900">
                                  {currency(detail.subtotal)}
                                </div>
                                {detail.discountAmount > 0 && (
                                  <div className="text-sm text-green-600">
                                    -{currency(detail.discountAmount)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Order Summary */}
                    <div className="flex justify-end">
                      <div className="w-full max-w-md space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tạm tính:</span>
                          <span className="font-medium">{currency(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Phí vận chuyển:</span>
                          <span className="font-medium">
                            {order.shippingFee === 0 ? 'Miễn phí' : currency(order.shippingFee)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Thuế (VAT):</span>
                          <span className="font-medium">{currency(order.taxAmount)}</span>
                        </div>
                        {order.discountAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Giảm giá:</span>
                            <span className="font-medium text-green-600">-{currency(order.discountAmount)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Tổng cộng:</span>
                          <span className="text-green-700">{currency(order.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Order Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Hủy đơn hàng
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cancelledReason" className="text-sm font-medium">
                Lý do hủy đơn hàng *
              </Label>
              <Textarea
                id="cancelledReason"
                placeholder="Vui lòng nhập lý do hủy đơn hàng..."
                value={cancelledReason}
                onChange={(e) => setCancelledReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>
              Không hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelOrder}
              disabled={cancelling || !cancelledReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelling ? (
                <div className="flex items-center gap-2">
                  <Spinner variant="circle-filled" size={16} />
                  Đang hủy...
                </div>
              ) : (
                'Xác nhận hủy'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
