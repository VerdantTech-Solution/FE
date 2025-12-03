import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogContent, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, X, CheckCircle2 } from 'lucide-react';
import { createProductCategory, getAllProductCategories } from '../api/product';
import type { ProductCategory } from '../api/product';

interface CreateProductCategoryRequest {
  name: string;
  parentId: number | null;
  serialRequired: boolean;
  description: string;
  iconUrl: string | null;
}

interface CreateProductFormProps {
  onProductCreated?: () => void;
}

const CreateProductForm: React.FC<CreateProductFormProps> = ({ onProductCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allCategories, setAllCategories] = useState<ProductCategory[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successData, setSuccessData] = useState<{name: string} | null>(null);
  const [formData, setFormData] = useState<CreateProductCategoryRequest>({
    name: '',
    parentId: null,
    serialRequired: false,
    description: '',
    iconUrl: ''
  });

  // Fetch all categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await getAllProductCategories();
        setAllCategories(categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Filter parent categories (không có parent)
  const parentCategories = allCategories.filter(cat => {
    const hasParentId = cat.parentId !== null && cat.parentId !== undefined;
    const hasParent = cat.parent !== null && cat.parent !== undefined;
    return !hasParentId && !hasParent;
  });

  // Filter subcategories của parent đã chọn
  const subCategories = selectedParentId 
    ? allCategories.filter(cat => {
        const catParentId = cat.parentId || cat.parent?.id || (cat as any).parent_id;
        return catParentId === selectedParentId;
      })
    : [];

  const handleInputChange = (field: keyof CreateProductCategoryRequest, value: string | number | boolean | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handler khi chọn parent category
  const handleParentChange = (value: string) => {
    const parentId = value === 'null' ? null : parseInt(value);
    setSelectedParentId(parentId);
    // Nếu chọn parent, set parentId = parent đó
    // Nếu chọn "Không có", reset về null
    handleInputChange('parentId', parentId);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên danh mục sản phẩm');
      return;
    }

    if (!formData.description.trim()) {
      alert('Vui lòng nhập mô tả danh mục sản phẩm');
      return;
    }

    setIsLoading(true);
    
    try {
      const payload = {
        name: formData.name.trim(),
        parentId: formData.parentId,
        serialRequired: formData.serialRequired,
        description: formData.description.trim(),
        iconUrl: formData.iconUrl?.trim() || null
      };
      
      const result = await createProductCategory(payload);
      
      // Set success data and show alert
      setSuccessData({ name: result.name });
      setShowSuccessAlert(true);
      
      // Reset form
      setFormData({
        name: '',
        parentId: null,
        serialRequired: false,
        description: '',
        iconUrl: ''
      });
      setSelectedParentId(null);
      
      setIsOpen(false);
      onProductCreated?.();
    } catch (error: any) {
      console.error('Lỗi khi tạo danh mục sản phẩm:', error);
      
      // Hiển thị chi tiết lỗi từ server
      const errorMessage = error?.response?.data?.message || error?.response?.data?.errors?.join(', ') || error?.message || 'Có lỗi xảy ra khi tạo danh mục sản phẩm';
      alert(`Lỗi: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setIsOpen(false);
      setFormData({
        name: '',
        parentId: null,
        serialRequired: false,
        description: '',
        iconUrl: ''
      });
      setSelectedParentId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus size={20} className="mr-2" />
          Thêm danh mục sản phẩm
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Tạo danh mục sản phẩm mới</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tên danh mục */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Tên danh mục <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nhập tên danh mục sản phẩm"
                required
                disabled={isLoading}
              />
            </div>

            {/* Danh mục cha */}
            <div className="space-y-2">
              <Label htmlFor="parentCategory" className="text-sm font-medium">
                Danh mục cha
              </Label>
              <Select
                value={selectedParentId?.toString() || 'null'}
                onValueChange={handleParentChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục cha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Không có danh mục cha</SelectItem>
                  {parentCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Hiển thị subcategories khi chọn parent - chỉ để tham khảo */}
          {selectedParentId && subCategories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="subCategory" className="text-sm font-medium">
                Danh mục con (chỉ để tham khảo)
              </Label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {parentCategories.find(p => p.id === selectedParentId)?.name || 'Danh mục cha'} có các danh mục con:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {subCategories.map((category) => (
                    <li key={category.id} className="text-sm text-gray-600">
                      {category.name}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  Lưu ý: Chỉ có thể chọn danh mục cha làm parent. Danh mục con không thể làm parent vì đã là con của danh mục khác.
                </p>
              </div>
            </div>
          )}

          {/* Serial Required */}
          <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
            <Switch
              id="serialRequired"
              checked={formData.serialRequired}
              onCheckedChange={(checked) => handleInputChange('serialRequired', checked)}
              disabled={isLoading}
            />
            <Label htmlFor="serialRequired" className="text-sm font-medium cursor-pointer">
              Yêu cầu số serial
            </Label>
          </div>

          {/* Mô tả */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Mô tả <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Nhập mô tả chi tiết về danh mục sản phẩm"
              rows={4}
              required
              disabled={isLoading}
            />
          </div>

          {/* URL Icon */}
          <div className="space-y-2">
            <Label htmlFor="iconUrl" className="text-sm font-medium">
              URL 
            </Label>
            <Input
              id="iconUrl"
              type="url"
              value={formData.iconUrl || ''}
              onChange={(e) => handleInputChange('iconUrl', e.target.value)}
              placeholder="https://example.com/icon.png"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Đường dẫn đến hình ảnh icon cho danh mục sản phẩm
            </p>
          </div>

          {/* Preview Icon */}
          {formData.iconUrl && formData.iconUrl.trim() && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Xem trước Icon</Label>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={formData.iconUrl}
                    alt="Icon preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p>Kích thước: 64x64px</p>
                  <p>Định dạng: PNG, JPG, SVG</p>
                </div>
              </div>
            </div>
          )}

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
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  Tạo danh mục
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
      
      {/* Success Alert Dialog */}
      <AlertDialog open={showSuccessAlert} onOpenChange={setShowSuccessAlert}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-emerald-700">
              🎉 Tạo danh mục thành công!
            </AlertDialogTitle>
            <div className="text-gray-600 space-y-2">
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <div className="font-semibold text-emerald-800 mb-2">Thông tin danh mục:</div>
                <div><strong>Tên danh mục:</strong> {successData?.name}</div>
              </div>
              <div className="text-sm">
                Danh mục của bạn đã được tạo thành công và sẵn sàng sử dụng.
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <AlertDialogAction 
              onClick={() => setShowSuccessAlert(false)}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold px-8 py-2 rounded-lg"
            >
              Đóng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default CreateProductForm;