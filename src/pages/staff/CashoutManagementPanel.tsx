import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Zap,
} from "lucide-react";
import {
  getAllCashoutRequest,
  type CashoutRequestData,
  type CashoutRequestsPage,
} from "@/api/wallet";
import {
  getSupportedBanks,
  type SupportedBank,
} from "@/api/vendorbankaccounts";
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
  const [banks, setBanks] = useState<SupportedBank[]>([]);

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
          const errorMessage =
            response?.errors?.[0] || "Không thể tải danh sách yêu cầu rút tiền";
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
    const fetchBanks = async () => {
      try {
        const bankList = await getSupportedBanks();
        setBanks(bankList);
      } catch (err) {
        console.error("Failed to fetch banks:", err);
      }
    };
    fetchBanks();
  }, []);

  useEffect(() => {
    fetchCashoutRequests(currentPage, pageSize);
  }, [currentPage, pageSize, fetchCashoutRequests]);

  const pendingRequests = useMemo(
    () => requests.filter((item) => isPendingStatus(item.status)),
    [requests]
  );

  const pendingCount = useMemo(() => pendingRequests.length, [pendingRequests]);

  const totalPendingAmount = useMemo(
    () => pendingRequests.reduce((sum, item) => sum + (item.amount || 0), 0),
    [pendingRequests]
  );

  const getBankName = useCallback(
    (bankCode?: string) => {
      if (!bankCode) return "—";
      const bank = banks.find((b) => b.bin === bankCode || b.code === bankCode);
      return bank ? bank.shortName || bank.name : bankCode;
    },
    [banks]
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Quản lý yêu cầu rút tiền
          </h2>
          <p className="text-sm text-gray-500">
            Xem và xử lý danh sách yêu cầu rút tiền đang chờ duyệt của nhà cung
            cấp
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
                          <span className="flex items-center gap-2 text-gray-900 font-medium">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            {getBankName(request.bankAccount?.bankCode)}
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
                        {isPendingStatus(request.status) &&
                          (request.vendorId || request.user?.id) && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  payOSProcessing.handleOpenPayOSConfirmDialog(
                                    request
                                  )
                                }
                                disabled={
                                  payOSProcessing.isProcessingPayOS &&
                                  payOSProcessing.processingPayOSId ===
                                    request.id
                                }
                                className="gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                              >
                                {payOSProcessing.isProcessingPayOS &&
                                payOSProcessing.processingPayOSId ===
                                  request.id ? (
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
