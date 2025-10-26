import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, X, Loader2, Crop } from 'lucide-react';
import { updateFarmProfile, getFarmProfileById, type FarmProfile, type CreateFarmProfileRequest } from '@/api/farm';
import { toast } from 'sonner';
import MapAreaPage from './MapAreaPage';
import AddressSelector from '@/components/AddressSelector';

interface UpdateFarmFormData {
  farmName: string;
  farmSizeHectares: number;
  locationAddress: string;
  city: string;
  district: string;
  ward: string;
  provinceCode?: number;
  districtCode?: number;
  communeCode?: number;
  latitude: number;
  longitude: number;
  status: 'Active' | 'Maintenance' | 'Deleted';
  primaryCrops: string;
}

const UpdateFarmPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [farmData, setFarmData] = useState<FarmProfile | null>(null);
  const [formData, setFormData] = useState<UpdateFarmFormData>({
    farmName: '',
    farmSizeHectares: 0,
    locationAddress: '',
    city: '',
    district: '',
    ward: '',
    provinceCode: 0,
    districtCode: 0,
    communeCode: 0,
    latitude: 0,
    longitude: 0,
    status: 'Active',
    primaryCrops: '',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load farm data
  useEffect(() => {
    const loadFarmData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        console.log('Loading farm data for ID:', id);
        
        const farm = await getFarmProfileById(Number(id));
        console.log('Raw API response:', farm);
        console.log('Farm type:', typeof farm);
        console.log('Farm keys:', Object.keys(farm || {}));
        
        setFarmData(farm);
        
        // Populate form with existing data - handle different response structures
        const farmAny = farm as any; // Type assertion to handle different API response structures
        const formData = {
          farmName: farm?.farmName || farmAny?.name || farmAny?.farm_name || '',
          farmSizeHectares: farm?.farmSizeHectares || farmAny?.farm_size_hectares || farmAny?.size || 0,
          locationAddress: farm?.address?.locationAddress || farmAny?.address?.location_address || farmAny?.location_address || '',
          city: farm?.address?.province || farmAny?.province || '', // Map province to city
          district: farm?.address?.district || farmAny?.district || '',
          ward: farm?.address?.commune || farmAny?.commune || farmAny?.ward || '', // Map commune to ward
          provinceCode: farmAny?.address?.provinceCode || farmAny?.provinceCode || 0,
          districtCode: farmAny?.address?.districtCode || farmAny?.districtCode || 0,
          communeCode: farmAny?.address?.communeCode || farmAny?.communeCode || 0,
          latitude: farm?.address?.latitude || farmAny?.latitude || farmAny?.lat || 0,
          longitude: farm?.address?.longitude || farmAny?.longitude || farmAny?.lng || 0,
          status: farm?.status || 'Active',
          primaryCrops: farm?.primaryCrops || farmAny?.primary_crops || farmAny?.crops || '',
        };
        
        console.log('Processed form data:', formData);
        console.log('Farm name specifically:', formData.farmName);
        
        setFormData(formData);
        
        // Show success message
        toast.success('Đã tải thông tin trang trại thành công!');
        
        // Force re-render to ensure form is populated
        setTimeout(() => {
          console.log('Force re-render - formData:', formData);
          setFormData(prev => ({ ...prev }));
        }, 100);
      } catch (error) {
        console.error('Error loading farm data:', error);
        console.error('Error details:', error);
        
        // Show detailed error
        toast.error(`Lỗi tải dữ liệu: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Try to navigate back after a delay
        setTimeout(() => {
          navigate('/farmlist');
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFarmData();
  }, [id, navigate]);

  const handleInputChange = (field: keyof UpdateFarmFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle coordinates from map
  const handleCoordinatesChange = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  // Handle area from map
  const handleAreaChange = (areaHectares: number) => {
    setFormData(prev => ({
      ...prev,
      farmSizeHectares: areaHectares,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.farmName.trim()) {
      toast.error('Tên trang trại không được để trống');
      return;
    }

    if (!formData.city.trim()) {
      toast.error('Tỉnh/Thành không được để trống');
      return;
    }

    if (!formData.district.trim()) {
      toast.error('Quận/Huyện không được để trống');
      return;
    }

    if (!formData.ward.trim()) {
      toast.error('Xã/Phường không được để trống');
      return;
    }

    if (formData.farmSizeHectares <= 0) {
      toast.error('Diện tích phải lớn hơn 0');
      return;
    }

    try {
      setIsSaving(true);
      
      // Ensure province and ProvinceCode follow API rule (both present or both null)
      const updateData: CreateFarmProfileRequest = {
        farmName: formData.farmName.trim(),
        farmSizeHectares: formData.farmSizeHectares,
        locationAddress: formData.locationAddress.trim(),
        province: formData.city.trim(), // Map city to province for API
        district: formData.district.trim(),
        commune: formData.ward.trim(), // Map ward to commune for API
        provinceCode: formData.provinceCode ? String(formData.provinceCode) : undefined,
        districtCode: formData.districtCode ? String(formData.districtCode) : undefined,
        communeCode: formData.communeCode ? String(formData.communeCode) : undefined,
        latitude: formData.latitude,
        longitude: formData.longitude,
        primaryCrops: formData.primaryCrops.trim(),
        status: formData.status,
      };

      // Fix rule: Province and ProvinceCode must both exist or both be null
      if (!updateData.province || updateData.province.trim() === '') {
        updateData.province = undefined;
        updateData.provinceCode = undefined;
      } else if (!updateData.provinceCode || String(updateData.provinceCode) === '0') {
        toast.error('Vui lòng chọn lại Tỉnh/Thành để lấy mã (ProvinceCode).');
        setIsSaving(false);
        return;
      }

      await updateFarmProfile(Number(id), updateData);
      
      toast.success('Cập nhật trang trại thành công!');
      navigate('/farmlist');
    } catch (error) {
      console.error('Error updating farm:', error);
      toast.error('Có lỗi xảy ra khi cập nhật trang trại');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/farmlist');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin trang trại...</p>
        </div>
      </div>
    );
  }

  if (!farmData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Không tìm thấy thông tin trang trại</p>
          <Button onClick={() => navigate('/farmlist')}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className=" bg-gray-50 py-8 my-[100px]">
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cập nhật trang trại</h1>
              <p className="text-gray-600 mt-1">Chỉnh sửa thông tin trang trại: {farmData.farmName}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <Card className="w-full shadow-xl border-2 border-blue-100">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Crop className="h-6 w-6 text-blue-600" />
                Thông tin trang trại
              </CardTitle>
              <CardDescription className="text-gray-600">
                Cập nhật thông tin chi tiết về trang trại của bạn
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-6">

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    📋 Thông tin cơ bản
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Farm Name */}
                    <div className="space-y-2">
                      <Label htmlFor="farmName" className="text-sm font-medium text-gray-700">
                        Tên trang trại <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="farmName"
                        type="text"
                        value={formData.farmName}
                        onChange={(e) => handleInputChange('farmName', e.target.value)}
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Nhập tên trang trại"
                        required
                      />
                    </div>

                    {/* Primary Crops */}
                    <div className="space-y-2">
                      <Label htmlFor="primaryCrops" className="text-sm font-medium text-gray-700">
                        Loại cây trồng chính
                      </Label>
                      <Input
                        id="primaryCrops"
                        type="text"
                        value={formData.primaryCrops}
                        onChange={(e) => handleInputChange('primaryCrops', e.target.value)}
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Ví dụ: Lúa, Ngô, Rau xanh..."
                      />
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                        Trạng thái <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: 'Active' | 'Maintenance' | 'Deleted') => 
                          handleInputChange('status', value)
                        }
                      >
                        <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Hoạt động</SelectItem>
                          <SelectItem value="Maintenance">Bảo trì</SelectItem>
                          <SelectItem value="Deleted">Xóa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Farm Size */}
                    <div className="space-y-2">
                      <Label htmlFor="farmSizeHectares" className="text-sm font-medium text-gray-700">
                        Diện tích (ha) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="farmSizeHectares"
                        value={formData.farmSizeHectares}
                        onChange={(e) => handleInputChange('farmSizeHectares', parseFloat(e.target.value) || 0)}
                        placeholder="Từ bản đồ"
                        inputMode="decimal"
                        required
                        readOnly
                        className="h-11 bg-gray-50 border-gray-300"
                      />
                      <p className="text-xs text-gray-500">Tự động từ vùng đã chọn trên bản đồ</p>
                    </div>
                  </div>
                </div>

                {/* Location Information Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    📍 Thông tin vị trí
                  </h3>
                  
                  {/* Location Address */}
                  <div className="space-y-2">
                    <Label htmlFor="locationAddress" className="text-sm font-medium text-gray-700">
                      Địa chỉ chi tiết
                    </Label>
                    <Input
                      id="locationAddress"
                      type="text"
                      value={formData.locationAddress}
                      onChange={(e) => handleInputChange('locationAddress', e.target.value)}
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Số nhà, tên đường, thôn/xóm..."
                    />
                  </div>

                  {/* Address Fields */}
                  <AddressSelector
                    selectedCity={formData.city}
                    selectedDistrict={formData.district}
                    selectedWard={formData.ward}
                    onCityChange={(value, code) => setFormData(prev => ({
                      ...prev,
                      city: value,
                      provinceCode: code ? parseInt(code) || 0 : 0,
                      // reset lower levels
                      district: '',
                      districtCode: 0,
                      ward: '',
                      communeCode: 0,
                    }))}
                    onDistrictChange={(value, code) => setFormData(prev => ({
                      ...prev,
                      district: value,
                      districtCode: code ? parseInt(code) || 0 : 0,
                      // reset ward
                      ward: '',
                      communeCode: 0,
                    }))}
                    onWardChange={(value, code) => setFormData(prev => ({
                      ...prev,
                      ward: value,
                      communeCode: code ? parseInt(code) || 0 : 0,
                    }))}
                    initialCity={farmData?.address?.province || (farmData as any)?.province || ''}
                    initialDistrict={farmData?.address?.district || (farmData as any)?.district || ''}
                    initialWard={farmData?.address?.commune || (farmData as any)?.commune || (farmData as any)?.ward || ''}
                  />

                  {/* Coordinates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude" className="text-sm font-medium text-gray-700">
                        Vĩ độ (Latitude)
                      </Label>
                      <Input
                        id="latitude"
                        value={formData.latitude}
                        onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value) || 0)}
                        placeholder="Từ bản đồ"
                        inputMode="decimal"
                        readOnly
                        className="h-11 bg-gray-50 border-gray-300"
                      />
                      <p className="text-xs text-gray-500">Tự động từ điểm đã chọn</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="longitude" className="text-sm font-medium text-gray-700">
                        Kinh độ (Longitude)
                      </Label>
                      <Input
                        id="longitude"
                        value={formData.longitude}
                        onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value) || 0)}
                        placeholder="Từ bản đồ"
                        inputMode="decimal"
                        readOnly
                        className="h-11 bg-gray-50 border-gray-300"
                      />
                      <p className="text-xs text-gray-500">Tự động từ điểm đã chọn</p>
                    </div>
                  </div>
                </div>

                {/* Status Notification */}
                <div className="mt-6">
                  {formData.latitude && formData.longitude && formData.farmSizeHectares ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Thông tin đã đầy đủ</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        Tọa độ: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)} | 
                        Diện tích: {formData.farmSizeHectares} ha
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="font-medium">Cần chọn vị trí trên bản đồ</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        Vui lòng chọn điểm trên bản đồ để lấy tọa độ và đo diện tích
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <Button
                    type="submit"
                    className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Đang cập nhật...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 font-medium transition-all duration-200"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="h-5 w-5 mr-2" />
                    Hủy bỏ
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Right Column - Map */}
          <Card className="w-full shadow-xl border-2 border-green-100">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                🗺️ Bản đồ & Đo diện tích
              </CardTitle>
              <CardDescription className="text-gray-600">
                Chọn vị trí và đo diện tích chính xác trên bản đồ
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-0">
              
              <div className="h-full relative overflow-hidden">
                <div className="w-full h-full bg-white">
                  <div className="w-full h-full [&>div]:!min-h-0 [&>div]:!pt-0 [&>div]:!bg-white">
                    <MapAreaPage 
                      onCoordinatesChange={handleCoordinatesChange}
                      onAreaChange={handleAreaChange}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UpdateFarmPage;