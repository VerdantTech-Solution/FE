import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { AlertCircle, Info, CheckCircle } from 'lucide-react';
import { createCashoutRequest, type CashoutRequest } from '@/api/wallet';
import type { VendorBankAccount } from '@/api/vendorbankaccounts';

interface WithdrawRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAccounts: VendorBankAccount[];
  balance: number;
  onSuccess: () => void;
}

const WithdrawRequestDialog = ({
  open,
  onOpenChange,
  bankAccounts,
  balance,
  onSuccess
}: WithdrawRequestDialogProps) => {
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);

  // Format số tiền với dấu phẩy ngăn cách
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  // Reset form khi đóng dialog
  useEffect(() => {
    if (!open) {
      setSelectedBankAccountId(null);
      setAmount('');
      setReason('');
      setNotes('');
      setError('');
    }
  }, [open]);

  const handleSubmit = async () => {
    // Validation
    if (!selectedBankAccountId) {
      setError('Vui lòng chọn tài khoản ngân hàng');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum > balance) {
      setError(`Số tiền rút không được vượt quá số dư hiện tại (${formatCurrency(balance)} ₫)`);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Ensure amount is a number (not string) and format properly
      const request: CashoutRequest = {
        bankAccountId: selectedBankAccountId,
        amount: Number(amountNum), // Ensure it's a number, not string
        reason: reason.trim() || undefined,
        notes: notes.trim() || undefined
      };

      console.log('[Withdraw Dialog] Submitting request:', request);

      const response = await createCashoutRequest(request);
      
      console.log('[Withdraw Dialog] Response received:', response);

      if (response.status) {
        // Success
        onOpenChange(false);
        onSuccess();
        setIsSuccessDialogOpen(true);
      } else {
        // Handle error from response
        const errorMessage = response.errors?.[0] || 'Không thể tạo yêu cầu rút tiền';
        setError(errorMessage);
      }
    } catch (err: any) {
      console.error('Create cashout request error:', err);
      
      // Extract error message
      let errorMessage = 'Có lỗi xảy ra khi tạo yêu cầu rút tiền';
      
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.response?.data?.errors?.[0]) {
        errorMessage = err.response.data.errors[0];
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Yêu cầu rút tiền</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Số dư hiện tại */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Số dư hiện tại:</span>
              <span className="text-lg font-bold text-green-700">{formatCurrency(balance)} ₫</span>
            </div>
          </div>

          {/* Chọn tài khoản ngân hàng */}
          <div className="space-y-2">
            <Label htmlFor="bankAccount" className="text-sm font-medium">
              Tài khoản ngân hàng <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedBankAccountId ? String(selectedBankAccountId) : undefined}
              onValueChange={(value) => setSelectedBankAccountId(Number(value))}
            >
              <SelectTrigger id="bankAccount">
                <SelectValue placeholder="Chọn tài khoản ngân hàng" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.length === 0 ? (
                  <SelectItem value="no-account" disabled>
                    Chưa có tài khoản ngân hàng
                  </SelectItem>
                ) : (
                  bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={String(account.id)}>
                      {account.bankCode} - {account.accountNumber} ({account.accountHolder})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {bankAccounts.length === 0 && (
              <p className="text-xs text-gray-500">
                Vui lòng thêm tài khoản ngân hàng trước khi rút tiền
              </p>
            )}
          </div>

          {/* Số tiền */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Số tiền muốn rút (₫) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Nhập số tiền"
              value={amount}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                  setAmount(value);
                  setError('');
                }
              }}
              max={balance}
            />
          </div>

          {/* Lý do */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Lý do rút tiền (tùy chọn)
            </Label>
            <Input
              id="reason"
              placeholder="Nhập lý do rút tiền"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Ghi chú */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Ghi chú (tùy chọn)
            </Label>
            <Textarea
              id="notes"
              placeholder="Nhập ghi chú nếu có"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 mb-1">Không thể tạo yêu cầu rút tiền</p>
                  <p className="text-sm text-red-700">{error}</p>
                  {error.includes('đang chờ xử lý') && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <div className="flex items-start space-x-2">
                        <Info className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-red-600">
                          Vui lòng đợi yêu cầu rút tiền trước đó được xử lý xong trước khi tạo yêu cầu mới.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedBankAccountId || !amount || bankAccounts.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Spinner variant="circle-filled" size={16} className="mr-2" />
                Đang xử lý...
              </>
            ) : (
              'Gửi yêu cầu'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

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
            Yêu cầu rút tiền đã được tạo thành công. Vui lòng chờ xử lý.
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
    </>
  );
};

export default WithdrawRequestDialog;

