import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import VendorSidebar from './VendorSidebar';
import { 
  Bell,
  DollarSign,
  Building,
  ShoppingCart,
  Star
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router';


// Dashboard tóm tắt - hiển thị các thông tin quan trọng nhất
const DashboardStats = () => {
  const stats = [
    { 
      label: "Tổng doanh thu", 
      value: "₫125,000,000", 
      change: "+12.5%",
      icon: DollarSign,
      color: "bg-green-50 text-green-600"
    },
    { 
      label: "Sản phẩm đã đăng", 
      value: "24", 
      change: "+3",
      icon: Building,
      color: "bg-blue-50 text-blue-600"
    },
    { 
      label: "Đơn hàng thành công", 
      value: "156", 
      change: "+12",
      icon: ShoppingCart,
      color: "bg-purple-50 text-purple-600"
    },
    { 
      label: "Đánh giá trung bình", 
      value: "4.8/5", 
      change: "+0.2",
      icon: Star,
      color: "bg-yellow-50 text-yellow-600"
    }
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Tóm tắt</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-sm text-green-600 mt-1">{stat.change}</p>
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
    </div>
  );
};

const RecentActivity = () => {
  const activities = [
    { action: "Sản phẩm mới được duyệt", product: "Thuốc trừ sâu sinh học", time: "2 giờ trước" },
    { action: "Đơn hàng mới", product: "Pin năng lượng mặt trời", time: "4 giờ trước" },
    { action: "Sản phẩm bị từ chối", product: "Phân bón hữu cơ", time: "1 ngày trước" },
    { action: "Thanh toán nhận được", product: "₫2,500,000", time: "2 ngày trước" }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Hoạt động gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-600">{activity.product}</p>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const VendorDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  return (
    <div className="flex h-screen bg-gray-50 ">
      {/* Sidebar */}
      <VendorSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
              <p className="text-gray-600">Thống kê và báo cáo hoạt động</p>
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
          {/* Dashboard tóm tắt ở trên */}
          <DashboardStats />
          
          {/* Dashboard chi tiết ở dưới */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Chi tiết</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivity />
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Biểu đồ doanh thu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Biểu đồ doanh thu sẽ được hiển thị ở đây
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default VendorDashboard;
