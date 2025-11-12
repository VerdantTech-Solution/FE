import React, { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, Package, CheckCircle, Clock, XCircle, Download } from "lucide-react";
import { getAllOrders, getOrderById, shipOrder, type OrderWithCustomer, type GetAllOrdersResponse, type ShipOrderItem } from "@/api/order";
import DetailOrder from "@/components/order/DetailOrder";

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

export const OrderManagementPage: React.FC = () => {
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

  const handleViewOrder = (order: OrderWithCustomer) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  const handleOrderUpdated = async () => {
    await fetchOrders();
  };

  const handleStatusChange = (status: OrderStatus) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when changing status
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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

  const handleExportExcel = () => {
    // TODO: Implement Excel export functionality
    console.log("Exporting orders to Excel...");
    alert("Chức năng xuất Excel đang được phát triển");
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Quản lý đơn hàng</h2>
          <p className="text-sm text-gray-500">Quản lý và theo dõi tất cả đơn hàng của khách hàng</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportExcel}>
            <Download className="w-4 h-4" />
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
      <DetailOrder
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        order={selectedOrder}
        onOrderUpdated={handleOrderUpdated}
      />

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

export default OrderManagementPage;
