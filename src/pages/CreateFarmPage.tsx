import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogContent, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { MapPin, CheckCircle2, ArrowLeft, ArrowRight, Map, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createFarmProfile, type CreateFarmProfileRequest } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import MapAreaPage from "./MapAreaPage";
import StepIndicator from "@/components/StepIndicator";
import AddressSelector from "@/components/AddressSelector";

export const CreateFarmPage = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  // const [message, setMessage] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successData, setSuccessData] = useState<{farmName: string, farmSize: string} | null>(null);

  // Ẩn loading sau khi component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Form state theo API schema
  const [form, setForm] = useState({
    farmName: "",
    farmSizeHectares: "",
    locationAddress: "",
    city: "",
    district: "",
    ward: "",
    provinceCode: 0,
    districtCode: 0,
    communeCode: "", // Changed to string
    latitude: "",
    longitude: "",
    primaryCrops: "",
  });

  const steps = [
    "Chọn vị trí & Diện tích",
    "Thông tin trang trại", 
    "Xác nhận & Tạo"
  ];

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  // Handle address selection from AddressSelector
  const handleCityChange = useCallback((city: string, code?: string) => {
    setForm((f) => ({ ...f, city, provinceCode: code ? parseInt(code) || 0 : 0, district: '', ward: '', districtCode: 0, communeCode: "" }));
  }, []);

  const handleDistrictChange = useCallback((district: string, code?: string) => {
    setForm((f) => ({ ...f, district, districtCode: code ? parseInt(code) || 0 : 0, ward: '', communeCode: "" }));
  }, []);

  const handleWardChange = useCallback((ward: string, code?: string) => {
    setForm((f) => ({ ...f, ward, communeCode: code || "" }));
  }, []);




  // Callback để nhận tọa độ từ MapAreaPage
  const handleCoordinatesFromMap = useCallback((lat: number, lng: number) => {
    setForm((f) => ({
      ...f,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }));
    // Coordinates updated from map
  }, []);

  // Callback để nhận diện tích từ MapAreaPage
  const handleAreaFromMap = useCallback((areaHectares: number) => {
    setForm((f) => ({
      ...f,
      farmSizeHectares: areaHectares.toFixed(4),
    }));
    // Area updated from map
  }, []);

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    // Only allow navigating to the next steps if all prior steps are valid
    if (step === 1) {
      setCurrentStep(1);
      return;
    }
    if (step === 2 && validateStep(1)) {
      setCurrentStep(2);
      return;
    }
    if (step === 3 && validateStep(1) && validateStep(2)) {
      setCurrentStep(3);
      return;
    }
    // otherwise ignore click
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Bước 1: Bắt buộc có tọa độ và diện tích hợp lệ từ bản đồ
        return !!(form.latitude && form.longitude && form.farmSizeHectares &&
                 !Number.isNaN(Number(form.latitude)) && Number(form.latitude) >= -90 && Number(form.latitude) <= 90 &&
                 !Number.isNaN(Number(form.longitude)) && Number(form.longitude) >= -180 && Number(form.longitude) <= 180 &&
                 !Number.isNaN(Number(form.farmSizeHectares)) && Number(form.farmSizeHectares) > 0);
      case 2:
        // Bước 2: Bắt buộc nhập đầy đủ các trường thông tin
        return !!(
          form.farmName.trim() &&
          form.primaryCrops.trim() &&
          form.locationAddress.trim() &&
          form.city.trim() &&
          form.district.trim() &&
          form.ward.trim()
        );
      case 3:
        return true;
      default:
        return false;
    }
  };

  const submitForm = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để tạo trang trại');
      return;
    }

    setSubmitting(true);
    
    try {
      const payload: CreateFarmProfileRequest = {
        farmName: form.farmName,
        farmSizeHectares: Number(form.farmSizeHectares) || 0,
        locationAddress: form.locationAddress || undefined,
        province: form.city || undefined, // Map city to province for API
        district: form.district || undefined,
        commune: form.ward || undefined, // Map ward to commune for API
        provinceCode: form.provinceCode || undefined,
        districtCode: form.districtCode || undefined,
        communeCode: form.communeCode || undefined, // Now properly handled as string
        latitude: form.latitude === "" ? undefined : Number(form.latitude),
        longitude: form.longitude === "" ? undefined : Number(form.longitude),
        primaryCrops: form.primaryCrops || undefined,
      };

      const res = await createFarmProfile(payload);
      if (!res.status) {
        throw new Error((res.errors || []).join(', '));
      }
      
      // Set success data and show alert
      setSuccessData({
        farmName: form.farmName,
        farmSize: form.farmSizeHectares
      });
      setShowSuccessAlert(true);
      
      // Reset form
      setForm({
        farmName: "",
        farmSizeHectares: "",
        locationAddress: "",
        city: "",
        district: "",
        ward: "",
        provinceCode: 0,
        districtCode: 0,
        communeCode: "",
        latitude: "",
        longitude: "",
        primaryCrops: "",
      });
      
      // Reset to first step
      setCurrentStep(1);
    } catch (error) {
      console.error('Error creating farm profile:', error);
      // You can add error handling here if needed
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mb-4 shadow-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Chọn vị trí & Diện tích</h3>
              <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Chọn điểm trên bản đồ để xác định vị trí và đo diện tích trang trại một cách chính xác
              </p>
            </div>

            {/* Bản đồ */}
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Map className="h-4 w-4 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Đo diện tích khu đất</h4>
                </div>
                <p className="text-sm text-gray-600">Chấm điểm trên bản đồ để đo diện tích chính xác</p>
              </div>
              
              <div className="relative">
                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-gray-50 min-h-[520px]">
                  {mapLoading && (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-20">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Đang tải bản đồ...</p>
                      </div>
                    </div>
                  )}
                  <MapAreaPage 
                    onCoordinatesChange={handleCoordinatesFromMap}
                    onAreaChange={handleAreaFromMap}
                  />
                </div>
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-sm z-10">
                  <p className="text-xs text-gray-600 font-medium">
                    💡 Click vào bản đồ để chọn điểm
                  </p>
                </div>
              </div>
            </div>

            {/* Hiển thị kết quả từ bản đồ */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-800">Kết quả đo đạc</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vĩ độ (latitude) <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    value={form.latitude} 
                    onChange={handleChange('latitude')} 
                    placeholder="Từ bản đồ" 
                    inputMode="decimal" 
                    type="number"
                    step="any"
                    required
                    readOnly
                    className="bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">Tự động từ điểm đã chọn</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kinh độ (longitude) <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    value={form.longitude} 
                    onChange={handleChange('longitude')} 
                    placeholder="Từ bản đồ" 
                    inputMode="decimal" 
                    type="number"
                    step="any"
                    required
                    readOnly
                    className="bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">Tự động từ điểm đã chọn</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diện tích (ha) <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    value={form.farmSizeHectares} 
                    onChange={handleChange('farmSizeHectares')} 
                    placeholder="Từ bản đồ" 
                    inputMode="decimal" 
                    required
                    readOnly
                    className="bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">Tự động từ vùng đã chọn</p>
                </div>
              </div>

        
            </div>

            {/* Thông báo trạng thái */}
            <div className="mt-6">
              {form.latitude && form.longitude && form.farmSizeHectares ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-green-700">
                      Hoàn thành đo đạc
                    </p>
                  </div>
                  <p className="text-xs text-green-600">
                    Tọa độ: {form.latitude}, {form.longitude} | Diện tích: {form.farmSizeHectares} ha
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-yellow-600" />
                    </div>
                    <p className="text-sm font-medium text-yellow-700">
                      Chưa hoàn thành đo đạc
                    </p>
                  </div>
                  <p className="text-xs text-yellow-600">
                    Vui lòng chọn ít nhất 3 điểm trên bản đồ để đo diện tích
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl mb-4 shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Thông tin trang trại</h3>
              <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Nhập thông tin chi tiết về trang trại của bạn để hoàn thiện hồ sơ
              </p>
            </div>

            {/* Thông tin cơ bản */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800">Thông tin cơ bản</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên trang trại <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    value={form.farmName} 
                    onChange={handleChange('farmName')} 
                    placeholder="VD: Trang trại A" 
                    required 
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cây trồng chính <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    value={form.primaryCrops} 
                    onChange={handleChange('primaryCrops')} 
                    placeholder="Lúa, ngô, sắn..." 
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Nhập nhiều loại, phân tách bằng dấu phẩy
                  </p>
                </div>
              </div>
            </div>

            {/* Địa chỉ hành chính */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800">Địa chỉ hành chính</h4>
              </div>
              
              {/* Detailed Address */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ chi tiết <span className="text-red-500">*</span>
                </label>
                <Input 
                  value={form.locationAddress} 
                  onChange={handleChange('locationAddress')} 
                  placeholder="Số nhà, đường, tên đường..." 
                  className="w-full"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Nhập địa chỉ chi tiết như số nhà, tên đường, tên khu phố...
                </p>
              </div>

              {/* Administrative Address Selectors */}
              <div className="bg-gradient-to-r from-blue-50 to-emerald-50 p-6 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <MapPin className="w-3 h-3 text-white" />
                  </div>
                  <h5 className="font-semibold text-gray-800">Chọn địa chỉ hành chính</h5>
                </div>
                <AddressSelector
                  selectedCity={form.city}
                  selectedDistrict={form.district}
                  selectedWard={form.ward}
                  onCityChange={handleCityChange}
                  onDistrictChange={handleDistrictChange}
                  onWardChange={handleWardChange}
                />
                <p className="mt-3 text-xs text-gray-600">
                  💡 Chọn tỉnh/thành trước, sau đó quận/huyện, cuối cùng là xã/phường
                </p>
              </div>
            </div>

            {/* Hiển thị thông tin từ bước 1 */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <Map className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800">Thông tin vị trí (từ bước 1)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vĩ độ (latitude)
                  </label>
                  <Input 
                    value={form.latitude} 
                    placeholder="Từ bản đồ" 
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kinh độ (longitude)
                  </label>
                  <Input 
                    value={form.longitude} 
                    placeholder="Từ bản đồ" 
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diện tích (ha)
                  </label>
                  <Input 
                    value={form.farmSizeHectares} 
                    placeholder="Từ bản đồ" 
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  ℹ️ <strong>Lưu ý:</strong> Thông tin vị trí và diện tích đã được xác định từ bước 1, không thể chỉnh sửa
                </p>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl mb-4 shadow-lg">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Xác nhận & Tạo trang trại</h3>
              <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Kiểm tra lại toàn bộ thông tin trước khi tạo trang trại
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Thông tin vị trí từ bước 1 */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-white" />
                    </div>
                    Vị trí & Diện tích (Bước 1)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tọa độ GPS</label>
                    <p className="text-sm text-gray-900 font-mono">
                      {form.latitude && form.longitude 
                        ? `${form.latitude}, ${form.longitude}` 
                        : "Chưa xác định"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Diện tích</label>
                    <p className="text-sm text-gray-900 font-semibold">
                      {form.farmSizeHectares ? `${form.farmSizeHectares} ha` : "Chưa đo"}
                    </p>
                  </div>
                  <div className="p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-xs text-green-700">
                      ✅ Đã xác định từ bản đồ
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Thông tin trang trại từ bước 2 */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-50 to-emerald-100">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    Thông tin trang trại (Bước 2)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tên trang trại</label>
                    <p className="text-sm text-gray-900 font-semibold">
                      {form.farmName || "Chưa nhập"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cây trồng chính</label>
                    <p className="text-sm text-gray-900">
                      {form.primaryCrops || "Chưa nhập"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Địa chỉ</label>
                    <p className="text-sm text-gray-900">
                      {[form.locationAddress, form.ward, form.district, form.city]
                        .filter(Boolean)
                        .join(", ") || "Chưa nhập"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Thông tin chủ trang trại */}
            {user && (
              <Card className="shadow-lg border-0 bg-gradient-to-br from-gray-50 to-gray-100">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                    Chủ trang trại
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-sm">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      <p className="text-xs text-gray-500">ID: {user.id}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tóm tắt cuối cùng */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Tóm tắt</h4>
              </div>
              <div className="text-sm text-gray-700 space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${form.latitude && form.longitude ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                  <span><strong>Vị trí:</strong> {form.latitude && form.longitude ? 'Đã xác định' : 'Chưa xác định'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${form.farmSizeHectares ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                  <span><strong>Diện tích:</strong> {form.farmSizeHectares ? `${form.farmSizeHectares} ha` : 'Chưa đo'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${form.farmName ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                  <span><strong>Tên trang trại:</strong> {form.farmName ? 'Đã nhập' : 'Chưa nhập'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${user ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                  <span><strong>Chủ sở hữu:</strong> {user ? 'Đã xác định' : 'Chưa đăng nhập'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 py-8 "
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8  ">
        {/* Header with enhanced styling */}
        <motion.div 
          className="text-center mb-12 mt-[80px]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
         
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-emerald-700 bg-clip-text text-transparent mb-4">
            Tạo trang trại mới
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Thiết lập trang trại của bạn trong 3 bước đơn giản với công nghệ bản đồ hiện đại
          </p>
        </motion.div>

        {/* Step Indicator with enhanced container */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
            <StepIndicator
              currentStep={currentStep}
              totalSteps={steps.length}
              steps={steps}
              onStepClick={goToStep}
              canClickStep={(step: number) => {
                if (step === 1) return true;
                if (step === 2) return validateStep(1);
                if (step === 3) return validateStep(1) && validateStep(2);
                return false;
              }}
            />
          </div>
        </motion.div>

        {/* Main Content with enhanced styling */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="mb-8 shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-t-lg"></div>
              <div className="p-8">
                <AnimatePresence mode="wait">
                  {renderStepContent()}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Navigation */}
        <motion.div 
          className="flex justify-between items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="gap-2 px-6 py-3 rounded-xl border-2 hover:bg-gray-50 transition-all duration-300 disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>

          <div className="flex gap-3">
            {currentStep < steps.length ? (
              <Button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className="gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tiếp theo
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={submitForm}
                disabled={submitting || !validateStep(1) || !validateStep(2)}
                className="gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang tạo...
                  </div>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Tạo trang trại
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Enhanced Message */}
        {/* {message && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-2xl shadow-lg backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-800">{message}</p>
            </div>
          </motion.div>
        )} */}
      </div>

      {/* Success Alert Dialog */}
      <AlertDialog open={showSuccessAlert} onOpenChange={setShowSuccessAlert}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-emerald-700">
              🎉 Tạo trang trại thành công!
            </AlertDialogTitle>
            <div className="text-gray-600 space-y-2">
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <div className="font-semibold text-emerald-800 mb-2">Thông tin trang trại:</div>
                <div><strong>Tên trang trại:</strong> {successData?.farmName}</div>
                <div><strong>Diện tích:</strong> {successData?.farmSize} ha</div>
              </div>
              <div className="text-sm">
                Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <AlertDialogAction 
              onClick={() => setShowSuccessAlert(false)}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold px-8 py-2 rounded-lg"
            >
              Tuyệt vời!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default CreateFarmPage;
