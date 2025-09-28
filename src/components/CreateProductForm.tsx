import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, X } from 'lucide-react';
import { createProductCategory, getProductCategories } from '../api/product';
import type { ProductCategory } from '../api/product';

interface CreateProductCategoryRequest {
  name: string;
  parentId: number | null;
  description: string;
  iconUrl: string | null;
}

interface CreateProductFormProps {
  onProductCreated?: () => void;
}

const CreateProductForm: React.FC<CreateProductFormProps> = ({ onProductCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parentCategories, setParentCategories] = useState<ProductCategory[]>([]);
  const [formData, setFormData] = useState<CreateProductCategoryRequest>({
    name: '',
    parentId: null,
    description: '',
    iconUrl: ''
  });

  // Fetch parent categories when component mounts
  useEffect(() => {
    const fetchParentCategories = async () => {
      try {
        const categories = await getProductCategories();
        setParentCategories(categories);
      } catch (error) {
        console.error('Error fetching parent categories:', error);
      }
    };

    if (isOpen) {
      fetchParentCategories();
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof CreateProductCategoryRequest, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
        description: formData.description.trim(),
        iconUrl: formData.iconUrl?.trim() || null
      };
      
      const result = await createProductCategory(payload);
      alert(`Tạo danh mục sản phẩm "${result.name}" thành công!`);
      
      // Reset form
      setFormData({
        name: '',
        parentId: null,
        description: '',
        iconUrl: ''
      });
      
      setIsOpen(false);
      onProductCreated?.();
    } catch (error: any) {
      console.error('Lỗi khi tạo danh mục sản phẩm:', error);
      
      // Hiển thị chi tiết lỗi từ server
      const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tạo danh mục sản phẩm';
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
        description: '',
        iconUrl: ''
      });
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
              <Label htmlFor="parentId" className="text-sm font-medium">
                Danh mục cha
              </Label>
              <Select
                value={formData.parentId?.toString() || 'null'}
                onValueChange={(value) => handleInputChange('parentId', value === 'null' ? null : parseInt(value))}
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
    </Dialog>
  );
};

export default CreateProductForm;