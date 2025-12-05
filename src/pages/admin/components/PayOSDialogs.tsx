import React from 'react';
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
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  XCircle,
  Zap,
} from "lucide-react";
import { type CashoutRequestData, type ProcessedCashoutData } from '@/api/wallet';

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

interface PayOSConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: CashoutRequestData | null;
  isProcessing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PayOSConfirmDialog: React.FC<PayOSConfirmDialogProps> = ({
  open,
  onOpenChange,
  request,
  isProcessing,
  onConfirm,
  onCancel,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
            <Zap className="w-7 h-7 text-blue-600" />
          </div>
          <AlertDialogTitle className="text-xl font-bold text-center">
            Xác nhận xử lý tự động qua PayOS
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {request && (
              <div className="mt-4 space-y-3 text-left">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Mã yêu cầu:</span>
                    <span className="text-sm font-medium text-gray-900">
                      #{request.id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Nhà cung cấp:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {request.vendor?.fullName || request.user?.fullName || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Số tiền:</span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(request.amount)}
                    </span>
                  </div>
                  {request.bankAccount && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Ngân hàng:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {request.bankAccount.bankCode} - {request.bankAccount.accountNumber}
                        </span>
                      </div>
                       {request.bankAccount.ToAccountName && (
                         <div className="flex justify-between items-center">
                           <span className="text-sm text-gray-600">Tên người nhận:</span>
                           <span className="text-sm font-medium text-gray-900">
                             {request.bankAccount.ToAccountName}
                           </span>
                         </div>
                       )}
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Bạn có chắc chắn muốn xử lý tự động yêu cầu rút tiền này qua PayOS?
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing} onClick={onCancel}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Xác nhận xử lý
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

interface PayOSSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ProcessedCashoutData | null;
  onClose: () => void;
}

export const PayOSSuccessDialog: React.FC<PayOSSuccessDialogProps> = ({
  open,
  onOpenChange,
  data,
  onClose,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <AlertDialogTitle className="text-xl font-bold text-center">
            Xử lý thành công!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {data && (
              <div className="mt-4 space-y-3 text-left">
                <div className="bg-green-50 rounded-lg p-4 space-y-2 border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Mã yêu cầu:</span>
                    <span className="text-sm font-medium text-gray-900">
                      #{data.id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Trạng thái:</span>
                    <Badge className={`${getStatusBadgeClass(data.status)} border-0`}>
                      {data.status}
                    </Badge>
                  </div>
                  {data.transaction && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Số tiền:</span>
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(data.transaction.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Gateway Payment ID:</span>
                        <span className="text-sm font-medium text-gray-900 font-mono">
                          {data.transaction.gatewayPaymentId}
                        </span>
                      </div>
                    </>
                  )}
                  {data.bankAccount && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tài khoản nhận:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {data.bankAccount.bankCode} - {data.bankAccount.accountNumber}
                      </span>
                    </div>
                  )}
                  {data.toAccountName && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tên người nhận:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {data.toAccountName}
                      </span>
                    </div>
                  )}
                  {data.processedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Thời gian xử lý:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDateTime(data.processedAt)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-green-600 text-center font-medium">
                  Yêu cầu rút tiền đã được xử lý tự động thành công qua PayOS.
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={onClose}
            className="bg-green-600 hover:bg-green-700 text-white w-full"
          >
            Đóng
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

interface PayOSErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: string | null;
  onClose: () => void;
}

export const PayOSErrorDialog: React.FC<PayOSErrorDialogProps> = ({
  open,
  onOpenChange,
  error,
  onClose,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[450px]">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
            <XCircle className="w-7 h-7 text-red-600" />
          </div>
          <AlertDialogTitle className="text-xl font-bold text-center text-red-600">
            Xử lý thất bại
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            <div className="mt-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 text-left">
                    {error || 'Đã xảy ra lỗi khi xử lý yêu cầu rút tiền qua PayOS'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Vui lòng thử lại hoặc liên hệ bộ phận hỗ trợ nếu vấn đề vẫn tiếp tục.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white w-full"
          >
            Đóng
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

