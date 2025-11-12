import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Search, X, CheckCircle } from 'lucide-react';
import { 
  getSupportedBanks, 
  createVendorBankAccount, 
  type SupportedBank
} from '@/api/vendorbankaccounts';

interface CreateBankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  onSuccess: () => void;
}

const CreateBankDialog = ({ open, onOpenChange, userId, onSuccess }: CreateBankDialogProps) => {
  const [banks, setBanks] = useState<SupportedBank[]>([]);
  const [selectedBank, setSelectedBank] = useState<SupportedBank | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);

  const loadBanks = async () => {
    try {
      setLoading(true);
      const banksData = await getSupportedBanks();
      setBanks(banksData);
    } catch (err) {
      setError('Không thể tải danh sách ngân hàng');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && banks.length === 0) {
      loadBanks();
    }
  }, [open]);

  const filteredBanks = banks.filter(bank => 
    bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bank.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bank.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectBank = (bank: SupportedBank) => {
    setSelectedBank(bank);
    setError('');
  };

  const handleSubmitBankAccount = async () => {
    if (!selectedBank) {
      setError('Vui lòng chọn ngân hàng');
      return;
    }
    if (!accountNumber.trim()) {
      setError('Vui lòng nhập số tài khoản');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await createVendorBankAccount(userId, {
        bankCode: selectedBank.bin,
        accountNumber: accountNumber.trim()
      });

      // Reset form và đóng dialog
      setSelectedBank(null);
      setAccountNumber('');
      setSearchQuery('');
      setError('');
      onOpenChange(false);
      
      // Gọi callback để reload danh sách
      onSuccess();
      
      // Show success dialog
      setIsSuccessDialogOpen(true);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi thiết lập ngân hàng');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setSelectedBank(null);
      setSearchQuery('');
      setAccountNumber('');
      setError('');
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Thiết lập ngân hàng</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!selectedBank ? (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Tìm kiếm ngân hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-11"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Bank List */}
            {loading && banks.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Đang tải danh sách ngân hàng...</p>
                </div>
              </div>
            ) : filteredBanks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Không tìm thấy ngân hàng nào</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredBanks.map((bank) => (
                    <button
                      key={bank.code}
                      onClick={() => handleSelectBank(bank)}
                      className="group flex flex-col items-center p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg bg-white transition-all duration-200 hover:scale-[1.02]"
                    >
                      <div className="w-16 h-16 mb-3 flex items-center justify-center bg-gray-50 rounded-lg p-2 group-hover:bg-blue-50 transition-colors">
                        <img 
                          src={bank.logo} 
                          alt={bank.shortName}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="text-center w-full">
                        <p className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">{bank.shortName}</p>
                        <p className="text-xs text-gray-500 line-clamp-2">{bank.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Selected Bank Card */}
            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
              <div className="w-16 h-16 bg-white rounded-lg p-2 flex items-center justify-center shadow-sm">
                <img 
                  src={selectedBank.logo} 
                  alt={selectedBank.shortName}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-lg">{selectedBank.shortName}</p>
                <p className="text-sm text-gray-600">{selectedBank.name}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedBank(null);
                  setAccountNumber('');
                  setError('');
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <X size={18} className="mr-1" />
                Đổi
              </Button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số tài khoản <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Nhập số tài khoản"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  disabled={loading}
                  className="h-11"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedBank(null);
                  setAccountNumber('');
                  setError('');
                }}
                disabled={loading}
                className="flex-1 h-11"
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmitBankAccount}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 h-11"
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Đang xử lý...
                  </span>
                ) : (
                  'Xác nhận'
                )}
              </Button>
            </div>
          </div>
        )}
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
            Thiết lập ngân hàng thành công.
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

export default CreateBankDialog;

