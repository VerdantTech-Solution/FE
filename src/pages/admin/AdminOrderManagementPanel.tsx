import React, { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Eye,
  Package,
  DollarSign,
  MapPin,
  Truck,
  CheckCircle,
  Clock,
  Loader2,
  XCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  shipOrder,
  type OrderWithCustomer,
  type GetAllOrdersResponse,
  type ShipOrderItem,
} from "@/api/order";
import { getProductById } from "@/api/product";
import {
  exportAdminTransactions,
  getAdminOrderStatistics,
  type AdminOrderStatistics,
} from "@/api/admin-dashboard";
import {
  getIdentityNumbersWithMetadata,
  type IdentityNumberItem,
} from "@/api/export";
import { formatVietnamDateTime, parseApiDateTime } from "@/lib/utils";

type OrderStatus =
  | "Pending"
  | "Paid"
  | "Confirmed"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "Refunded"
  | "all";

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  paid: number;
  shipped: number;
  cancelled: number;
  delivered: number;
  refunded: number;
  fulfillmentRate: number;
  cancellationRate: number;
  refundRate: number;
  averageDeliveryDays: number;
}

type ShipItemForm = {
  id: string;
  orderDetailId: number;
  productName: string;
  productId: number;
  categoryId?: number;
  entryNumber: number;
  totalQuantity: number;
  quantity: number;
  serialNumber: string;
  lotNumber: string;
  availableIdentityNumbers?: IdentityNumberItem[];
  hasSerialNumbers?: boolean; // true if lotNumberInfo === null and serialNumberInfo exists
};

