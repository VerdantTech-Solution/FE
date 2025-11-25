import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, Search, Filter, Edit, Trash, Eye } from "lucide-react";

export const AdminEquipmentPage = () => {
  const productCategories = [
    { name: 'Drone & UAV', value: 35, color: '#10B981', sales: 12500000, stock: 45, status: 'active' },
    { name: 'Máy móc nông nghiệp', value: 28, color: '#3B82F6', sales: 9800000, stock: 32, status: 'active' },
    { name: 'Dụng cụ làm nông', value: 20, color: '#F59E0B', sales: 7200000, stock: 128, status: 'active' },
    { name: 'Phân bón & Thuốc', value: 12, color: '#EF4444', sales: 4200000, stock: 89, status: 'low' },
    { name: 'Hạt giống & Cây con', value: 5, color: '#8B5CF6', sales: 1800000, stock: 156, status: 'active' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'low':
        return 'bg-yellow-100 text-yellow-800';
      case 'out':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Còn hàng';
      case 'low':
        return 'Sắp hết';
      case 'out':
        return 'Hết hàng';
      default:
        return 'Không xác định';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý thiết bị nông nghiệp</h2>
          <p className="text-gray-600">Theo dõi và quản lý tất cả thiết bị, máy móc và dụng cụ</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder="Tìm kiếm thiết bị..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Lọc
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Thêm thiết bị
          </Button>
        </div>
      </div>

      {/* Equipment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {productCategories.map((category, index) => (
          <div key={index} className="p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.value}% tổng sản phẩm</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Doanh thu:</span>
                <span className="font-medium">{category.sales.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tồn kho:</span>
                <span className="font-medium">{category.stock} đơn vị</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Trạng thái:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(category.status)}`}>
                  {getStatusText(category.status)}
                </span>
              </div>
              <Progress value={category.value} className="h-2" />
              <div className="flex gap-2">
                <Button className="flex-1" variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Xem
                </Button>
                <Button className="flex-1" variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Sửa
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Equipment Management Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Danh sách thiết bị chi tiết</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Thiết bị</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Danh mục</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Tồn kho</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Giá bán</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Trạng thái</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Drone DJI Agras T30', category: 'Drone & UAV', stock: 15, price: '85.000.000đ', status: 'active' },
                  { name: 'Máy cày mini Kubota', category: 'Máy móc nông nghiệp', stock: 8, price: '45.000.000đ', status: 'active' },
                  { name: 'Bộ dụng cụ làm vườn', category: 'Dụng cụ làm nông', stock: 45, price: '850.000đ', status: 'active' },
                  { name: 'Hệ thống tưới tự động', category: 'Hệ thống tưới tiêu', stock: 12, price: '2.500.000đ', status: 'low' },
                  { name: 'Phân bón hữu cơ', category: 'Phân bón & Thuốc', stock: 89, price: '150.000đ', status: 'active' },
                ].map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{item.category}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.stock > 20 ? 'bg-green-100 text-green-800' : 
                        item.stock > 10 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.stock} đơn vị
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{item.price}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="p-2">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-2">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-2 text-red-600">
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">156</div>
                <div className="text-sm text-gray-600">Tổng thiết bị</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">23</div>
                <div className="text-sm text-gray-600">Đang hoạt động</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">8</div>
                <div className="text-sm text-gray-600">Cần bảo trì</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">3</div>
                <div className="text-sm text-gray-600">Hỏng hóc</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
