import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, CheckCircle } from "lucide-react";
import {
  processTicket,
  type ProcessTicketRequest,
  type TicketItem,
} from "@/api/ticket";

const PROCESSABLE_STATUSES: Array<ProcessTicketRequest["status"]> = [
  "InReview",
  "Approved",
  "Rejected",
  "Cancelled",
];

const STATUS_BADGE_MAP: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  inreview: "bg-blue-100 text-blue-700",
  in_review: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-red-100 text-red-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
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

interface SupportTicketDetailDialogProps {
  ticket: TicketItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProcessed: () => void;
}

export const SupportTicketDetailDialog = ({
  ticket,
  open,
  onOpenChange,
  onProcessed,
}: SupportTicketDetailDialogProps) => {
  const [status, setStatus] = useState<ProcessTicketRequest["status"]>("InReview");
  const [replyNotes, setReplyNotes] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

  const defaultStatus = useMemo<ProcessTicketRequest["status"]>(() => {
    if (!ticket?.status) return "InReview";
    const normalized = ticket.status.replace(/\s+/g, "");
    if (PROCESSABLE_STATUSES.includes(normalized as ProcessTicketRequest["status"])) {
      return normalized as ProcessTicketRequest["status"];
    }
    return "InReview";
  }, [ticket?.status]);

  useEffect(() => {
    if (open && ticket) {
      setStatus(defaultStatus);
      setReplyNotes(ticket.replyNotes || "");
      setError("");
    } else if (!open) {
      setStatus("InReview");
      setReplyNotes("");
      setError("");
    }
  }, [open, ticket, defaultStatus]);

  if (!ticket) {
    return null;
  }

  const validatePayload = () => {
    if (!status) {
      setError("Vui lòng chọn trạng thái mới cho yêu cầu.");
      return false;
    }

    const trimmedNotes = replyNotes.trim();
    if (status === "InReview" && trimmedNotes.length > 0) {
      setError("Trạng thái InReview không được phép có ghi chú phản hồi.");
      return false;
    }

    if (status !== "InReview" && trimmedNotes.length === 0) {
      setError("Vui lòng nhập ghi chú phản hồi khi phê duyệt / từ chối / hủy yêu cầu.");
      return false;
    }

    setError("");
    return true;
  };

  const handleProcessTicket = async () => {
    if (!ticket) return;
    if (!validatePayload()) return;

    try {
      setIsProcessing(true);

      const payload: ProcessTicketRequest = {
        status,
        replyNotes: status === "InReview" ? undefined : replyNotes.trim(),
      };

      const response = await processTicket(ticket.id, payload);

      if (response.status) {
        setIsSuccessDialogOpen(true);
        onProcessed();
      } else {
        const errorMsg =
          response.errors?.join(", ") ||
          response.errors?.[0] ||
          "Không thể cập nhật trạng thái yêu cầu hỗ trợ";
        setError(errorMsg);
        setIsErrorDialogOpen(true);
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.errors?.join(", ") ||
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi cập nhật trạng thái yêu cầu hỗ trợ";
      setError(errorMsg);
      setIsErrorDialogOpen(true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu #{ticket.id}</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết và cập nhật trạng thái yêu cầu hỗ trợ / hoàn tiền.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Người gửi
                </p>
                <p className="text-sm text-gray-900 mt-1">
                  {ticket.user?.fullName || ticket.user?.email || "Không xác định"}
                </p>
                {ticket.user?.email && (
                  <p className="text-xs text-gray-500">{ticket.user.email}</p>
                )}
                {ticket.user?.phoneNumber && (
                  <p className="text-xs text-gray-500">{ticket.user.phoneNumber}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Trạng thái hiện tại
                </p>
                <p className="mt-1">
                  <Badge
                    className={
                      STATUS_BADGE_MAP[ticket.status?.toLowerCase?.() || ""] ||
                      "bg-gray-100 text-gray-700"
                    }
                  >
                    {ticket.status || "Không rõ"}
                  </Badge>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Loại yêu cầu
                </p>
                <p className="text-sm text-gray-900 mt-1">
                  {ticket.requestType === "RefundRequest"
                    ? "Yêu cầu hoàn tiền"
                    : "Yêu cầu hỗ trợ"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Thời gian tạo
                </p>
                <p className="text-sm text-gray-900 mt-1">{formatDateTime(ticket.createdAt)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Tiêu đề
              </p>
              <p className="text-sm text-gray-900 mt-1">{ticket.title}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Mô tả chi tiết
              </p>
              <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 whitespace-pre-line">
                {ticket.description}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Cập nhật trạng thái
                </p>
                <Select
                  value={status}
                  onValueChange={(value: ProcessTicketRequest["status"]) => setStatus(value)}
                  disabled={isProcessing}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROCESSABLE_STATUSES.map((statusOption) => (
                      <SelectItem key={statusOption} value={statusOption}>
                        {statusOption === "InReview"
                          ? "In Review"
                          : statusOption === "Approved"
                            ? "Approved"
                            : statusOption === "Rejected"
                              ? "Rejected"
                              : "Cancelled"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Ghi chú phản hồi
                </p>
                <Textarea
                  placeholder={
                    status === "InReview"
                      ? "Trạng thái InReview không được nhập ghi chú."
                      : "Nhập ghi chú phản hồi cho người dùng"
                  }
                  value={replyNotes}
                  onChange={(e) => setReplyNotes(e.target.value)}
                  disabled={isProcessing || status === "InReview"}
                  rows={5}
                  className="resize-none"
                />
              </div>
            </div>

            {ticket.replyNotes && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Ghi chú trước đó
                </p>
                <div className="mt-2 rounded-md border border-gray-200 bg-blue-50 p-3 text-sm text-blue-700 whitespace-pre-line">
                  {ticket.replyNotes}
                </div>
              </div>
            )}

            {ticket.images && ticket.images.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Hình ảnh đính kèm
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ticket.images.map((image, index) => (
                    <a
                      key={image.imagePublicId || index}
                      href={image.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={image.imageUrl}
                        alt={`Ticket attachment ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isProcessing}
              >
                Đóng
              </Button>
              <Button
                onClick={handleProcessTicket}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </span>
                ) : (
                  "Cập nhật trạng thái"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <AlertDialogContent className="sm:max-w-[400px]">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-center">
              Cập nhật thành công
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Trạng thái yêu cầu đã được cập nhật thành công.
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

      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent className="sm:max-w-[450px]">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-center">
              Cập nhật thất bại
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              <div className="mt-4">
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {error || "Không thể cập nhật trạng thái yêu cầu hỗ trợ."}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setIsErrorDialogOpen(false);
                setError("");
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

