import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogContent, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { MapPin, CheckCircle2, ArrowLeft, ArrowRight, Map, FileText, Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createFarmProfile, getCropVarietySuggestions } from "@/api";
import type { 
  CreateFarmProfileRequest, 
  CropInfo, 
  CropVarietySuggestion,
  PlantingMethod,
  CropType,
  FarmingType,
  CropStatus
} from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import MapAreaPage from "./MapAreaPage";
import StepIndicator from "@/components/StepIndicator";
import AddressSelector from "@/components/AddressSelector";

type CropFormValues = {
  id: string;
  cropName: string;
  plantingDate: string;
  plantingMethod: PlantingMethod;
  cropType: CropType;
  farmingType: FarmingType;
  status: CropStatus;
};

type CropSuggestionState = {
  options: CropVarietySuggestion[];
  loading: boolean;
  error?: string;
  open: boolean;
  lastQuery?: string;
};

const generateCropId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `crop-${Math.random().toString(36).slice(2, 10)}`;
};

const createEmptyCrop = (): CropFormValues => ({
  id: generateCropId(),
  cropName: "",
  plantingDate: "",
  plantingMethod: "DirectSeeding",
  cropType: "LeafyGreen",
  farmingType: "Intensive",
  status: "Planning",
});

export const CreateFarmPage = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  // const [message, setMessage] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successData, setSuccessData] = useState<{farmName: string, farmSize: string, crops: CropInfo[]} | null>(null);
  const [cropSuggestionsState, setCropSuggestionsState] = useState<Record<string, CropSuggestionState>>({});

  // Ẩn loading sau khi component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleCropChange = useCallback((index: number, field: keyof CropFormValues, value: string) => {
    let targetCropId: string | undefined;
    setForm((prev) => {
      const updated = [...prev.crops];
      const target = updated[index];
      if (!target) {
        return prev;
      }
      targetCropId = target.id;
      updated[index] = { ...target, [field]: value };
      return { ...prev, crops: updated };
    });

    if (field === "cropName" && targetCropId) {
      setCropSuggestionsState((prev) => {
        if (!prev[targetCropId!]) {
          return prev;
        }
        return {
          ...prev,
          [targetCropId!]: {
            ...prev[targetCropId!],
            open: false,
            error: undefined,
          },
        };
      });
    }
  }, [setCropSuggestionsState]);

  const toggleCropSuggestions = useCallback(async (crop: CropFormValues) => {
    let shouldFetch = true;
    const trimmedName = crop.cropName.trim();

    setCropSuggestionsState((prev) => {
      const current = prev[crop.id];
      if (current?.open && !current.loading) {
        shouldFetch = false;
        return {
          ...prev,
          [crop.id]: {
            ...current,
            open: false,
          },
        };
      }

      if (!trimmedName) {
        shouldFetch = false;
        return {
          ...prev,
          [crop.id]: {
            options: [],
            loading: false,
            error: "Vui lòng nhập tên rau củ trước khi lấy gợi ý.",
            open: true,
          },
        };
      }

      return {
        ...prev,
        [crop.id]: {
          options: current?.options || [],
          loading: true,
          error: undefined,
          open: true,
          lastQuery: trimmedName,
        },
      };
    });

    if (!shouldFetch || !trimmedName) {
      return;
    }

    try {
      const options = await getCropVarietySuggestions(trimmedName);
      setCropSuggestionsState((prev) => {
        const current = prev[crop.id];
        if (!current) {
          return prev;
        }
        return {
          ...prev,
          [crop.id]: {
            ...current,
            options,
            loading: false,
            error: options.length ? undefined : "Không tìm thấy giống phù hợp.",
            open: true,
            lastQuery: trimmedName,
          },
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể lấy gợi ý. Vui lòng thử lại.";
      setCropSuggestionsState((prev) => {
        const current = prev[crop.id];
        if (!current) {
          return prev;
        }
        return {
          ...prev,
          [crop.id]: {
            ...current,
            loading: false,
            error: message,
          },
        };
      });
    }
  }, [setCropSuggestionsState]);

  const handleSuggestionSelect = useCallback((index: number, suggestion: CropVarietySuggestion) => {
    handleCropChange(index, "cropName", suggestion.name);
  }, [handleCropChange]);

  // Form state theo API schema
  const [form, setForm] = useState({
    farmName: "",
    farmSizeHectares: "",
    locationAddress: "",
    city: "",
    district: "",
    ward: "",
    provinceCode: "",
    districtCode: "",
    communeCode: "",
    latitude: "",
    longitude: "",
    crops: [createEmptyCrop()],
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
    setForm((f) => ({ ...f, city, provinceCode: code || "", district: '', ward: '', districtCode: "", communeCode: "" }));
  }, []);

  const handleDistrictChange = useCallback((district: string, code?: string) => {
    setForm((f) => ({ ...f, district, districtCode: code || "", ward: '', communeCode: "" }));
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

  const addCropField = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      crops: [...prev.crops, createEmptyCrop()],
    }));
  }, []);

  const removeCropField = useCallback((index: number) => {
    setForm((prev) => {
      const remaining = prev.crops.filter((_, i) => i !== index);
      const updated = remaining.length ? remaining : [createEmptyCrop()];

      const validIds = new Set(updated.map((crop) => crop.id));
      setCropSuggestionsState((prevState) => {
        let hasChanges = false;
        const nextState = { ...prevState };
        Object.keys(nextState).forEach((key) => {
          if (!validIds.has(key)) {
            delete nextState[key];
            hasChanges = true;
          }
        });
        return hasChanges ? nextState : prevState;
      });

      return { ...prev, crops: updated };
    });
  }, [setCropSuggestionsState]);

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
        const hasValidCrop = form.crops.some(
          (crop) => crop.cropName.trim() && crop.plantingDate
        );
        const hasIncompleteCrop = form.crops.some(
          (crop) =>
            (crop.cropName.trim() && !crop.plantingDate) ||
            (!crop.cropName.trim() && crop.plantingDate)
        );

        return !!(
          form.farmName.trim() &&
          form.locationAddress.trim() &&
          form.city.trim() &&
          form.district.trim() &&
          form.ward.trim() &&
          hasValidCrop &&
          !hasIncompleteCrop
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
      const preparedCrops: CropInfo[] = form.crops
        .filter((crop) => crop.cropName.trim() && crop.plantingDate)
        .map((crop) => ({
          cropName: crop.cropName.trim(),
          plantingDate: crop.plantingDate,
          // Lấy đúng các giá trị người dùng đã chọn
          plantingMethod: crop.plantingMethod,
          cropType: crop.cropType,
          farmingType: crop.farmingType,
          status: crop.status,
        }));

      const payload: CreateFarmProfileRequest = {
        farmName: form.farmName,
        farmSizeHectares: Number(form.farmSizeHectares) || 0,
        locationAddress: form.locationAddress || undefined,
        province: form.city || undefined, // Map city to province for API
        district: form.district || undefined,
        commune: form.ward || undefined, // Map ward to commune for API
        provinceCode: form.provinceCode || undefined,
        districtCode: form.districtCode || undefined,
        communeCode: form.communeCode || undefined,
        latitude: form.latitude === "" ? undefined : Number(form.latitude),
        longitude: form.longitude === "" ? undefined : Number(form.longitude),
        crops: preparedCrops.length ? preparedCrops : undefined,
      };

      const res = await createFarmProfile(payload);
      if (!res.status) {
        throw new Error((res.errors || []).join(', '));
      }
      
      // Set success data and show alert
      setSuccessData({
        farmName: form.farmName,
        farmSize: form.farmSizeHectares,
        crops: preparedCrops,
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
        provinceCode: "",
        districtCode: "",
        communeCode: "",
        latitude: "",
        longitude: "",
        crops: [createEmptyCrop()],
      });
      setCropSuggestionsState({});
      
      // Reset to first step
      setCurrentStep(1);
    } catch (error) {
      console.error('Error creating farm profile:', error);
      // You can add error handling here if needed
    } finally {
      setSubmitting(false);
    }
  };

  const formatPlantingDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
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

      case 2: {
        const hasValidCropEntry = form.crops.some(
          (crop) => crop.cropName.trim() && crop.plantingDate
        );
        const hasIncompleteCropEntry = form.crops.some(
          (crop) =>
            (crop.cropName.trim() && !crop.plantingDate) ||
            (!crop.cropName.trim() && crop.plantingDate)
        );

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
                    Danh sách rau củ <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-4">
                    Nhập từng loại cây trồng và ngày trồng cụ thể. Cần ít nhất một cây trồng có đầy đủ thông tin.
                  </p>
                  <div className="space-y-4">
                    {form.crops.map((crop, index) => {
                      const suggestionMeta = cropSuggestionsState[crop.id];
                      return (
                        <div
                          key={crop.id}
                          className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm"
                        >
                          <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Tên loại rau củ 
                            </label>
                            <div className="relative">
                              <Input
                                value={crop.cropName}
                                onChange={(e) => handleCropChange(index, 'cropName', e.target.value)}
                                placeholder="Ví dụ: Cà rốt, Bắp cải..."
                                className="pr-28"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => toggleCropSuggestions(crop)}
                                className="absolute inset-y-1 right-1 flex items-center gap-1 rounded-lg border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50"
                                disabled={suggestionMeta?.loading}
                              >
                                {suggestionMeta?.loading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Sparkles className="h-3.5 w-3.5" />
                                )}
                                Gợi ý
                              </Button>
                            </div>
                            {suggestionMeta?.open && (
                              <div className="mt-2 rounded-xl border border-emerald-200 bg-white shadow-lg">
                                <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-500">
                                  <span>
                                    Gợi ý cho "{suggestionMeta.lastQuery || crop.cropName || 'giống rau'}"
                                  </span>
                                  <button
                                    type="button"
                                    className="text-emerald-600 font-semibold"
                                    onClick={() =>
                                      setCropSuggestionsState((prev) => {
                                        const current = prev[crop.id];
                                        if (!current) {
                                          return prev;
                                        }
                                        return {
                                          ...prev,
                                          [crop.id]: { ...current, open: false },
                                        };
                                      })
                                    }
                                  >
                                    Đóng
                                  </button>
                                </div>
                                <div className="max-h-56 overflow-y-auto">
                                  {suggestionMeta.loading && (
                                    <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600">
                                      <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                                      Đang lấy gợi ý...
                                    </div>
                                  )}
                                  {!suggestionMeta.loading && suggestionMeta.error && (
                                    <div className="px-4 py-3 text-sm text-red-600">
                                      {suggestionMeta.error}
                                    </div>
                                  )}
                                  {!suggestionMeta.loading &&
                                    !suggestionMeta.error &&
                                    !suggestionMeta.options.length && (
                                      <div className="px-4 py-3 text-sm text-gray-500">
                                        Chưa có gợi ý cho từ khoá này.
                                      </div>
                                    )}
                                  {!suggestionMeta.loading &&
                                    !suggestionMeta.error &&
                                    suggestionMeta.options.length > 0 && (
                                      <div className="divide-y divide-gray-100">
                                        {suggestionMeta.options.map((option, optionIndex) => (
                                          <button
                                            key={`${crop.id}-${option.name}-${optionIndex}`}
                                            type="button"
                                            className="w-full px-4 py-3 text-left hover:bg-emerald-50"
                                            onClick={() => handleSuggestionSelect(index, option)}
                                          >
                                            <div className="font-semibold text-gray-900">
                                              {option.name}
                                            </div>
                                            {option.description && (
                                              <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                                                {option.description}
                                              </p>
                                            )}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Ngày trồng
                            </label>
                            <Input
                              type="date"
                              value={crop.plantingDate}
                              onChange={(e) => handleCropChange(index, 'plantingDate', e.target.value)}
                            />
                          </div>

                          {/* Nhóm dropdown cho phương thức trồng, loại cây, hình thức canh tác, trạng thái */}
                          <div className="md:col-span-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Phương thức trồng
                              </label>
                              <Select
                                value={crop.plantingMethod}
                                onValueChange={(value) => handleCropChange(index, 'plantingMethod', value)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Chọn phương thức" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="DirectSeeding">Gieo thẳng</SelectItem>
                                  <SelectItem value="TrayNursery">Ươm khay</SelectItem>
                                  <SelectItem value="Transplanting">Cấy cây con</SelectItem>
                                  <SelectItem value="VegetativePropagation">Nhân giống vô tính</SelectItem>
                                  <SelectItem value="Cutting">Giâm cành</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Nhóm cây trồng
                              </label>
                              <Select
                                value={crop.cropType}
                                onValueChange={(value) => handleCropChange(index, 'cropType', value)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Chọn nhóm" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="LeafyGreen">Rau lá</SelectItem>
                                  <SelectItem value="Fruiting">Rau/cây cho quả</SelectItem>
                                  <SelectItem value="RootVegetable">Rau củ (rễ)</SelectItem>
                                  <SelectItem value="Herb">Rau gia vị / thảo mộc</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Hình thức canh tác
                              </label>
                              <Select
                                value={crop.farmingType}
                                onValueChange={(value) => handleCropChange(index, 'farmingType', value)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Chọn hình thức" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Intensive">Thâm canh</SelectItem>
                                  <SelectItem value="CropRotation">Luân canh</SelectItem>
                                  <SelectItem value="Intercropping">Xen canh</SelectItem>
                                  <SelectItem value="Greenhouse">Nhà kính</SelectItem>
                                  <SelectItem value="Hydroponics">Thủy canh</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Trạng thái
                              </label>
                              <Select
                                value={crop.status}
                                onValueChange={(value) => handleCropChange(index, 'status', value)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Chọn trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Planning">Đang lên kế hoạch</SelectItem>
                                  <SelectItem value="Seedling">Cây con</SelectItem>
                                  <SelectItem value="Growing">Đang sinh trưởng</SelectItem>
                                  <SelectItem value="Harvesting">Đang thu hoạch</SelectItem>
                                  <SelectItem value="Completed">Hoàn thành vụ</SelectItem>
                                  <SelectItem value="Failed">Thất bại</SelectItem>
                                  <SelectItem value="Deleted">Đã xóa</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {form.crops.length > 1 && (
                            <div className="md:col-span-5 flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => removeCropField(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Xoá
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCropField}
                    className="mt-4 gap-2 border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm cây trồng
                  </Button>
                  {(!hasValidCropEntry || hasIncompleteCropEntry) && (
                    <p className="mt-2 text-xs text-red-500">
                      {hasIncompleteCropEntry
                        ? 'Vui lòng nhập đầy đủ tên và ngày trồng cho mỗi cây.'
                        : 'Cần ít nhất một cây trồng có đầy đủ thông tin.'}
                    </p>
                  )}
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
      }

      case 3: {
        const completedCrops = form.crops
          .filter((crop) => crop.cropName.trim() && crop.plantingDate)
          .map((crop) => ({
            cropName: crop.cropName.trim(),
            plantingDate: crop.plantingDate,
          }));

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
                    <label className="text-sm font-medium text-gray-600">Danh sách cây trồng</label>
                    {completedCrops.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-sm text-gray-900">
                        {completedCrops.map((crop, idx) => (
                          <li key={`${crop.cropName}-${idx}`} className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-1 rounded-md bg-white border border-emerald-200 text-emerald-700 font-semibold">
                              {crop.cropName}
                            </span>
                            <span className="text-xs text-gray-500">
                              Ngày trồng: {formatPlantingDate(crop.plantingDate)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400">Chưa nhập</p>
                    )}
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
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${completedCrops.length ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                  <span><strong>Cây trồng:</strong> {completedCrops.length ? `${completedCrops.length} loại` : 'Chưa nhập'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      }

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
                {successData?.crops?.length ? (
                  <div className="mt-3 text-left">
                    <div className="font-semibold text-emerald-800 mb-1">Cây trồng:</div>
                    <ul className="text-sm text-emerald-900 space-y-1 list-disc list-inside">
                      {successData.crops.map((crop, idx) => (
                        <li key={`${crop.cropName}-${idx}`}>
                          {crop.cropName} • {formatPlantingDate(crop.plantingDate)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
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
