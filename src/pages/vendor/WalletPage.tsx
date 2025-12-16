import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import VendorSidebar from './VendorSidebar';
import VendorHeader from './VendorHeader';
import CreateBankDialog from '@/components/bank/CreateBankDialog';
import BankAccountsList from '@/components/bank/BankAccountsList';
import WithdrawRequestDialog from '@/components/wallet/WithdrawRequestDialog';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getSupportedBanks, 
  getVendorBankAccounts,
  type SupportedBank,
  type VendorBankAccount
} from '@/api/vendorbankaccounts';
import { useWallet } from '@/hooks/useWallet';


interface WalletBalanceProps {
  balance: number;
  loading: boolean;
}

const WalletBalance = ({ balance, loading }: WalletBalanceProps) => {
  // Format số tiền với dấu phẩy ngăn cách
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
      <CardContent className="p-6">
        <div>
          <p className="text-green-100 text-sm">Số dư ví</p>
          {loading ? (
            <div className="flex items-center mt-2">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              <p className="text-3xl font-bold">Đang tải...</p>
            </div>
          ) : (
            <p className="text-3xl font-bold mt-2">₫{formatCurrency(balance)}</p>
          )}
          <p className="text-green-100 text-sm mt-1">Số dư khả dụng</p>
        </div>
      </CardContent>
    </Card>
  );
};

const WithdrawForm = ({ 
  onWithdrawClick, 
  balance, 
  hasBankAccounts 
}: { 
  onWithdrawClick: () => void; 
  balance: number;
  hasBankAccounts: boolean;
}) => {
  // Format số tiền với dấu phẩy ngăn cách
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Rút tiền</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Số dư khả dụng</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(balance)} ₫</p>
          </div>
          
          {!hasBankAccounts && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                Vui lòng thêm tài khoản ngân hàng trước khi rút tiền
              </p>
            </div>
          )}
          
          <Button 
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={onWithdrawClick}
            disabled={!hasBankAccounts || balance <= 0}
          >
            Yêu cầu rút tiền
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const WalletPage = () => {
  const { user } = useAuth();
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [banks, setBanks] = useState<SupportedBank[]>([]);
  const [vendorBankAccounts, setVendorBankAccounts] = useState<VendorBankAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  
  // Use wallet hook để quản lý wallet
  const userId = user?.id ? Number(user.id) : undefined;
  const { balance, loading: walletLoading, refreshWallet } = useWallet(userId);

  // Load vendor bank accounts
  const loadVendorBankAccounts = async () => {
    const userId = Number(user?.id);
    if (!userId) return;

    try {
      setLoadingAccounts(true);
      const accounts = await getVendorBankAccounts(userId);
      setVendorBankAccounts(accounts || []);
    } catch (err) {
      console.error('Load vendor bank accounts error:', err);
      setVendorBankAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadVendorBankAccounts();
      loadBanks();
    }
  }, [user?.id]);

  const loadBanks = async () => {
    try {
      const banksData = await getSupportedBanks();
      setBanks(banksData);
    } catch (err) {
      console.error('Load banks error:', err);
    }
  };

  const handleOpenBankDialog = () => {
    setIsBankDialogOpen(true);
  };

  const handleBankAccountSuccess = () => {
    loadVendorBankAccounts();
    refreshWallet(); // Refresh wallet sau khi thêm/xóa bank account
  };

  const handleWithdrawSuccess = () => {
    refreshWallet(); // Refresh wallet sau khi tạo yêu cầu rút tiền
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <VendorSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <VendorHeader
          title="Ví"
          subtitle="Quản lý tài chính và giao dịch"
        />

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <WalletBalance balance={balance} loading={walletLoading} />
          
          {/* Ngân hàng của bạn */}
          <BankAccountsList
            accounts={vendorBankAccounts}
            banks={banks}
            loading={loadingAccounts}
            onAddBank={handleOpenBankDialog}
            onDeleteSuccess={handleBankAccountSuccess}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WithdrawForm 
              onWithdrawClick={() => setIsWithdrawDialogOpen(true)}
              balance={balance}
              hasBankAccounts={vendorBankAccounts.length > 0}
            />
          </div>
        </main>
      </div>

      {/* Bank Setup Dialog */}
      <CreateBankDialog
        open={isBankDialogOpen}
        onOpenChange={setIsBankDialogOpen}
        userId={Number(user?.id) || 0}
        onSuccess={handleBankAccountSuccess}
      />

      {/* Withdraw Request Dialog */}
      <WithdrawRequestDialog
        open={isWithdrawDialogOpen}
        onOpenChange={setIsWithdrawDialogOpen}
        bankAccounts={vendorBankAccounts}
        balance={balance}
        onSuccess={handleWithdrawSuccess}
      />
    </div>
  );
};

export default WalletPage;
