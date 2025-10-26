import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, X, Check, Trash2 } from 'lucide-react';
import { registerProduct, getProductCategories } from '../api/product';
import type { RegisterProductRequest, ProductCategory } from '../api/product';

interface SpecificationItem {
  key: string;
  value: string;
}

type ResultStatus = 'success' | 'error' | null;

interface RegisterProductFormProps {
  onProductRegistered?: () => void;
}

const RegisterProductForm: React.FC<RegisterProductFormProps> = ({ onProductRegistered }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resultStatus, setResultStatus] = useState<ResultStatus>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [specifications, setSpecifications] = useState<SpecificationItem[]>([
    { key: '', value: '' }
  ]);
  
  const [formData, setFormData] = useState<Partial<RegisterProductRequest>>({
    categoryId: 1,
    proposedProductCode: '',
    proposedProductName: '',
    description: '',
    unitPrice: 0,
    energyEfficiencyRating: '',
    specifications: {},
    manualFile: null,
    images: [],
    warrantyMonths: 0,
    weightKg: 0,
    dimensionsCm: {
      width: 0,
      height: 0,
      length: 0
    }
  });

  // Fetch categories when dialog opens
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getProductCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

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
        { key: 'Độ sâu xới', value: '25-35 cm' },
        { key: 'Số cấp số cầu trước', value: '5 cấp' },
        { key: 'Số cấp số cầu sau', value: '4 cấp' },
        { key: 'Loại nhiên liệu', value: 'Dầu diesel' },
        { key: 'Khả năng điều chỉnh', value: 'Có' },
        { key: 'Khung sườn', value: 'Thiết kế chắc chắn' }
      ];
    } else if (categoryName.includes('máy gặt')) {
      return [
        { key: 'Công suất động cơ', value: '25-35 HP' },
        { key: 'Loại động cơ', value: 'Diesel' },
        { key: 'Độ rộng cắt', value: '1.5-2.5 m' },
        { key: 'Tốc độ làm việc', value: '3-8 km/h' },
        { key: 'Dung tích thùng chứa', value: '1-3 tấn' },
        { key: 'Loại nhiên liệu', value: 'Dầu diesel' },
        { key: 'Hệ thống điều khiển', value: 'Thủy lực' }
      ];
    } else if (categoryName.includes('drone') || categoryName.includes('uav')) {
      return [
        { key: 'Thời gian bay', value: '15-30 phút' },
        { key: 'Tầm bay', value: '1-5 km' },
        { key: 'Tải trọng', value: '5-20 kg' },
        { key: 'Tốc độ bay', value: '10-20 m/s' },
        { key: 'Độ cao bay tối đa', value: '120 m' },
        { key: 'Pin', value: 'Lithium Polymer' },
        { key: 'Camera', value: '4K/HD' },
        { key: 'GPS', value: 'Có' }
      ];
    } else if (categoryName.includes('phân bón')) {
      return [
        { key: 'Thành phần chính', value: 'N-P-K' },
        { key: 'Hàm lượng dinh dưỡng', value: '15-15-15' },
        { key: 'Dạng sản phẩm', value: 'Hạt' },
        { key: 'Độ tan', value: 'Tan nhanh' },
        { key: 'pH', value: '6.0-7.0' },
        { key: 'Độ ẩm', value: '< 2%' }
      ];
    } else if (categoryName.includes('hạt giống')) {
      return [
        { key: 'Tỷ lệ nảy mầm', value: '> 85%' },
        { key: 'Độ tinh khiết', value: '> 98%' },
        { key: 'Hàm lượng nước', value: '< 12%' },
        { key: 'Thời gian bảo quản', value: '2-3 năm' },
        { key: 'Nhiệt độ bảo quản', value: '10-15°C' },
        { key: 'Độ ẩm bảo quản', value: '45-55%' }
      ];
    }
    
    return [{ key: '', value: '' }];
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('dimensionsCm.')) {
      const dimension = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        dimensionsCm: {
          ...prev.dimensionsCm,
          [dimension]: parseFloat(value) || 0
        }
      }));
    } else if (field === 'categoryId') {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
      
      // Auto-suggest specifications when category changes
      const suggestedSpecs = getSuggestedSpecifications(value);
      setSpecifications(suggestedSpecs);
    } else {
      setFormData(prev => ({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.proposedProductName?.trim()) {
      alert('Vui lòng nhập tên sản phẩm');
      return;
    }

    if (!formData.proposedProductCode?.trim()) {
      alert('Vui lòng nhập mã sản phẩm');
      return;
    }

    if ((formData.unitPrice ?? 0) <= 0) {
      alert('Vui lòng nhập giá hợp lệ');
      return;
    }

    setIsLoading(true);
    
    try {
      // Convert specifications array to dictionary
      const specificationsDict: { [key: string]: string } = {};
      specifications.forEach((spec) => {
        if (spec.key.trim() && spec.value.trim()) {
          specificationsDict[spec.key.trim()] = spec.value.trim();
        }
      });

      const payload = {
        ...formData,
        vendorId: 0, // This will be set by backend based on auth
        categoryId: formData.categoryId || 1,
        proposedProductCode: formData.proposedProductCode || '',
        proposedProductName: formData.proposedProductName || '',
        unitPrice: parseFloat((formData.unitPrice ?? 0).toString()),
        warrantyMonths: parseInt((formData.warrantyMonths || 0).toString()),
        weightKg: parseFloat((formData.weightKg || 0).toString()),
        specifications: specificationsDict,
      };
      
      await registerProduct(payload as RegisterProductRequest);
      setResultStatus('success');
      
      // Reset form after 3 seconds and close
      setTimeout(() => {
        setResultStatus(null);
        setIsOpen(false);
        setFormData({
          categoryId: 1,
          proposedProductCode: '',
          proposedProductName: '',
          description: '',
          unitPrice: 0,
          energyEfficiencyRating: '',
          specifications: {},
          manualFile: null,
          images: [],
          warrantyMonths: 0,
          weightKg: 0,
          dimensionsCm: {
            width: 0,
            height: 0,
            length: 0
          }
        });
        setSpecifications([{ key: '', value: '' }]);
        onProductRegistered?.();
      }, 3000);
      
    } catch (error: any) {
      console.error('Lỗi khi đăng ký sản phẩm:', error);
      
      let message = 'Có lỗi xảy ra khi đăng ký sản phẩm';
      
      if (error?.response?.status === 405) {
        message = 'Endpoint không hỗ trợ hoặc bạn không có quyền truy cập';
      } else if (error?.response?.status === 401) {
        message = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại';
      } else if (error?.response?.status === 403) {
        message = 'Bạn không có quyền đăng ký sản phẩm';
      } else {
        message = error?.response?.data?.message || error?.message || message;
      }
      
      setErrorMessage(message);
      setResultStatus('error');
      
      // Auto close after 4 seconds for error
      setTimeout(() => {
        setResultStatus(null);
        setErrorMessage('');
      }, 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading && !resultStatus) {
      setIsOpen(false);
      setErrorMessage('');
    }
  };

  const handleResultClose = () => {
    setResultStatus(null);
    setErrorMessage('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus size={20} className="mr-2" />
          Đăng ký sản phẩm mới
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {resultStatus ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            {/* Success Icon with Animation */}
            {resultStatus === 'success' && (
              <>
                <div className="relative mb-6">
                  {/* Outer circles animation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-green-100 opacity-30 animate-ping"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full bg-green-100 opacity-50"></div>
                  </div>
                  
                  {/* Main success circle */}
                  <div className="relative w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg animate-scale-in">
                    <Check className="w-12 h-12 text-white stroke-[3]" />
                  </div>
                  
                  {/* Decorative plus signs */}
                  <div className="absolute -top-2 -right-2 text-green-300 text-2xl animate-float">+</div>
                  <div className="absolute -bottom-2 -left-2 text-green-300 text-2xl animate-float-delayed">+</div>
                  <div className="absolute top-1/2 -right-6 w-2 h-2 rounded-full bg-green-300 animate-pulse"></div>
                  <div className="absolute top-1/2 -left-6 w-2 h-2 rounded-full bg-green-300 animate-pulse"></div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3 animate-fade-in-up">
                  Đăng ký thành công!
                </h3>
                <p className="text-gray-600 text-center max-w-sm animate-fade-in-up-delayed">
                  Sản phẩm của bạn đã được đăng ký và đang chờ duyệt.
                </p>
                
                <Button 
                  onClick={handleResultClose}
                  className="mt-8 bg-green-600 hover:bg-green-700 px-8 animate-fade-in"
                >
                  Đóng
                </Button>
              </>
            )}

            {/* Error Icon with Animation */}
            {resultStatus === 'error' && (
              <>
                <div className="relative mb-6">
                  {/* Outer circles animation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-red-100 opacity-30 animate-ping"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full bg-red-100 opacity-50"></div>
                  </div>
                  
                  {/* Main error circle */}
                  <div className="relative w-24 h-24 rounded-full bg-red-500 flex items-center justify-center shadow-lg animate-scale-in">
                    <X className="w-12 h-12 text-white stroke-[3]" />
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute -top-2 -right-2 text-red-300 text-2xl animate-float">×</div>
                  <div className="absolute -bottom-2 -left-2 text-red-300 text-2xl animate-float-delayed">×</div>
                  <div className="absolute top-1/2 -right-6 w-2 h-2 rounded-full bg-red-300 animate-pulse"></div>
                  <div className="absolute top-1/2 -left-6 w-2 h-2 rounded-full bg-red-300 animate-pulse"></div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3 animate-fade-in-up">
                  Đăng ký thất bại!
                </h3>
                <p className="text-gray-600 text-center max-w-md animate-fade-in-up-delayed">
                  {errorMessage}
                </p>
                
                <div className="flex gap-3 mt-8">
                  <Button 
                    onClick={handleResultClose}
                    variant="outline"
                    className="px-6 animate-fade-in"
                  >
                    Đóng
                  </Button>
                  <Button 
                    onClick={() => {
                      setResultStatus(null);
                      setErrorMessage('');
                    }}
                    className="bg-red-600 hover:bg-red-700 px-6 animate-fade-in-delayed"
                  >
                    Thử lại
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Đăng ký sản phẩm mới</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="categoryId" className="text-sm font-medium">
                    Danh mục <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={(formData.categoryId ?? 1).toString()}
                    onValueChange={(value) => handleInputChange('categoryId', parseInt(value))}
                    disabled={isLoading}
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
                    value={formData.proposedProductCode}
                    onChange={(e) => handleInputChange('proposedProductCode', e.target.value)}
                    placeholder="VD: PRO-321"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Product Name */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="proposedProductName" className="text-sm font-medium">
                    Tên sản phẩm <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="proposedProductName"
                    value={formData.proposedProductName}
                    onChange={(e) => handleInputChange('proposedProductName', e.target.value)}
                    placeholder="Nhập tên sản phẩm"
                    required
                    disabled={isLoading}
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
                    value={formData.unitPrice}
                    onChange={(e) => handleInputChange('unitPrice', e.target.value)}
                    placeholder="12880"
                    required
                    disabled={isLoading}
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
                    value={formData.warrantyMonths}
                    onChange={(e) => handleInputChange('warrantyMonths', e.target.value)}
                    placeholder="10"
                    required
                    disabled={isLoading}
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
                    value={formData.weightKg}
                    onChange={(e) => handleInputChange('weightKg', e.target.value)}
                    placeholder="0.5"
                    required
                    disabled={isLoading}
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
                    value={formData.energyEfficiencyRating}
                    onChange={(e) => handleInputChange('energyEfficiencyRating', e.target.value)}
                    placeholder="8"
                    disabled={isLoading}
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
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Nhập mô tả chi tiết về sản phẩm"
                  rows={4}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Dimensions */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Kích thước (cm) <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.dimensionsCm?.width}
                      onChange={(e) => handleInputChange('dimensionsCm.width', e.target.value)}
                      placeholder="Rộng"
                      disabled={isLoading}
                      min="0"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.dimensionsCm?.height}
                      onChange={(e) => handleInputChange('dimensionsCm.height', e.target.value)}
                      placeholder="Cao"
                      disabled={isLoading}
                      min="0"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.dimensionsCm?.length}
                      onChange={(e) => handleInputChange('dimensionsCm.length', e.target.value)}
                      placeholder="Dài"
                      disabled={isLoading}
                      min="0"
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
                        const suggestedSpecs = getSuggestedSpecifications(formData.categoryId ?? 1);
                        setSpecifications(suggestedSpecs);
                      }}
                      disabled={isLoading}
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
                      disabled={isLoading}
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
                          placeholder="Tên thông số (VD: Màu sắc, Kích thước...)"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          value={spec.value}
                          onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                          placeholder="Giá trị"
                          disabled={isLoading}
                        />
                      </div>
                      {specifications.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSpecification(index)}
                          disabled={isLoading}
                          className="h-10 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Manual URLs */}
              <div className="space-y-2">
                <Label htmlFor="manualUrls" className="text-sm font-medium">
                  Link hướng dẫn sử dụng
                </Label>
                <Input
                  id="manualUrls"
                  value={typeof formData.manualFile === 'string' ? formData.manualFile : ''}
                  onChange={(e) => handleInputChange('manualUrls', e.target.value)}
                  placeholder="https://example.com/manual.pdf"
                  disabled={isLoading}
                />
              </div>

              {/* Images */}
              <div className="space-y-2">
                <Label htmlFor="images" className="text-sm font-medium">
                  Link hình ảnh
                </Label>
                <Input
                  id="images"
                  value={Array.isArray(formData.images) ? '' : (formData.images || '')}
                  onChange={(e) => handleInputChange('images', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  disabled={isLoading}
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  <X size={16} className="mr-2" />
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Đang đăng ký...
                    </>
                  ) : (
                    <>
                      <Plus size={16} className="mr-2" />
                      Xác nhận đăng ký
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RegisterProductForm;

