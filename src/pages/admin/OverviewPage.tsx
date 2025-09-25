import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Search,
  Filter,
  Trash,
  ArrowUp,
  ArrowDown
} from "lucide-react";

// Recharts imports
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

interface OverviewPageProps {
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
}

export const OverviewPage = ({ selectedPeriod, setSelectedPeriod }: OverviewPageProps) => {
  const viewOrder = (orderId: string) => {
    // Navigate to order detail page
    console.log(`Navigate to order detail: ${orderId}`);
    // You can replace this with actual navigation logic
    // For example: navigate(`/admin/orders/${orderId}`) or window.location.href = `/admin/orders/${orderId}`
  };
  // Mock data for charts
  const revenueData = [
    { month: 'T1', revenue: 12500000, growth: 12, orders: 45, customers: 23 },
    { month: 'T2', revenue: 15800000, growth: 8, orders: 52, customers: 31 },
    { month: 'T3', revenue: 14200000, growth: -5, orders: 38, customers: 19 },
    { month: 'T4', revenue: 18900000, growth: 15, orders: 67, customers: 42 },
    { month: 'T5', revenue: 17500000, growth: 7, orders: 58, customers: 35 },
    { month: 'T6', revenue: 21000000, growth: 20, orders: 78, customers: 51 },
  ];

  const productCategories = [
    { name: 'Drone & UAV', value: 35, color: '#10B981', sales: 12500000 },
    { name: 'Máy móc nông nghiệp', value: 28, color: '#3B82F6', sales: 9800000 },
    { name: 'Dụng cụ làm nông', value: 20, color: '#F59E0B', sales: 7200000 },
    { name: 'Phân bón & Thuốc', value: 12, color: '#EF4444', sales: 4200000 },
    { name: 'Khác', value: 5, color: '#8B5CF6', sales: 1800000 },
  ];

  const recentOrders = [
    {
      id: '#VT001',
      customer: 'Nguyễn Văn An',
      product: 'Drone DJI Agras T30',
      amount: '85.000.000đ',
      status: 'Đã giao',
      date: '2024-01-15',
      progress: 100
    },
    {
      id: '#VT002',
      customer: 'Trần Thị Bình',
      product: 'Máy cày mini Kubota',
      amount: '45.000.000đ',
      status: 'Đang xử lý',
      date: '2024-01-14',
      progress: 75
    },
    {
      id: '#VT003',
      customer: 'Lê Văn Cường',
      product: 'Bộ dụng cụ làm vườn',
      amount: '850.000đ',
      status: 'Đã giao',
      date: '2024-01-13',
      progress: 100
    },
    {
      id: '#VT004',
      customer: 'Phạm Thị Dung',
      product: 'Hệ thống tưới tự động',
      amount: '2.500.000đ',
      status: 'Chờ xác nhận',
      date: '2024-01-12',
      progress: 25
    }
  ];

  const stats = [
    {
      title: 'Tổng doanh thu',
      value: '89.5M',
      change: '+15.2%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Đơn hàng mới',
      value: '1,234',
      change: '+8.1%',
      trend: 'up',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Khách hàng mới',
      value: '567',
      change: '+12.3%',
      trend: 'up',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Tỷ lệ chuyển đổi',
      value: '3.2%',
      change: '-2.1%',
      trend: 'down',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Đã giao':
        return 'bg-green-100 text-green-800';
      case 'Đang xử lý':
        return 'bg-blue-100 text-blue-800';
      case 'Chờ xác nhận':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="flex items-center gap-2 mt-2">
                {stat.trend === 'up' ? (
                  <ArrowUp className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500">so với tháng trước</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">Biểu đồ doanh thu</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={selectedPeriod === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod('week')}
                >
                  Tuần
                </Button>
                <Button
                  variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod('month')}
                >
                  Tháng
                </Button>
                <Button
                  variant={selectedPeriod === 'year' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod('year')}
                >
                  Năm
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  formatter={(value) => [`${Number(value).toLocaleString()}đ`, 'Doanh thu']}
                  labelFormatter={(label) => `Tháng ${label}`}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Product Categories Pie Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Phân bố sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="60%" height={200}>
                <RechartsPieChart>
                  <Pie
                    data={productCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    innerRadius={30}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {productCategories.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Tỷ lệ']}
                    labelStyle={{ fontWeight: 'bold' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
              
              {/* Custom Legend */}
              <div className="w-40 ml-6 space-y-3">
                {productCategories.map((category, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {category.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {category.value}% • {category.sales.toLocaleString()}đ
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Tổng cộng:</span>
                <span className="font-semibold text-gray-900">
                  {productCategories.reduce((sum, cat) => sum + cat.sales, 0).toLocaleString()}đ
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders with Progress */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">Đơn hàng gần đây</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm đơn hàng..."
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Lọc
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-colors" onClick={() => viewOrder(order.id)}>
                    <div className="font-medium text-gray-900 hover:text-blue-600">{order.id}</div>
                    <div className="text-sm text-gray-500">{order.customer}</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{order.product}</div>
                  <div className="text-sm text-gray-500">{order.amount}</div>
                </div>
                <div className="text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <div className="text-sm text-gray-500 mt-1">{order.date}</div>
                </div>
                <div className="w-32">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Tiến độ</span>
                    <span>{order.progress}%</span>
                  </div>
                  <Progress value={order.progress} className="h-2" />
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="p-2 text-red-600">
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};
