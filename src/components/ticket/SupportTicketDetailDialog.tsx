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
import { AlertCircle, CheckCircle, Upload, X } from "lucide-react";
import {
  processTicket,
  type ProcessTicketRequest,
  type TicketItem,
  type TicketMessage,
  type TicketImage,
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

