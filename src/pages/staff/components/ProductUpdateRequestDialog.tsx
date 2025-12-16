import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { processProductUpdateRequest, type ProductUpdateRequest } from "@/api/product";
import { Package } from "lucide-react";

interface ProductUpdateRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ProductUpdateRequest | null;
  onProcessed?: () => void;
  /**
   * Chế độ hiển thị:
   * - "staff": cho phép duyệt / từ chối
   * - "vendor": chỉ xem chi tiết, không có nút thao tác
   */
  mode?: "staff" | "vendor";
}

const formatDate = (value?: string) => {
  if (!value) return "--";
  try {
    return new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  } catch {
    return value;
  }
};

export const ProductUpdateRequestDialog = ({
  open,
  onOpenChange,
  request,
  onProcessed,
  mode = "staff",
}: ProductUpdateRequestDialogProps) => {
  const snapshot = request?.productSnapshot as any;
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const images: Array<{ imageUrl?: string }> =
    (snapshot?.images as any[])?.map((img) =>
      typeof img === "string" ? { imageUrl: img } : img
    ) || [];

  const statusBadge = () => {
    const status = request?.status;
    const variant = status === "Approved" ? "default" : "secondary";
    const label =
      status === "Approved"
        ? "Đã duyệt"
        : status === "Rejected"
          ? "Từ chối"
          : status === "Pending"
            ? "Chờ duyệt"
            : status || "Không rõ";
    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleApprove = async () => {
    if (!request) return;
    setSubmitting(true);
    try {
      await processProductUpdateRequest(request.id, { status: "Approved" });
      alert("Đã duyệt yêu cầu cập nhật sản phẩm.");
      onOpenChange(false);
      onProcessed?.();
    } catch (err: any) {
      alert(err?.message || "Không thể duyệt yêu cầu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!request) return;
    if (!rejectionReason.trim()) {
      alert("Vui lòng nhập lý do từ chối.");
      return;
    }
    setSubmitting(true);
    try {
      await processProductUpdateRequest(request.id, { status: "Rejected", rejectionReason });
      alert("Đã từ chối yêu cầu cập nhật.");
      onOpenChange(false);
      onProcessed?.();
    } catch (err: any) {
      alert(err?.message || "Không thể từ chối yêu cầu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Chi tiết yêu cầu cập nhật</DialogTitle>
          {statusBadge()}
        </DialogHeader>
        <div className="max-h-[70vh] pr-4 overflow-y-auto space-y-4">
          {!request ? (
            <div className="text-gray-600 text-sm">Không có dữ liệu yêu cầu.</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Mã yêu cầu</p>
                  <p className="font-semibold">#{request.id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Vendor</p>
                  <p className="font-semibold">{request.vendorId ?? "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Mã sản phẩm</p>
                  <p className="font-semibold">{snapshot?.productCode || request.productCode || request.productId}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tên sản phẩm</p>
                  <p className="font-semibold">{snapshot?.productName || request.productName || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Ngày gửi</p>
                  <p className="font-semibold">{formatDate(request.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Ngày xử lý</p>
                  <p className="font-semibold">{formatDate(request.processedAt ?? undefined)}</p>
                </div>
              </div>

              <div className="h-px bg-gray-200" />

              <div className="space-y-2 text-sm">
                <p className="text-gray-700 font-semibold">Thông tin sản phẩm</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 border rounded-md">
                    <p className="text-gray-500">Giá</p>
                    <p className="font-semibold">
                      {snapshot?.unitPrice !== undefined
                        ? snapshot.unitPrice.toLocaleString("vi-VN")
                        : "—"}
                    </p>
                  </div>
                  <div className="p-3 border rounded-md">
                    <p className="text-gray-500">Giảm giá (%)</p>
                    <p className="font-semibold">{snapshot?.discountPercentage ?? "—"}</p>
                  </div>
                  <div className="p-3 border rounded-md">
                    <p className="text-gray-500">Năng lượng</p>
                    <p className="font-semibold">{snapshot?.energyEfficiencyRating ?? "—"}</p>
                  </div>
                  <div className="p-3 border rounded-md">
                    <p className="text-gray-500">Bảo hành (tháng)</p>
                    <p className="font-semibold">{snapshot?.warrantyMonths ?? "—"}</p>
                  </div>
                  <div className="p-3 border rounded-md">
                    <p className="text-gray-500">Cân nặng (kg)</p>
                    <p className="font-semibold">{snapshot?.weightKg ?? "—"}</p>
                  </div>
                  <div className="p-3 border rounded-md">
                    <p className="text-gray-500">Kích thước (cm)</p>
                    <p className="font-semibold">
                      {snapshot?.dimensionsCm
                        ? `${snapshot.dimensionsCm.length ?? "-"} x ${snapshot.dimensionsCm.width ?? "-"} x ${snapshot.dimensionsCm.height ?? "-"}`
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="p-3 border rounded-md">
                  <p className="text-gray-500 mb-1">Mô tả</p>
                  <p className="whitespace-pre-wrap text-gray-800">
                    {snapshot?.description || "—"}
                  </p>
                </div>

                {snapshot?.specifications && Object.keys(snapshot.specifications).length > 0 && (
                  <div className="p-3 border rounded-md">
                    <p className="text-gray-500 mb-2">Thông số kỹ thuật</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(snapshot.specifications).map(([k, v]) => (
                        <div key={k} className="text-sm">
                          <span className="font-semibold text-gray-800">{k}:</span>{" "}
                          <span className="text-gray-700">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-gray-500 mb-1">Hình ảnh</p>
                  {images.length === 0 ? (
                    <div className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center text-gray-500">
                      <Package className="w-6 h-6 mr-2" />
                      Không có hình ảnh
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {images.map((img, idx) => (
                        <div key={idx} className="rounded-md overflow-hidden border bg-white">
                          <img
                            src={img.imageUrl}
                            alt={`img-${idx}`}
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {mode === "staff" && (
                <div className="space-y-3">
                  <p className="text-gray-700 font-semibold">Phê duyệt / Từ chối</p>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="flex gap-2">
                      <Button
                        onClick={handleApprove}
                        disabled={submitting || request?.status === "Approved"}
                      >
                        {submitting ? "Đang xử lý..." : "Duyệt"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleReject}
                        disabled={submitting || request?.status === "Rejected"}
                      >
                        {submitting ? "Đang xử lý..." : "Từ chối"}
                      </Button>
                    </div>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Lý do từ chối (bắt buộc khi từ chối)"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

