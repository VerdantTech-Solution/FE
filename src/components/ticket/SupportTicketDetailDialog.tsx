import { useEffect, useMemo, useState, type ChangeEvent } from "react";
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
import { AlertCircle, CheckCircle, Upload, X, HandCoins, Wallet, Banknote, Loader2 } from "lucide-react";
import {
  processTicket,
  type ProcessTicketRequest,
  type TicketItem,
  type TicketMessage,
  type TicketImage,
} from "@/api/ticket";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getOrderById, type OrderWithCustomer } from "@/api/order";
import { formatVietnamDateTime } from "@/lib/utils";
import { getVendorBankAccounts, getSupportedBanks, type VendorBankAccount, type SupportedBank } from "@/api/vendorbankaccounts";
import { processRefundRequest, type ProcessRefundRequestPayload } from "@/api/cashout";
import { getExportedIdentityNumbersByOrderDetailId, type IdentityNumberItem } from "@/api/export";

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

const MACHINERY_CATEGORY_IDS = [24, 25, 28, 29];

const requiresSerialForCategory = (categoryId?: number | null) =>
  Boolean(categoryId && MACHINERY_CATEGORY_IDS.includes(categoryId));

// Kiểm tra xem sản phẩm có số seri trong exportedIdentityNumbers không
const hasSerialNumbers = (exportedIdentityNumbers: IdentityNumberItem[]) =>
  exportedIdentityNumbers.some((item) => item.serialNumber);

const formatDateTime = (value?: string | null) => {
  if (!value) return "---";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "---";
  return formatVietnamDateTime(value);
};

