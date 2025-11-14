import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Package, DollarSign, MapPin, Truck, CheckCircle, Clock, Loader2, AlertCircle } from "lucide-react";
import { getOrderById, updateOrderStatus, type OrderWithCustomer } from "@/api/order";

interface DetailOrderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderWithCustomer | null;
  onOrderUpdated: () => void;
}

const DetailOrder: React.FC<DetailOrderProps> = ({
  open,
  onOpenChange,
  order,
  onOrderUpdated,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<OrderWithCustomer | null>(order);
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (order) {
      setSelectedOrder(order);
      setNewStatus(order.status);
      setShowCancelReason(false);
      setCancelReason("");
      setUpdateError(null);
    }
  }, [order]);

  useEffect(() => {
    if (open && order) {
      // Fetch full order details
      setIsLoadingOrderDetails(true);
      getOrderById(order.id)
        .then((response) => {
          if (response.status && response.data) {
            setSelectedOrder(response.data);
          }
        })
        .catch((error) => {
          console.error("Error fetching order details:", error);
        })
        .finally(() => {
          setIsLoadingOrderDetails(false);
        });
    }
  }, [open, order]);

  const getStatusSteps = () => {
    return [
      { status: "Pending", label: "Chờ xử lý", icon: Clock },
      { status: "Paid", label: "Đã thanh toán", icon: DollarSign },
      { status: "Processing", label: "Đang đóng gói", icon: Loader2 },
      { status: "Shipped", label: "Đã vận chuyển", icon: Truck },
      { status: "Delivered", label: "Đã giao hàng", icon: CheckCircle },
    ];
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      Pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
      Paid: { bg: "bg-blue-100", text: "text-blue-700" },
      Confirmed: { bg: "bg-purple-100", text: "text-purple-700" },
      Processing: { bg: "bg-orange-100", text: "text-orange-700" },
      Shipped: { bg: "bg-cyan-100", text: "text-cyan-700" },
      Delivered: { bg: "bg-green-100", text: "text-green-700" },
      Cancelled: { bg: "bg-red-100", text: "text-red-700" },
      Refunded: { bg: "bg-gray-100", text: "text-gray-700" },
    };

    const config = statusConfig[status] || statusConfig.Pending;
    return (
      <Badge className={`${config.bg} ${config.text} border-0`}>
        {status}
      </Badge>
    );
  };

  const handleNewStatusChange = (value: string) => {
    setNewStatus(value);
    setUpdateError(null);
    if (value === "Cancelled") {
      setShowCancelReason(true);
    } else {
      setShowCancelReason(false);
      setCancelReason("");
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    // If cancelling, check for reason
    if (newStatus === "Cancelled" && !cancelReason.trim()) {
      setUpdateError("Vui lòng nhập lý do hủy đơn hàng");
      return;
    }

    setIsUpdatingStatus(true);
    setUpdateError(null);

    try {
      const payload: any = { status: newStatus };
      if (newStatus === "Cancelled" && cancelReason) {
        payload.cancelledReason = cancelReason;
      }

      const response = await updateOrderStatus(selectedOrder.id, payload);

      if (response.status) {
        // Refresh the order details
        try {
          const orderResponse = await getOrderById(selectedOrder.id);
          if (orderResponse.status && orderResponse.data) {
            setSelectedOrder(orderResponse.data);
            setNewStatus(orderResponse.data.status);
          }
        } catch (refreshError) {
          console.error("Error refreshing order details:", refreshError);
        }

        // Notify parent to refresh list
        onOrderUpdated();

        // Reset form
        setShowCancelReason(false);
        setCancelReason("");
        setUpdateError(null);

        // Show success dialog
        setIsSuccessDialogOpen(true);
      } else {
        // Get error message from API response - format: { errors: ["message1", "message2"] }
        let apiErrorMessage = "Không thể cập nhật trạng thái đơn hàng";
        
        if (response.errors && Array.isArray(response.errors) && response.errors.length > 0) {
          // Lấy tất cả error messages và join lại
          apiErrorMessage = response.errors.join(", ");
        } else if (response.errors && response.errors[0]) {
          apiErrorMessage = String(response.errors[0]);
        }
        
        console.log("API error response:", response);
        console.log("Extracted error message:", apiErrorMessage);
        
        setUpdateError(apiErrorMessage);
        setErrorMessage(apiErrorMessage);
        setIsErrorDialogOpen(true);
      }
    } catch (error: any) {
      console.error("Error updating order status:", error);
      console.error("Error details:", {
        response: error?.response,
        data: error?.response?.data,
        message: error?.message,
      });
      
      // Extract error message from various possible formats
      let apiErrorMessage = "Có lỗi xảy ra khi cập nhật trạng thái đơn hàng";
      
      // Kiểm tra error.response.data (format từ axios khi API trả về lỗi)
      if (error?.response?.data) {
        const errorData = error.response.data;
        
        // Format 1: errorData.errors là array (format chính từ API)
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          apiErrorMessage = errorData.errors.join(", ");
        }
        // Format 2: errorData.errors[0] (single error)
        else if (errorData.errors && errorData.errors[0]) {
          apiErrorMessage = String(errorData.errors[0]);
        }
        // Format 3: errorData.message
        else if (errorData.message) {
          apiErrorMessage = String(errorData.message);
        }
        // Format 4: errorData là string trực tiếp
        else if (typeof errorData === 'string') {
          apiErrorMessage = errorData;
        }
      }
      // Kiểm tra error.message (nếu không có response.data)
      else if (error?.message) {
        apiErrorMessage = String(error.message);
      }
      
      console.log("Final error message to display:", apiErrorMessage);
      
      setUpdateError(apiErrorMessage);
      setErrorMessage(apiErrorMessage);
      setIsErrorDialogOpen(true);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (!selectedOrder) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="px-[15px] py-[10px] max-w-3xl max-h-[90vh] overflow-x-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Chi tiết đơn hàng #{selectedOrder.id}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Customer Info */}
            {selectedOrder.customer && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Thông tin khách hàng
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Tên khách hàng:</span>
                    <p className="font-medium">{selectedOrder.customer.fullName || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium">{selectedOrder.customer.email || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Số điện thoại:</span>
                    <p className="font-medium">{selectedOrder.customer.phoneNumber || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Trạng thái xác minh:</span>
                    <p className="font-medium">
                      {selectedOrder.customer.isVerified ? (
                        <Badge className="bg-green-100 text-green-700">Đã xác minh</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700">Chưa xác minh</Badge>
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Order Info */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Thông tin đơn hàng
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Trạng thái:</span>
                  <p>{getStatusBadge(selectedOrder.status)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Phương thức thanh toán:</span>
                  <p className="font-medium">{selectedOrder.orderPaymentMethod}</p>
                </div>
                <div>
                  <span className="text-gray-500">Phương thức vận chuyển:</span>
                  <p className="font-medium">{selectedOrder.shippingMethod}</p>
                </div>
                <div>
                  <span className="text-gray-500">Mã vận đơn:</span>
                  <p className="font-medium">{selectedOrder.trackingNumber || "Chưa có"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Ngày tạo:</span>
                  <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Cập nhật lần cuối:</span>
                  <p className="font-medium">{formatDate(selectedOrder.updatedAt)}</p>
                </div>
              </div>
            </Card>

            {/* Status Step Indicator */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Loader2 className="w-5 h-5" />
                Tiến trình đơn hàng
              </h3>
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  {getStatusSteps().map((step, index) => {
                    const currentIndex = getStatusSteps().findIndex(
                      (s) => s.status === selectedOrder.status
                    );
                    const isCompleted = index <= currentIndex;
                    const isCurrent = step.status === selectedOrder.status;
                    const Icon = step.icon;

                    return (
                      <div key={step.status} className="flex flex-col items-center flex-1">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                            isCompleted
                              ? "bg-green-500 text-white"
                              : isCurrent
                              ? "bg-blue-500 text-white animate-pulse"
                              : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <p
                          className={`text-xs mt-2 text-center ${
                            isCompleted ? "text-green-600 font-medium" : "text-gray-500"
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Update Status Control */}
            <Card className="p-4 border-blue-200">
              <h3 className="font-semibold mb-3">Cập nhật trạng thái</h3>

              {updateError && (
                <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2 text-red-600">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800 mb-1">
                        Không thể cập nhật trạng thái
                      </p>
                      <p className="text-sm text-red-700">{updateError}</p>
                    </div>
                  </div>
                </div>
              )}

              {showCancelReason ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Lý do hủy đơn hàng <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={cancelReason}
                      onChange={(e) => {
                        setCancelReason(e.target.value);
                        setUpdateError(null);
                      }}
                      placeholder="Nhập lý do hủy đơn hàng..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpdateStatus}
                      disabled={!cancelReason.trim() || isUpdatingStatus}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isUpdatingStatus ? "Đang xử lý..." : "Xác nhận hủy"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCancelReason(false);
                        setCancelReason("");
                        setNewStatus("");
                        setUpdateError(null);
                      }}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Select
                      value={newStatus || selectedOrder.status}
                      onValueChange={handleNewStatusChange}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Chờ xử lý</SelectItem>
                        <SelectItem value="Paid">Đã thanh toán</SelectItem>
                        <SelectItem value="Processing">Đang đóng gói</SelectItem>
                        <SelectItem value="Shipped">Đã vận chuyển</SelectItem>
                        <SelectItem value="Delivered">Đã giao hàng</SelectItem>
                        <SelectItem value="Cancelled">Hủy đơn hàng</SelectItem>
                        <SelectItem value="Refunded">Đã hoàn tiền</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleUpdateStatus}
                      disabled={
                        !newStatus || isUpdatingStatus || newStatus === selectedOrder.status
                      }
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isUpdatingStatus ? "Đang xử lý..." : "Cập nhật"}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Chọn trạng thái mới và nhấn "Cập nhật" để thay đổi
                  </p>
                </div>
              )}
            </Card>

            {/* Address */}
            {selectedOrder.address && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Địa chỉ giao hàng
                </h3>
                <div className="text-sm">
                  <p className="font-medium">
                    {selectedOrder.address.locationAddress || "Chưa có địa chỉ"}
                  </p>
                  <p className="text-gray-600">
                    {[
                      selectedOrder.address.commune,
                      selectedOrder.address.district,
                      selectedOrder.address.province,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Chưa có thông tin"}
                  </p>
                </div>
              </Card>
            )}

            {/* Order Items */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Sản phẩm ({selectedOrder.orderDetails?.length || 0})
              </h3>
              {isLoadingOrderDetails ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-600">Đang tải sản phẩm...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedOrder.orderDetails && selectedOrder.orderDetails.length > 0 ? (
                    selectedOrder.orderDetails.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-4 border-b pb-3 last:border-0"
                      >
                        {/* Product Image */}
                        {item.product.images && item.product.images.length > 0 && (
                          <div className="w-20 h-20 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
                            <img
                              src={item.product.images[0]}
                              alt={item.product.productName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.product.productName}</p>
                          <p className="text-xs text-gray-500">
                            Mã sản phẩm: {item.product.productCode}
                          </p>
                          {item.product.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {item.product.description}
                            </p>
                          )}
                          {item.product.warrantyMonths && (
                            <p className="text-xs text-green-600 mt-1">
                              Bảo hành: {item.product.warrantyMonths} tháng
                            </p>
                          )}
                        </div>
                        <div className="text-right min-w-[100px]">
                          <p className="font-medium text-gray-900">
                            {formatPrice(item.unitPrice)}
                          </p>
                          <p className="text-xs text-gray-500">Số lượng: x{item.quantity}</p>
                          {item.discountAmount > 0 && (
                            <p className="text-xs text-green-600">
                              Giảm: -{formatPrice(item.discountAmount)}
                            </p>
                          )}
                        </div>
                        <div className="text-right min-w-[120px]">
                          <p className="font-semibold text-gray-900">
                            {formatPrice(item.subtotal)}
                          </p>
                          <p className="text-xs text-gray-400">Tổng</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Không có sản phẩm trong đơn hàng
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Price Summary */}
            <Card className="p-4 bg-gray-50">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Tổng kết
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá:</span>
                    <span>-{formatPrice(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Thuế:</span>
                  <span>{formatPrice(selectedOrder.taxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span>{formatPrice(selectedOrder.shippingFee)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-lg font-bold">Tổng cộng:</span>
                  <span className="text-lg font-bold">
                    {formatPrice(selectedOrder.totalAmount)}
                  </span>
                </div>
              </div>
            </Card>

            {selectedOrder.notes && (
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Ghi chú</h3>
                <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Success AlertDialog */}
      <AlertDialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <AlertDialogContent className="sm:max-w-[400px]">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-center">
              Thành công!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Trạng thái đơn hàng đã được cập nhật thành công.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setIsSuccessDialogOpen(false)}
              className="bg-green-600 hover:bg-green-700 text-white w-full"
            >
              Đóng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error AlertDialog */}
      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent className="sm:max-w-[450px]">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-center">
              Lỗi cập nhật trạng thái
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              <div className="mt-4">
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {errorMessage}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setIsErrorDialogOpen(false);
                setUpdateError(null);
                setErrorMessage("");
              }}
              className="bg-red-600 hover:bg-red-700 text-white w-full"
            >
              Đóng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DetailOrder;

