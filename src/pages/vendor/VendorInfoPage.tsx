import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import VendorSidebar from './VendorSidebar';
import { 
  Bell,
  Save,
  Edit,
  MapPin,
  Phone,
  Mail,
  Building
} from 'lucide-react';


const VendorProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "Công ty TNHH Nông nghiệp Xanh",
    contactPerson: "Nguyễn Văn A",
    email: "contact@greenagri.com",
    phone: "0123456789",
    address: "123 Đường Nông nghiệp, Quận 1, TP.HCM",
    description: "Chuyên cung cấp các sản phẩm nông nghiệp công nghệ cao, thân thiện với môi trường.",
    website: "www.greenagri.com",
    taxCode: "0123456789"
  });

  const handleSave = () => {
    setIsEditing(false);
    // Handle save logic here
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Thông tin công ty</CardTitle>
          <Button 
            variant={isEditing ? "default" : "outline"} 
            size="sm"
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          >
            {isEditing ? (
              <>
                <Save size={16} className="mr-2" />
                Lưu
              </>
            ) : (
              <>
                <Edit size={16} className="mr-2" />
                Chỉnh sửa
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">Tên công ty</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="contactPerson">Người liên hệ</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                disabled={!isEditing}
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="address">Địa chỉ</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                disabled={!isEditing}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="taxCode">Mã số thuế</Label>
              <Input
                id="taxCode"
                value={formData.taxCode}
                onChange={(e) => setFormData({...formData, taxCode: e.target.value})}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Label htmlFor="description">Mô tả công ty</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            disabled={!isEditing}
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
};

const BusinessStats = () => {
  const stats = [
    { label: "Sản phẩm đã đăng", value: "24", icon: Building },
    { label: "Đơn hàng thành công", value: "156", icon: Phone },
    { label: "Đánh giá trung bình", value: "4.8/5", icon: Mail },
    { label: "Thời gian hoạt động", value: "2 năm", icon: MapPin }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
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

const VerificationStatus = () => {
  const verifications = [
    { label: "Xác thực danh tính", status: "verified", description: "Đã xác thực" },
    { label: "Xác thực doanh nghiệp", status: "verified", description: "Đã xác thực" },
    { label: "Xác thực sản phẩm", status: "pending", description: "Đang chờ duyệt" },
    { label: "Xác thực thanh toán", status: "verified", description: "Đã xác thực" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Trạng thái xác thực</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {verifications.map((verification, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{verification.label}</p>
                <p className="text-sm text-gray-600">{verification.description}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(verification.status)}`}>
                {verification.status === 'verified' ? 'Đã xác thực' : 
                 verification.status === 'pending' ? 'Đang chờ' : 'Từ chối'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const VendorInfoPage = () => {
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
              <h1 className="text-2xl font-bold text-gray-900">Thông tin vendor</h1>
              <p className="text-gray-600">Quản lý thông tin công ty và hồ sơ</p>
            </div>
            <div className="flex items-center space-x-4">
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
          <BusinessStats />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VendorProfile />
            <VerificationStatus />
          </div>
        </main>
      </div>
    </div>
  );
};

export default VendorInfoPage;
