import React, { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Eye, Package, DollarSign, MapPin, Truck, CheckCircle, Clock, Loader2, XCircle } from "lucide-react";
import { getAllOrders, getOrderById, updateOrderStatus, shipOrder, type OrderWithCustomer, type GetAllOrdersResponse, type ShipOrderItem } from "@/api/order";
import { getProductById } from "@/api/product";

type OrderStatus = "Pending" | "Paid" | "Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled" | "Refunded" | "all";

interface OrderStats {
  total: number;
  pending: number;
  paid: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  refunded: number;
}

export const OrderManagementPanel: React.FC = () => {
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithCustomer | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [isShipDialogOpen, setIsShipDialogOpen] = useState(false);
  const [shipItems, setShipItems] = useState<Array<{ productId: number; categoryId?: number; productName: string; quantity: number; serialNumber: string; lotNumber: string }>>([]);
  const [isShipping, setIsShipping] = useState(false);

  const stats = useMemo<OrderStats>(() => {
    return {
      total: totalRecords,
      pending: orders.filter((o) => o.status === "Pending").length,
      paid: orders.filter((o) => o.status === "Paid").length,
      confirmed: orders.filter((o) => o.status === "Confirmed").length,
      processing: orders.filter((o) => o.status === "Processing").length,
      shipped: orders.filter((o) => o.status === "Shipped").length,
      delivered: orders.filter((o) => o.status === "Delivered").length,
      cancelled: orders.filter((o) => o.status === "Cancelled").length,
      refunded: orders.filter((o) => o.status === "Refunded").length,
    };
  }, [orders, totalRecords]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: GetAllOrdersResponse = await getAllOrders(
        currentPage,
        pageSize,
        statusFilter === "all" ? undefined : statusFilter
      );
      
      if (response.status) {
        setOrders(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalRecords(response.data.totalRecords);
      } else {
        setError(response.errors?.join(", ") || "Không thể tải dữ liệu đơn hàng");
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.errors?.join(", ") || err?.message || "Có lỗi xảy ra khi tải đơn hàng";
      setError(errorMessage);
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, pageSize, statusFilter]);

  // Reset newStatus when order changes
  useEffect(() => {
    if (selectedOrder) {
      setNewStatus(selectedOrder.status);
      setShowCancelReason(false);
      setCancelReason("");
    }
  }, [selectedOrder]);

  const handleViewOrder = async (order: OrderWithCustomer) => {
    setIsDetailDialogOpen(true);
    
    // Show basic info first with safe defaults
    setSelectedOrder({
      ...order,
      address: order.address || {} as any,
      customer: order.customer || {} as any,
      orderDetails: order.orderDetails || []
    });
    
    // Fetch full order details from API
    setIsLoadingOrderDetails(true);
    try {
      console.log("Fetching order details for order ID:", order.id);
      const response = await getOrderById(order.id);
      console.log("Order details response:", response);
      
      if (response.status && response.data) {
        setSelectedOrder(response.data); // Update with full details
      } else {
        console.error("Failed to fetch order details:", response.errors);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setIsLoadingOrderDetails(false);
    }
  };

  const handleStatusChange = (status: OrderStatus) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when changing status
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    // If cancelling, check for reason
    if (newStatus === "Cancelled" && !cancelReason.trim()) {
      setShowCancelReason(true);
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const payload: any = { status: newStatus };
      if (newStatus === "Cancelled" && cancelReason) {
        payload.cancelledReason = cancelReason;
      }

      console.log("Sending payload:", payload);
      const response = await updateOrderStatus(selectedOrder.id, payload);
      console.log("Response:", response);
      
      if (response.status) {
        // Refresh the order details
        const orderResponse = await getOrderById(selectedOrder.id);
        if (orderResponse.status && orderResponse.data) {
          setSelectedOrder(orderResponse.data);
        }
        
        // Refresh the list
        await fetchOrders();
        
        setShowCancelReason(false);
        setCancelReason("");
        setNewStatus("");
        alert("Cập nhật trạng thái đơn hàng thành công!");
      } else {
        console.error("Failed to update order status:", response.errors);
        alert(`Không thể cập nhật trạng thái đơn hàng: ${response.errors?.join(", ") || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("Error updating order status:", error);
      alert(`Có lỗi xảy ra: ${error?.response?.data?.errors?.join(", ") || error.message || "Unknown error"}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleNewStatusChange = (value: string) => {
    setNewStatus(value);
    if (value === "Cancelled") {
      setShowCancelReason(true);
    } else if (value === "Shipped") {
      // Open ship dialog if order is not already shipped
      if (selectedOrder && selectedOrder.status !== "Shipped" && selectedOrder.status !== "Delivered") {
        handleOpenShipDialog();
        return;
      }
    } else {
      setShowCancelReason(false);
      setCancelReason("");
    }
  };

  const handleOpenShipDialog = async () => {
    if (!selectedOrder || !selectedOrder.orderDetails) return;
    
    // Fetch categoryId for each product if not present
    const items = await Promise.all(
      selectedOrder.orderDetails.map(async (detail) => {
        let categoryId = detail.product.categoryId;
        
        // If categoryId is not in order details, fetch from product API
        if (!categoryId) {
          try {
            const product = await getProductById(detail.product.id);
            categoryId = product.categoryId;
          } catch (error) {
            console.error(`Failed to fetch category for product ${detail.product.id}:`, error);
          }
        }
        
        return {
          productId: detail.product.id,
          categoryId: categoryId,
          productName: detail.product.productName,
          quantity: detail.quantity,
          serialNumber: "",
          lotNumber: "",
        };
      })
    );
    
    setShipItems(items);
    setIsShipDialogOpen(true);
  };

  const handleShipOrder = async () => {
    if (!selectedOrder) return;

    // Validate: categoryId = 1 needs serialNumber, others need lotNumber
    const hasErrors = shipItems.some(item => {
      if (item.categoryId === 1) {
        return !item.serialNumber.trim();
      } else {
        return !item.lotNumber.trim();
      }
    });

    if (hasErrors) {
      alert("Vui lòng điền đầy đủ thông tin: Máy móc (category ID = 1) cần số seri, các loại khác cần số lô");
      return;
    }

    setIsShipping(true);
    try {
      // Prepare ship payload - one item per product (not per quantity)
      const payload: ShipOrderItem[] = shipItems.map(item => ({
        productId: item.productId,
        serialNumber: item.categoryId === 1 ? item.serialNumber : undefined,
        lotNumber: item.categoryId !== 1 ? item.lotNumber : undefined,
      }));

      console.log("Shipping order with payload:", payload);
      const response = await shipOrder(selectedOrder.id, payload);
      console.log("Ship order response:", response);
      
      if (response.status) {
        // Refresh the order details
        const orderResponse = await getOrderById(selectedOrder.id);
        if (orderResponse.status && orderResponse.data) {
          setSelectedOrder(orderResponse.data);
        }
        
        // Refresh the list
        await fetchOrders();
        
        setIsShipDialogOpen(false);
        setShipItems([]);
        setNewStatus("");
        alert("Đã gửi đơn hàng thành công!");
      } else {
        console.error("Failed to ship order:", response.errors);
        alert(`Không thể gửi đơn hàng: ${response.errors?.join(", ") || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("Error shipping order:", error);
      alert(`Có lỗi xảy ra: ${error?.response?.data?.errors?.join(", ") || error.message || "Unknown error"}`);
    } finally {
      setIsShipping(false);
    }
  };

  const getStatusSteps = () => {
    return [
      { status: "Pending", label: "Chờ xử lý", icon: Clock },
      { status: "Paid", label: "Đã thanh toán", icon: DollarSign },
      { status: "Processing", label: "Đang xử lý", icon: Loader2 },
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

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    
    const query = searchQuery.toLowerCase();
    return orders.filter(
      (order) =>
        order.id.toString().includes(query) ||
        order.customer.fullName.toLowerCase().includes(query) ||
        order.customer.email.toLowerCase().includes(query) ||
        order.trackingNumber?.toLowerCase().includes(query) ||
        order.notes?.toLowerCase().includes(query)
    );
  }, [orders, searchQuery]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Quản lý đơn hàng</h2>
          <p className="text-sm text-gray-500">Quản lý và theo dõi tất cả đơn hàng của khách hàng</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Package className="w-4 h-4" />
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Total Orders */}
        <Card className="p-4 relative overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 text-blue-600">
            <Package className="h-20 w-20" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tổng đơn hàng</p>
              <p className="text-3xl font-bold tracking-tight">{stats.total}</p>
            </div>
          </div>
        </Card>

        {/* Pending */}
        <Card className="p-4 relative overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 text-yellow-600">
            <Clock className="h-20 w-20" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Chờ xử lý</p>
              <p className="text-3xl font-bold tracking-tight">{stats.pending}</p>
            </div>
           
          </div>
        </Card>

        {/* Delivered */}
        <Card className="p-4 relative overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 text-green-600">
            <CheckCircle className="h-20 w-20" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Đã giao</p>
              <p className="text-3xl font-bold tracking-tight">{stats.delivered}</p>
            </div>
         
          </div>
        </Card>

        {/* Cancelled */}
        <Card className="p-4 relative overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 text-red-600">
            <XCircle className="h-20 w-20" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Đã hủy</p>
              <p className="text-3xl font-bold tracking-tight">{stats.cancelled}</p>
            </div>
         
          </div>
        </Card>
      </div>

      {/* Filter block */}
      <Card className="mb-6">
        <div className="p-4 border-b text-sm font-medium text-gray-700">Bộ lọc và tìm kiếm</div>
        <div className="p-4 grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Input
              placeholder="Tìm theo ID, tên, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => handleStatusChange(v as OrderStatus)}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Confirmed">Confirmed</SelectItem>
              <SelectItem value="Processing">Processing</SelectItem>
              <SelectItem value="Shipped">Shipped</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
              <SelectItem value="Refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 md:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter("all");
                setSearchQuery("");
                setCurrentPage(1);
              }}
            >
              Xóa bộ lọc
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-gray-600">Đang tải...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">
            <p>{error}</p>
            <Button onClick={fetchOrders} className="mt-4 bg-red-600 hover:bg-red-700">
              Thử lại
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 bg-gray-50 px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              <div className="col-span-2">Mã đơn hàng</div>
              <div className="col-span-3">Khách hàng</div>
              <div className="col-span-2">Trạng thái</div>
              <div className="col-span-2">Tổng tiền</div>
              <div className="col-span-2">Ngày tạo</div>
              <div className="col-span-1 text-right">Hành động</div>
            </div>
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-12 items-center px-5 py-3 border-t text-sm hover:bg-gray-50"
              >
                <div className="col-span-2">
                  <div className="font-medium text-gray-900">#{order.id}</div>
                  <div className="text-xs text-gray-500">{order.trackingNumber || "Chưa có mã"}</div>
                </div>
                <div className="col-span-3">
                  <div className="font-medium text-gray-900">{order.customer.fullName}</div>
                  <div className="text-xs text-gray-500">{order.customer.email}</div>
                </div>
                <div className="col-span-2">{getStatusBadge(order.status)}</div>
                <div className="col-span-2">
                  <div className="font-semibold text-gray-900">{formatPrice(order.totalAmount)}</div>
                  <div className="text-xs text-gray-500">
                    {order.orderPaymentMethod}
                  </div>
                </div>
                <div className="col-span-2 text-gray-600">
                  {formatDate(order.createdAt)}
                </div>
                <div className="col-span-1 text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    title="Xem chi tiết"
                    onClick={() => handleViewOrder(order)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {filteredOrders.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                {loading ? "Đang tải..." : "Không có đơn hàng phù hợp"}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Hiển thị {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalRecords)} trong tổng số {totalRecords} đơn hàng
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Trước
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className={currentPage === page ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="px-[15px] py-[10px] max-w-3xl max-h-[90vh] overflow-x-hidden overflow-y-auto ">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Chi tiết đơn hàng #{selectedOrder?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder ? (
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
                      const currentIndex = getStatusSteps().findIndex(s => s.status === selectedOrder.status);
                      const isCompleted = index <= currentIndex;
                      const isCurrent = step.status === selectedOrder.status;
                      const Icon = step.icon;
                      
                      return (
                        <div key={step.status} className="flex flex-col items-center flex-1">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                            isCompleted 
                              ? "bg-green-500 text-white" 
                              : isCurrent 
                                ? "bg-blue-500 text-white animate-pulse" 
                                : "bg-gray-200 text-gray-400"
                          }`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <p className={`text-xs mt-2 text-center ${isCompleted ? "text-green-600 font-medium" : "text-gray-500"}`}>
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
                
                {showCancelReason ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Lý do hủy đơn hàng</label>
                      <Textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
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
                        }}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Select value={newStatus || selectedOrder.status} onValueChange={handleNewStatusChange}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Chờ xử lý</SelectItem>
                          <SelectItem value="Paid">Đã thanh toán</SelectItem>
                          <SelectItem value="Processing">Đang xử lý</SelectItem>
                          <SelectItem value="Shipped">Đã vận chuyển</SelectItem>
                          <SelectItem value="Delivered">Đã giao hàng</SelectItem>
                          <SelectItem value="Cancelled">Hủy đơn hàng</SelectItem>
                          <SelectItem value="Refunded">Đã hoàn tiền</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleUpdateStatus}
                        disabled={!newStatus || isUpdatingStatus || newStatus === selectedOrder.status}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isUpdatingStatus ? "Đang xử lý..." : "Cập nhật"}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">Chọn trạng thái mới và nhấn "Cập nhật" để thay đổi</p>
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
                    <p className="font-medium">{selectedOrder.address.locationAddress || "Chưa có địa chỉ"}</p>
                    <p className="text-gray-600">
                      {[
                        selectedOrder.address.commune,
                        selectedOrder.address.district,
                        selectedOrder.address.province
                      ].filter(Boolean).join(", ") || "Chưa có thông tin"}
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
                        <div key={item.id} className="flex items-start gap-4 border-b pb-3 last:border-0">
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
                            <p className="text-xs text-gray-500">Mã sản phẩm: {item.product.productCode}</p>
                            {item.product.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.product.description}</p>
                            )}
                            {item.product.warrantyMonths && (
                              <p className="text-xs text-green-600 mt-1">
                                Bảo hành: {item.product.warrantyMonths} tháng
                              </p>
                            )}
                          </div>
                          <div className="text-right min-w-[100px]">
                            <p className="font-medium text-gray-900">{formatPrice(item.unitPrice)}</p>
                            <p className="text-xs text-gray-500">Số lượng: x{item.quantity}</p>
                            {item.discountAmount > 0 && (
                              <p className="text-xs text-green-600">Giảm: -{formatPrice(item.discountAmount)}</p>
                            )}
                          </div>
                          <div className="text-right min-w-[120px]">
                            <p className="font-semibold text-gray-900">{formatPrice(item.subtotal)}</p>
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
                    <span className="text-lg font-bold">{formatPrice(selectedOrder.totalAmount)}</span>
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
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải thông tin đơn hàng...</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ship Order Dialog */}
      <Dialog open={isShipDialogOpen} onOpenChange={setIsShipDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Gửi đơn hàng #{selectedOrder?.id}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-gray-600">
              Vui lòng điền thông tin: Máy móc (category ID = 1) cần số seri, các loại khác cần số lô
            </p>
            <div className="space-y-4">
              {shipItems.map((item, index) => (
                <Card key={item.productId} className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.productName}</h4>
                      <p className="text-xs text-gray-500">Số lượng: {item.quantity}</p>
                      {item.categoryId && (
                        <p className="text-xs text-gray-500">Category ID: {item.categoryId}</p>
                      )}
                    </div>
                    {item.categoryId === 1 ? (
                      <div className="grid gap-2">
                        <Label htmlFor={`serial-${item.productId}`}>
                          Số seri <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`serial-${item.productId}`}
                          value={item.serialNumber}
                          onChange={(e) => {
                            const updated = [...shipItems];
                            updated[index].serialNumber = e.target.value;
                            setShipItems(updated);
                          }}
                          placeholder="Nhập số seri"
                          required
                        />
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        <Label htmlFor={`lot-${item.productId}`}>
                          Số lô <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`lot-${item.productId}`}
                          value={item.lotNumber}
                          onChange={(e) => {
                            const updated = [...shipItems];
                            updated[index].lotNumber = e.target.value;
                            setShipItems(updated);
                          }}
                          placeholder="Nhập số lô"
                          required
                        />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsShipDialogOpen(false);
                  setShipItems([]);
                  setNewStatus("");
                }}
                disabled={isShipping}
              >
                Hủy
              </Button>
              <Button
                onClick={handleShipOrder}
                disabled={isShipping}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isShipping ? "Đang gửi..." : "Gửi đơn hàng"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManagementPanel;

