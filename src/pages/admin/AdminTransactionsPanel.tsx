import { useState, useEffect } from "react";
import {
  getAdminTransactions,
  type AdminTransaction,
  type AdminTransactionsResponse,
} from "@/api/admin-dashboard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  TrendingUp,
  DollarSign,
} from "lucide-react";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

export const AdminTransactionsPanel = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<AdminTransactionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  // Date range state
  const getInitialDateRange = () => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);

    return {
      from: from.toISOString().split("T")[0],
      to: to.toISOString().split("T")[0],
    };
  };

  const [dateRange, setDateRange] = useState(getInitialDateRange());
  const [selectedRange, setSelectedRange] = useState<
    "7days" | "30days" | "custom"
  >("30days");

  // Handle range change
  const handleRangeChange = (range: "7days" | "30days" | "custom") => {
    setSelectedRange(range);
    const to = new Date();
    const from = new Date();

    if (range === "7days") {
      from.setDate(from.getDate() - 7);
    } else if (range === "30days") {
      from.setDate(from.getDate() - 30);
    }

    if (range !== "custom") {
      setDateRange({
        from: from.toISOString().split("T")[0],
        to: to.toISOString().split("T")[0],
      });
      setCurrentPage(1); // Reset to page 1 when changing range
    }
  };

  // Handle custom date change
  const handleDateChange = (type: "from" | "to", value: string) => {
    setDateRange((prev) => ({
      ...prev,
      [type]: value,
    }));
    setCurrentPage(1); // Reset to page 1 when changing dates
  };

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getAdminTransactions(
          dateRange.from,
          dateRange.to,
          currentPage,
          pageSize
        );
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Không thể tải dữ liệu giao dịch"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [dateRange.from, dateRange.to, currentPage, pageSize]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Get transaction type label
  const getTransactionTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      PaymentIn: "Thanh toán vào",
      PaymentOut: "Thanh toán ra",
      Refund: "Hoàn tiền",
      Commission: "Hoa hồng",
      Withdraw: "Rút tiền",
      Deposit: "Nạp tiền",
    };
    return typeMap[type] || type;
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      Completed: "bg-green-100 text-green-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Failed: "bg-red-100 text-red-800",
      Cancelled: "bg-gray-100 text-gray-800",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      Completed: "Hoàn thành",
      Pending: "Đang xử lý",
      Failed: "Thất bại",
      Cancelled: "Đã hủy",
    };
    return statusMap[status] || status;
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Calculate total amount
  const totalAmount =
    data?.data.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lỗi</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Tổng giao dịch
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {data?.totalRecords || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Trong khoảng thời gian đã chọn
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Tổng giá trị
              </CardTitle>
              <DollarSign className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalAmount)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Trên trang hiện tại</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Tổng số trang
              </CardTitle>
              <Calendar className="h-5 w-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {data?.totalPages || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Trang {currentPage} / {data?.totalPages || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Danh sách giao dịch</CardTitle>
              <CardDescription className="mt-1">
                Quản lý và theo dõi tất cả các giao dịch trong hệ thống
              </CardDescription>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Khoảng thời gian:</Label>
              <div className="flex gap-2">
                <Button
                  variant={selectedRange === "7days" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleRangeChange("7days")}
                >
                  7 ngày
                </Button>
                <Button
                  variant={selectedRange === "30days" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleRangeChange("30days")}
                >
                  30 ngày
                </Button>
                <Button
                  variant={selectedRange === "custom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleRangeChange("custom")}
                >
                  Tùy chọn
                </Button>
              </div>
            </div>

            {/* Custom Date Picker */}
            {selectedRange === "custom" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="from-date" className="text-sm font-medium">
                    Từ ngày
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="from-date"
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => handleDateChange("from", e.target.value)}
                      className="pl-10"
                      max={dateRange.to}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to-date" className="text-sm font-medium">
                    Đến ngày
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="to-date"
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => handleDateChange("to", e.target.value)}
                      className="pl-10"
                      min={dateRange.from}
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-4" />
              <p className="text-sm text-gray-500">
                Đang tải dữ liệu giao dịch...
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-[80px] font-semibold">
                          ID
                        </TableHead>
                        <TableHead className="font-semibold">
                          Loại giao dịch
                        </TableHead>
                        <TableHead className="font-semibold">Số tiền</TableHead>
                        <TableHead className="w-[120px] font-semibold">
                          Trạng thái
                        </TableHead>
                        <TableHead className="font-semibold">
                          Thời gian
                        </TableHead>
                        <TableHead className="font-semibold">
                          Người thực hiện
                        </TableHead>
                        <TableHead className="font-semibold">
                          Người xử lý
                        </TableHead>
                        <TableHead className="font-semibold">Mô tả</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data && data.data.length > 0 ? (
                        data.data.map((transaction: AdminTransaction) => (
                          <TableRow
                            key={transaction.transactionId}
                            className="hover:bg-gray-50"
                          >
                            <TableCell className="font-medium text-blue-600">
                              #{transaction.transactionId}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                {getTransactionTypeLabel(
                                  transaction.transactionType
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="font-bold text-green-600">
                              {formatCurrency(transaction.amount)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(
                                  transaction.status
                                )}`}
                              >
                                {getStatusLabel(transaction.status)}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {formatDate(transaction.createdAt)}
                            </TableCell>
                            <TableCell className="font-medium">
                              {transaction.performer}
                            </TableCell>
                            <TableCell className="font-medium">
                              {transaction.processor}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div
                                className="truncate"
                                title={transaction.description}
                              >
                                {transaction.description}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <DollarSign className="h-12 w-12 mb-3 text-gray-300" />
                              <p className="font-medium">
                                Không có giao dịch nào
                              </p>
                              <p className="text-sm">
                                Trong khoảng thời gian đã chọn
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Hiển thị{" "}
                    <span className="font-semibold text-gray-900">
                      {(currentPage - 1) * pageSize + 1}
                    </span>{" "}
                    đến{" "}
                    <span className="font-semibold text-gray-900">
                      {Math.min(currentPage * pageSize, data.totalRecords)}
                    </span>{" "}
                    trong tổng số{" "}
                    <span className="font-semibold text-gray-900">
                      {data.totalRecords}
                    </span>{" "}
                    giao dịch
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!data.hasPreviousPage}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Trước
                    </Button>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium px-3 py-1 bg-green-50 text-green-700 rounded">
                        {currentPage}
                      </span>
                      <span className="text-sm text-gray-500">
                        / {data.totalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!data.hasNextPage}
                      className="gap-1"
                    >
                      Sau
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
