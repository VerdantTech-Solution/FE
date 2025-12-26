import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getVendorTransactions,
  type VendorTransaction,
  type TransactionPaginatedData,
} from "@/api/vendordashboard";
import {
  Loader2,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import ExportExcelDialog from "./ExportExcelDialog";

interface TransactionHistoryProps {
  userId?: number;
}

const TransactionHistory = ({ userId }: TransactionHistoryProps) => {
  const [transactions, setTransactions] =
    useState<TransactionPaginatedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date filters
  const getDefaultDateRange = () => {
    const now = new Date();
    const to = now.toISOString().split("T")[0];
    const fromDate = new Date(now);
    fromDate.setMonth(now.getMonth() - 1);
    const from = fromDate.toISOString().split("T")[0];
    return { from, to };
  };

  const [dateFrom, setDateFrom] = useState(getDefaultDateRange().from);
  const [dateTo, setDateTo] = useState(getDefaultDateRange().to);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Load transactions
  const loadTransactions = async (page: number = 1) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getVendorTransactions(
        dateFrom,
        dateTo,
        page,
        pageSize
      );
      setTransactions(data);
      setCurrentPage(page);
    } catch (err: any) {
      console.error("Load transactions error:", err);
      setError(err?.message || "Không thể tải danh sách giao dịch");
      setTransactions(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadTransactions(1);
    }
  }, [userId, dateFrom, dateTo]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm");
    } catch {
      return dateString;
    }
  };

  // Get status badge color
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get status label
  const getStatusLabel = (status: string): string => {
    switch (status.toLowerCase()) {
      case "completed":
        return "Hoàn thành";
      case "pending":
        return "Đang xử lý";
      case "failed":
        return "Thất bại";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  // Get transaction type label
  const getTransactionTypeLabel = (type: string): string => {
    const types: Record<string, string> = {
      VendorSubscription: "Đăng ký gói",
      Topup: "Nạp tiền",
      Cashout: "Rút tiền",
      OrderPayment: "Thanh toán đơn hàng",
      Refund: "Hoàn tiền",
    };
    return types[type] || type;
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Lịch sử giao dịch
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Xuất Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Date filters */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="dateFrom" className="text-sm font-medium">
              Từ ngày
            </Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="dateTo" className="text-sm font-medium">
              Đến ngày
            </Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => loadTransactions(1)}
              disabled={loading}
              className="w-full"
            >
              <Filter className="w-4 h-4 mr-2" />
              Lọc
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Đang tải...</span>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading &&
          !error &&
          (!transactions?.data || transactions.data.length === 0) && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                Không có giao dịch nào trong khoảng thời gian này
              </p>
            </div>
          )}

        {/* Transactions table */}
        {!loading &&
          !error &&
          transactions?.data &&
          transactions.data.length > 0 && (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã GD</TableHead>
                      <TableHead>Loại giao dịch</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Người thực hiện</TableHead>
                      <TableHead>Người xử lý</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.data.map((transaction) => (
                      <TableRow key={transaction.transactionId}>
                        <TableCell className="font-medium">
                          #{transaction.transactionId}
                        </TableCell>
                        <TableCell>
                          {getTransactionTypeLabel(transaction.transactionType)}
                        </TableCell>
                        <TableCell className="font-semibold whitespace-nowrap">
                          {formatCurrency(transaction.amount)} ₫
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(
                              transaction.status
                            )}`}
                          >
                            {getStatusLabel(transaction.status)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {formatDate(transaction.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {transaction.description || "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {transaction.performer || "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {transaction.processor || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Trang {transactions.currentPage} / {transactions.totalPages} (
                  {transactions.totalRecords} giao dịch)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadTransactions(currentPage - 1)}
                    disabled={!transactions.hasPreviousPage || loading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadTransactions(currentPage + 1)}
                    disabled={!transactions.hasNextPage || loading}
                  >
                    Sau
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
      </CardContent>

      {/* Export Excel Dialog */}
      <ExportExcelDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
      />
    </Card>
  );
};

export default TransactionHistory;
