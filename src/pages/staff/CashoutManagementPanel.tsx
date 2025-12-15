import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CreditCard,
  DollarSign,
  Loader2,
  RefreshCw,
  User,
  CheckCircle,
  XCircle,
  X,
  Zap,
} from "lucide-react";
import {
  getAllCashoutRequest,
  processCashoutManual,
  type CashoutRequestData,
  type CashoutRequestsPage,
  type ProcessCashoutManualRequest,
  type ManualCashoutStatus,
} from "@/api/wallet";
import { usePayOSProcessing } from "./hooks/usePayOSProcessing";
import {
  PayOSConfirmDialog,
  PayOSSuccessDialog,
  PayOSErrorDialog,
} from "./components/PayOSDialogs";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("vi-VN");
  } catch {
    return value;
  }
};

const getStatusBadgeClass = (status?: string) => {
  if (!status) return "bg-yellow-100 text-yellow-700";
  
  const normalizedStatus = status.toLowerCase();
  
  switch (normalizedStatus) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "failed":
      return "bg-red-100 text-red-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    case "approved":
      return "bg-green-100 text-green-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "processing":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-yellow-100 text-yellow-700";
  }
};

const isStatusTrue = (status: unknown) => {
  if (typeof status === "boolean") return status;
  if (typeof status === "string") {
    return status.toLowerCase() === "true";
  }
  return false;
};

const isPendingStatus = (status?: string) => {
  if (!status) return false;
  const normalized = status.toLowerCase();
  return normalized === "pending" || normalized === "processing";
};

