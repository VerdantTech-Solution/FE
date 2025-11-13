import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getOrdersByUser, updateOrderStatus, type OrderWithCustomer } from '@/api/order';
import { createProductReview, getProductReviewsByOrderId, type ProductReview } from '@/api/productReview';
import { ChevronLeft, ChevronRight, Package, MapPin, CreditCard, Star, ImagePlus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

const currency = (v: number) => v.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'paid':
      return 'bg-blue-100 text-blue-800 border-blue-200';
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
    case 'paid':
      return 'Đã thanh toán';
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

const getProductImageUrl = (images: any): string | undefined => {
  if (!images) return undefined;
  if (Array.isArray(images)) {
    const first = images[0];
    if (!first) return undefined;
    if (typeof first === 'object' && 'imageUrl' in first) return (first as any).imageUrl as string;
    return String(first);
  }
  return String(images);
};

const renderStaticStars = (rating: number) =>
  Array.from({ length: 5 }, (_, index) => (
    <Star
      key={index}
      className={`h-4 w-4 ${index < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
    />
  ));

const canConfirmDelivery = (status: string) => {
  const normalized = status.toLowerCase();
  return ['shipped', 'processing', 'paid', 'confirmed'].includes(normalized);
};

type ReviewUploadImage = {
  file: File;
  preview: string;
};

export default function OrderHistoryPage() {
  const [searchParams] = useSearchParams();
  const userIdParam = searchParams.get('userId');
  const userId = userIdParam ? Number(userIdParam) : undefined;
  const getUserIdFromToken = () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return undefined;
      const parts = token.split('.');
      if (parts.length !== 3) return undefined;
      const payloadJson = JSON.parse(atob(parts[1]));
      const nameId = payloadJson?.nameid || payloadJson?.sub || payloadJson?.userId;
      const parsed = Number(nameId);
      return Number.isFinite(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  };
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});
  const [reviewsByOrder, setReviewsByOrder] = useState<Record<number, ProductReview[]>>({});
  const [reviewsLoading, setReviewsLoading] = useState<Record<number, boolean>>({});
  const [reviewTarget, setReviewTarget] = useState<{
    order: OrderWithCustomer;
    detail: OrderWithCustomer['orderDetails'][number];
  } | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState<ReviewUploadImage[]>([]);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState<string | null>(null);
  const [confirmingOrders, setConfirmingOrders] = useState<Record<number, boolean>>({});
  const [statusNotification, setStatusNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadOrders = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const effectiveUserId = userId ?? getUserIdFromToken();
      if (!effectiveUserId) throw { message: 'Không xác định được userId. Vui lòng đăng nhập hoặc thêm ?userId=...' };

      const response = await getOrdersByUser(effectiveUserId, page, pageSize);
      
      if (response.status) {
        setOrders(response.data.data);
        setCurrentPage(response.data.currentPage);
        setTotalPages(response.data.totalPages);
        setTotalRecords(response.data.totalRecords);
      } else {
        setError(response.errors?.[0] || 'Không thể tải danh sách đơn hàng');
      }
    } catch (e: any) {
      const serverMsg = e?.errors?.[0] || e?.message;
      setError(serverMsg || 'Lỗi khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(1);
  }, [selectedStatus, userId, pageSize]);

  useEffect(() => {
    if (!statusNotification) return;
    const timeout = setTimeout(() => setStatusNotification(null), 4000);
    return () => clearTimeout(timeout);
  }, [statusNotification]);

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadOrders(page);
  };

  const handlePageSizeChange = (size: string) => {
    setPageSize(parseInt(size));
    setCurrentPage(1);
    loadOrders(1);
  };

  const fetchOrderReviews = async (orderId: number) => {
    setReviewsLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const response = await getProductReviewsByOrderId(orderId);
      const list = response?.data && Array.isArray(response.data) ? response.data : [];
      setReviewsByOrder(prev => ({ ...prev, [orderId]: list }));
    } catch (err) {
      console.error('Error fetching product reviews for order', orderId, err);
      setReviewsByOrder(prev => ({ ...prev, [orderId]: [] }));
    } finally {
      setReviewsLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const toggleExpanded = (orderId: number) => {
    const willExpand = !expandedOrders[orderId];
    setExpandedOrders(prev => ({ ...prev, [orderId]: willExpand }));
    if (willExpand && !reviewsByOrder[orderId] && !reviewsLoading[orderId]) {
      fetchOrderReviews(orderId);
    }
  };

  const resetReviewState = () => {
    setReviewRating(5);
    setReviewComment('');
    setReviewImages(prev => {
      prev.forEach(img => URL.revokeObjectURL(img.preview));
      return [];
    });
    setReviewError(null);
    setReviewSuccessMessage(null);
    setReviewSubmitting(false);
  };

  const openReviewDialog = (
    order: OrderWithCustomer,
    detail: OrderWithCustomer['orderDetails'][number]
  ) => {
    setReviewTarget({ order, detail });
    resetReviewState();
  };

  const closeReviewDialog = () => {
    setReviewTarget(null);
    resetReviewState();
  };

  const handleReviewImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const currentCount = reviewImages.length;
    const remainingSlots = 5 - currentCount;
    if (remainingSlots <= 0) {
      setReviewError('Bạn chỉ có thể tải lên tối đa 5 hình ảnh cho mỗi đánh giá.');
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remainingSlots);

    const oversized = selectedFiles.find(file => file.size > 5 * 1024 * 1024);
    if (oversized) {
      setReviewError(`Ảnh ${oversized.name} vượt quá dung lượng 5MB.`);
      return;
    }

    const invalidType = selectedFiles.find(file => !file.type.startsWith('image/'));
    if (invalidType) {
      setReviewError(`File ${invalidType.name} không phải là hình ảnh.`);
      return;
    }

    setReviewError(null);

    const uploads: ReviewUploadImage[] = selectedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setReviewImages(prev => [...prev, ...uploads]);
  };

  const handleRemoveReviewImage = (index: number) => {
    setReviewImages(prev => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmitReview = async () => {
    if (!reviewTarget) return;
    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError('Vui lòng chọn số sao hợp lệ.');
      return;
    }

    setReviewSubmitting(true);
    setReviewError(null);
    setReviewSuccessMessage(null);

    try {
      const payload = {
        orderId: reviewTarget.order.id,
        productId: reviewTarget.detail.product.id,
        orderDetailId: reviewTarget.detail.id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
        images: reviewImages.length > 0 ? reviewImages.map(image => image.file) : undefined,
      };

      const response = await createProductReview(payload);

      if (response?.status === false) {
        const message =
          response.errors?.[0] || 'Không thể gửi đánh giá. Vui lòng thử lại sau.';
        setReviewError(message);
        return;
      }

      setReviewSuccessMessage('Gửi đánh giá thành công! Cảm ơn bạn đã chia sẻ.');
      await fetchOrderReviews(reviewTarget.order.id);
      // reload orders to update e.g. statuses optional?
      setTimeout(() => {
        closeReviewDialog();
      }, 1200);
    } catch (err: any) {
      console.error('Submit review error:', err);
      const message =
        err?.errors?.[0] ||
        err?.message ||
        'Không thể gửi đánh giá. Vui lòng thử lại sau.';
      setReviewError(message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleConfirmOrderDelivered = async (orderId: number) => {
    setConfirmingOrders(prev => ({ ...prev, [orderId]: true }));
    setStatusNotification(null);
    try {
      const response = await updateOrderStatus(orderId, { status: 'Delivered' });
      if (response?.status === false) {
        const message = response.errors?.[0] || 'Không thể cập nhật trạng thái đơn hàng.';
        throw new Error(message);
      }
      setStatusNotification({ type: 'success', text: 'Xác nhận đã nhận hàng thành công.' });
      await loadOrders(currentPage);
      if (expandedOrders[orderId]) {
        await fetchOrderReviews(orderId);
      }
    } catch (err: any) {
      console.error('Confirm order delivered error:', err);
      const message = err?.errors?.[0] || err?.message || 'Không thể cập nhật trạng thái đơn hàng.';
      setStatusNotification({ type: 'error', text: message });
    } finally {
      setConfirmingOrders(prev => ({ ...prev, [orderId]: false }));
    }
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
                <SelectItem value="Paid">Đã thanh toán</SelectItem>
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

        {statusNotification && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
              statusNotification.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-600'
            }`}
          >
            {statusNotification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            )}
            <span>{statusNotification.text}</span>
          </div>
        )}

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
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                          <CardTitle className="text-lg">Đơn hàng #{order.id}</CardTitle>
                          <Badge className={`px-3 py-1 ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </Badge>
                        </div>
                        <div className="flex flex-col items-end gap-2 sm:items-end sm:flex-row sm:gap-3">
                          {canConfirmDelivery(order.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConfirmOrderDelivered(order.id)}
                              disabled={confirmingOrders[order.id]}
                              className="flex items-center gap-2"
                            >
                              {confirmingOrders[order.id] ? (
                                <>
                                  <Spinner variant="circle-filled" size={16} className="text-green-600" />
                                  Đang cập nhật...
                                </>
                              ) : (
                                'Đã nhận hàng'
                              )}
                            </Button>
                          )}
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">{currency(order.totalAmount)}</p>
                            <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 overflow-x-auto">
                        {order.orderDetails.slice(0, 5).map((detail) => {
                          const url = getProductImageUrl(detail.product.images);
                          return (
                            <div key={detail.id} className="flex-shrink-0">
                              {url ? (
                                <img src={url} alt={detail.product.productName} className="w-12 h-12 object-cover rounded-md border" />
                              ) : (
                                <div className="w-12 h-12 rounded-md bg-gray-100 border" />
                              )}
                              <p className="mt-2 text-base font-semibold text-gray-900">{detail.product.productName}</p>
                            </div>
                          );
                        })}
                        {order.orderDetails.length > 5 && (
                          <span className="text-sm text-gray-500">+{order.orderDetails.length - 5} nữa</span>
                        )}
                      </div>
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => toggleExpanded(order.id)}>
                          {expandedOrders[order.id] ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {expandedOrders[order.id] && (
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
                          <p className="text-sm text-gray-900">{formatAddress(order.address ?? order.customer?.userAddresses?.[0])}</p>
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
                        {reviewsLoading[order.id] && (
                          <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
                            <Spinner variant="circle-filled" size={18} className="text-green-600" />
                            <span>Đang tải đánh giá sản phẩm...</span>
                          </div>
                        )}
                        {order.orderDetails.map((detail) => {
                          const orderReviews = reviewsByOrder[order.id] || [];
                          const reviewForDetail = orderReviews.find(
                            (review) =>
                              review.orderDetailId === detail.id ||
                              review.productId === detail.product.id
                          );
                          const isDelivered = order.status.toLowerCase() === 'delivered';

                          return (
                            <div key={detail.id} className="py-3 border-b border-gray-100 last:border-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-start gap-3">
                                  {detail.product.images && detail.product.images.length > 0 ? (
                                    <img
                                      src={
                                        Array.isArray(detail.product.images)
                                          ? typeof detail.product.images[0] === 'object' &&
                                            detail.product.images[0] !== null &&
                                            'imageUrl' in detail.product.images[0]
                                            ? (detail.product.images[0] as any).imageUrl
                                            : String(detail.product.images[0])
                                    : detail.product.images
                                  }
                                  alt={detail.product.productName}
                                      className="w-14 h-14 object-cover rounded-lg border"
                                />
                                  ) : (
                                    <div className="w-14 h-14 rounded-lg bg-gray-100 border" />
                              )}
                              <div>
                                <p className="font-medium text-gray-900">{detail.product.productName}</p>
                                <p className="text-sm text-gray-500">
                                  {currency(detail.unitPrice)} × {detail.quantity}
                                </p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                      Thành tiền: {currency(detail.subtotal)}
                                    </p>
                                    {detail.discountAmount > 0 && (
                                      <p className="text-xs text-green-600">
                                        -{currency(detail.discountAmount)} (giảm giá)
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-2 min-w-[180px]">
                                  {reviewForDetail ? (
                                    <div className="flex flex-col items-end gap-2">
                                      <div className="flex items-center gap-1">
                                        {renderStaticStars(reviewForDetail.rating)}
                                        <span className="text-sm font-medium text-gray-700">
                                          {reviewForDetail.rating}/5
                                        </span>
                                      </div>
                                      <Button variant="outline" size="sm" disabled>
                                        Đã đánh giá
                                      </Button>
                                    </div>
                                  ) : isDelivered ? (
                                    <Button
                                      size="sm"
                                      onClick={() => openReviewDialog(order, detail)}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      Đánh giá sản phẩm
                                    </Button>
                                  ) : (
                                    <div className="text-xs text-gray-500">
                                      Đánh giá sẽ khả dụng sau khi đơn hàng hoàn tất giao
                                    </div>
                                  )}
                                </div>
                              </div>

                              {reviewForDetail?.comment && (
                                <div className="mt-3 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
                                  {reviewForDetail.comment}
                                </div>
                              )}

                              {reviewForDetail?.images && reviewForDetail.images.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-3">
                                  {reviewForDetail.images.map((image, index) => (
                                    <img
                                      key={image.imagePublicId || `${reviewForDetail.id}-${index}`}
                                      src={image.imageUrl}
                                      alt={`Đánh giá ${detail.product.productName} ${index + 1}`}
                                      className="h-16 w-16 rounded-md object-cover border"
                                    />
                                  ))}
                            </div>
                              )}
                            </div>
                          );
                        })}
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
                  )}
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

      <Dialog open={!!reviewTarget} onOpenChange={(open) => (open ? null : closeReviewDialog())}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Đánh giá sản phẩm</DialogTitle>
            <DialogDescription>
              Chia sẻ trải nghiệm của bạn sau khi nhận hàng để giúp những người mua khác.
            </DialogDescription>
          </DialogHeader>

        {reviewTarget && (
          <div className="space-y-5">
            <div className="flex items-start gap-4 rounded-lg border border-gray-200 p-4">
              <img
                src={
                  getProductImageUrl(reviewTarget.detail.product.images) ||
                  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=120&h=120&fit=crop'
                }
                alt={reviewTarget.detail.product.productName}
                className="h-16 w-16 rounded-md object-cover"
              />
              <div>
                <p className="font-semibold text-gray-900">
                  {reviewTarget.detail.product.productName}
                </p>
                <p className="text-sm text-gray-500">
                  Số lượng: {reviewTarget.detail.quantity} · Đơn giá:{' '}
                  {currency(reviewTarget.detail.unitPrice)}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Chấm điểm</Label>
              <div className="mt-2 flex items-center gap-2">
                {Array.from({ length: 5 }, (_, index) => {
                  const value = index + 1;
                  const active = value <= reviewRating;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setReviewRating(value)}
                      className="focus:outline-none transition-transform hover:scale-105"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          active ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="text-sm text-gray-600">{reviewRating} / 5</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewComment" className="text-sm font-medium text-gray-700">
                Nhận xét của bạn
              </Label>
              <Textarea
                id="reviewComment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Sản phẩm có đáp ứng mong đợi của bạn không? Chia sẻ thêm về chất lượng, đóng gói hay dịch vụ nhé."
                className="min-h-[120px]"
                disabled={reviewSubmitting}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="reviewImages" className="text-sm font-medium text-gray-700">
                  Hình ảnh sản phẩm (tùy chọn)
                </Label>
                <span className="text-xs text-gray-500">Tối đa 5 ảnh, mỗi ảnh ≤ 5MB</span>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  id="reviewImages"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleReviewImageUpload(e.target.files)}
                  disabled={reviewImages.length >= 5}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('reviewImages')?.click()}
                  disabled={reviewImages.length >= 5}
                  className="flex items-center gap-2"
                >
                  <ImagePlus className="h-4 w-4" />
                  Thêm ảnh
                </Button>
              </div>
              {reviewImages.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {reviewImages.map((image, index) => (
                    <div
                      key={image.preview}
                      className="relative h-20 w-20 overflow-hidden rounded-md border"
                    >
                      <img
                        src={image.preview}
                        alt={`Hình ảnh ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                        onClick={() => handleRemoveReviewImage(index)}
                        aria-label="Xóa hình ảnh"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {reviewError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {reviewError}
              </div>
            )}
            {reviewSuccessMessage && (
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {reviewSuccessMessage}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeReviewDialog}
                disabled={reviewSubmitting}
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleSubmitReview}
                disabled={reviewSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {reviewSubmitting ? (
                  <>
                    <Spinner variant="circle-filled" size={16} className="mr-2" />
                    Đang gửi...
                  </>
                ) : (
                  'Gửi đánh giá'
                )}
              </Button>
            </div>
          </div>
        )}
        </DialogContent>
      </Dialog>
    </div>
  );
}