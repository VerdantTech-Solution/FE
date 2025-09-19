import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin,CheckCircle2, ArrowLeft, ArrowRight, Map } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createFarmProfile, type CreateFarmProfileRequest } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import MapAreaPage from "./MapAreaPage";
import StepIndicator from "@/components/StepIndicator";

export const CreateFarmPage = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(true);

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
    province: "",
    district: "",
    commune: "",
    latitude: "90",
    longitude: "180",
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

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage('Trình duyệt không hỗ trợ định vị');
      return;
    }

    setMessage('Đang lấy vị trí...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setForm((f) => ({
          ...f,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        }));
        setMessage('Đã lấy tọa độ thành công');
        setTimeout(() => setMessage(null), 2000);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Không thể lấy vị trí';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Bị từ chối quyền truy cập vị trí';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Vị trí không khả dụng';
            break;
          case error.TIMEOUT:
            errorMessage = 'Hết thời gian chờ lấy vị trí';
            break;
        }
        setMessage(errorMessage);
        setTimeout(() => setMessage(null), 3000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };



  // Callback để nhận tọa độ từ MapAreaPage
  const handleCoordinatesFromMap = useCallback((lat: number, lng: number) => {
    setForm((f) => ({
      ...f,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }));
    setMessage(`Đã cập nhật tọa độ từ bản đồ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    setTimeout(() => setMessage(null), 3000);
  }, []);

  // Callback để nhận diện tích từ MapAreaPage
  const handleAreaFromMap = useCallback((areaHectares: number) => {
    setForm((f) => ({
      ...f,
      farmSizeHectares: areaHectares.toFixed(4),
    }));
    setMessage(`Đã cập nhật diện tích từ bản đồ: ${areaHectares.toFixed(4)} ha`);
    setTimeout(() => setMessage(null), 3000);
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
    setCurrentStep(step);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Bước 1: Phải có tọa độ và diện tích từ bản đồ
        return !!(form.latitude && form.longitude && form.farmSizeHectares &&
                 Number(form.latitude) >= -90 && Number(form.latitude) <= 90 &&
                 Number(form.longitude) >= -180 && Number(form.longitude) <= 180 &&
                 Number(form.farmSizeHectares) > 0);
      case 2:
        // Bước 2: Phải có tên trang trại
        return !!(form.farmName.trim());
      case 3:
        return true;
      default:
        return false;
    }
  };

  const submitForm = async () => {
    if (!user) {
      setMessage('Vui lòng đăng nhập để tạo trang trại');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    
    try {
      const payload: CreateFarmProfileRequest = {
        farmName: form.farmName,
        farmSizeHectares: Number(form.farmSizeHectares) || 0,
        locationAddress: form.locationAddress || undefined,
        province: form.province || undefined,
        district: form.district || undefined,
        commune: form.commune || undefined,
        latitude: form.latitude === "" ? undefined : Number(form.latitude),
        longitude: form.longitude === "" ? undefined : Number(form.longitude),
        primaryCrops: form.primaryCrops || undefined,
      };

      const response = await createFarmProfile(payload);
      setMessage(`Tạo trang trại thành công (ID: ${response.id})`);
      
      // Reset form
      setForm({
        farmName: "",
        farmSizeHectares: "",
        locationAddress: "",
        province: "",
        district: "",
        commune: "",
        latitude: "90",
        longitude: "180",
        primaryCrops: "",
      });
      
      setTimeout(() => {
        setCurrentStep(1);
        setMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Error creating farm profile:', error);
      const errObj = error as { message?: string };
      const msg = errObj?.message ?? 'Tạo trang trại thất bại';
      setMessage(msg);
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
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chọn vị trí & Diện tích</h3>
              <p className="text-sm text-gray-600 mb-6">Chọn điểm trên bản đồ để xác định vị trí và đo diện tích trang trại</p>
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
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Thông tin trang trại</h3>
              <p className="text-sm text-gray-600 mb-6">Nhập thông tin chi tiết về trang trại của bạn</p>
            </div>

            {/* Thông tin cơ bản */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-800">Thông tin cơ bản</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Cây trồng chính
                  </label>
                  <Input 
                    value={form.primaryCrops} 
                    onChange={handleChange('primaryCrops')} 
                    placeholder="Lúa, ngô, sắn..." 
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Nhập nhiều loại, phân tách bằng dấu phẩy
                  </p>
                </div>
              </div>
            </div>

            {/* Địa chỉ hành chính */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-800">Địa chỉ hành chính</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ chi tiết
                  </label>
                  <Input 
                    value={form.locationAddress} 
                    onChange={handleChange('locationAddress')} 
                    placeholder="Số nhà, đường..." 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tỉnh/Thành
                  </label>
                  <Input 
                    value={form.province} 
                    onChange={handleChange('province')} 
                    placeholder="VD: Hà Nội" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quận/Huyện
                  </label>
                  <Input 
                    value={form.district} 
                    onChange={handleChange('district')} 
                    placeholder="VD: Đông Anh" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Xã/Phường
                  </label>
                  <Input 
                    value={form.commune} 
                    onChange={handleChange('commune')} 
                    placeholder="VD: Kim Chung" 
                  />
                </div>
              </div>
            </div>

            {/* Hiển thị thông tin từ bước 1 */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-800">Thông tin vị trí (từ bước 1)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Xác nhận & Tạo trang trại</h3>
              <p className="text-sm text-gray-600 mb-6">Kiểm tra lại toàn bộ thông tin trước khi tạo trang trại</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Thông tin vị trí từ bước 1 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Vị trí & Diện tích (Bước 1)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Thông tin trang trại (Bước 2)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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
                      {[form.locationAddress, form.commune, form.district, form.province]
                        .filter(Boolean)
                        .join(", ") || "Chưa nhập"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Thông tin chủ trang trại */}
            {user && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Chủ trang trại</CardTitle>
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
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Tóm tắt</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• <strong>Vị trí:</strong> {form.latitude && form.longitude ? 'Đã xác định' : 'Chưa xác định'}</p>
                <p>• <strong>Diện tích:</strong> {form.farmSizeHectares ? `${form.farmSizeHectares} ha` : 'Chưa đo'}</p>
                <p>• <strong>Tên trang trại:</strong> {form.farmName ? 'Đã nhập' : 'Chưa nhập'}</p>
                <p>• <strong>Chủ sở hữu:</strong> {user ? 'Đã xác định' : 'Chưa đăng nhập'}</p>
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
      className="min-h-screen bg-gray-50 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tạo trang trại mới</h1>
          <p className="text-gray-600">Thiết lập trang trại của bạn trong 3 bước đơn giản</p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <StepIndicator
            currentStep={currentStep}
            totalSteps={steps.length}
            steps={steps}
            onStepClick={goToStep}
          />
        </div>

        {/* Main Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>

          <div className="flex gap-2">
            {currentStep < steps.length ? (
              <Button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className="gap-2"
              >
                Tiếp theo
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={submitForm}
                disabled={submitting || !validateStep(1) || !validateStep(2)}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {submitting ? (
                  "Đang tạo..."
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Tạo trang trại
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md"
          >
            <p className="text-sm text-blue-700">{message}</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default CreateFarmPage;
