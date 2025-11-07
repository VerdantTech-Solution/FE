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
}

const BankAccountsList = ({ accounts, banks, loading, onAddBank, onDeleteSuccess }: BankAccountsListProps) => {
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

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="text-blue-600" size={24} />
            <CardTitle className="text-lg font-semibold">Ngân hàng của bạn</CardTitle>
          </div>
          <Button 
            onClick={onAddBank}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus size={16} className="mr-1" />
            Thêm ngân hàng
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-gray-600">Đang tải...</span>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 mb-4">Bạn chưa có ngân hàng nào</p>
            <Button 
              onClick={onAddBank}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={16} className="mr-1" />
              Thiết lập ngân hàng
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => {
              const bankInfo = getBankInfo(account.bankCode);
              return (
                <div
                  key={account.id}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all bg-white"
                >
                  <div className="flex items-start space-x-3">
                    {bankInfo?.logo ? (
                      <div className="w-12 h-12 bg-gray-50 rounded-lg p-2 flex items-center justify-center flex-shrink-0">
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
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="text-blue-600" size={24} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-semibold text-gray-900">
                          {bankInfo?.shortName || bankInfo?.name || account.bankCode}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(account.id)}
                          disabled={deletingId === account.id}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {account.accountHolder}
                      </p>
                      <p className="text-sm font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded">
                        {account.accountNumber}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Thêm: {new Date(account.createdAt).toLocaleDateString('vi-VN')}
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
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-center">
              Xác nhận xóa tài khoản ngân hàng
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600">
              Bạn có chắc chắn muốn xóa tài khoản ngân hàng này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3 sm:gap-0">
            <AlertDialogCancel onClick={() => setDeletingId(null)}>
              Hủy
            </AlertDialogCancel>
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
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-emerald-700">
              Xóa thành công!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Tài khoản ngân hàng đã được xóa khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <AlertDialogAction
              onClick={() => setShowSuccessDialog(false)}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold px-8 py-2 rounded-lg"
            >
              Đóng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-center text-red-700">
              Lỗi
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600">
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <AlertDialogAction
              onClick={() => setShowErrorDialog(false)}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-2 rounded-lg"
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

