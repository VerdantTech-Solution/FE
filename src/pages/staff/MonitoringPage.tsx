import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogContent, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, X, Search, Edit, Eye, Trash2, Bell, CheckCircle2, ArrowLeft, Package } from "lucide-react";
import { getProductCategories, createProductCategory, updateProductCategory, getProductsByCategory, type Product } from "@/api/product";
import type { ProductCategory, CreateProductCategoryRequest, UpdateProductCategoryRequest, ResponseWrapper } from "@/api/product";
import { ProductDetailDialog } from "./components/ProductDetailDialog";
import { getProductUnitById } from "@/lib/productUnitMapper";

export const MonitoringPage: React.FC = () => {
  const [monitoringItems, setMonitoringItems] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Product view states
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isProductDetailDialogOpen, setIsProductDetailDialogOpen] = useState(false);
  const [allCategoriesForUnit, setAllCategoriesForUnit] = useState<ProductCategory[]>([]);

  // Create form states
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isCreateLoading, setIsCreateLoading] = useState(false);
  const [allCategories, setAllCategories] = useState<ProductCategory[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successData, setSuccessData] = useState<{name: string} | null>(null);
  const [formData, setFormData] = useState<CreateProductCategoryRequest>({
    name: '',
    parentId: null,
    serialRequired: false,
    description: '',
  });

  // Edit form states
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isEditDialogLoading, setIsEditDialogLoading] = useState(false);
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [editData, setEditData] = useState<UpdateProductCategoryRequest>({
    name: '',
    parentId: null,
    serialRequired: false,
    description: '',
    isActive: true,
  });

  const fetchMonitoringItems = async (page: number = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProductCategories({ page, pageSize });
      
      // Xử lý response có thể là PaginatedResponse hoặc array
      if (Array.isArray(response)) {
        // Backward compatibility: nếu là array, giữ nguyên logic cũ
        setMonitoringItems(response);
        setTotalPages(1);
        setTotalRecords(response.length);
      } else if (response && 'data' in response) {
        // PaginatedResponse
        setMonitoringItems(response.data);
        setTotalPages(response.totalPages);
        setTotalRecords(response.totalRecords);
      } else {
        setMonitoringItems([]);
        setTotalPages(1);
        setTotalRecords(0);
      }
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi tải danh sách thiết bị giám sát');
      console.error('Error fetching monitoring items:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter categories based on search query
  const filteredItems = monitoringItems.filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.slug?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.parent?.name.toLowerCase().includes(query)
    );
  });
  
  const fetchProductsByCategory = async (categoryId: number) => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      const response = await getProductsByCategory(categoryId, { page: 1, pageSize: 1000 });
      setProducts(response.data);
    } catch (err: any) {
      setProductsError(err?.message || 'Có lỗi xảy ra khi tải danh sách sản phẩm');
      console.error('Error fetching products by category:', err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };
  
  const handleCategoryClick = (category: ProductCategory) => {
    setSelectedCategoryId(category.id);
    setSelectedCategoryName(category.name);
    fetchProductsByCategory(category.id);
  };
  
  const handleBackToCategories = () => {
    setSelectedCategoryId(null);
    setSelectedCategoryName('');
    setProducts([]);
    setProductsError(null);
  };
  
  const handleViewProductDetails = (product: Product) => {
    setSelectedProductId(product.id);
    setIsProductDetailDialogOpen(true);
  };
  
  const getProductImageUrl = (images: any): string | undefined => {
    if (!images) return undefined;
    if (Array.isArray(images)) {
      const first = images[0];
      if (!first) return undefined;
      if (typeof first === 'object' && 'imageUrl' in first) return (first as any).imageUrl as string;
      return String(first);
    }
    return String(images);
  };
  
  const currency = (v: number) => v.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

  const handleMonitoringCreated = () => {
    fetchMonitoringItems(1);
    setCurrentPage(1);
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchMonitoringItems(page);
  };

  const handleDeactivateAndRemove = async (id: number, name: string) => {
    if (deletingId != null) return;
    const confirmed = window.confirm(`Bạn có chắc muốn xóa danh mục "${name}"?\nHành động này sẽ đặt trạng thái thành không hoạt động và ẩn khỏi danh sách.`);
    if (!confirmed) return;
    setDeletingId(id);
    // Optimistic remove: xóa khỏi UI ngay lập tức
    const previousItems = monitoringItems;
    setMonitoringItems(prev => prev.filter(item => item.id !== id));
    try {
      await updateProductCategory(id, { isActive: false });
      // Tùy chọn: đồng bộ lại danh sách ở nền (không chặn UI)
      fetchMonitoringItems().catch(() => {});
    } catch (err: any) {
      // Rollback nếu lỗi
      setMonitoringItems(previousItems);
      const errorMessage = err?.response?.data?.errors?.join(', ') || err?.message || 'Có lỗi xảy ra khi xóa danh mục';
      alert(`Lỗi: ${errorMessage}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleInputChange = (field: keyof CreateProductCategoryRequest, value: string | number | boolean | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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

  // Handler khi chọn parent category
  const handleParentChange = (value: string) => {
    const parentId = value === 'null' ? null : parseInt(value);
    setSelectedParentId(parentId);
    // Nếu chọn parent, set parentId = parent đó
    // Nếu chọn "Không có", reset về null
    handleInputChange('parentId', parentId);
  };


  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { alert('Vui lòng nhập tên thiết bị giám sát'); return; }
    if (!formData.description.trim()) { alert('Vui lòng nhập mô tả thiết bị'); return; }
    setIsCreateLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        parentId: formData.parentId,
        serialRequired: formData.serialRequired,
        description: formData.description.trim(),
      };
      const result = await createProductCategory(payload);
      
      // Set success data and show alert
      setSuccessData({ name: result.name });
      setShowSuccessAlert(true);
      
      setFormData({ name: '', parentId: null, serialRequired: false, description: '' });
      setSelectedParentId(null);
      setIsCreateFormOpen(false);
      handleMonitoringCreated();
    } catch (error: any) {
      console.error('Lỗi khi tạo thiết bị giám sát:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tạo thiết bị giám sát';
      alert(`Lỗi: ${errorMessage}`);
    } finally {
      setIsCreateLoading(false);
    }
  };

  const openEditDialog = async (item: ProductCategory) => {
    setIsEditDialogLoading(true);
    setEditItemId(item.id);
    setEditData({
      name: item.name,
      parentId: item.parent?.id ?? null,
      serialRequired: item.serialRequired ?? false,
      description: item.description,
      isActive: item.isActive,
    });
    
    // Load categories for the dropdown
    try { 
      const response = await getProductCategories({ page: 1, pageSize: 1000 });
      const categories = Array.isArray(response) ? response : response.data;
      setAllCategories(categories); 
    } catch (error) {
      console.error('Error fetching categories for edit:', error);
    } finally {
      setIsEditDialogLoading(false);
    }
    
    setIsEditFormOpen(true);
  };

  const handleEditInputChange = (field: keyof UpdateProductCategoryRequest, value: string | number | boolean | null) => {
    setEditData(prev => ({ ...prev, [field]: value as never }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editItemId == null) return;
    if (!editData.name.trim()) { 
      alert('Vui lòng nhập tên danh mục'); 
      return; 
    }
    if (!editData.description.trim()) { 
      alert('Vui lòng nhập mô tả'); 
      return; 
    }
    
    setIsEditLoading(true);
    try {
      const payload: Partial<UpdateProductCategoryRequest> = {
        name: editData.name.trim(),
        parentId: editData.parentId,
        serialRequired: editData.serialRequired,
        description: editData.description.trim(),
        isActive: editData.isActive,
      };
      
      console.log('Updating category with payload:', payload);
      const res: ResponseWrapper<ProductCategory> = await updateProductCategory(editItemId, payload);
      
      // Check if the response indicates success
      if (res && res.status === false) { 
        throw new Error(res.errors?.join(', ') || 'Cập nhật thất bại'); 
      }
      
      // Success message
      const updatedName = res?.data?.name || editData.name;
      alert(`Cập nhật danh mục "${updatedName}" thành công!`);
      
      // Close dialog and refresh data
      setIsEditFormOpen(false);
      setEditItemId(null);
      setEditData({ name: '', parentId: null, serialRequired: false, description: '', isActive: true });
      await fetchMonitoringItems(currentPage);
      
    } catch (err: any) {
      console.error('Update category error:', err);
      let errorMessage = 'Có lỗi xảy ra khi cập nhật danh mục';
      
      if (err?.response?.data?.errors) {
        errorMessage = err.response.data.errors.join(', ');
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      alert(`Lỗi: ${errorMessage}`);
    } finally {
      setIsEditLoading(false);
    }
  };

  useEffect(() => { fetchMonitoringItems(1); }, []);
  
  // Load all categories for unit mapping
  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const response = await getProductCategories({ page: 1, pageSize: 1000 });
        const categories = Array.isArray(response) ? response : response.data;
        setAllCategoriesForUnit(categories);
      } catch (error) {
        console.error('Error fetching categories for unit mapping:', error);
      }
    };
    fetchAllCategories();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try { 
        const response = await getProductCategories({ page: 1, pageSize: 1000 });
        const categories = Array.isArray(response) ? response : response.data;
        setAllCategories(categories); 
      } catch (error) { 
        console.error('Error fetching categories:', error); 
      }
    };
    if (isCreateFormOpen) { 
      fetchCategories(); 
    }
  }, [isCreateFormOpen]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh mục sản phẩm</h1>
          <p className="text-gray-600">Quản lý thiết bị giám sát hệ thống</p>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus size={20} className="mr-2" />
                Thêm danh mục sản phẩm
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Tạo danh mục sản phẩm mới</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Tên thiết bị <span className="text-red-500">*</span></Label>
                    <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Nhập tên thiết bị giám sát" required disabled={isCreateLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parentCategory" className="text-sm font-medium">Danh mục cha</Label>
                    <Select value={selectedParentId?.toString() || 'null'} onValueChange={handleParentChange} disabled={isCreateLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục cha" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Không có danh mục cha</SelectItem>
                        {parentCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>{category.name}</SelectItem>
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
                <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                  <Switch
                    id="serialRequired"
                    checked={formData.serialRequired}
                    onCheckedChange={(checked) => handleInputChange('serialRequired', checked)}
                    disabled={isCreateLoading}
                  />
                  <Label htmlFor="serialRequired" className="text-sm font-medium cursor-pointer">
                    Yêu cầu số serial
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Mô tả <span className="text-red-500">*</span></Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Nhập mô tả chi tiết về thiết bị giám sát" rows={4} required disabled={isCreateLoading} />
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Button type="button" variant="outline" onClick={() => setIsCreateFormOpen(false)} disabled={isCreateLoading}><X size={16} className="mr-2" />Hủy</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isCreateLoading}>{isCreateLoading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Đang tạo...</>) : (<><Plus size={16} className="mr-2" />Tạo thiết bị</>)}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="sm" className="p-2"><Bell size={20} /></Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <Button onClick={() => fetchMonitoringItems(currentPage)} className="mt-2 bg-red-600 hover:bg-red-700" size="sm">Thử lại</Button>
        </div>
      )}
      
      {/* Products View - Show when category is selected */}
      {selectedCategoryId && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleBackToCategories}>
                      <ArrowLeft size={20} />
                    </Button>
                    Sản phẩm trong danh mục: {selectedCategoryName}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {products.length} sản phẩm
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-600">Đang tải sản phẩm...</span>
                </div>
              ) : productsError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600">{productsError}</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Không có sản phẩm nào trong danh mục này</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product) => {
                    const imageUrl = getProductImageUrl(product.images);
                    return (
                      <Card key={product.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="aspect-video w-full bg-gray-100 rounded-lg overflow-hidden mb-3">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={product.productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-sm font-semibold line-clamp-2 flex-1">
                              {product.productName}
                            </CardTitle>
                            <Badge
                              variant={product.isActive ? "default" : "secondary"}
                              className={product.isActive ? "bg-green-100 text-green-800" : ""}
                            >
                              {product.isActive ? "Hoạt động" : "Ngừng hoạt động"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Mã SP:</span>
                              <span className="font-medium">{product.productCode}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Giá:</span>
                              <span className="font-semibold text-green-600">
                                {currency(product.unitPrice)} / {getProductUnitById(product.categoryId, allCategoriesForUnit)}
                              </span>
                            </div>
                            {product.stockQuantity !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Tồn kho:</span>
                                <span className="font-medium">{product.stockQuantity}</span>
                              </div>
                            )}
                            {product.soldCount !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Đã bán:</span>
                                <span className="font-medium">{product.soldCount}</span>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleViewProductDetails(product)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Xem chi tiết
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Cards - Hide when viewing products */}
      {!selectedCategoryId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[{ label: "Tổng thiết bị", value: totalRecords.toString(), icon: "📡", color: "bg-blue-50 text-blue-600" }, { label: "Đang hoạt động", value: monitoringItems.filter(item => item.isActive).length.toString(), icon: "✓", color: "bg-green-50 text-green-600" }, { label: "Không hoạt động", value: monitoringItems.filter(item => !item.isActive).length.toString(), icon: "✗", color: "bg-red-50 text-red-600" }, { label: "Có danh mục cha", value: monitoringItems.filter(item => item.parent).length.toString(), icon: "🔗", color: "bg-purple-50 text-purple-600" }].map((stat, index) => (
          <Card key={index} className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <span className="text-xl">{stat.icon}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* Filters - Hide when viewing products */}
      {!selectedCategoryId && (
      <div className="flex flex-col sm:flex-row gap-4">
        <Select>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="inactive">Không hoạt động</SelectItem>
            <SelectItem value="maintenance">Bảo trì</SelectItem>
            <SelectItem value="error">Có lỗi</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tất cả loại thiết bị" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            <SelectItem value="sensor">Cảm biến</SelectItem>
            <SelectItem value="camera">Camera</SelectItem>
            <SelectItem value="weather">Thời tiết</SelectItem>
            <SelectItem value="irrigation">Tưới tiêu</SelectItem>
            <SelectItem value="security">An ninh</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input 
              placeholder="Tìm kiếm danh mục..." 
              className="pl-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {searchQuery && (
            <Button 
              variant="outline" 
              onClick={() => setSearchQuery('')}
              className="px-4"
              title="Xóa tìm kiếm"
            >
              <X size={20} />
            </Button>
          )}
        </div>
      </div>
      )}

      {/* Categories Table - Hide when viewing products */}
      {!selectedCategoryId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Danh sách danh mục sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600">Đang tải...</span>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Tên thiết bị</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Slug</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Danh mục cha</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Trạng thái</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Ngày tạo</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-500">
                            {searchQuery ? `Không tìm thấy danh mục nào với từ khóa "${searchQuery}"` : 'Không có danh mục nào'}
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div>
                              <p className="font-medium text-gray-900">{item.name}</p>
                              <p className="text-sm text-gray-500">{item.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{item.slug}</td>
                        <td className="py-4 px-4 text-gray-600">{item.parent ? (<span className="text-blue-600">{item.parent.name}</span>) : (<span className="text-gray-400">Không có</span>)}</td>
                        <td className="py-4 px-4">
                          <Badge className={`${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} border-0`}>
                            <span className="mr-1">{item.isActive ? '✓' : '✗'}</span>
                            {item.isActive ? 'Hoạt động' : 'Không hoạt động'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" className="p-2" onClick={() => openEditDialog(item)}><Edit size={16} /></Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="p-2" 
                              disabled={deletingId === item.id}
                              onClick={() => handleCategoryClick(item)}
                              title="Xem sản phẩm trong danh mục"
                            >
                              <Eye size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-2 text-red-600 hover:text-red-700"
                              disabled={deletingId === item.id}
                              onClick={() => handleDeactivateAndRemove(item.id, item.name)}
                            >
                              {deletingId === item.id ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                      ))
                      )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  {searchQuery ? (
                    <>Hiển thị {filteredItems.length} kết quả tìm kiếm cho "{searchQuery}"</>
                  ) : (
                    <>Hiển thị {monitoringItems.length > 0 ? `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalRecords)}` : '0'} trong tổng số {totalRecords} danh mục</>
                  )}
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Trước</Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => handlePageChange(page)} className={currentPage === page ? "bg-blue-600 hover:bg-blue-700" : ""}>{page}</Button>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Sau</Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Cập nhật danh mục</DialogTitle>
          </DialogHeader>
          
          {isEditDialogLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
            </div>
          ) : (
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-sm font-medium">Tên danh mục <span className="text-red-500">*</span></Label>
                  <Input 
                    id="edit-name" 
                    value={editData.name} 
                    onChange={(e) => handleEditInputChange('name', e.target.value)} 
                    disabled={isEditLoading} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-parent" className="text-sm font-medium">Danh mục cha</Label>
                  <Select 
                    value={editData.parentId == null ? 'null' : String(editData.parentId)} 
                    onValueChange={(v) => handleEditInputChange('parentId', v === 'null' ? null : parseInt(v))} 
                    disabled={isEditLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục cha" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">Không có danh mục cha</SelectItem>
                      {parentCategories.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description" className="text-sm font-medium">Mô tả <span className="text-red-500">*</span></Label>
                <Textarea 
                  id="edit-description" 
                  value={editData.description} 
                  onChange={(e) => handleEditInputChange('description', e.target.value)} 
                  rows={4} 
                  disabled={isEditLoading} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Trạng thái</Label>
                <div className="flex items-center gap-3">
                  <Button 
                    type="button" 
                    variant={editData.isActive ? 'default' : 'outline'} 
                    onClick={() => handleEditInputChange('isActive', true)} 
                    disabled={isEditLoading} 
                    className={editData.isActive ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    Hoạt động
                  </Button>
                  <Button 
                    type="button" 
                    variant={!editData.isActive ? 'default' : 'outline'} 
                    onClick={() => handleEditInputChange('isActive', false)} 
                    disabled={isEditLoading} 
                    className={!editData.isActive ? 'bg-gray-600 hover:bg-gray-700' : ''}
                  >
                    Không hoạt động
                  </Button>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditFormOpen(false)} 
                  disabled={isEditLoading}
                >
                  <X size={16} className="mr-2" />Hủy
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700" 
                  disabled={isEditLoading}
                >
                  {isEditLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <Edit size={16} className="mr-2" />
                      Cập nhật
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

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
      
      {/* Product Detail Dialog */}
      <ProductDetailDialog
        productId={selectedProductId}
        open={isProductDetailDialogOpen}
        onOpenChange={setIsProductDetailDialogOpen}
        onProductUpdated={() => {
          // Refresh products when product is updated
          if (selectedCategoryId) {
            fetchProductsByCategory(selectedCategoryId);
          }
        }}
      />
    </div>
  );
};
