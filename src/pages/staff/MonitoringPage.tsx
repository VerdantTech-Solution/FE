import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, X, Search, Edit, Eye, Trash2, Bell } from "lucide-react";
import { getProductCategories, createProductCategory, updateProductCategory } from "@/api/product";
import type { ProductCategory, CreateProductCategoryRequest, UpdateProductCategoryRequest, ResponseWrapper } from "@/api/product";

export const MonitoringPage: React.FC = () => {
  const [monitoringItems, setMonitoringItems] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Create form states
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isCreateLoading, setIsCreateLoading] = useState(false);
  const [parentCategories, setParentCategories] = useState<ProductCategory[]>([]);
  const [formData, setFormData] = useState<CreateProductCategoryRequest>({
    name: '',
    parentId: null,
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
    description: '',
    isActive: true,
  });

  const fetchMonitoringItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProductCategories();
      setMonitoringItems(data);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi tải danh sách thiết bị giám sát');
      console.error('Error fetching monitoring items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMonitoringCreated = () => {
    fetchMonitoringItems();
    setCurrentPage(1);
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

  const handleInputChange = (field: keyof CreateProductCategoryRequest, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
        description: formData.description.trim(),
      };
      const result = await createProductCategory(payload);
      alert(`Tạo thiết bị giám sát "${result.name}" thành công!`);
      setFormData({ name: '', parentId: null, description: '' });
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
      description: item.description,
      isActive: item.isActive,
    });
    
    // Load parent categories for the dropdown
    try { 
      const categories = await getProductCategories(); 
      setParentCategories(categories); 
    } catch (error) {
      console.error('Error fetching parent categories for edit:', error);
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
      setEditData({ name: '', parentId: null, description: '', isActive: true });
      await fetchMonitoringItems();
      
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

  // pagination
  const totalPages = Math.ceil(monitoringItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = monitoringItems.slice(startIndex, endIndex);
  const handlePageChange = (page: number) => setCurrentPage(page);

  useEffect(() => { fetchMonitoringItems(); }, []);
  useEffect(() => {
    const fetchParentCategories = async () => {
      try { const categories = await getProductCategories(); setParentCategories(categories); } catch (error) { console.error('Error fetching parent categories:', error); }
    };
    if (isCreateFormOpen) { fetchParentCategories(); }
  }, [isCreateFormOpen]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Giám sát</h1>
          <p className="text-gray-600">Quản lý thiết bị giám sát hệ thống</p>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus size={20} className="mr-2" />
                Thêm thiết bị giám sát
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Tạo thiết bị giám sát mới</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Tên thiết bị <span className="text-red-500">*</span></Label>
                    <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Nhập tên thiết bị giám sát" required disabled={isCreateLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parentId" className="text-sm font-medium">Danh mục cha</Label>
                    <Select value={formData.parentId?.toString() || 'null'} onValueChange={(value) => handleInputChange('parentId', value === 'null' ? null : parseInt(value))} disabled={isCreateLoading}>
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
          <Button onClick={fetchMonitoringItems} className="mt-2 bg-red-600 hover:bg-red-700" size="sm">Thử lại</Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[{ label: "Tổng thiết bị", value: monitoringItems.length.toString(), icon: "📡", color: "bg-blue-50 text-blue-600" }, { label: "Đang hoạt động", value: monitoringItems.filter(item => item.isActive).length.toString(), icon: "✓", color: "bg-green-50 text-green-600" }, { label: "Không hoạt động", value: monitoringItems.filter(item => !item.isActive).length.toString(), icon: "✗", color: "bg-red-50 text-red-600" }, { label: "Có danh mục cha", value: monitoringItems.filter(item => item.parent).length.toString(), icon: "🔗", color: "bg-purple-50 text-purple-600" }].map((stat, index) => (
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

      {/* Filters */}
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
            <Input placeholder="Tìm kiếm thiết bị..." className="pl-10" />
          </div>
          <Button className="px-6"><Search size={20} /></Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Danh sách thiết bị giám sát</CardTitle>
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
                    {currentItems.map((item) => (
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
                            <Button variant="ghost" size="sm" className="p-2" disabled={deletingId === item.id}><Eye size={16} /></Button>
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
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">Hiển thị {monitoringItems.length > 0 ? `${startIndex + 1}-${Math.min(endIndex, monitoringItems.length)}` : '0'} trong tổng số {monitoringItems.length} thiết bị giám sát</p>
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
    </div>
  );
};
