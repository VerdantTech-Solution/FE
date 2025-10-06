import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import VendorSidebar from './VendorSidebar';
import RegisterProductForm from '@/components/RegisterProductForm';
import { 
  Bell,
  Search,
  Eye,
  Check,
  X,
  Clock
} from 'lucide-react';

// Mock data for registrations
const mockRegistrations = [
  {
    id: 1,
    productName: "Thuốc trừ sâu sinh học",
    applicant: "Nguyễn Văn A",
    status: "pending",
    submittedAt: "15/01/2024",
    category: "Công nghệ sinh học"
  },
  {
    id: 2,
    productName: "Pin năng lượng mặt trời",
    applicant: "Trần Thị B",
    status: "approved",
    submittedAt: "14/01/2024",
    category: "Năng lượng tái tạo"
  },
  {
    id: 3,
    productName: "Hệ thống xử lý nước",
    applicant: "Lê Văn C",
    status: "rejected",
    submittedAt: "13/01/2024",
    category: "Xử lý nước"
  }
];

const statusConfig = {
  pending: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  approved: { label: "Đã duyệt", color: "bg-green-100 text-green-800", icon: Check },
  rejected: { label: "Từ chối", color: "bg-red-100 text-red-800", icon: X }
};


const RegistrationStatsCards = () => {
  const stats = [
    { label: "Tổng đơn đăng ký", value: "156", icon: "📋", color: "bg-blue-50 text-blue-600" },
    { label: "Chờ duyệt", value: "23", icon: "⏰", color: "bg-yellow-50 text-yellow-600" },
    { label: "Đã duyệt", value: "128", icon: "✓", color: "bg-green-50 text-green-600" },
    { label: "Từ chối", value: "5", icon: "✗", color: "bg-red-50 text-red-600" }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ">
      {stats.map((stat, index) => (
        <Card key={index} className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                <span className="text-xl">{stat.icon}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const RegistrationFilters = () => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <Select>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Tất cả trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trạng thái</SelectItem>
          <SelectItem value="pending">Chờ duyệt</SelectItem>
          <SelectItem value="approved">Đã duyệt</SelectItem>
          <SelectItem value="rejected">Từ chối</SelectItem>
        </SelectContent>
      </Select>

      <Select>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Tất cả danh mục" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả danh mục</SelectItem>
          <SelectItem value="biotech">Công nghệ sinh học</SelectItem>
          <SelectItem value="renewable">Năng lượng tái tạo</SelectItem>
          <SelectItem value="water">Xử lý nước</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex-1 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input 
            placeholder="Tìm kiếm đơn đăng ký..." 
            className="pl-10"
          />
        </div>
        <Button className="px-6">
          <Search size={20} />
        </Button>
      </div>
    </div>
  );
};

const RegistrationTable = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Danh sách đơn đăng ký</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Sản phẩm</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Người đăng ký</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Danh mục</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Trạng thái</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Ngày gửi</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {mockRegistrations.map((registration) => {
                const statusInfo = statusConfig[registration.status as keyof typeof statusConfig];
                const StatusIcon = statusInfo.icon;
                
                return (
                  <tr key={registration.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900">{registration.productName}</p>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{registration.applicant}</td>
                    <td className="py-4 px-4 text-gray-600">{registration.category}</td>
                    <td className="py-4 px-4">
                      <Badge className={`${statusInfo.color} border-0`}>
                        <StatusIcon size={12} className="mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{registration.submittedAt}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" className="p-2">
                          <Eye size={16} />
                        </Button>
                        {registration.status === 'pending' && (
                          <>
                            <Button variant="ghost" size="sm" className="p-2 text-green-600 hover:text-green-700">
                              <Check size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" className="p-2 text-red-600 hover:text-red-700">
                              <X size={16} />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Hiển thị 1-3 trong tổng số 156 đơn đăng ký
          </p>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const RegistrationManagementPage = () => {
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
              <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn đăng ký</h1>
              <p className="text-gray-600">Duyệt và quản lý các đơn đăng ký sản phẩm</p>
            </div>
            <div className="flex items-center space-x-4">
              <RegisterProductForm onProductRegistered={() => {
                // Có thể refresh danh sách ở đây
                console.log('Sản phẩm đã được đăng ký thành công');
              }} />
              <Button variant="ghost" size="sm" className="p-2">
                <Bell size={20} />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Vendor Name</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <RegistrationStatsCards />
          <RegistrationFilters />
          <RegistrationTable />
        </main>
      </div>
    </div>
  );
};

export default RegistrationManagementPage;
