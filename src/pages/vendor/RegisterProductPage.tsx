import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogContent, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { CheckCircle2, ArrowLeft, ArrowRight, Package, FileText, Plus, X, Trash2, Upload, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { registerProduct, getProductCategories } from "@/api/product";
import type { RegisterProductRequest, ProductCategory } from "@/api/product";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router";
import StepIndicator from "@/components/StepIndicator";

interface SpecificationItem {
  key: string;
  value: string;
}

interface CertificateFile {
  file: File | null;
  imageUrl: string;
  purpose: string;
  sortOrder: number;
}

export const RegisterProductPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successData, setSuccessData] = useState<{productName: string, productCode: string} | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [specifications, setSpecifications] = useState<SpecificationItem[]>([
    { key: '', value: '' }
  ]);
  const [certificateFiles, setCertificateFiles] = useState<CertificateFile[]>([]);

  // Form state
  const [form, setForm] = useState({
    categoryId: 1,
    proposedProductCode: "",
    proposedProductName: "",
    description: "",
    unitPrice: 0,
    energyEfficiencyRating: "",
    warrantyMonths: 0,
    weightKg: 0,
    dimensionsCm: {
      width: 0,
      height: 0,
      length: 0
    }
  });

  // File states
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const steps = [
    "Thông tin sản phẩm",
    "Chứng nhận & Xác nhận"
  ];

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getProductCategories();
        setCategories(fetchedCategories);
        if (fetchedCategories.length > 0) {
          setForm(prev => ({ ...prev, categoryId: fetchedCategories[0].id }));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Suggested specifications for different categories
  const getSuggestedSpecifications = (categoryId: number): SpecificationItem[] => {
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    const categoryName = selectedCategory?.name?.toLowerCase() || '';
    
    if (categoryName.includes('máy cày') || categoryName.includes('máy xới')) {
      return [
        { key: 'Công suất động cơ', value: '12 HP' },
        { key: 'Loại động cơ', value: 'Diesel' },
        { key: 'Hệ truyền động', value: '2 cầu - 2 hộp số' },
        { key: 'Độ rộng xới', value: '70-100 cm' },
        { key: 'Độ sâu xới', value: '25-35 cm' }
      ];
    } else if (categoryName.includes('máy gặt')) {
      return [
        { key: 'Công suất động cơ', value: '25-35 HP' },
        { key: 'Loại động cơ', value: 'Diesel' },
        { key: 'Độ rộng cắt', value: '1.5-2.5 m' },
        { key: 'Tốc độ làm việc', value: '3-8 km/h' }
      ];
    } else if (categoryName.includes('drone') || categoryName.includes('uav')) {
      return [
        { key: 'Thời gian bay', value: '15-30 phút' },
        { key: 'Tầm bay', value: '1-5 km' },
        { key: 'Tải trọng', value: '5-20 kg' },
        { key: 'Pin', value: 'Lithium Polymer' }
      ];
    }
    
    return [{ key: '', value: '' }];
  };

  const handleChange = (field: string, value: any) => {
    if (field.startsWith('dimensionsCm.')) {
      const dimension = field.split('.')[1];
      setForm(prev => ({
        ...prev,
        dimensionsCm: {
          ...prev.dimensionsCm,
          [dimension]: parseFloat(value) || 0
        }
      }));
    } else if (field === 'categoryId') {
      const categoryId = typeof value === 'string' ? parseInt(value) : value;
      setForm(prev => ({
        ...prev,
        categoryId
      }));
      
      // Auto-suggest specifications when category changes
      const suggestedSpecs = getSuggestedSpecifications(categoryId);
      setSpecifications(suggestedSpecs);
    } else {
      setForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { key: '', value: '' }]);
  };

  const removeSpecification = (index: number) => {
    if (specifications.length > 1) {
      setSpecifications(specifications.filter((_, i) => i !== index));
    }
  };

  const updateSpecification = (index: number, field: 'key' | 'value', value: string) => {
    const newSpecs = [...specifications];
    newSpecs[index][field] = value;
    setSpecifications(newSpecs);
  };

  const addCertificateFile = () => {
    setCertificateFiles([...certificateFiles, {
      file: null,
      imageUrl: '',
      purpose: '',
      sortOrder: certificateFiles.length
    }]);
  };

  const removeCertificateFile = (index: number) => {
    setCertificateFiles(certificateFiles.filter((_, i) => i !== index));
  };

  const updateCertificateFile = (index: number, field: keyof CertificateFile, value: any) => {
    const newFiles = [...certificateFiles];
    newFiles[index] = { ...newFiles[index], [field]: value };
    setCertificateFiles(newFiles);
  };

  const handleFileChange = (index: number, file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateCertificateFile(index, 'file', file);
        updateCertificateFile(index, 'imageUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
    if (step === 1) {
      setCurrentStep(1);
      return;
    }
    if (step === 2 && validateStep(1)) {
      setCurrentStep(2);
      return;
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          form.proposedProductName.trim() &&
          form.proposedProductCode.trim() &&
          form.description.trim() &&
          form.unitPrice > 0 &&
          form.warrantyMonths >= 0 &&
          form.weightKg > 0 &&
          form.dimensionsCm.width > 0 &&
          form.dimensionsCm.height > 0 &&
          form.dimensionsCm.length > 0
        );
      case 2:
        return true; // Certificate is optional
      default:
        return false;
    }
  };

  const submitForm = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để đăng ký sản phẩm');
      return;
    }

    if (!user.id) {
      alert('Không tìm thấy thông tin vendor. Vui lòng đăng nhập lại.');
      return;
    }

    setSubmitting(true);
    
    try {
      // Convert specifications array to dictionary
      const specificationsDict: { [key: string]: string } = {};
      specifications.forEach((spec) => {
        if (spec.key.trim() && spec.value.trim()) {
          specificationsDict[spec.key.trim()] = spec.value.trim();
        }
      });

      // Collect certificate files
      const certificateFilesArray = certificateFiles
        .filter(cert => cert.file !== null)
        .map(cert => cert.file!);

      const payload: RegisterProductRequest = {
        vendorId: typeof user.id === 'string' ? parseInt(user.id) : user.id,
        categoryId: form.categoryId,
        proposedProductCode: form.proposedProductCode,
        proposedProductName: form.proposedProductName,
        description: form.description || undefined,
        unitPrice: parseFloat(form.unitPrice.toString()),
        energyEfficiencyRating: form.energyEfficiencyRating || undefined,
        specifications: Object.keys(specificationsDict).length > 0 ? specificationsDict : undefined,
        warrantyMonths: parseInt(form.warrantyMonths.toString()) || undefined,
        weightKg: parseFloat(form.weightKg.toString()) || undefined,
        dimensionsCm: {
          width: form.dimensionsCm.width || 0,
          height: form.dimensionsCm.height || 0,
          length: form.dimensionsCm.length || 0
        },
        manualFile: manualFile || undefined,
        images: imageFiles.length > 0 ? imageFiles : undefined,
        certificate: certificateFilesArray.length > 0 ? certificateFilesArray : undefined
      };

      console.log('Sending payload:', payload);
      const response = await registerProduct(payload);
      console.log('Register product success:', response);
      
      // TODO: Upload certificate files here if API is available
      // For now, we'll just show success
      
      setSuccessData({
        productName: form.proposedProductName,
        productCode: form.proposedProductCode
      });
      setShowSuccessAlert(true);
      
    } catch (error: any) {
      console.error('Error registering product:', error);
      
      let errorMessage = 'Có lỗi xảy ra khi đăng ký sản phẩm.';
      
      if (error?.response?.status === 405) {
        errorMessage = 'API endpoint không hỗ trợ. Vui lòng liên hệ quản trị viên.';
      } else if (error?.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      } else if (error?.response?.status === 403) {
        errorMessage = 'Bạn không có quyền đăng ký sản phẩm.';
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.errors) {
        errorMessage = Array.isArray(error.response.data.errors) 
          ? error.response.data.errors.join(', ')
          : 'Có lỗi xảy ra.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage + '\n\nVui lòng thử lại hoặc kiểm tra console để biết thêm chi tiết.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessAlert(false);
    navigate('/vendor/registrations');
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
                <Package className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Thông tin sản phẩm</h3>
              <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Nhập đầy đủ thông tin về sản phẩm bạn muốn đăng ký
              </p>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800">Thông tin cơ bản</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="categoryId" className="text-sm font-medium">
                    Danh mục <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.categoryId.toString()}
                    onValueChange={(value) => handleChange('categoryId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Product Code */}
                <div className="space-y-2">
                  <Label htmlFor="proposedProductCode" className="text-sm font-medium">
                    Mã sản phẩm đề xuất <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="proposedProductCode"
                    value={form.proposedProductCode}
                    onChange={(e) => handleChange('proposedProductCode', e.target.value)}
                    placeholder="VD: PRO-001"
                    required
                  />
                </div>

                {/* Product Name */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="proposedProductName" className="text-sm font-medium">
                    Tên sản phẩm <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="proposedProductName"
                    value={form.proposedProductName}
                    onChange={(e) => handleChange('proposedProductName', e.target.value)}
                    placeholder="Nhập tên sản phẩm"
                    required
                  />
                </div>

                {/* Unit Price */}
                <div className="space-y-2">
                  <Label htmlFor="unitPrice" className="text-sm font-medium">
                    Giá bán (VNĐ) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    value={form.unitPrice}
                    onChange={(e) => handleChange('unitPrice', e.target.value)}
                    placeholder="0"
                    required
                    min="0"
                  />
                </div>

                {/* Warranty Months */}
                <div className="space-y-2">
                  <Label htmlFor="warrantyMonths" className="text-sm font-medium">
                    Thời gian bảo hành (tháng) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="warrantyMonths"
                    type="number"
                    value={form.warrantyMonths}
                    onChange={(e) => handleChange('warrantyMonths', e.target.value)}
                    placeholder="0"
                    required
                    min="0"
                  />
                </div>

                {/* Weight */}
                <div className="space-y-2">
                  <Label htmlFor="weightKg" className="text-sm font-medium">
                    Trọng lượng (kg) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="weightKg"
                    type="number"
                    step="0.01"
                    value={form.weightKg}
                    onChange={(e) => handleChange('weightKg', e.target.value)}
                    placeholder="0"
                    required
                    min="0"
                  />
                </div>

                {/* Energy Efficiency Rating */}
                <div className="space-y-2">
                  <Label htmlFor="energyEfficiencyRating" className="text-sm font-medium">
                    Xếp hạng hiệu suất
                  </Label>
                  <Input
                    id="energyEfficiencyRating"
                    value={form.energyEfficiencyRating}
                    onChange={(e) => handleChange('energyEfficiencyRating', e.target.value)}
                    placeholder="A+, 5 sao, ..."
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Mô tả <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Nhập mô tả chi tiết về sản phẩm"
                  rows={4}
                  required
                />
              </div>

              {/* Dimensions */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Kích thước (cm) <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.dimensionsCm.width}
                      onChange={(e) => handleChange('dimensionsCm.width', e.target.value)}
                      placeholder="Rộng"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.dimensionsCm.height}
                      onChange={(e) => handleChange('dimensionsCm.height', e.target.value)}
                      placeholder="Cao"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.dimensionsCm.length}
                      onChange={(e) => handleChange('dimensionsCm.length', e.target.value)}
                      placeholder="Dài"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Thông số kỹ thuật</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const suggestedSpecs = getSuggestedSpecifications(form.categoryId);
                        setSpecifications(suggestedSpecs);
                      }}
                      className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Check size={16} className="mr-1" />
                      Gợi ý thông số
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSpecification}
                      className="h-8"
                    >
                      <Plus size={16} className="mr-1" />
                      Thêm thông số
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {specifications.map((spec, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Input
                          value={spec.key}
                          onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                          placeholder="Tên thông số"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          value={spec.value}
                          onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                          placeholder="Giá trị"
                        />
                      </div>
                      {specifications.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSpecification(index)}
                          className="h-10 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Manual File */}
              <div className="space-y-2">
                <Label htmlFor="manualFile" className="text-sm font-medium">
                  File hướng dẫn sử dụng
                </Label>
                <Input
                  id="manualFile"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setManualFile(e.target.files?.[0] || null)}
                />
                {manualFile && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    {manualFile.name}
                  </p>
                )}
              </div>

              {/* Images */}
              <div className="space-y-2">
                <Label htmlFor="images" className="text-sm font-medium">
                  Hình ảnh sản phẩm
                </Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setImageFiles(files);
                  }}
                />
                {imageFiles.length > 0 && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    {imageFiles.length} hình ảnh đã chọn
                  </p>
                )}
              </div>
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
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Chứng nhận & Xác nhận</h3>
              <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Tải lên các chứng nhận sản phẩm (không bắt buộc) và xác nhận thông tin
              </p>
            </div>

            {/* Certificate Files */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center">
                    <Upload className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800">Chứng nhận sản phẩm</h4>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCertificateFile}
                  className="h-8"
                >
                  <Plus size={16} className="mr-1" />
                  Thêm chứng nhận
                </Button>
              </div>

              {certificateFiles.length === 0 ? (
                <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">Chưa có chứng nhận nào</p>
                  <p className="text-sm text-gray-500">Bấm "Thêm chứng nhận" để tải lên tài liệu</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {certificateFiles.map((cert, index) => (
                    <Card key={index} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Mục đích chứng nhận
                              </Label>
                              <Input
                                value={cert.purpose}
                                onChange={(e) => updateCertificateFile(index, 'purpose', e.target.value)}
                                placeholder="VD: Giấy chứng nhận chất lượng, ISO, ..."
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Tệp tin
                              </Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
                                  className="flex-1"
                                />
                                {cert.imageUrl && (
                                  <div className="flex items-center gap-1 text-green-600 text-sm">
                                    <CheckCircle2 size={16} />
                                    <span>Đã chọn</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCertificateFile(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X size={20} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Tóm tắt thông tin</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Tên sản phẩm</p>
                  <p className="font-semibold text-gray-900">{form.proposedProductName || "Chưa nhập"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mã sản phẩm</p>
                  <p className="font-semibold text-gray-900">{form.proposedProductCode || "Chưa nhập"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Giá bán</p>
                  <p className="font-semibold text-gray-900">
                    {form.unitPrice > 0 ? `${form.unitPrice.toLocaleString('vi-VN')} VNĐ` : "Chưa nhập"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bảo hành</p>
                  <p className="font-semibold text-gray-900">{form.warrantyMonths} tháng</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trọng lượng</p>
                  <p className="font-semibold text-gray-900">{form.weightKg} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">File hướng dẫn</p>
                  <p className="font-semibold text-gray-900">{manualFile ? manualFile.name : "Chưa có"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Hình ảnh</p>
                  <p className="font-semibold text-gray-900">{imageFiles.length} tệp</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Chứng nhận</p>
                  <p className="font-semibold text-gray-900">{certificateFiles.filter(c => c.file).length} tệp</p>
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
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-12 mt-[80px]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-emerald-700 bg-clip-text text-transparent mb-4">
            Đăng ký sản phẩm mới
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Đăng ký sản phẩm của bạn trong 2 bước đơn giản
          </p>
        </motion.div>

        {/* Step Indicator */}
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
                return false;
              }}
            />
          </div>
        </motion.div>

        {/* Main Content */}
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

        {/* Navigation */}
        <motion.div 
          className="flex justify-between items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Button
            variant="outline"
            onClick={() => {
              if (currentStep === 1) {
                navigate('/vendor/registrations');
              } else {
                prevStep();
              }
            }}
            className="gap-2 px-6 py-3 rounded-xl border-2 hover:bg-gray-50 transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4" />
            {currentStep === 1 ? 'Hủy' : 'Quay lại'}
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
                disabled={submitting || !validateStep(1)}
                className="gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang đăng ký...
                  </div>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Đăng ký sản phẩm
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Success Alert Dialog */}
      <AlertDialog open={showSuccessAlert} onOpenChange={setShowSuccessAlert}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-emerald-700">
              🎉 Đăng ký sản phẩm thành công!
            </AlertDialogTitle>
            <div className="text-gray-600 space-y-2">
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <div className="font-semibold text-emerald-800 mb-2">Thông tin sản phẩm:</div>
                <div><strong>Tên sản phẩm:</strong> {successData?.productName}</div>
                <div><strong>Mã sản phẩm:</strong> {successData?.productCode}</div>
              </div>
              <div className="text-sm">
                Sản phẩm của bạn đang được chờ duyệt. Bạn có thể theo dõi trạng thái tại trang quản lý đơn đăng ký.
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <AlertDialogAction 
              onClick={handleSuccessClose}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold px-8 py-2 rounded-lg"
            >
              Về trang quản lý
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default RegisterProductPage;