interface SupportTicketDetailDialogProps {
  ticket: (TicketItem & { requestMessages?: TicketMessage[] }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProcessed: () => void;
  isDetailLoading?: boolean;
  detailError?: string;
  onRefreshTicket?: (ticketId: number) => Promise<void> | void;
}

export const SupportTicketDetailDialog = ({
  ticket,
  open,
  onOpenChange,
  onProcessed,
  isDetailLoading = false,
  detailError = "",
  onRefreshTicket,
}: SupportTicketDetailDialogProps) => {
  const [status, setStatus] = useState<ProcessTicketRequest["status"]>("InReview");
  const [replyNotes, setReplyNotes] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [messageImages, setMessageImages] = useState<TicketImage[]>([]);
  const [messageError, setMessageError] = useState("");
  const [messageSuccess, setMessageSuccess] = useState("");
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [isUploadingMessageImage, setIsUploadingMessageImage] = useState(false);

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
      setMessageContent("");
      setMessageImages([]);
      setMessageError("");
      setMessageSuccess("");
    } else if (!open) {
      setStatus("InReview");
      setReplyNotes("");
      setError("");
      setMessageContent("");
      setMessageImages([]);
      setMessageError("");
      setMessageSuccess("");
    }
  }, [open, ticket, defaultStatus]);

  useEffect(() => {
    if (!messageSuccess) return;
    const timeout = setTimeout(() => setMessageSuccess(""), 5000);
    return () => clearTimeout(timeout);
  }, [messageSuccess]);

  if (!ticket) {
    return null;
  }

  const messages = ticket.requestMessages || [];
  const messageCount = messages.length;
  const hasPendingReply = messages.some(
    (message) => !message.replyNotes || !message.replyNotes.trim()
  );
  const reachedMessageLimit = messageCount >= 3;
  const canSendNewMessage = !reachedMessageLimit && !isDetailLoading && !detailError;
  const isRefundRequestApproved =
    ticket.requestType === "RefundRequest" &&
    ticket.status?.toLowerCase() === "approved";

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

  const resetMessageInputs = () => {
    setMessageContent("");
    setMessageImages([]);
    setMessageError("");
  };

  const handleMessageImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 3 - messageImages.length;
    if (remainingSlots <= 0) {
      setMessageError("Tối đa 3 ảnh cho mỗi tin nhắn.");
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remainingSlots);
    const maxSize = 5 * 1024 * 1024;
    const validFiles = selectedFiles.filter((file) => {
      if (file.size > maxSize) {
        setMessageError(`Ảnh ${file.name} vượt quá 5MB.`);
        return false;
      }
      if (!file.type.startsWith("image/")) {
        setMessageError(`File ${file.name} không phải là ảnh.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploadingMessageImage(true);
    setMessageError("");

    try {
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "Cloudinary Test");
        formData.append(
          "public_id",
          `ticket_message_${Date.now()}_${Math.random().toString(36).substring(7)}`
        );

        const cloudinaryResponse = await fetch(
          "https://api.cloudinary.com/v1_1/dtlkjzuhq/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!cloudinaryResponse.ok) {
          throw new Error(`Upload thất bại cho ${file.name}`);
        }

        const cloudinaryData = await cloudinaryResponse.json();

        return {
          imageUrl: cloudinaryData.secure_url,
          imagePublicId: cloudinaryData.public_id,
        } as TicketImage;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setMessageImages((prev) => [...prev, ...uploadedImages]);
    } catch (err: any) {
      setMessageError(err?.message || "Có lỗi xảy ra khi upload ảnh.");
    } finally {
      setIsUploadingMessageImage(false);
      event.target.value = "";
    }
  };

  const handleRemoveMessageImage = (index: number) => {
    setMessageImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!ticket) return;
    const trimmedMessage = messageContent.trim();
    if (!trimmedMessage) {
      setMessageError("Vui lòng nhập nội dung tin nhắn.");
      return;
    }

    setIsMessageSending(true);
    setMessageError("");
    setMessageSuccess("");

    try {
      // Staff gửi tin nhắn sử dụng PATCH /api/RequestTicket/{requestId}/process
      // Chỉ gửi tin nhắn, không thay đổi trạng thái (không gửi status)
      const messagePayload: ProcessTicketRequest["requestMessages"] = {
        replyNotes: trimmedMessage,
        ...(messageImages.length > 0 && { images: messageImages }),
      };

      // Nếu có requestMessageId, thêm vào để cập nhật message hiện có
      if (ticket.requestMessageId != null) {
        messagePayload.id = ticket.requestMessageId;
      }

      // Chỉ gửi requestMessages, không gửi status để tránh lỗi "Trạng thái mới phải khác với trạng thái hiện tại"
      const payload: ProcessTicketRequest = {
        requestMessages: messagePayload,
      };

      const response = await processTicket(ticket.id, payload);

      if (response.status) {
        resetMessageInputs();
        setMessageSuccess("Tin nhắn đã được gửi thành công.");
        if (onRefreshTicket) {
          await onRefreshTicket(ticket.id);
        }
      } else {
        const errorMsg =
          response.errors?.join(", ") ||
          response.errors?.[0] ||
          "Không thể gửi tin nhắn mới.";
        setMessageError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.errors?.join(", ") ||
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi gửi tin nhắn.";
      setMessageError(errorMsg);
    } finally {
      setIsMessageSending(false);
    }
  };

  const handleProcessTicket = async () => {
    if (!ticket) return;
    if (!validatePayload()) return;

    try {
      setIsProcessing(true);

      // Xây message payload: nếu có requestMessageId thì PATCH vào message đó,
      // nếu không có thì để backend tạo message mới (không gửi id).
      const messagePayload =
        status === "InReview"
          ? undefined
          : (() => {
              const base: { replyNotes: string; id?: number } = {
                replyNotes: replyNotes.trim(),
              };
              if (ticket.requestMessageId != null) {
                base.id = ticket.requestMessageId;
              }
              return base;
            })();

      const payload: ProcessTicketRequest = {
        status,
        // Theo schema mới: requestMessages: { id?, replyNotes }
        requestMessages: messagePayload,
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
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu #{ticket.id}</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết và cập nhật trạng thái yêu cầu hỗ trợ / hoàn tiền.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pb-2">
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
                  onValueChange={(value) => setStatus(value as ProcessTicketRequest["status"])}
                  disabled={isProcessing}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROCESSABLE_STATUSES.map((statusOption) => (
                      <SelectItem key={statusOption} value={statusOption as string}>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Lịch sử trao đổi
                </p>
                <span className="text-xs text-gray-500">{messageCount}/3 tin nhắn</span>
              </div>

              {isDetailLoading && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  Đang tải tin nhắn...
                </div>
              )}

              {detailError && !isDetailLoading && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
                  {detailError}
                </p>
              )}

              {!isDetailLoading && !detailError && messages.length === 0 && (
                <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md p-3">
                  Chưa có tin nhắn bổ sung cho yêu cầu này.
                </p>
              )}

              {!isDetailLoading && !detailError && messages.length > 0 && (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className="rounded-md border border-gray-200 bg-gray-50 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {message.staff
                            ? `Nhân viên: ${message.staff}`
                            : ticket.user?.fullName || ticket.user?.email || "Người dùng"}
                        </span>
                        <span>{formatDateTime(message.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-line">{message.description}</p>

                      {message.images && message.images.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {message.images.map((image, index) => (
                            <a
                              key={image.imagePublicId || index}
                              href={image.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img
                                src={image.imageUrl}
                                alt={`Message image ${index + 1}`}
                                className="w-16 h-16 object-cover rounded border border-gray-200"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      {message.replyNotes && (
                        <div className="rounded border border-blue-100 bg-blue-50 p-2">
                          <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide mb-1">
                            Phản hồi
                          </p>
                          <p className="text-xs text-blue-700 whitespace-pre-line">{message.replyNotes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isRefundRequestApproved && (
              <RefundProcessingPanel
                ticket={ticket}
                onRefreshTicket={onRefreshTicket}
              />
            )}

            <div className="rounded-md border border-gray-200 bg-white p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Gửi tin nhắn đến khách hàng</p>
                <span className="text-xs text-gray-500">{messageCount}/3</span>
              </div>

              {reachedMessageLimit && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
                  Đã đạt giới hạn tối đa 3 tin nhắn cho yêu cầu này.
                </p>
              )}

              {messageError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
                  {messageError}
                </p>
              )}

              {messageSuccess && (
                <p className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-md p-2">
                  {messageSuccess}
                </p>
              )}

                <Textarea
                  placeholder={
                    hasPendingReply
                      ? "Trả lời nội dung khách hàng..."
                      : "Nhập nội dung bạn muốn gửi tới khách hàng..."
                  }
                  value={messageContent}
                  onChange={(e) => {
                    setMessageContent(e.target.value);
                    if (messageError) setMessageError("");
                  }}
                  rows={4}
                  className="resize-none"
                  disabled={!canSendNewMessage || isMessageSending}
                />

              {messageImages.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {messageImages.map((image, index) => (
                    <div key={image.imagePublicId || index} className="relative">
                      <img
                        src={image.imageUrl}
                        alt={`Upload ${index + 1}`}
                        className="w-20 h-20 rounded-lg border border-gray-200 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMessageImage(index)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                        disabled={isMessageSending}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {messageImages.length < 3 && (
                  <label className="flex items-center gap-2 rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 cursor-pointer hover:border-blue-500">
                    {isUploadingMessageImage ? (
                      <>
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        Đang upload...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Thêm ảnh
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleMessageImageSelect}
                      disabled={!canSendNewMessage || isMessageSending || isUploadingMessageImage}
                    />
                  </label>
                )}

                <Button
                  onClick={handleSendMessage}
                  disabled={!canSendNewMessage || isMessageSending || isUploadingMessageImage}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isMessageSending ? "Đang gửi..." : "Gửi tin nhắn"}
                </Button>
              </div>
            </div>

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

interface RefundDetailForm {
  orderDetailId: number;
  productName: string;
  maxQuantity: number;
  quantity: number;
  lotNumber: string;
  serialNumbers: string[]; // Mảng số seri, mỗi phần tử tương ứng với 1 sản phẩm
  include: boolean;
  requiresSerial: boolean;
  unitPrice: number;
  discountAmount: number;
  exportedIdentityNumbers: IdentityNumberItem[];
  identityNumbersLoading: boolean;
}

interface RefundProcessingPanelProps {
  ticket: TicketItem & { requestMessages?: TicketMessage[] };
  onRefreshTicket?: (ticketId: number) => Promise<void> | void;
}

const RefundProcessingPanel = ({
  ticket,
  onRefreshTicket,
}: RefundProcessingPanelProps) => {
  const [orderInfo, setOrderInfo] = useState<OrderWithCustomer | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [bankAccounts, setBankAccounts] = useState<VendorBankAccount[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState("");
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>("0");
  const [refundMode, setRefundMode] = useState<"payos" | "manual">("payos");
  const [gatewayPaymentId, setGatewayPaymentId] = useState("");
  const [detailForms, setDetailForms] = useState<RefundDetailForm[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isCustomRefundAmount, setIsCustomRefundAmount] = useState(false);
  const [supportedBanks, setSupportedBanks] = useState<SupportedBank[]>([]);
  const [isRefundSuccessDialogOpen, setIsRefundSuccessDialogOpen] = useState(false);

  const derivedOrderId = useMemo(() => extractOrderIdFromTicket(ticket), [ticket]);

  // Helper function để tìm thông tin ngân hàng theo bankCode
  const findBankInfo = useMemo(() => {
    return (bankCode?: string | null): SupportedBank | null => {
      if (!bankCode) return null;
      return supportedBanks.find((bank) => bank.bin === bankCode || bank.code === bankCode) || null;
    };
  }, [supportedBanks]);

  // Load danh sách ngân hàng được hỗ trợ
  useEffect(() => {
    const loadSupportedBanks = async () => {
      try {
        const banks = await getSupportedBanks();
        setSupportedBanks(banks);
      } catch (err) {
        console.error('Error loading supported banks:', err);
      }
    };
    loadSupportedBanks();
  }, []);

  useEffect(() => {
    setOrderInfo(null);
    setOrderError("");
    setBankAccounts([]);
    setBankError("");
    setSelectedBankId(null);
    setRefundAmount("0");
    setRefundMode("payos");
    setGatewayPaymentId("");
    setDetailForms([]);
    setSubmitError("");
    setSubmitSuccess("");
    setIsCustomRefundAmount(false);

    if (!ticket) return;

    if (ticket.user?.id) {
      void (async () => {
        try {
          setBankLoading(true);
          setBankError("");
          const accounts = await getVendorBankAccounts(ticket.user!.id);
          setBankAccounts(accounts);
          const activeAccount = accounts.find((acc) => acc.isActive) || accounts[0];
          setSelectedBankId(activeAccount ? activeAccount.id : null);
          if (!accounts.length) {
            setBankError("Khách hàng chưa cung cấp tài khoản ngân hàng.");
          }
        } catch (err: any) {
          setBankAccounts([]);
          setBankError(
            err?.response?.data?.errors?.[0] ||
              err?.message ||
              "Không thể tải danh sách tài khoản ngân hàng của khách hàng."
          );
        } finally {
          setBankLoading(false);
        }
      })();
    } else {
      setBankError("Không tìm thấy thông tin người dùng để truy xuất tài khoản ngân hàng.");
    }

    if (derivedOrderId) {
      void (async () => {
        try {
          setOrderLoading(true);
          setOrderError("");
          const response = await getOrderById(derivedOrderId);
          if (response.status && response.data) {
            setOrderInfo(response.data);
            // Cho phép tất cả đơn hàng chọn cả PayOS và Manual
            setRefundMode("payos");
            setRefundAmount(String(response.data.totalAmount ?? 0));
            const initialForms = response.data.orderDetails.map((detail) => ({
              orderDetailId: detail.id,
              productName: detail.product.productName,
              maxQuantity: detail.quantity,
              quantity: 0,
              lotNumber: "",
              serialNumbers: [] as string[],
              include: false,
              requiresSerial: requiresSerialForCategory(detail.product.categoryId),
              unitPrice: detail.unitPrice,
              discountAmount: detail.discountAmount,
              exportedIdentityNumbers: [] as IdentityNumberItem[],
              identityNumbersLoading: false,
            }));
            setDetailForms(initialForms);

            // Fetch exported identity numbers for each order detail
            initialForms.forEach(async (form) => {
              try {
                setDetailForms((prev) =>
                  prev.map((f) =>
                    f.orderDetailId === form.orderDetailId
                      ? { ...f, identityNumbersLoading: true }
                      : f
                  )
                );
                const identityNumbers = await getExportedIdentityNumbersByOrderDetailId(
                  form.orderDetailId
                );
                // Kiểm tra xem có số seri trong identityNumbers không
                const hasSerialInExported = hasSerialNumbers(identityNumbers);
                setDetailForms((prev) =>
                  prev.map((f) =>
                    f.orderDetailId === form.orderDetailId
                      ? { 
                          ...f, 
                          exportedIdentityNumbers: identityNumbers, 
                          identityNumbersLoading: false,
                          // Nếu có số seri trong exportedIdentityNumbers, thì bắt buộc phải nhập số seri
                          requiresSerial: f.requiresSerial || hasSerialInExported
                        }
                      : f
                  )
                );
              } catch (err) {
                console.error(
                  `Error fetching exported identity numbers for order detail ${form.orderDetailId}:`,
                  err
                );
                setDetailForms((prev) =>
                  prev.map((f) =>
                    f.orderDetailId === form.orderDetailId
                      ? { ...f, identityNumbersLoading: false }
                      : f
                  )
                );
              }
            });
          } else {
            setOrderInfo(null);
            setOrderError(response.errors?.[0] || "Không thể tải thông tin đơn hàng.");
          }
        } catch (err: any) {
          setOrderInfo(null);
          setOrderError(err?.message || "Không thể tải thông tin đơn hàng.");
        } finally {
          setOrderLoading(false);
        }
      })();
    } else {
      setOrderError("Không tìm thấy mã đơn hàng trong yêu cầu hoàn hàng.");
    }
  }, [ticket, derivedOrderId]);

  const deliveredAt = orderInfo?.deliveredAt ? new Date(orderInfo.deliveredAt) : null;
  const deliveredWithin7Days = deliveredAt
    ? Date.now() - deliveredAt.getTime() <= 7 * 24 * 60 * 60 * 1000
    : false;
  const isDeliveredStatus = orderInfo?.status?.toLowerCase() === "delivered";
  const refundEligible = Boolean(orderInfo) && deliveredWithin7Days && isDeliveredStatus;

  const handleDetailToggle = (detailId: number, include: boolean) => {
    setDetailForms((prev) =>
      prev.map((detail) => {
        if (detail.orderDetailId !== detailId) return detail;
        const newQuantity = include
          ? Math.min(detail.maxQuantity, detail.quantity > 0 ? detail.quantity : 1)
          : 0;
        // Khởi tạo serialNumbers array với số lượng phần tử tương ứng với quantity
        const newSerialNumbers = include
          ? Array.from({ length: newQuantity }, () => "")
          : [];
        return {
          ...detail,
          include,
          quantity: newQuantity,
          serialNumbers: newSerialNumbers,
        };
      })
    );
    if (!include) {
      setIsCustomRefundAmount(false);
    }
  };

  const handleDetailFieldChange = (
    detailId: number,
    field: keyof Pick<RefundDetailForm, "quantity" | "lotNumber">,
    value: string
  ) => {
    setDetailForms((prev) =>
      prev.map((detail) => {
        if (detail.orderDetailId !== detailId) return detail;
        if (field === "quantity") {
          const parsed = Math.max(
            0,
            Math.min(detail.maxQuantity, Number.isNaN(Number(value)) ? 0 : Number(value))
          );
          // Khi quantity thay đổi, điều chỉnh số lượng phần tử trong serialNumbers array
          const newSerialNumbers = [...detail.serialNumbers];
          if (parsed < newSerialNumbers.length) {
            // Nếu giảm quantity, cắt bớt serial numbers
            newSerialNumbers.splice(parsed);
          } else if (parsed > newSerialNumbers.length) {
            // Nếu tăng quantity, thêm empty strings để có đủ số lượng ô nhập
            while (newSerialNumbers.length < parsed) {
              newSerialNumbers.push("");
            }
          }
          return { ...detail, quantity: parsed, serialNumbers: newSerialNumbers };
        }
        return { ...detail, [field]: value };
      })
    );
    if (field === "quantity") {
      setIsCustomRefundAmount(false);
    }
  };

  const handleSerialNumberChange = (detailId: number, index: number, value: string) => {
    setDetailForms((prev) =>
      prev.map((detail) => {
        if (detail.orderDetailId !== detailId) return detail;
        const newSerialNumbers = [...detail.serialNumbers];
        newSerialNumbers[index] = value;
        // Auto-set lot number if available
        const serialNumbers = detail.exportedIdentityNumbers.filter((item) => item.serialNumber);
        const selectedItem = serialNumbers.find((item) => item.serialNumber === value);
        return {
          ...detail,
          serialNumbers: newSerialNumbers,
          lotNumber: selectedItem?.lotNumber || detail.lotNumber,
        };
      })
    );
    setIsCustomRefundAmount(false);
  };

  const handleRestoreAutoAmount = () => {
    setIsCustomRefundAmount(false);
    setRefundAmount(String(Math.round(autoCalculatedAmount)));
  };

  const selectedDetails = useMemo(
    () => detailForms.filter((detail) => detail.include && detail.quantity > 0),
    [detailForms]
  );
  const autoCalculatedAmount = useMemo(
    () =>
      selectedDetails.reduce(
        (sum, detail) => sum + calculateDetailRefundAmount(detail),
        0
      ),
    [selectedDetails]
  );
  const parsedRefundAmount = Number(refundAmount || 0);

  useEffect(() => {
    if (!isCustomRefundAmount) {
      setRefundAmount(String(Math.round(autoCalculatedAmount)));
    }
  }, [autoCalculatedAmount, isCustomRefundAmount]);

  const validateRefundPayload = (): string | null => {
    if (!orderInfo) return "Không thể xác định thông tin đơn hàng.";
    if (!selectedBankId) return "Vui lòng chọn tài khoản ngân hàng để hoàn tiền.";
    if (!selectedDetails.length) return "Vui lòng chọn ít nhất một sản phẩm để hoàn.";
    if (!parsedRefundAmount || parsedRefundAmount <= 0) {
      return "Số tiền hoàn phải lớn hơn 0.";
    }
    if (parsedRefundAmount > orderInfo.totalAmount) {
      return "Số tiền hoàn không được vượt quá tổng giá trị đơn hàng.";
    }
    if (!refundEligible) {
      return "Đơn hàng không đủ điều kiện hoàn tiền (phải đã giao và trong vòng 7 ngày).";
    }
    if (refundMode === "manual" && !gatewayPaymentId.trim()) {
      return "Vui lòng nhập mã giao dịch khi hoàn tiền thủ công.";
    }

    for (const detail of selectedDetails) {
      if (!detail.lotNumber.trim()) {
        return `Vui lòng nhập số lô cho sản phẩm "${detail.productName}".`;
      }
      
      // Kiểm tra xem sản phẩm có số seri trong exportedIdentityNumbers không
      const hasSerialInExported = hasSerialNumbers(detail.exportedIdentityNumbers);
      // Nếu có số seri trong exportedIdentityNumbers hoặc requiresSerial = true, thì bắt buộc phải nhập số seri
      const mustHaveSerial = detail.requiresSerial || hasSerialInExported;
      
      if (mustHaveSerial) {
        if (detail.serialNumbers.length !== detail.quantity) {
          return `Sản phẩm "${detail.productName}" yêu cầu số lượng số seri phải bằng số lượng sản phẩm (${detail.quantity}).`;
        }
        // Kiểm tra không có serial number nào trống
        if (detail.serialNumbers.some((sn) => !sn.trim())) {
          return `Sản phẩm "${detail.productName}" có số seri trống. Vui lòng nhập đầy đủ số seri.`;
        }
        // Kiểm tra không có serial number nào trùng lặp
        const uniqueSerials = new Set(detail.serialNumbers.filter((sn) => sn.trim()));
        if (uniqueSerials.size !== detail.serialNumbers.filter((sn) => sn.trim()).length) {
          return `Sản phẩm "${detail.productName}" có số seri trùng lặp. Vui lòng chọn các số seri khác nhau.`;
        }
      }
    }

    return null;
  };

  const handleSubmitRefund = async () => {
    const validationMessage = validateRefundPayload();
    if (validationMessage) {
      setSubmitError(validationMessage);
      setSubmitSuccess("");
      return;
    }

    setSubmitError("");
    setSubmitSuccess("");
    setSubmitting(true);

    const payload: ProcessRefundRequestPayload = {
      refundAmount: Math.round(parsedRefundAmount),
      bankAccountId: selectedBankId!,
      gatewayPaymentId: refundMode === "manual" ? gatewayPaymentId.trim() : null,
      orderDetails: selectedDetails.map((detail) => {
        // Kiểm tra xem sản phẩm có số seri trong exportedIdentityNumbers không
        const hasSerialInExported = hasSerialNumbers(detail.exportedIdentityNumbers);
        const mustHaveSerial = detail.requiresSerial || hasSerialInExported;
        
        // Nếu có serial numbers, tạo một identityNumber cho mỗi serial number (quantity = 1)
        if (mustHaveSerial && detail.serialNumbers.length > 0) {
          return {
            orderDetailId: detail.orderDetailId,
            identityNumbers: detail.serialNumbers.map((serialNumber) => ({
              lotNumber: detail.lotNumber.trim(),
              quantity: 1,
              serialNumber: serialNumber.trim(),
            })),
          };
        }
        // Nếu không có serial numbers, tạo một identityNumber với quantity tổng
        return {
          orderDetailId: detail.orderDetailId,
          identityNumbers: [
            {
              lotNumber: detail.lotNumber.trim(),
              quantity: detail.quantity,
            },
          ],
        };
      }),
    };

    try {
      const response = await processRefundRequest(ticket.id, payload);
      if (response.status) {
        setSubmitSuccess(response.data || "Đã gửi yêu cầu hoàn tiền thành công.");
        setSubmitError("");
        setIsRefundSuccessDialogOpen(true);
        setDetailForms((prev) =>
          prev.map((detail) => ({
            ...detail,
            include: false,
            quantity: 0,
            lotNumber: "",
            serialNumbers: [],
          }))
        );
        setRefundMode("payos");
        setGatewayPaymentId("");
        if (onRefreshTicket) {
          await onRefreshTicket(ticket.id);
        }
      } else {
        setSubmitSuccess("");
        setSubmitError(
          response.errors?.join("\n") || "Không thể xử lý hoàn tiền. Vui lòng thử lại."
        );
      }
    } catch (err: any) {
      setSubmitSuccess("");
      setSubmitError(
        err?.response?.data?.errors?.[0] ||
          err?.message ||
          "Không thể xử lý hoàn tiền. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-emerald-100 p-2">
          <HandCoins className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="font-semibold text-emerald-900">Hoàn tiền cho khách hàng</p>
          <p className="text-sm text-emerald-800">
            Đơn hàng phải đã giao và trong vòng 7 ngày để được hoàn. Vui lòng xác thực thông tin
            ngân hàng trước khi chuyển.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-white bg-white/80 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900">Thông tin đơn hàng</h4>
          {orderLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang tải...
            </div>
          )}
        </div>
        {orderError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
            {orderError}
          </p>
        )}
        {orderInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
            <div>
              <p className="text-gray-500">Mã đơn hàng</p>
              <p className="font-semibold text-gray-900">#{orderInfo.id}</p>
            </div>
            <div>
              <p className="text-gray-500">Trạng thái</p>
              <p className="font-semibold text-gray-900">{orderInfo.status}</p>
            </div>
            <div>
              <p className="text-gray-500">Ngày giao</p>
              <p className="font-semibold text-gray-900">
                {orderInfo.deliveredAt ? formatDateTime(orderInfo.deliveredAt) : "Chưa xác định"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Tổng giá trị</p>
              <p className="font-semibold text-gray-900">
                {formatCurrency(orderInfo.totalAmount || 0)}
              </p>
            </div>
          </div>
        )}
        {!refundEligible && orderInfo && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
            Đơn hàng phải ở trạng thái "Delivered" và chưa quá 7 ngày kể từ ngày giao để được hoàn
            tiền.
          </p>
        )}
      </div>

      <div className="rounded-lg border border-white bg-white/80 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900">Tài khoản ngân hàng nhận hoàn</h4>
          {bankLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang tải...
            </div>
          )}
        </div>
        {bankError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
            {bankError}
          </p>
        )}
        {bankAccounts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bankAccounts.map((account) => {
              const isSelected = selectedBankId === account.id;
              const bankInfo = findBankInfo(account.bankCode);
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => setSelectedBankId(account.id)}
                  className={`rounded-lg border p-3 text-left transition ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50 shadow-sm"
                      : "border-gray-200 bg-white"
                  } ${!account.isActive ? "opacity-60" : ""}`}
                  disabled={!account.isActive}
                >
                  <div className="flex items-start gap-3">
                    {bankInfo?.logo && (
                      <div className="w-10 h-10 bg-gray-50 rounded-lg p-2 flex items-center justify-center flex-shrink-0 border border-gray-100">
                        <img 
                          src={bankInfo.logo} 
                          alt={bankInfo.shortName || bankInfo.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        {isSelected && (
                          <span className="text-[10px] uppercase font-semibold text-emerald-700">
                            Đang chọn
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-medium">{account.accountNumber}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {bankInfo ? bankInfo.name : account.bankCode || "Không xác định"}
                      </p>
                      {!account.isActive && (
                        <p className="text-[10px] text-red-600 mt-2">Tài khoản đã vô hiệu hóa</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-white bg-white/80 p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-emerald-100 p-2">
            <Banknote className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="refundAmount">Số tiền hoàn (VND)</Label>
                  <button
                    type="button"
                    onClick={handleRestoreAutoAmount}
                    disabled={!isCustomRefundAmount}
                    className="text-xs text-emerald-600 disabled:text-gray-400"
                  >
                    Khôi phục tự tính
                  </button>
                </div>
                <Input
                  id="refundAmount"
                  type="number"
                  min={0}
                  max={orderInfo?.totalAmount || undefined}
                  value={refundAmount}
                  onChange={(e) => {
                    setRefundAmount(e.target.value);
                    setIsCustomRefundAmount(true);
                  }}
                  disabled={!orderInfo}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Hệ thống tự tính: {formatCurrency(autoCalculatedAmount)} (chỉ gồm giá sản phẩm, không
                  bao gồm phí vận chuyển). Tối đa: {formatCurrency(orderInfo?.totalAmount || 0)}
                </p>
              </div>
              <div>
                <Label>Phương thức hoàn</Label>
                <Select
                  value={refundMode}
                  onValueChange={(value: "payos" | "manual") => setRefundMode(value)}
                >
                  <SelectTrigger className="h-11 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payos">
                      Thanh toán tự động qua PayOS
                    </SelectItem>
                    <SelectItem value="manual">Hoàn tiền thủ công (đã chuyển tay)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {refundMode === "manual" && (
              <div>
                <Label htmlFor="gatewayPaymentId">Mã giao dịch thủ công</Label>
                <Input
                  id="gatewayPaymentId"
                  placeholder="Nhập reference/mã giao dịch đã chuyển tay"
                  value={gatewayPaymentId}
                  onChange={(e) => setGatewayPaymentId(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">Sản phẩm được hoàn</p>
          {detailForms.length === 0 && (
            <p className="text-xs text-gray-500">Chưa có dữ liệu sản phẩm.</p>
          )}
          {detailForms.map((detail) => (
            <div
              key={detail.orderDetailId}
              className="rounded-lg border border-gray-200 p-3 space-y-3 bg-white"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{detail.productName}</p>
                  <p className="text-xs text-gray-500">
                    Tối đa: {detail.maxQuantity} sản phẩm
                    {detail.requiresSerial && " · Yêu cầu số seri"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={detail.include}
                    onCheckedChange={(checked) => handleDetailToggle(detail.orderDetailId, checked)}
                  />
                  <span className="text-xs text-gray-600">Hoàn sản phẩm này</span>
                </div>
              </div>

              {detail.include && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Số lượng</Label>
                    <Input
                      type="number"
                      min={detail.requiresSerial ? 1 : 1}
                      max={detail.maxQuantity}
                      value={detail.quantity}
                      onChange={(e) => handleDetailFieldChange(detail.orderDetailId, "quantity", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Số lô</Label>
                    {detail.identityNumbersLoading ? (
                      <div className="flex items-center gap-2 text-xs text-gray-500 h-11 border border-gray-200 rounded-md px-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải...
                      </div>
                    ) : (() => {
                      // Get unique lot numbers (from items without serial numbers or from serial number items)
                      const lotNumberMap = new Map<string, number>();
                      detail.exportedIdentityNumbers.forEach((item) => {
                        if (item.lotNumber) {
                          if (item.serialNumber) {
                            // For serial number items, count unique lot numbers
                            const current = lotNumberMap.get(item.lotNumber) || 0;
                            lotNumberMap.set(item.lotNumber, current + 1);
                          } else {
                            // For lot-only items, use remainingQuantity
                            const quantity = item.remainingQuantity || 0;
                            const current = lotNumberMap.get(item.lotNumber) || 0;
                            lotNumberMap.set(item.lotNumber, Math.max(current, quantity));
                          }
                        }
                      });
                      const lotNumbers = Array.from(lotNumberMap.entries());

                      if (lotNumbers.length > 0) {
                        return (
                          <Select
                            value={detail.lotNumber}
                            onValueChange={(value) => {
                              setDetailForms((prev) =>
                                prev.map((d) =>
                                  d.orderDetailId === detail.orderDetailId
                                    ? { ...d, lotNumber: value }
                                    : d
                                )
                              );
                            }}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Chọn số lô" />
                            </SelectTrigger>
                            <SelectContent>
                              {lotNumbers.map(([lotNumber, quantity]) => (
                                <SelectItem key={lotNumber} value={lotNumber}>
                                  {lotNumber}
                                  {quantity > 0 && ` (Số lượng: ${quantity})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        );
                      }

                      return (
                        <Input
                          value={detail.lotNumber}
                          onChange={(e) =>
                            handleDetailFieldChange(detail.orderDetailId, "lotNumber", e.target.value)
                          }
                          placeholder="Nhập số lô nhận lại"
                        />
                      );
                    })()}
                  </div>
                  <div className="md:col-span-3">
                    <Label>Số seri (nếu có)</Label>
                    {detail.identityNumbersLoading ? (
                      <div className="flex items-center gap-2 text-xs text-gray-500 h-11 border border-gray-200 rounded-md px-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải...
                      </div>
                    ) : (() => {
                      const availableSerialNumbers = detail.exportedIdentityNumbers.filter(
                        (item) => item.serialNumber
                      );
                      // Filter theo lot number nếu đã chọn
                      const filteredSerialNumbers = detail.lotNumber
                        ? availableSerialNumbers.filter((item) => item.lotNumber === detail.lotNumber)
                        : availableSerialNumbers;

                      // Kiểm tra xem sản phẩm có số seri trong exportedIdentityNumbers không
                      const hasSerialInExported = hasSerialNumbers(detail.exportedIdentityNumbers);
                      const mustHaveSerial = detail.requiresSerial || hasSerialInExported;
                      
                      // Luôn hiển thị khi quantity > 0 hoặc có serial numbers available hoặc bắt buộc phải có số seri
                      if (detail.quantity > 0 || mustHaveSerial || filteredSerialNumbers.length > 0) {
                        // Hiển thị số lượng ô nhập tương ứng với quantity
                        return (
                          <div className="space-y-2 mt-1">
                            {detail.quantity > 0 ? Array.from({ length: detail.quantity }).map((_, index) => {
                              // Lấy các số seri đã chọn ở các vị trí khác để loại trừ
                              const selectedSerials = detail.serialNumbers.filter((_, i) => i !== index);
                              const currentSerial = detail.serialNumbers[index];
                              
                              // Các số seri có thể chọn (không trùng với các số đã chọn ở vị trí khác)
                              // Nhưng vẫn bao gồm số seri hiện tại đã chọn ở vị trí này
                              const selectableSerials = filteredSerialNumbers.filter(
                                (item) => {
                                  const serialValue = item.serialNumber!;
                                  // Bao gồm số seri hiện tại nếu đã chọn
                                  if (currentSerial && serialValue === currentSerial) {
                                    return true;
                                  }
                                  // Loại trừ các số seri đã chọn ở vị trí khác
                                  return !selectedSerials.includes(serialValue);
                                }
                              );

                              return (
                                <div key={index} className="flex items-center gap-2">
                                  <Label className="text-xs text-gray-600 w-20 shrink-0">
                                    Sản phẩm {index + 1}:
                                  </Label>
                                  {filteredSerialNumbers.length > 0 ? (
                                    <Select
                                      value={detail.serialNumbers[index] || ""}
                                      onValueChange={(value) => {
                                        handleSerialNumberChange(detail.orderDetailId, index, value);
                                      }}
                                    >
                                      <SelectTrigger className="h-10 flex-1">
                                        <SelectValue placeholder="Chọn số seri" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {/* Hiển thị tất cả các số seri có thể chọn (đã loại trừ trùng lặp) */}
                                        {selectableSerials.map((item, idx) => (
                                          <SelectItem
                                            key={`${item.serialNumber}-${idx}`}
                                            value={item.serialNumber!}
                                          >
                                            {item.serialNumber}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Input
                                      value={detail.serialNumbers[index] || ""}
                                      onChange={(e) =>
                                        handleSerialNumberChange(detail.orderDetailId, index, e.target.value)
                                      }
                                      placeholder={(() => {
                                        const hasSerialInExported = hasSerialNumbers(detail.exportedIdentityNumbers);
                                        const mustHaveSerial = detail.requiresSerial || hasSerialInExported;
                                        return mustHaveSerial ? "Bắt buộc" : "Không bắt buộc";
                                      })()}
                                      className="flex-1"
                                    />
                                  )}
                                </div>
                              );
                            }) : null}
                            {(() => {
                              const hasSerialInExported = hasSerialNumbers(detail.exportedIdentityNumbers);
                              const mustHaveSerial = detail.requiresSerial || hasSerialInExported;
                              return mustHaveSerial && detail.serialNumbers.some((sn) => !sn.trim()) ? (
                                <p className="text-xs text-amber-600">
                                  Vui lòng chọn đầy đủ số seri cho tất cả sản phẩm.
                                </p>
                              ) : null;
                            })()}
                            {detail.lotNumber && filteredSerialNumbers.length === 0 && (
                              <p className="text-xs text-gray-500">
                                Không còn số seri nào khả dụng cho số lô "{detail.lotNumber}".
                              </p>
                            )}
                          </div>
                        );
                      }

                      return (
                        <Input
                          value={detail.serialNumbers[0] || ""}
                          onChange={(e) =>
                            handleSerialNumberChange(detail.orderDetailId, 0, e.target.value)
                          }
                          placeholder="Không bắt buộc"
                          className="mt-1"
                        />
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {submitError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md p-2">
          {submitError}
        </p>
      )}
      {submitSuccess && (
        <p className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-md p-2">
          {submitSuccess}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Wallet className="h-4 w-4 text-emerald-600" />
          Hoàn tiền sẽ chuyển về tài khoản khách hàng đã chọn.
        </div>
        <Button
          onClick={handleSubmitRefund}
          disabled={
            submitting ||
            !refundEligible ||
            !orderInfo ||
            !selectedBankId ||
            bankLoading ||
            orderLoading
          }
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {submitting ? "Đang xử lý hoàn tiền..." : "Thực hiện hoàn tiền"}
        </Button>
      </div>

      <AlertDialog
        open={isRefundSuccessDialogOpen}
        onOpenChange={(open) => {
          setIsRefundSuccessDialogOpen(open);
          if (!open) {
            setSubmitSuccess("");
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-[400px]">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 w-14 h-14 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-center text-gray-900">
              Thành công!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-700">
              Yêu cầu hoàn tiền đã được xử lý thành công. Chúng tôi sẽ phản hồi sớm nhất có thể.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setIsRefundSuccessDialogOpen(false);
                setSubmitSuccess("");
              }}
              className="bg-green-600 hover:bg-green-700 text-white w-full rounded-md"
            >
              Đóng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const extractOrderIdFromText = (value?: string | null): number | null => {
  if (!value) return null;
  const match = value.match(/#(\d+)/);
  if (match) {
    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const extractOrderIdFromTicket = (
  ticket?: (TicketItem & { requestMessages?: TicketMessage[] }) | null
): number | null => {
  if (!ticket) return null;
  const candidates: Array<string | null | undefined> = [
    ticket.title,
    ticket.description,
    ticket.replyNotes,
    ...((ticket.requestMessages || []).map((msg) => msg.description) || []),
  ];

  for (const text of candidates) {
    const orderId = extractOrderIdFromText(text);
    if (orderId) {
      return orderId;
    }
  }

  return null;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);

const calculateDetailRefundAmount = (detail: RefundDetailForm) => {
  const perUnitDiscount =
    detail.maxQuantity > 0 ? detail.discountAmount / detail.maxQuantity : 0;
  const effectiveUnitPrice = Math.max(0, detail.unitPrice - perUnitDiscount);
  return Math.max(0, detail.quantity) * effectiveUnitPrice;
};

