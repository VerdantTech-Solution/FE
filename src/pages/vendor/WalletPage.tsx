import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import VendorSidebar from './VendorSidebar';
import { 
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router';


const WalletBalance = () => {
  return (
    <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm">Số dư ví</p>
            <p className="text-3xl font-bold mt-2">₫125,000,000</p>
            <p className="text-green-100 text-sm mt-1">+12.5% so với tháng trước</p>
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

const RecentTransactions = () => {
  const transactions = [
    { 
      type: "income", 
      description: "Thanh toán từ khách hàng", 
      amount: "₫2,500,000", 
      date: "15/01/2024",
      status: "completed"
    },
    { 
      type: "expense", 
      description: "Phí dịch vụ platform", 
      amount: "₫125,000", 
      date: "14/01/2024",
      status: "completed"
    },
    { 
      type: "income", 
      description: "Bán sản phẩm", 
      amount: "₫1,800,000", 
      date: "13/01/2024",
      status: "completed"
    },
    { 
      type: "pending", 
      description: "Thanh toán đang chờ", 
      amount: "₫3,200,000", 
      date: "12/01/2024",
      status: "pending"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Giao dịch gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  transaction.type === 'income' ? 'bg-green-100' : 
                  transaction.type === 'expense' ? 'bg-red-100' : 'bg-yellow-100'
                }`}>
                  {transaction.type === 'income' ? (
                    <ArrowUpRight size={20} className="text-green-600" />
                  ) : transaction.type === 'expense' ? (
                    <ArrowDownLeft size={20} className="text-red-600" />
                  ) : (
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-sm text-gray-500">{transaction.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${
                  transaction.type === 'income' ? 'text-green-600' : 
                  transaction.type === 'expense' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {transaction.type === 'expense' ? '-' : '+'}{transaction.amount}
                </p>
                <p className="text-xs text-gray-500 capitalize">{transaction.status}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const WithdrawForm = () => {
  const [amount, setAmount] = useState('');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Rút tiền</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số tiền muốn rút
            </label>
            <Input
              type="number"
              placeholder="Nhập số tiền"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số tài khoản ngân hàng
            </label>
            <Input
              placeholder="Nhập số tài khoản"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên ngân hàng
            </label>
            <Input
              placeholder="Nhập tên ngân hàng"
            />
          </div>
          <Button className="w-full bg-green-600 hover:bg-green-700">
            Yêu cầu rút tiền
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const WalletPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  return (
    <div className="flex h-screen bg-gray-50 mt-[80px]">
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
                <span className="text-sm font-medium text-gray-700">Vendor Name</span>
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
          <WalletBalance />
          <TransactionStats />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentTransactions />
            <WithdrawForm />
          </div>
        </main>
      </div>
    </div>
  );
};

export default WalletPage;
