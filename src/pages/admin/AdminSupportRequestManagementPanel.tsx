import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, MessageSquare, RefreshCcw, Search } from "lucide-react";
import {
  getTickets,
  type GetTicketsParams,
  type TicketItem,
} from "@/api/ticket";
import { SupportTicketDetailDialog } from "@/components/ticket/SupportTicketDetailDialog";

const REQUEST_TYPES = [
  { value: "all", label: "Tất cả loại yêu cầu" },
  { value: "SupportRequest", label: "Yêu cầu hỗ trợ" },
  { value: "RefundRequest", label: "Yêu cầu hoàn tiền" },
];

const REQUEST_STATUSES = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "Pending", label: "Pending" },
  { value: "InReview", label: "In Review" },
  { value: "Resolved", label: "Resolved" },
  { value: "Closed", label: "Closed" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];

const STATUS_BADGE_MAP: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  inreview: "bg-blue-100 text-blue-700",
  in_review: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "---";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "---";
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const AdminSupportRequestManagementPanel = () => {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [requestType, setRequestType] = useState("all");
  const [requestStatus, setRequestStatus] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const params: GetTicketsParams = {
        page,
        pageSize,
      };

      if (requestType !== "all") {
        params.requestType = requestType;
      }

      if (requestStatus !== "all") {
        params.requestStatus = requestStatus;
      }

      const response = await getTickets(params);

      if (response.status && response.data) {
        setTickets(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalRecords(response.data.totalRecords);
      } else {
        const errorMsg =
          response.errors?.join(", ") ||
          response.errors?.[0] ||
          "Không thể tải danh sách yêu cầu hỗ trợ";
        setTickets([]);
        setError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.errors?.join(", ") ||
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi tải danh sách yêu cầu hỗ trợ";
      setTickets([]);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, requestType, requestStatus]);

  const statusSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    tickets.forEach((ticket) => {
      const statusKey = ticket.status?.toLowerCase() || "unknown";
      summary[statusKey] = (summary[statusKey] || 0) + 1;
    });
    return summary;
  }, [tickets]);

  const handleViewTicket = (ticket: TicketItem) => {
    setSelectedTicket(ticket);
    setIsDetailOpen(true);
  };

  const handleTicketProcessed = () => {
    setIsDetailOpen(false);
    fetchTickets();
  };

  const handleChangePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
  };

  const handlePageSizeChange = (value: string) => {
    const newSize = Number(value);
    setPageSize(newSize);
    setPage(1);
  };

  const resetFilters = () => {
    setRequestType("all");
    setRequestStatus("all");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý yêu cầu hỗ trợ</h2>
          <p className="text-sm text-gray-500">
            Theo dõi và xử lý các yêu cầu hỗ trợ/hoàn tiền từ người dùng.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={resetFilters}
            className="gap-2"
            disabled={loading}
          >
            <RefreshCcw className="w-4 h-4" />
            Đặt lại
          </Button>
          <Button
            onClick={fetchTickets}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
            disabled={loading}
          >
            <Search className="w-4 h-4" />
            Tải lại
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Tổng yêu cầu</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{totalRecords}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Đang chờ xử lý</p>
            <p className="text-2xl font-semibold text-yellow-600 mt-1">
              {statusSummary["pending"] || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Đã xử lý / hoàn tất</p>
            <p className="text-2xl font-semibold text-green-600 mt-1">
              {(statusSummary["resolved"] || 0) + (statusSummary["closed"] || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Loại yêu cầu</p>
              <Select
                value={requestType}
                onValueChange={(value) => {
                  setRequestType(value);
                  setPage(1);
                }}
                disabled={loading}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REQUEST_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Trạng thái</p>
              <Select
                value={requestStatus}
                onValueChange={(value) => {
                  setRequestStatus(value);
                  setPage(1);
                }}
                disabled={loading}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REQUEST_STATUSES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Số bản ghi / trang</p>
              <Select
                value={String(pageSize)}
                onValueChange={handlePageSizeChange}
                disabled={loading}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} bản ghi
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Danh sách yêu cầu hỗ trợ
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
              <Button variant="outline" onClick={fetchTickets} disabled={loading}>
                Thử lại
              </Button>
            </div>
          )}

          {!error && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Mã yêu cầu
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Người gửi
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Loại yêu cầu
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tiêu đề
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tạo lúc
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                          Đang tải dữ liệu...
                        </div>
                      </td>
                    </tr>
                  ) : tickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                        Không có yêu cầu hỗ trợ nào phù hợp
                      </td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => {
                      const userName = ticket.user?.fullName || ticket.user?.email || "Không xác định";
                      const statusClass =
                        STATUS_BADGE_MAP[ticket.status?.toLowerCase?.() || ""] || "bg-gray-100 text-gray-700";

                      return (
                        <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">#{ticket.id}</td>
                          <td className="px-4 py-4 text-sm text-gray-700">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{userName}</span>
                              <span className="text-xs text-gray-500">{ticket.user?.email}</span>
                              {ticket.user?.phoneNumber && (
                                <span className="text-xs text-gray-500">{ticket.user.phoneNumber}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700">
                            {ticket.requestType === "RefundRequest" ? "Hoàn tiền" : "Hỗ trợ"}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700">{ticket.title}</td>
                          <td className="px-4 py-4 text-sm">
                            <Badge className={statusClass}>
                              {ticket.status || "Không rõ"}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700">
                            {formatDateTime(ticket.createdAt)}
                          </td>
                          <td className="px-4 py-4 text-sm text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewTicket(ticket)}
                              className="h-9"
                            >
                              Xem chi tiết
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <p className="text-sm text-gray-600">
          Trang {page} / {Math.max(totalPages, 1)} — Tổng cộng {totalRecords} yêu cầu
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleChangePage(page - 1)}
            disabled={loading || page <= 1}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            onClick={() => handleChangePage(page + 1)}
            disabled={loading || page >= totalPages}
          >
            Sau
          </Button>
        </div>
      </div>

      <SupportTicketDetailDialog
        ticket={selectedTicket}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onProcessed={handleTicketProcessed}
      />
    </div>
  );
};

