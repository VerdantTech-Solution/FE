import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import VendorSidebar from './VendorSidebar';
import CreateBankDialog from '@/components/bank/CreateBankDialog';
import BankAccountsList from '@/components/bank/BankAccountsList';
import WithdrawRequestDialog from '@/components/wallet/WithdrawRequestDialog';
import { 
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router';
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
        <div className="flex items-center justify-between">
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
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Wallet size={32} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TransactionStats = () => {
  const stats = [
    { 
      label: "Thu nhập tháng này", 
      value: "₫45,000,000", 
      icon: ArrowUpRight,
      color: "bg-green-50 text-green-600"
    },
    { 
      label: "Chi phí tháng này", 
      value: "₫8,500,000", 
      icon: ArrowDownLeft,
      color: "bg-red-50 text-red-600"
    },
    { 
      label: "Giao dịch thành công", 
      value: "156", 
      icon: TrendingUp,
      color: "bg-blue-50 text-blue-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <Icon size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
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
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [banks, setBanks] = useState<SupportedBank[]>([]);
  const [vendorBankAccounts, setVendorBankAccounts] = useState<VendorBankAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  
  // Use wallet hook để quản lý wallet
  const userId = user?.id ? Number(user.id) : undefined;
  const { balance, loading: walletLoading, refreshWallet } = useWallet(userId);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ví</h1>
              <p className="text-gray-600">Quản lý tài chính và giao dịch</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="p-2">
                <Bell size={20} />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">{user?.fullName || 'Vendor Name'}</span>
              </div>
              <Button 
                variant="outline" 
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                Đăng xuất
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <WalletBalance balance={balance} loading={walletLoading} />
          <TransactionStats />
          
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
