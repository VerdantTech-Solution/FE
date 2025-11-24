import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import VendorSidebar from './VendorSidebar';
import AddressSelector from '@/components/AddressSelector';
import { 
  Bell,
  Save,
  Edit,
  MapPin,
  Phone,
  Mail,
  Building,
  Loader2,
  FileText,
  Award,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router';
import { 
  getVendorByUserId, 
  updateVendorProfile,
  type VendorProfileResponse,
  type UpdateVendorProfileRequest 
} from '@/api/vendor';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


interface VendorProfileProps {
  vendorData: VendorProfileResponse | null;
  loading: boolean;
  onUpdate?: (data: Partial<VendorProfileResponse>) => Promise<void>;
  isUpdating?: boolean;
  onVendorDataUpdated?: () => void;
}

const VendorProfile = ({ vendorData, loading, onUpdate, isUpdating = false, onVendorDataUpdated }: VendorProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    province: "",
    district: "",
    commune: "",
    description: "",
    website: "",
    taxCode: "",
    businessRegistrationNumber: ""
  });

  // Update form data when vendorData changes
  useEffect(() => {
    if (vendorData) {
      // Luôn cập nhật formData khi vendorData thay đổi
      // Điều này đảm bảo form hiển thị dữ liệu mới sau khi update thành công
      setFormData({
        companyName: vendorData.companyName || "",
        contactPerson: vendorData.fullName || "",
        email: vendorData.email || "",
        phone: vendorData.phoneNumber || "",
        address: vendorData.companyAddress || "",
        province: vendorData.province || "",
        district: vendorData.district || "",
        commune: vendorData.commune || "",
        description: "",
        website: "",
        taxCode: vendorData.taxCode || "",
        businessRegistrationNumber: vendorData.businessRegistrationNumber || ""
      });
      
      // Gọi callback nếu có để thông báo vendorData đã được cập nhật
      if (onVendorDataUpdated) {
        onVendorDataUpdated();
      }
    }
  }, [vendorData?.id, vendorData?.companyName, vendorData?.fullName, vendorData?.email, vendorData?.phoneNumber, vendorData?.companyAddress, vendorData?.province, vendorData?.district, vendorData?.commune, vendorData?.taxCode, vendorData?.businessRegistrationNumber, onVendorDataUpdated]);

  const handleSave = async () => {
    if (!onUpdate) return;
    
    try {
      // Đợi update hoàn thành
      await onUpdate({
        companyName: formData.companyName,
        fullName: formData.contactPerson,
        email: formData.email,
        phoneNumber: formData.phone,
        companyAddress: formData.address,
        province: formData.province,
        district: formData.district,
        commune: formData.commune,
        taxCode: formData.taxCode,
        businessRegistrationNumber: formData.businessRegistrationNumber
      });
      // Chỉ đóng chế độ chỉnh sửa sau khi update thành công
      // FormData sẽ được cập nhật tự động qua useEffect khi vendorData thay đổi
      setIsEditing(false);
    } catch (error) {
      // Error is handled in parent component
      console.error('Error saving vendor profile:', error);
      // Không đóng chế độ chỉnh sửa nếu có lỗi
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Đang tải thông tin...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!vendorData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-600">Không tìm thấy thông tin vendor</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Thông tin công ty</CardTitle>
          <Button 
            variant={isEditing ? "default" : "outline"} 
            size="sm"
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : isEditing ? (
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
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm font-semibold text-gray-700">
                Tên công ty
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                disabled={!isEditing}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPerson" className="text-sm font-semibold text-gray-700">
                Người liên hệ
              </Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                disabled={!isEditing}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={!isEditing}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                Số điện thoại
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                disabled={!isEditing}
                className="h-11"
              />
            </div>
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-semibold text-gray-700">
                Địa chỉ công ty
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                disabled={!isEditing}
                rows={3}
                placeholder="Nhập địa chỉ chi tiết"
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Tỉnh/Thành - Quận/Huyện - Xã/Phường
              </Label>
              {isEditing ? (
                <AddressSelector
                  selectedCity={formData.province}
                  selectedDistrict={formData.district}
                  selectedWard={formData.commune}
                  onCityChange={(value) => setFormData({...formData, province: value})}
                  onDistrictChange={(value) => setFormData({...formData, district: value})}
                  onWardChange={(value) => setFormData({...formData, commune: value})}
                  initialCity={formData.province}
                  initialDistrict={formData.district}
                  initialWard={formData.commune}
                />
              ) : (
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 space-y-2">
                      {formData.province && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500 w-20">Tỉnh/Thành:</span>
                          <span className="text-sm font-semibold text-gray-900">{formData.province}</span>
                        </div>
                      )}
                      {formData.district && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500 w-20">Quận/Huyện:</span>
                          <span className="text-sm font-semibold text-gray-900">{formData.district}</span>
                        </div>
                      )}
                      {formData.commune && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500 w-20">Xã/Phường:</span>
                          <span className="text-sm font-semibold text-gray-900">{formData.commune}</span>
                        </div>
                      )}
                      {!formData.province && !formData.district && !formData.commune && (
                        <p className="text-sm text-gray-500">Chưa có thông tin địa chỉ</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxCode" className="text-sm font-semibold text-gray-700">
                Mã số thuế
              </Label>
              <Input
                id="taxCode"
                value={formData.taxCode}
                onChange={(e) => setFormData({...formData, taxCode: e.target.value})}
                disabled={!isEditing}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessRegistrationNumber" className="text-sm font-semibold text-gray-700">
                Số đăng ký kinh doanh
              </Label>
              <Input
                id="businessRegistrationNumber"
                value={formData.businessRegistrationNumber}
                onChange={(e) => setFormData({...formData, businessRegistrationNumber: e.target.value})}
                disabled={!isEditing}
                className="h-11"
              />
            </div>
          </div>
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

const CertificatesSection = ({ vendorData }: { vendorData: VendorProfileResponse | null }) => {
  if (!vendorData || !vendorData.files || vendorData.files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Chứng chỉ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Chưa có chứng chỉ nào</p>
            <p className="text-sm text-gray-400 mt-1">Vui lòng tải lên chứng chỉ của công ty</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Chứng chỉ ({vendorData.files.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendorData.files.map((file, index) => (
            <div
              key={file.id}
              className="group relative border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all duration-200 bg-white"
            >
              {/* Image Preview */}
              <div className="aspect-video w-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                <img
                  src={file.imageUrl}
                  alt={`Chứng chỉ ${index + 1}`}
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Certificate';
                  }}
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={() => window.open(file.imageUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Xem chi tiết
                  </Button>
                </div>
              </div>
              
              {/* File Info */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-900">
                      Chứng chỉ {index + 1}
                    </span>
                  </div>
                  {file.purpose && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {file.purpose}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">ID: {file.id}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const VendorInfoPage = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [vendorData, setVendorData] = useState<VendorProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch vendor profile on mount
  useEffect(() => {
    const fetchVendorProfile = async () => {
      if (!user?.id) {
        setError('Không tìm thấy thông tin người dùng');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
        const profile = await getVendorByUserId(userId);
        setVendorData(profile);
      } catch (err: any) {
        console.error('Error fetching vendor profile:', err);
        setError(err?.message || 'Không thể tải thông tin vendor');
      } finally {
        setLoading(false);
      }
    };

    fetchVendorProfile();
  }, [user?.id]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleUpdateVendor = async (data: Partial<VendorProfileResponse>) => {
    if (!vendorData?.id) {
      setUpdateError('Không tìm thấy ID vendor');
      return;
    }

    try {
      setIsUpdating(true);
      setUpdateError(null);

      // Chỉ gửi các trường được phép cập nhật (không gửi files/chứng chỉ)
      const updateData: UpdateVendorProfileRequest = {
        id: vendorData.id,
        companyName: data.companyName || vendorData.companyName || '',
        businessRegistrationNumber: data.businessRegistrationNumber || vendorData.businessRegistrationNumber || '',
        companyAddress: data.companyAddress || vendorData.companyAddress || '',
        province: data.province || vendorData.province || '',
        district: data.district || vendorData.district || '',
        commune: data.commune || vendorData.commune || '',
        email: data.email || vendorData.email || '',
        fullName: data.fullName || vendorData.fullName || '',
        phoneNumber: data.phoneNumber || vendorData.phoneNumber || '',
        taxCode: data.taxCode || vendorData.taxCode || ''
      };

      // Gọi API cập nhật
      const result = await updateVendorProfile(vendorData.id, updateData);
      console.log('Update vendor profile result:', result);
      
      // Hiển thị dialog thành công
      console.log('Setting showSuccessDialog to true');
      setShowSuccessDialog(true);
      console.log('showSuccessDialog should be true now');
      
    } catch (err: any) {
      console.error('Error updating vendor profile:', err);
      setUpdateError(err?.message || 'Không thể cập nhật thông tin vendor');
      
      // Ẩn thông báo lỗi sau 5 giây
      setTimeout(() => {
        setUpdateError(null);
      }, 5000);
    } finally {
      setIsUpdating(false);
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Thông tin vendor</h1>
              <p className="text-gray-600">Quản lý thông tin công ty và hồ sơ</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="p-2">
                <Bell size={20} />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">
                  {vendorData?.companyName || user?.fullName || 'Vendor'}
                </span>
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
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}
          {updateError && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-600">{updateError}</p>
              </CardContent>
            </Card>
          )}
          {vendorData && <BusinessStats />}
          <div className="space-y-6">
            <VendorProfile 
              vendorData={vendorData} 
              loading={loading}
              onUpdate={handleUpdateVendor}
              isUpdating={isUpdating}
              onVendorDataUpdated={() => {
                // Callback này được gọi khi vendorData được cập nhật
                // Có thể thêm logic bổ sung nếu cần
                console.log('Vendor data updated successfully');
              }}
            />
            {vendorData && <CertificatesSection vendorData={vendorData} />}
          </div>
        </main>
      </div>

      {/* Success Alert Dialog */}
      {showSuccessDialog && (
        <AlertDialog open={showSuccessDialog} onOpenChange={(open) => {
          console.log('AlertDialog onOpenChange:', open);
          setShowSuccessDialog(open);
        }}>
          <AlertDialogContent className="sm:max-w-[400px] z-[200]">
            <AlertDialogHeader>
              <div className="mx-auto mb-4 w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <AlertDialogTitle className="text-xl font-bold text-center">
                Cập nhật thành công!
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Thông tin vendor đã được cập nhật thành công. Các thay đổi đã được lưu vào hệ thống.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => {
                  console.log('Closing dialog and reloading...');
                  setShowSuccessDialog(false);
                  // Reload trang sau khi đóng dialog để hiển thị dữ liệu mới
                  setTimeout(() => {
                    window.location.reload();
                  }, 300);
                }}
                className="bg-green-600 hover:bg-green-700 text-white w-full"
              >
                Đóng
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default VendorInfoPage;