export const AdminOrderManagementPanel: React.FC = () => {
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Set default date range: from start of current year to today
  const getDefaultDateRange = () => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    return {
      from: formatDate(startOfYear),
      to: formatDate(today),
    };
  };

  const defaultDateRange = getDefaultDateRange();
  const [dateFrom, setDateFrom] = useState<string>(defaultDateRange.from);
  const [dateTo, setDateTo] = useState<string>(defaultDateRange.to);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithCustomer | null>(
    null
  );
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [isShipDialogOpen, setIsShipDialogOpen] = useState(false);
  const [shipItems, setShipItems] = useState<ShipItemForm[]>([]);
  const [isShipping, setIsShipping] = useState(false);
  const [shipFormError, setShipFormError] = useState<string>("");
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportDateFrom, setExportDateFrom] = useState<string>("");
  const [exportDateTo, setExportDateTo] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    processing: 0,
    paid: 0,
    shipped: 0,
    cancelled: 0,
    delivered: 0,
    refunded: 0,
    fulfillmentRate: 0,
    cancellationRate: 0,
    refundRate: 0,
    averageDeliveryDays: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingIdentityNumbers, setIsLoadingIdentityNumbers] =
    useState(false);
  const [allOrders, setAllOrders] = useState<OrderWithCustomer[]>([]);

  // Fetch all orders for filtering
  const fetchAllOrders = async (status?: OrderStatus) => {
    try {
      let allData: OrderWithCustomer[] = [];
      let currentPageNum = 1;
      let hasMore = true;
      const fetchPageSize = 100;

      while (hasMore) {
        const response: GetAllOrdersResponse = await getAllOrders(
          currentPageNum,
          fetchPageSize,
          status === "all" ? undefined : status
        );

        if (response.status && response.data && response.data.data) {
          allData = [...allData, ...response.data.data];
          hasMore = currentPageNum < response.data.totalPages;
          currentPageNum++;
        } else {
          hasMore = false;
        }
      }

      setAllOrders(allData);
      setCurrentPage(1);
    } catch (err: any) {
      console.error("Error fetching all orders:", err);
      setAllOrders([]);
    }
  };

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
      } else {
        setError(
          response.errors?.join(", ") || "Không thể tải dữ liệu đơn hàng"
        );
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.errors?.join(", ") ||
        err?.message ||
        "Có lỗi xảy ra khi tải đơn hàng";
      setError(errorMessage);
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStatistics = async () => {
    try {
      setIsLoadingStats(true);
      // Fetch all orders for filtering
      await fetchAllOrders(statusFilter === "all" ? undefined : statusFilter);

      // Call the real API to get order statistics
      const statistics: AdminOrderStatistics = await getAdminOrderStatistics(
        dateFrom,
        dateTo
      );

      setStats({
        total: statistics.totalOrders || 0,
        pending: statistics.ordersByStatus?.pending || 0,
        processing: statistics.ordersByStatus?.processing || 0,
        paid: statistics.ordersByStatus?.paid || 0,
        shipped: statistics.ordersByStatus?.shipped || 0,
        cancelled: statistics.ordersByStatus?.cancelled || 0,
        delivered: statistics.ordersByStatus?.delivered || 0,
        refunded: statistics.ordersByStatus?.refunded || 0,
        fulfillmentRate: statistics.fulfillmentRate || 0,
        cancellationRate: statistics.cancellationRate || 0,
        refundRate: statistics.refundRate || 0,
        averageDeliveryDays: statistics.averageDeliveryDays || 0,
      });
    } catch (err: any) {
      console.error("Error fetching order statistics:", err);
      setStats({
        total: 0,
        pending: 0,
        processing: 0,
        paid: 0,
        shipped: 0,
        cancelled: 0,
        delivered: 0,
        refunded: 0,
        fulfillmentRate: 0,
        cancellationRate: 0,
        refundRate: 0,
        averageDeliveryDays: 0,
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, pageSize, statusFilter]);

  useEffect(() => {
    fetchOrderStatistics();
  }, []);

  // Helper function to get display status based on payment method
  const getDisplayStatus = (status: string, paymentMethod?: string): string => {
    // Với Banking: Nếu status là "Pending", hiển thị như "Paid" (vì Banking phải thanh toán trước)
    if (paymentMethod === "Banking" && status === "Pending") {
      return "Paid";
    }
    return status;
  };

  // Reset newStatus when order changes
  useEffect(() => {
    if (selectedOrder) {
      // Map status để hiển thị đúng cho Banking
      const displayStatus = getDisplayStatus(
        selectedOrder.status,
        selectedOrder.orderPaymentMethod
      );
      setNewStatus(displayStatus);
      setShowCancelReason(false);
      setCancelReason("");
    }
  }, [selectedOrder]);

  const handleViewOrder = async (order: OrderWithCustomer) => {
    setIsDetailDialogOpen(true);

    // Show basic info first with safe defaults
    setSelectedOrder({
      ...order,
      address: order.address || ({} as any),
      customer: order.customer || ({} as any),
      orderDetails: order.orderDetails || [],
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

    // Với Banking: Nếu status hiện tại là "Pending" và chọn "Paid", không cần update (vì đã đúng)
    if (
      selectedOrder.orderPaymentMethod === "Banking" &&
      selectedOrder.status === "Pending" &&
      newStatus === "Paid"
    ) {
      // Không cần update, chỉ cần refresh để hiển thị đúng
      await fetchOrders();
      if (selectedOrder) {
        const orderResponse = await getOrderById(selectedOrder.id);
        if (orderResponse.status && orderResponse.data) {
          setSelectedOrder(orderResponse.data);
        }
      }
      return;
    }

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

        // Refresh statistics
        await fetchOrderStatistics();

        setShowCancelReason(false);
        setCancelReason("");
        setNewStatus("");

        // Show success dialog
        setSuccessMessage("Cập nhật trạng thái đơn hàng thành công!");
        setIsSuccessDialogOpen(true);
      } else {
        console.error("Failed to update order status:", response);
        // Get detailed error message from API response
        const errorMessages = response.errors || [];
        const apiErrorMessage =
          errorMessages.length > 0
            ? errorMessages.join("\n")
            : `Lỗi: ${response.statusCode || "Unknown"}`;
        setErrorMessage(apiErrorMessage);
        setIsErrorDialogOpen(true);
      }
    } catch (error: any) {
      console.error("Error updating order status:", error);
      // Extract detailed error message from various possible formats
      let apiErrorMessage = "Có lỗi xảy ra khi cập nhật trạng thái đơn hàng";

      if (error?.errors && Array.isArray(error.errors)) {
        apiErrorMessage = error.errors.join("\n");
      } else if (
        error?.response?.data?.errors &&
        Array.isArray(error.response.data.errors)
      ) {
        apiErrorMessage = error.response.data.errors.join("\n");
      } else if (error?.response?.data?.errors?.[0]) {
        apiErrorMessage = error.response.data.errors[0];
      } else if (error?.response?.data?.message) {
        apiErrorMessage = error.response.data.message;
      } else if (error?.message) {
        apiErrorMessage = error.message;
      } else if (error?.statusCode) {
        apiErrorMessage = `Lỗi ${error.statusCode}: ${
          error.errors?.[0] || "Không thể cập nhật trạng thái đơn hàng"
        }`;
      }

      setErrorMessage(apiErrorMessage);
      setIsErrorDialogOpen(true);
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
      if (
        selectedOrder &&
        selectedOrder.status !== "Shipped" &&
        selectedOrder.status !== "Delivered"
      ) {
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

    setIsLoadingIdentityNumbers(true);
    setShipFormError("");

    try {
      // Fetch categoryId and identity numbers for each product
      const itemGroups = await Promise.all(
        selectedOrder.orderDetails.map(async (detail) => {
          let categoryId = detail.product.categoryId;

          if (!categoryId) {
            try {
              const product = await getProductById(detail.product.id);
              categoryId = product.categoryId;
            } catch (error) {
              console.error(
                `Failed to fetch category for product ${detail.product.id}:`,
                error
              );
            }
          }

          // Fetch identity numbers for this product with metadata
          let availableIdentityNumbers: IdentityNumberItem[] = [];
          let hasSerialNumbers = false;
          try {
            const { items, metadata } = await getIdentityNumbersWithMetadata(
              detail.product.id
            );
            availableIdentityNumbers = items;
            hasSerialNumbers = metadata.hasSerialNumbers;
            console.log(
              `Identity numbers for product ${detail.product.id}:`,
              availableIdentityNumbers
            );
            console.log(`Has serial numbers:`, hasSerialNumbers);
          } catch (error) {
            console.error(
              `Failed to fetch identity numbers for product ${detail.product.id}:`,
              error
            );
          }

          // Use metadata to determine if serial numbers are required
          // If hasSerialNumbers is true (lotNumberInfo === null), then serial numbers are required
          const requiresSerial = hasSerialNumbers;

          if (requiresSerial) {
            return Array.from({ length: detail.quantity }).map((_, idx) => ({
              id: `${detail.id}-${idx}`,
              orderDetailId: detail.id,
              productId: detail.product.id,
              productName: detail.product.productName,
              categoryId,
              entryNumber: idx + 1,
              totalQuantity: detail.quantity,
              quantity: 1,
              serialNumber: "",
              lotNumber: "",
              availableIdentityNumbers,
              hasSerialNumbers,
            }));
          }

          return [
            {
              id: `${detail.id}`,
              orderDetailId: detail.id,
              productId: detail.product.id,
              productName: detail.product.productName,
              categoryId,
              entryNumber: 1,
              totalQuantity: detail.quantity,
              quantity: detail.quantity,
              serialNumber: "",
              lotNumber: "",
              availableIdentityNumbers,
              hasSerialNumbers,
            },
          ];
        })
      );

      setShipItems(itemGroups.flat());
      setIsShipDialogOpen(true);
    } catch (error) {
      console.error("Error opening ship dialog:", error);
      setShipFormError("Không thể tải thông tin sản phẩm. Vui lòng thử lại.");
    } finally {
      setIsLoadingIdentityNumbers(false);
    }
  };

  const handleShipDialogChange = (open: boolean) => {
    setIsShipDialogOpen(open);
    if (!open) {
      setShipItems([]);
      setShipFormError("");
      setNewStatus("");
    }
  };

  const handleShipOrder = async () => {
    if (!selectedOrder) return;

    for (const item of shipItems) {
      const requiresSerial = item.hasSerialNumbers ?? false;
      const lotNumber = item.lotNumber.trim();
      const serialNumber = item.serialNumber.trim();
      const quantity = Number(item.quantity);

      if (!lotNumber) {
        setShipFormError(
          `Sản phẩm "${item.productName}"${
            requiresSerial
              ? ` (mục ${item.entryNumber}/${item.totalQuantity})`
              : ""
          } đang thiếu số lô.`
        );
        return;
      }

      if (requiresSerial && !serialNumber) {
        setShipFormError(
          `Sản phẩm "${item.productName}" (mục ${item.entryNumber}/${item.totalQuantity}) đang thiếu số seri.`
        );
        return;
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        setShipFormError(
          `Vui lòng nhập số lượng hợp lệ cho sản phẩm "${item.productName}".`
        );
        return;
      }

      if (requiresSerial && quantity !== 1) {
        setShipFormError(
          `Sản phẩm "${item.productName}" yêu cầu số seri nên số lượng mỗi mục phải bằng 1.`
        );
        return;
      }

      if (!requiresSerial && quantity > item.totalQuantity) {
        setShipFormError(
          `Số lượng gửi của "${item.productName}" không được vượt quá ${item.totalQuantity}.`
        );
        return;
      }
    }

    setIsShipping(true);
    setShipFormError("");
    try {
      // Group items by orderDetailId
      const groupedByOrderDetail = shipItems.reduce((acc, item) => {
        if (!acc[item.orderDetailId]) {
          acc[item.orderDetailId] = [];
        }
        acc[item.orderDetailId].push(item);
        return acc;
      }, {} as Record<number, typeof shipItems>);

      // Build payload in new format and check for duplicates
      const payload: ShipOrderItem[] = Object.entries(groupedByOrderDetail).map(
        ([orderDetailId, items]) => {
          const requiresSerial = items[0].hasSerialNumbers ?? false;

          // Check for duplicate serial numbers within the same orderDetailId
          if (requiresSerial) {
            const serialNumbers = items
              .map((item) => item.serialNumber?.trim())
              .filter(Boolean) as string[];
            const uniqueSerialNumbers = new Set(serialNumbers);

            if (serialNumbers.length !== uniqueSerialNumbers.size) {
              const duplicates = serialNumbers.filter(
                (serial, index) => serialNumbers.indexOf(serial) !== index
              );
              throw new Error(
                `Số seri bị trùng lặp trong cùng một đơn hàng chi tiết #${orderDetailId}: ${[
                  ...new Set(duplicates),
                ].join(", ")}`
              );
            }
          }

          const identityNumbers = items.map((item) => {
            const identityNumber: any = {
              lotNumber: item.lotNumber.trim(),
              quantity: item.quantity,
            };
            if (requiresSerial && item.serialNumber) {
              identityNumber.serialNumber = item.serialNumber.trim();
            }
            return identityNumber;
          });

          return {
            orderDetailId: Number(orderDetailId),
            identityNumbers,
          };
        }
      );

      console.log(
        "Shipping order with payload:",
        JSON.stringify(payload, null, 2)
      );
      console.log("Ship items before grouping:", shipItems);
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

        // Refresh statistics
        await fetchOrderStatistics();

        handleShipDialogChange(false);

        // Show success dialog
        setSuccessMessage("Đã gửi đơn hàng thành công!");
        setIsSuccessDialogOpen(true);
      } else {
        console.error("Failed to ship order:", response);
        // Get detailed error message from API response
        const errorMessages = response.errors || [];
        const apiErrorMessage =
          errorMessages.length > 0
            ? errorMessages.join("\n")
            : `Lỗi: ${response.statusCode || "Unknown"}`;
        setShipFormError(apiErrorMessage);
        setErrorMessage(apiErrorMessage);
        setIsErrorDialogOpen(true);
      }
    } catch (error: any) {
      console.error("Error shipping order:", error);
      // Extract detailed error message from various possible formats
      let apiErrorMessage = "Có lỗi xảy ra khi gửi đơn hàng";

      if (error?.errors && Array.isArray(error.errors)) {
        apiErrorMessage = error.errors.join("\n");
      } else if (
        error?.response?.data?.errors &&
        Array.isArray(error.response.data.errors)
      ) {
        apiErrorMessage = error.response.data.errors.join("\n");
      } else if (error?.response?.data?.errors?.[0]) {
        apiErrorMessage = error.response.data.errors[0];
      } else if (error?.response?.data?.message) {
        apiErrorMessage = error.response.data.message;
      } else if (error?.message) {
        apiErrorMessage = error.message;
      } else if (error?.statusCode) {
        apiErrorMessage = `Lỗi ${error.statusCode}: ${
          error.errors?.[0] || "Không thể gửi đơn hàng"
        }`;
      }

      setShipFormError(apiErrorMessage);
      setErrorMessage(apiErrorMessage);
      setIsErrorDialogOpen(true);
    } finally {
      setIsShipping(false);
    }
  };

  const handleExportDialogOpen = () => {
    // Initialize with default date range: 30 days ago to today
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    setExportDateFrom(formatDate(thirtyDaysAgo));
    setExportDateTo(formatDate(today));
    setIsExportDialogOpen(true);
  };

  const handleExportTransactions = async () => {
    if (!exportDateFrom || !exportDateTo) {
      setErrorMessage("Vui lòng chọn cả ngày bắt đầu và ngày kết thúc");
      setIsErrorDialogOpen(true);
      return;
    }

    if (new Date(exportDateFrom) > new Date(exportDateTo)) {
      setErrorMessage("Ngày bắt đầu không được sau ngày kết thúc");
      setIsErrorDialogOpen(true);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedEndDate = new Date(exportDateTo);
    selectedEndDate.setHours(0, 0, 0, 0);

    if (selectedEndDate > today) {
      setErrorMessage("Ngày kết thúc không được vượt quá ngày hôm nay");
      setIsErrorDialogOpen(true);
      return;
    }

    setIsExporting(true);
    try {
      const blob = await exportAdminTransactions(exportDateFrom, exportDateTo);

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `GiaoDich_${exportDateFrom}_${exportDateTo}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccessMessage("Xuất file Excel thành công!");
      setIsSuccessDialogOpen(true);
      setIsExportDialogOpen(false);
    } catch (error: any) {
      console.error("Error exporting transactions:", error);
      let errorMsg = "Có lỗi xảy ra khi xuất dữ liệu";

      if (
        error?.response?.data?.errors &&
        Array.isArray(error.response.data.errors)
      ) {
        errorMsg = error.response.data.errors.join("\n");
      } else if (error?.message) {
        errorMsg = error.message;
      }

      setErrorMessage(errorMsg);
      setIsErrorDialogOpen(true);
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusSteps = (paymentMethod?: string) => {
    const allSteps = [
      { status: "Pending", label: "Chờ xử lý", icon: Clock },
      { status: "Paid", label: "Đã thanh toán", icon: DollarSign },
      { status: "Processing", label: "Đang đóng gói", icon: Loader2 },
      { status: "Shipped", label: "Đã gửi", icon: Truck },
      { status: "Delivered", label: "Đã nhận", icon: CheckCircle },
    ];

    // Nếu là COD, bỏ bước "Đã thanh toán"
    if (paymentMethod === "COD") {
      return allSteps.filter((step) => step.status !== "Paid");
    }

    return allSteps;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    // Parse the date using helper that handles timezone correctly
    if (!dateString) return "-";

    const date = parseApiDateTime(dateString);

    // Format in Vietnam timezone: HH:mm dd/mm/yyyy
    const formatter = new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const hourIndex = parts.findIndex((p) => p.type === "hour");
    const minuteIndex = parts.findIndex((p) => p.type === "minute");
    const dayIndex = parts.findIndex((p) => p.type === "day");
    const monthIndex = parts.findIndex((p) => p.type === "month");
    const yearIndex = parts.findIndex((p) => p.type === "year");

    if (
      hourIndex >= 0 &&
      minuteIndex >= 0 &&
      dayIndex >= 0 &&
      monthIndex >= 0 &&
      yearIndex >= 0
    ) {
      const hour = parts[hourIndex].value;
      const minute = parts[minuteIndex].value;
      const day = parts[dayIndex].value;
      const month = parts[monthIndex].value;
      const year = parts[yearIndex].value;

      return `${hour}:${minute} ${day}/${month}/${year}`;
    }

    return formatVietnamDateTime(dateString);
  };

  const getStatusBadge = (status: string, paymentMethod?: string) => {
    // Với Banking: Nếu status là "Pending", hiển thị như "Paid" (vì Banking phải thanh toán trước)
    const displayStatus =
      paymentMethod === "Banking" && status === "Pending" ? "Paid" : status;

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

    const config = statusConfig[displayStatus] || statusConfig.Pending;
    return (
      <Badge className={`${config.bg} ${config.text} border-0`}>
        {displayStatus}
      </Badge>
    );
  };

  const getProductImageUrl = (images: any): string | undefined => {
    if (!images) return undefined;
    if (Array.isArray(images)) {
      const first = images[0];
      if (!first) return undefined;
      if (typeof first === "object" && first !== null) {
        if ("imageUrl" in first && typeof first.imageUrl === "string")
          return first.imageUrl;
        if ("url" in first && typeof first.url === "string") return first.url;
        if ("image" in first && typeof first.image === "string")
          return first.image;
      }
      return typeof first === "string" ? first : undefined;
    }
    if (typeof images === "object" && images !== null) {
      if ("imageUrl" in images && typeof images.imageUrl === "string")
        return images.imageUrl;
      if ("url" in images && typeof images.url === "string") return images.url;
      if ("image" in images && typeof images.image === "string")
        return images.image;
    }
    return typeof images === "string" ? images : undefined;
  };

  const allFilteredOrders = useMemo(() => {
    let result = allOrders.length > 0 ? allOrders : orders;

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((order) => order.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (order) =>
          order.id.toString().includes(query) ||
          order.customer.fullName.toLowerCase().includes(query) ||
          order.customer.email.toLowerCase().includes(query) ||
          order.trackingNumber?.toLowerCase().includes(query) ||
          order.notes?.toLowerCase().includes(query)
      );
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      result = result.filter((order) => {
        const orderDate = new Date(order.createdAt).toISOString().split("T")[0];

        if (dateFrom && orderDate < dateFrom) return false;
        if (dateTo && orderDate > dateTo) return false;

        return true;
      });
    }

    return result;
  }, [allOrders, orders, statusFilter, searchQuery, dateFrom, dateTo]);

  // Paginate filtered results
  const filteredOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return allFilteredOrders.slice(startIndex, endIndex);
  }, [allFilteredOrders, currentPage, pageSize]);

  // Calculate pagination based on filtered results
  const filteredTotalRecords = allFilteredOrders.length;
  const filteredTotalPages = Math.ceil(filteredTotalRecords / pageSize);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Quản lý đơn hàng
          </h2>
          <p className="text-sm text-gray-500">
            Quản lý và theo dõi tất cả đơn hàng của khách hàng
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportDialogOpen}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 mb-6">
        {/* Total Orders */}
        <Card className="p-4 relative overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 text-blue-600">
            <Package className="h-16 w-16" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Tổng đơn hàng</p>
            <p className="text-2xl font-bold tracking-tight">
              {isLoadingStats ? "..." : stats.total}
            </p>
          </div>
        </Card>

        {/* Pending */}
        <Card className="p-4 relative overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 text-yellow-600">
            <Clock className="h-16 w-16" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Chờ xử lý</p>
            <p className="text-2xl font-bold tracking-tight text-yellow-600">
              {isLoadingStats ? "..." : stats.pending}
            </p>
          </div>
        </Card>

        {/* Processing */}
        <Card className="p-4 relative overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 text-orange-600">
            <Loader2 className="h-16 w-16" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Đang xử lý</p>
            <p className="text-2xl font-bold tracking-tight text-orange-600">
              {isLoadingStats ? "..." : stats.processing}
            </p>
          </div>
        </Card>

        {/* Paid */}
        <Card className="p-4 relative overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 text-blue-600">
            <DollarSign className="h-16 w-16" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Đã thanh toán</p>
            <p className="text-2xl font-bold tracking-tight text-blue-600">
              {isLoadingStats ? "..." : stats.paid}
            </p>
          </div>
        </Card>

        {/* Shipped */}
        <Card className="p-4 relative overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 text-cyan-600">
            <Truck className="h-16 w-16" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Đã gửi</p>
            <p className="text-2xl font-bold tracking-tight text-cyan-600">
              {isLoadingStats ? "..." : stats.shipped}
            </p>
          </div>
        </Card>

        {/* Delivered */}
        <Card className="p-4 relative overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 text-green-600">
            <CheckCircle className="h-16 w-16" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Đã giao</p>
            <p className="text-2xl font-bold tracking-tight text-green-600">
              {isLoadingStats ? "..." : stats.delivered}
            </p>
          </div>
        </Card>

        {/* Cancelled */}
        <Card className="p-4 relative overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 text-red-600">
            <XCircle className="h-16 w-16" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Đã hủy</p>
            <p className="text-2xl font-bold tracking-tight text-red-600">
              {isLoadingStats ? "..." : stats.cancelled}
            </p>
          </div>
        </Card>

        {/* Refunded */}
        <Card className="p-4 relative overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 text-gray-600">
            <AlertCircle className="h-16 w-16" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Đã hoàn tiền</p>
            <p className="text-2xl font-bold tracking-tight text-gray-600">
              {isLoadingStats ? "..." : stats.refunded}
            </p>
          </div>
        </Card>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tỷ lệ hoàn thành</p>
              <p className="text-2xl font-bold tracking-tight text-green-600">
                {isLoadingStats
                  ? "..."
                  : `${stats.fulfillmentRate.toFixed(1)}%`}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tỷ lệ hủy đơn</p>
              <p className="text-2xl font-bold tracking-tight text-red-600">
                {isLoadingStats
                  ? "..."
                  : `${stats.cancellationRate.toFixed(1)}%`}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Thời gian giao hàng TB</p>
              <p className="text-2xl font-bold tracking-tight text-blue-600">
                {isLoadingStats ? "..." : `${stats.averageDeliveryDays} ngày`}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter block */}
      <Card className="mb-6">
        <div className="p-4 border-b text-sm font-medium text-gray-700">
          Bộ lọc và tìm kiếm
        </div>
        <div className="p-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Input
                placeholder="Tìm theo ID, tên, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => handleStatusChange(v as OrderStatus)}
            >
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
          <div className="grid gap-3 md:grid-cols-4 border-t pt-4">
            <div>
              <Label
                htmlFor="date-from"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Từ ngày
              </Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={dateTo || undefined}
              />
            </div>
            <div>
              <Label
                htmlFor="date-to"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Đến ngày
              </Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom || undefined}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={fetchOrderStatistics}
                disabled={isLoadingStats}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoadingStats ? "Đang tải..." : "Áp dụng"}
              </Button>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                  fetchOrderStatistics();
                }}
                disabled={isLoadingStats}
                className="w-full"
              >
                Xóa ngày
              </Button>
            </div>
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
            <Button
              onClick={fetchOrders}
              className="mt-4 bg-red-600 hover:bg-red-700"
            >
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
                  <div className="text-xs text-gray-500">
                    {order.trackingNumber || "Chưa có mã"}
                  </div>
                </div>
                <div className="col-span-3">
                  <div className="font-medium text-gray-900">
                    {order.customer.fullName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {order.customer.email}
                  </div>
                </div>
                <div className="col-span-2">
                  {getStatusBadge(order.status, order.orderPaymentMethod)}
                </div>
                <div className="col-span-2">
                  <div className="font-semibold text-gray-900">
                    {formatPrice(order.totalAmount)}
                  </div>
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
      {!loading && !error && filteredTotalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Hiển thị {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, filteredTotalRecords)} trong tổng
            số {filteredTotalRecords} đơn hàng
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
            {(() => {
              const pages: (number | string)[] = [];
              const maxVisiblePages = 5;

              if (filteredTotalPages <= maxVisiblePages + 2) {
                // Show all pages if total is small
                for (let i = 1; i <= filteredTotalPages; i++) {
                  pages.push(i);
                }
              } else {
                // Always show first page
                pages.push(1);

                if (currentPage > 3) {
                  pages.push("...");
                }

                // Show pages around current page
                const start = Math.max(2, currentPage - 1);
                const end = Math.min(filteredTotalPages - 1, currentPage + 1);

                for (let i = start; i <= end; i++) {
                  pages.push(i);
                }

                if (currentPage < filteredTotalPages - 2) {
                  pages.push("...");
                }

                // Always show last page
                pages.push(filteredTotalPages);
              }

              return pages.map((page, index) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-gray-500"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page as number)}
                    className={
                      currentPage === page
                        ? "bg-blue-600 hover:bg-blue-700"
                        : ""
                    }
                  >
                    {page}
                  </Button>
                )
              );
            })()}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === filteredTotalPages}
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
                      <p className="font-medium">
                        {selectedOrder.customer.fullName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="font-medium">
                        {selectedOrder.customer.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Số điện thoại:</span>
                      <p className="font-medium">
                        {selectedOrder.customer.phoneNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">
                        Trạng thái xác minh:
                      </span>
                      <p className="font-medium">
                        {selectedOrder.customer.isVerified ? (
                          <Badge className="bg-green-100 text-green-700">
                            Đã xác minh
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-700">
                            Chưa xác minh
                          </Badge>
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
                    <p>
                      {getStatusBadge(
                        selectedOrder.status,
                        selectedOrder.orderPaymentMethod
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">
                      Phương thức thanh toán:
                    </span>
                    <p className="font-medium">
                      {selectedOrder.orderPaymentMethod}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">
                      Phương thức vận chuyển:
                    </span>
                    <p className="font-medium">
                      {selectedOrder.shippingMethod}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Mã vận đơn:</span>
                    <p className="font-medium">
                      {selectedOrder.trackingNumber || "Chưa có"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Ngày tạo:</span>
                    <p className="font-medium">
                      {formatDate(selectedOrder.createdAt)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Cập nhật lần cuối:</span>
                    <p className="font-medium">
                      {formatDate(selectedOrder.updatedAt)}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Cancelled Order Info */}
              {selectedOrder.status === "Cancelled" &&
                (selectedOrder.cancelledReason ||
                  selectedOrder.cancelledAt) && (
                  <Card className="p-4 border-red-200 bg-red-50">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-700">
                      <XCircle className="w-5 h-5" />
                      Thông tin hủy đơn hàng
                    </h3>
                    <div className="space-y-2 text-sm">
                      {selectedOrder.cancelledReason && (
                        <div>
                          <span className="text-gray-600 font-medium">
                            Lý do hủy:
                          </span>
                          <p className="text-gray-900 mt-1 p-2 bg-white rounded border border-red-200">
                            {selectedOrder.cancelledReason}
                          </p>
                        </div>
                      )}
                      {selectedOrder.cancelledAt && (
                        <div>
                          <span className="text-gray-600 font-medium">
                            Thời gian hủy:
                          </span>
                          <p className="text-gray-900 font-medium mt-1">
                            {formatDate(selectedOrder.cancelledAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

              {/* Status Step Indicator */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Loader2 className="w-5 h-5" />
                  Tiến trình đơn hàng
                </h3>
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    {(() => {
                      const statusSteps = getStatusSteps(
                        selectedOrder?.orderPaymentMethod
                      );
                      const getCurrentStatusIndex = () => {
                        if (!selectedOrder) return -1;
                        const orderStatus = selectedOrder.status;
                        const paymentMethod = selectedOrder.orderPaymentMethod;
                        // Với Banking: Nếu status là "Pending", map sang "Paid" (vì Banking phải thanh toán trước)
                        if (
                          paymentMethod === "Banking" &&
                          orderStatus === "Pending"
                        ) {
                          return statusSteps.findIndex(
                            (s) => s.status === "Paid"
                          );
                        }
                        // Nếu là COD và status là "Paid", map sang "Processing" (bỏ qua bước Paid)
                        if (paymentMethod === "COD" && orderStatus === "Paid") {
                          return statusSteps.findIndex(
                            (s) => s.status === "Processing"
                          );
                        }
                        return statusSteps.findIndex(
                          (s) => s.status === orderStatus
                        );
                      };
                      const currentIndex = getCurrentStatusIndex();
                      return statusSteps.map((step, index) => {
                        const isCompleted = index <= currentIndex;
                        const isCurrent =
                          step.status === selectedOrder.status ||
                          (currentIndex === -1 && index === 0);
                        const Icon = step.icon;

                        return (
                          <div
                            key={step.status}
                            className="flex flex-col items-center flex-1"
                          >
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
                                isCompleted
                                  ? "text-green-600 font-medium"
                                  : "text-gray-500"
                              }`}
                            >
                              {step.label}
                            </p>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </Card>

              {/* Update Status Control */}
              <Card className="p-4 border-blue-200">
                <h3 className="font-semibold mb-3">Cập nhật trạng thái</h3>

                {showCancelReason ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Lý do hủy đơn hàng
                      </label>
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
                      <Select
                        value={
                          newStatus ||
                          getDisplayStatus(
                            selectedOrder.status,
                            selectedOrder.orderPaymentMethod
                          )
                        }
                        onValueChange={handleNewStatusChange}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedOrder.orderPaymentMethod !== "Banking" && (
                            <SelectItem value="Pending">Chờ xử lý</SelectItem>
                          )}
                          {selectedOrder.orderPaymentMethod !== "COD" && (
                            <SelectItem value="Paid">Đã thanh toán</SelectItem>
                          )}
                          <SelectItem value="Processing">
                            Đang đóng gói
                          </SelectItem>
                          <SelectItem value="Shipped">Đã gửi</SelectItem>
                          <SelectItem value="Delivered">Đã nhận</SelectItem>
                          <SelectItem value="Cancelled">
                            Hủy đơn hàng
                          </SelectItem>
                          <SelectItem value="Refunded">Đã hoàn tiền</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleUpdateStatus}
                        disabled={
                          !newStatus ||
                          isUpdatingStatus ||
                          newStatus ===
                            getDisplayStatus(
                              selectedOrder.status,
                              selectedOrder.orderPaymentMethod
                            )
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
                      {selectedOrder.address.locationAddress ||
                        "Chưa có địa chỉ"}
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
                    <span className="ml-2 text-gray-600">
                      Đang tải sản phẩm...
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedOrder.orderDetails &&
                    selectedOrder.orderDetails.length > 0 ? (
                      selectedOrder.orderDetails.map((item) => {
                        const productImageUrl = getProductImageUrl(
                          item.product.images
                        );
                        return (
                          <div
                            key={item.id}
                            className="flex items-start gap-4 border-b pb-3 last:border-0"
                          >
                            {/* Product Image */}
                            <div className="w-20 h-20 rounded-md overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-50">
                              {productImageUrl ? (
                                <img
                                  src={productImageUrl}
                                  alt={item.product.productName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                                  Không có ảnh
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {item.product.productName}
                              </p>
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
                              <p className="text-xs text-gray-500">
                                Số lượng: x{item.quantity}
                              </p>
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
                        );
                      })
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
      <Dialog open={isShipDialogOpen} onOpenChange={handleShipDialogChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Gửi đơn hàng #{selectedOrder?.id}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-gray-600">
              Vui lòng chọn số lô và số seri (nếu có) từ danh sách có sẵn trong
              kho cho từng sản phẩm.
            </p>
            {isLoadingIdentityNumbers && (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-sm text-gray-600">
                  Đang tải danh sách số lô/số seri...
                </span>
              </div>
            )}
            {shipFormError && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3 whitespace-pre-line">
                <div className="font-semibold mb-1">⚠️ Lỗi:</div>
                <div>{shipFormError}</div>
              </div>
            )}
            <div className="space-y-4">
              {shipItems.map((item, index) => {
                const hasSerialNumbers = item.hasSerialNumbers ?? false;
                const identityNumbers = item.availableIdentityNumbers || [];

                // Get unique lot numbers (for non-machinery products or to filter serials)
                const lotNumbers = Array.from(
                  new Set(
                    identityNumbers
                      .filter((id) => id.lotNumber)
                      .map((id) => id.lotNumber!)
                  )
                );

                // Get serial numbers filtered by selected lot number (if has serial numbers)
                const availableSerials =
                  hasSerialNumbers && item.lotNumber
                    ? identityNumbers.filter(
                        (id) =>
                          id.serialNumber && id.lotNumber === item.lotNumber
                      )
                    : identityNumbers.filter((id) => id.serialNumber);

                return (
                  <Card key={item.id} className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {item.productName} —{" "}
                          <span className="text-xs text-gray-500">
                            Mục {item.entryNumber}/{item.totalQuantity}
                          </span>
                        </h4>
                        {item.categoryId && (
                          <p className="text-xs text-gray-500">
                            Category ID: {item.categoryId}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`lot-${item.id}`}>
                          Số lô <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={item.lotNumber || ""}
                          onValueChange={(value) => {
                            setShipItems((prev) => {
                              const updated = [...prev];
                              updated[index] = {
                                ...updated[index],
                                lotNumber: value,
                                // Clear serial number when lot number changes (if has serial numbers)
                                serialNumber: hasSerialNumbers
                                  ? ""
                                  : updated[index].serialNumber,
                              };
                              return updated;
                            });
                            if (shipFormError) setShipFormError("");
                          }}
                        >
                          <SelectTrigger id={`lot-${item.id}`}>
                            <SelectValue placeholder="Chọn số lô" />
                          </SelectTrigger>
                          <SelectContent>
                            {lotNumbers.length > 0 ? (
                              lotNumbers.map((lotNum) => {
                                const lotItem = identityNumbers.find(
                                  (id) => id.lotNumber === lotNum
                                );
                                const quantity = lotItem?.remainingQuantity;
                                return (
                                  <SelectItem key={lotNum} value={lotNum}>
                                    {lotNum}
                                    {quantity !== undefined &&
                                      ` (Còn lại: ${quantity})`}
                                  </SelectItem>
                                );
                              })
                            ) : (
                              <SelectItem value="none" disabled>
                                Không có số lô có sẵn
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {lotNumbers.length === 0 &&
                          identityNumbers.length === 0 && (
                            <p className="text-xs text-amber-600">
                              ⚠️ Không có số lô có sẵn trong kho cho sản phẩm
                              này
                            </p>
                          )}
                      </div>
                      {hasSerialNumbers && (
                        <div className="grid gap-2">
                          <Label htmlFor={`serial-${item.id}`}>
                            Số seri <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={item.serialNumber || ""}
                            onValueChange={(value) => {
                              setShipItems((prev) => {
                                const updated = [...prev];
                                updated[index] = {
                                  ...updated[index],
                                  serialNumber: value,
                                };
                                return updated;
                              });
                              if (shipFormError) setShipFormError("");
                            }}
                            disabled={!item.lotNumber}
                          >
                            <SelectTrigger id={`serial-${item.id}`}>
                              <SelectValue
                                placeholder={
                                  item.lotNumber
                                    ? "Chọn số seri"
                                    : "Chọn số lô trước"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSerials.length > 0 ? (
                                availableSerials.map((id) => {
                                  // Check if this serial number is already selected by another item with the same orderDetailId
                                  const isAlreadySelected = shipItems.some(
                                    (otherItem) =>
                                      otherItem.orderDetailId ===
                                        item.orderDetailId &&
                                      otherItem.id !== item.id &&
                                      otherItem.serialNumber === id.serialNumber
                                  );

                                  return (
                                    <SelectItem
                                      key={id.serialNumber}
                                      value={id.serialNumber!}
                                      disabled={isAlreadySelected}
                                    >
                                      {id.serialNumber}
                                      {id.lotNumber && ` (Lô: ${id.lotNumber})`}
                                      {isAlreadySelected && " (Đã chọn)"}
                                    </SelectItem>
                                  );
                                })
                              ) : (
                                <SelectItem value="none" disabled>
                                  {item.lotNumber
                                    ? "Không có số seri có sẵn cho lô này"
                                    : "Vui lòng chọn số lô trước"}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          {!item.lotNumber && (
                            <p className="text-xs text-gray-500">
                              Vui lòng chọn số lô trước để hiển thị danh sách số
                              seri
                            </p>
                          )}
                          {item.lotNumber && availableSerials.length === 0 && (
                            <p className="text-xs text-amber-600">
                              ⚠️ Không có số seri có sẵn cho lô {item.lotNumber}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  handleShipDialogChange(false);
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

      {/* Success AlertDialog */}
      <AlertDialog
        open={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
      >
        <AlertDialogContent className="sm:max-w-[400px]">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-center">
              Thành công!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {successMessage || "Thao tác đã được thực hiện thành công."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setIsSuccessDialogOpen(false);
                setSuccessMessage("");
              }}
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
              Lỗi
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              <div className="mt-4">
                <div className="text-sm text-gray-700 whitespace-pre-line text-left bg-gray-50 p-3 rounded-md max-h-60 overflow-y-auto">
                  {errorMessage || "Có lỗi xảy ra. Vui lòng thử lại."}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setIsErrorDialogOpen(false);
                setErrorMessage("");
              }}
              className="bg-red-600 hover:bg-red-700 text-white w-full"
            >
              Đóng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Transactions Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Xuất dữ liệu giao dịch
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Chọn khoảng thời gian để xuất dữ liệu giao dịch thành file Excel.
            </p>

            {/* From Date */}
            <div>
              <Label
                htmlFor="export-from"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Từ ngày
              </Label>
              <Input
                id="export-from"
                type="date"
                value={exportDateFrom}
                onChange={(e) => setExportDateFrom(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mặc định: 30 ngày trước
              </p>
            </div>

            {/* To Date */}
            <div>
              <Label
                htmlFor="export-to"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Đến ngày
              </Label>
              <Input
                id="export-to"
                type="date"
                value={exportDateTo}
                onChange={(e) => setExportDateTo(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Không được vượt quá ngày hôm nay
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleExportTransactions}
                disabled={isExporting || !exportDateFrom || !exportDateTo}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xuất...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Xuất Excel
                  </>
                )}
              </Button>
              <Button
                onClick={() => setIsExportDialogOpen(false)}
                disabled={isExporting}
                variant="outline"
                className="flex-1"
              >
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrderManagementPanel;