const defaultPagination: CashoutRequestsPage = {
  data: [],
  currentPage: 1,
  pageSize: 10,
  totalPages: 1,
  totalRecords: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

export const CashoutManagementPanel: React.FC = () => {
  const [requests, setRequests] = useState<CashoutRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginationMeta, setPaginationMeta] =
    useState<CashoutRequestsPage>(defaultPagination);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Process dialog states
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CashoutRequestData | null>(null);
  const [processStatus, setProcessStatus] = useState<ManualCashoutStatus>('Completed');
  const [gatewayPaymentId, setGatewayPaymentId] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  
  const selectedVendorId = useMemo(
    () => selectedRequest?.vendorId || selectedRequest?.user?.id || null,
    [selectedRequest]
  );
  const isGatewayPaymentRequired = processStatus === 'Completed';
  const isCancelReasonRequired = processStatus === 'Failed' || processStatus === 'Cancelled';
  const isGatewayPaymentValid = !isGatewayPaymentRequired || gatewayPaymentId.trim().length > 0;
  const isCancelReasonValid = !isCancelReasonRequired || cancelReason.trim().length > 0;
  const isManualProcessDisabled =
    isProcessing ||
    !selectedVendorId ||
    !isGatewayPaymentValid ||
    !isCancelReasonValid;
  
  // PayOS processing hook
  const payOSProcessing = usePayOSProcessing({
    onSuccess: () => {
      fetchCashoutRequests(currentPage, pageSize, { skipLoading: true });
    },
    onError: (error) => {
      setError(error);
    },
  });

  const fetchCashoutRequests = useCallback(
    async (
      page = currentPage,
      size = pageSize,
      options?: { skipLoading?: boolean }
    ) => {
      const skipLoading = options?.skipLoading ?? false;

      try {
        if (!skipLoading) {
          setLoading(true);
        }
        setError(null);

        // Gọi API để lấy tất cả cashout requests với phân trang
        const response = await getAllCashoutRequest(page, size);

        if (response && isStatusTrue(response.status) && response.data) {
          const paginationData = response.data;
          setRequests(paginationData.data || []);
          setPaginationMeta({
            data: paginationData.data || [],
            currentPage: paginationData.currentPage || page,
            pageSize: paginationData.pageSize || size,
            totalPages: paginationData.totalPages || 1,
            totalRecords: paginationData.totalRecords || 0,
            hasNextPage: paginationData.hasNextPage || false,
            hasPreviousPage: paginationData.hasPreviousPage || false,
          });
        } else {
          // Nếu không có data hoặc status false
          const errorMessage = response?.errors?.[0] || "Không thể tải danh sách yêu cầu rút tiền";
          setError(errorMessage);
          setRequests([]);
          setPaginationMeta((prev) => ({
            ...prev,
            data: [],
            currentPage: page,
            pageSize: size,
          }));
        }
      } catch (err: any) {
        const errorMessage =
          err?.errors?.[0] ||
          err?.message ||
          "Có lỗi xảy ra khi tải danh sách yêu cầu rút tiền";
        setError(errorMessage);
        setRequests([]);
        setPaginationMeta((prev) => ({
          ...prev,
          data: [],
          currentPage: page,
          pageSize: size,
        }));
      } finally {
        if (!skipLoading) {
          setLoading(false);
        }
      }
    },
    [currentPage, pageSize]
  );

  useEffect(() => {
    fetchCashoutRequests(currentPage, pageSize);
  }, [currentPage, pageSize, fetchCashoutRequests]);

  const pendingRequests = useMemo(
    () => requests.filter((item) => isPendingStatus(item.status)),
    [requests]
  );

  const pendingCount = useMemo(
    () => pendingRequests.length,
    [pendingRequests]
  );

  const totalPendingAmount = useMemo(
    () => pendingRequests.reduce((sum, item) => sum + (item.amount || 0), 0),
    [pendingRequests]
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchCashoutRequests(currentPage, pageSize, { skipLoading: true });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePageSizeChange = (value: string) => {
    const size = Number(value);
    setPageSize(size);
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < paginationMeta.totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleOpenProcessDialog = (request: CashoutRequestData) => {
    setSelectedRequest(request);
    setProcessStatus('Completed');
    setGatewayPaymentId('');
    setCancelReason('');
    setProcessError(null);
    setIsProcessDialogOpen(true);
  };

  const handleCloseProcessDialog = () => {
    setIsProcessDialogOpen(false);
    setSelectedRequest(null);
    setProcessStatus('Completed');
    setGatewayPaymentId('');
    setCancelReason('');
    setProcessError(null);
  };

  const handleProcessStatusChange = (value: ManualCashoutStatus) => {
    setProcessStatus(value);
    setGatewayPaymentId('');
    setCancelReason('');
    setProcessError(null);
  };

  const handleProcessCashout = async () => {
    if (!selectedRequest) {
      setProcessError('Không tìm thấy thông tin yêu cầu');
      return;
    }

    if (!selectedVendorId) {
      setProcessError('Không tìm thấy ID nhà cung cấp');
      return;
    }

    if (isGatewayPaymentRequired && !isGatewayPaymentValid) {
      setProcessError('Vui lòng nhập Gateway Payment ID cho trạng thái Completed');
      return;
    }

    if (isCancelReasonRequired && !isCancelReasonValid) {
      setProcessError('Vui lòng nhập lý do hủy cho trạng thái Failed/Cancelled');
      return;
    }

    setIsProcessing(true);
    setProcessError(null);

    try {
      const requestData: ProcessCashoutManualRequest = {
        status: processStatus,
        ...(processStatus === 'Completed' && { gatewayPaymentId: gatewayPaymentId.trim() }),
        ...((processStatus === 'Failed' || processStatus === 'Cancelled') && { cancelReason: cancelReason.trim() }),
      };

      const response = await processCashoutManual(selectedVendorId, requestData);

      if (response.status) {
        handleCloseProcessDialog();
        await fetchCashoutRequests(currentPage, pageSize, { skipLoading: true });
        setIsSuccessDialogOpen(true);
      } else {
        const errorMessage = response.errors && response.errors.length > 0
          ? response.errors.join(', ')
          : 'Không thể xử lý yêu cầu rút tiền';
        setProcessError(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.errors?.[0] || 'Có lỗi xảy ra khi xử lý yêu cầu rút tiền';
      setProcessError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Quản lý yêu cầu rút tiền
          </h2>
          <p className="text-sm text-gray-500">
            Xem và xử lý danh sách yêu cầu rút tiền đang chờ duyệt của nhà cung cấp
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={pageSize.toString()}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Số dòng" />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size} dòng / trang
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            className="gap-2"
          >
            {isRefreshing || loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Làm mới
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tổng yêu cầu</p>
              <p className="text-3xl font-bold text-gray-900">
                {paginationMeta.totalRecords}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
              <User className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Đang chờ duyệt</p>
              <p className="text-3xl font-bold text-yellow-600">
                {pendingCount}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tổng số tiền chờ duyệt</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(totalPendingAmount)}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {error && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-4 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Danh sách yêu cầu rút tiền
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !isRefreshing ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              Đang tải dữ liệu...
            </div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              Không có yêu cầu rút tiền nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Mã yêu cầu
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Nhà cung cấp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Số tiền
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Ngân hàng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Lý do/Ghi chú
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Ngày tạo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        #{request.id}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {request.vendor?.fullName ||
                              request.vendor?.email ||
                              request.user?.fullName ||
                              request.user?.email ||
                              "—"}
                          </span>
                          {(request.vendor?.email || request.user?.email) && (
                            <span className="text-xs text-gray-500">
                              {request.vendor?.email || request.user?.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-green-600">
                        {formatCurrency(request.amount)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-2 text-gray-900">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            {request.bankAccount?.bankCode || "—"}
                          </span>
                          <span className="flex items-center gap-2 text-gray-600">
                            <CreditCard className="h-4 w-4 text-gray-400" />
                            {request.bankAccount?.accountNumber || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        <div className="space-y-1">
                          {request.reason && (
                            <p className="text-gray-700">
                              <span className="font-medium text-gray-900">
                                Lý do:
                              </span>{" "}
                              {request.reason}
                            </p>
                          )}
                          {request.notes && (
                            <p className="text-gray-500">
                              <span className="font-medium text-gray-900">
                                Ghi chú:
                              </span>{" "}
                              {request.notes}
                            </p>
                          )}
                          {!request.reason && !request.notes && "—"}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        <div className="space-y-1">
                          <p>{formatDateTime(request.createdAt)}</p>
                          {request.processedAt && (
                            <p className="text-xs text-gray-500">
                              Xử lý: {formatDateTime(request.processedAt)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <Badge
                          className={`${getStatusBadgeClass(
                            request.status
                          )} border-0`}
                        >
                          {request.status || "Pending"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {isPendingStatus(request.status) && (request.vendorId || request.user?.id) && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => payOSProcessing.handleOpenPayOSConfirmDialog(request)}
                              disabled={payOSProcessing.isProcessingPayOS && payOSProcessing.processingPayOSId === request.id}
                              className="gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                            >
                              {payOSProcessing.isProcessingPayOS && payOSProcessing.processingPayOSId === request.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Đang xử lý...
                                </>
                              ) : (
                                <>
                                  <Zap className="h-4 w-4" />
                                  PayOS
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenProcessDialog(request)}
                              className="gap-1"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Thủ công
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-4 text-sm text-gray-600 md:flex-row">
            <div>
              Trang {paginationMeta.currentPage} / {paginationMeta.totalPages} •{" "}
              {paginationMeta.totalRecords} yêu cầu
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || loading}
                className="gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={
                  currentPage === paginationMeta.totalPages ||
                  loading ||
                  paginationMeta.totalPages === 0
                }
                className="gap-1"
              >
                Sau
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process Cashout AlertDialog */}
      <AlertDialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <AlertDialogContent className="sm:max-w-[500px]">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-center">
              Xử lý yêu cầu rút tiền #{selectedRequest?.id}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {selectedRequest && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Nhà cung cấp:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedRequest.vendor?.fullName || selectedRequest.user?.fullName || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Số tiền:</span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(selectedRequest.amount)}
                    </span>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Trạng thái xử lý <span className="text-red-500">*</span>
              </Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    value: "Completed" as ManualCashoutStatus,
                    title: "Completed",
                    description: "Đã thanh toán thành công",
                    helper: "Bắt buộc nhập Gateway Payment ID",
                    icon: CheckCircle,
                    accent: "text-green-600",
                  },
                  {
                    value: "Failed" as ManualCashoutStatus,
                    title: "Failed",
                    description: "Thanh toán thất bại",
                    helper: "Bắt buộc nhập lý do hủy",
                    icon: XCircle,
                    accent: "text-red-600",
                  },
                  {
                    value: "Cancelled" as ManualCashoutStatus,
                    title: "Cancelled",
                    description: "Hủy theo yêu cầu",
                    helper: "Bắt buộc nhập lý do hủy",
                    icon: X,
                    accent: "text-gray-600",
                  },
                ].map((option) => {
                  const Icon = option.icon;
                  const isActive = processStatus === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleProcessStatusChange(option.value)}
                      className={`flex flex-1 flex-col rounded-lg border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
                        isActive
                          ? "border-green-500 bg-green-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-green-400"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${option.accent}`} />
                        <span className="font-semibold text-gray-900">
                          {option.title}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {option.description}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        {option.helper}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {processStatus === 'Completed' && (
              <div className="space-y-2">
                <Label htmlFor="gatewayPaymentId" className="text-sm font-medium">
                  Gateway Payment ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="gatewayPaymentId"
                  placeholder="Nhập Gateway Payment ID"
                  value={gatewayPaymentId}
                  aria-invalid={isGatewayPaymentRequired && !isGatewayPaymentValid}
                  onChange={(e) => {
                    setGatewayPaymentId(e.target.value);
                    setProcessError(null);
                  }}
                />
                <p
                  className={`text-xs ${
                    isGatewayPaymentValid ? 'text-gray-500' : 'text-red-500'
                  }`}
                >
                  Mã thanh toán từ gateway (bắt buộc cho trạng thái Completed)
                </p>
              </div>
            )}

            {(processStatus === 'Failed' || processStatus === 'Cancelled') && (
              <div className="space-y-2">
                <Label htmlFor="cancelReason" className="text-sm font-medium">
                  Lý do hủy <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="cancelReason"
                  placeholder="Nhập lý do hủy yêu cầu rút tiền"
                  value={cancelReason}
                  aria-invalid={isCancelReasonRequired && !isCancelReasonValid}
                  onChange={(e) => {
                    setCancelReason(e.target.value);
                    setProcessError(null);
                  }}
                  rows={3}
                />
                <p
                  className={`text-xs ${
                    isCancelReasonValid ? 'text-gray-500' : 'text-red-500'
                  }`}
                >
                  Lý do hủy yêu cầu rút tiền (bắt buộc cho trạng thái Failed/Cancelled)
                </p>
              </div>
            )}

            {(processError || (!selectedVendorId && selectedRequest)) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start space-x-2 text-red-600">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    {processError ||
                      'Không tìm thấy ID nhà cung cấp hợp lệ cho yêu cầu này'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProcessCashout}
              disabled={isManualProcessDisabled}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Xác nhận xử lý
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              Yêu cầu rút tiền đã được xử lý thành công.
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

      {/* PayOS Dialogs */}
      <PayOSConfirmDialog
        open={payOSProcessing.isPayOSConfirmDialogOpen}
        onOpenChange={payOSProcessing.handleClosePayOSConfirmDialog}
        request={payOSProcessing.selectedPayOSRequest}
        isProcessing={payOSProcessing.isProcessingPayOS}
        onConfirm={payOSProcessing.handleProcessCashoutPayOS}
        onCancel={payOSProcessing.handleClosePayOSConfirmDialog}
      />

      <PayOSSuccessDialog
        open={payOSProcessing.isPayOSSuccessDialogOpen}
        onOpenChange={payOSProcessing.closePayOSSuccessDialog}
        data={payOSProcessing.payOSSuccessData}
        onClose={payOSProcessing.closePayOSSuccessDialog}
      />

      <PayOSErrorDialog
        open={payOSProcessing.isPayOSErrorDialogOpen}
        onOpenChange={payOSProcessing.closePayOSErrorDialog}
        error={payOSProcessing.payOSError}
        onClose={payOSProcessing.closePayOSErrorDialog}
      />
    </div>
  );
};

export default CashoutManagementPanel;

