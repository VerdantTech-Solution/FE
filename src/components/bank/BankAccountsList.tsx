import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Building2, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { type VendorBankAccount, type SupportedBank, deleteVendorBankAccount } from '@/api/vendorbankaccounts';

interface BankAccountsListProps {
  accounts: VendorBankAccount[];
  banks: SupportedBank[];
  loading: boolean;
  onAddBank: () => void;
  onDeleteSuccess: () => void;
  title?: string;
  description?: string;
}

const BankAccountsList = ({ accounts, banks, loading, onAddBank, onDeleteSuccess, title = "Ngân hàng của bạn", description }: BankAccountsListProps) => {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Map bankCode to bank info
  const getBankInfo = (bankCode: string) => {
    return banks.find(b => b.bin === bankCode || b.code === bankCode);
  };

  const handleDeleteClick = (accountId: number) => {
    setDeletingId(accountId);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    try {
      await deleteVendorBankAccount(deletingId);
      setShowDeleteDialog(false);
      setShowSuccessDialog(true);
      onDeleteSuccess();
    } catch (error: any) {
      setShowDeleteDialog(false);
      setErrorMessage(error?.message || 'Có lỗi xảy ra khi xóa tài khoản ngân hàng');
      setShowErrorDialog(true);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDialogClose = (setter: (value: boolean) => void) => {
    return (open: boolean) => {
      setter(open);
      if (!open) {
        setDeletingId(null);
        setErrorMessage('');
      }
    };
  };

  return (
    <Card className="mb-6 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Building2 className="text-white" size={20} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-gray-900">{title}</CardTitle>
              {description && (
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              )}
            </div>
          </div>
          <Button 
            onClick={onAddBank}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm"
          >
            <Plus size={16} className="mr-1.5" />
            Thêm
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-500">Đang tải...</span>
            </div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 mb-4">
              <Building2 className="text-blue-500" size={32} />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">Chưa có tài khoản ngân hàng</h3>
            <p className="text-xs text-gray-500 mb-4">{description || "Thêm tài khoản để nhận hoàn tiền"}</p>
            <Button 
              onClick={onAddBank}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm"
            >
              <Plus size={16} className="mr-1.5" />
              Thêm ngân hàng
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {accounts.map((account) => {
              const bankInfo = getBankInfo(account.bankCode);
              return (
                <div
                  key={account.id}
                  className="group relative p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white"
                >
                  <div className="flex items-start gap-3">
                    {bankInfo?.logo ? (
                      <div className="w-11 h-11 bg-gray-50 rounded-lg p-2 flex items-center justify-center flex-shrink-0 border border-gray-100">
                        <img 
                          src={bankInfo.logo} 
                          alt={bankInfo.shortName}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-11 h-11 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="text-blue-600" size={20} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-semibold text-sm text-gray-900 line-clamp-1">
                          {bankInfo?.shortName || bankInfo?.name || account.bankCode}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(account.id)}
                          disabled={deletingId === account.id}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                        {account.accountHolder}
                      </p>
                      <p className="text-xs font-mono text-gray-800 bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-100">
                        {account.accountNumber}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={handleDialogClose(setShowDeleteDialog)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-600" />
            </div>
            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tài khoản ngân hàng này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto mb-4 w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <AlertDialogTitle>Xóa thành công</AlertDialogTitle>
            <AlertDialogDescription>
              Tài khoản ngân hàng đã được xóa khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <AlertDialogAction
              onClick={() => setShowSuccessDialog(false)}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
            >
              Đóng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={handleDialogClose(setShowErrorDialog)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto mb-4 w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-600" />
            </div>
            <AlertDialogTitle>Đã xảy ra lỗi</AlertDialogTitle>
            <AlertDialogDescription>
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <AlertDialogAction
              onClick={() => setShowErrorDialog(false)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Đóng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default BankAccountsList;

