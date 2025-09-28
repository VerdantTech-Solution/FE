import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sidebar,
  SidebarHeader,
  SidebarHeaderTitle,
  SidebarHeaderTitleText,
  SidebarHeaderTitleMain,
  SidebarHeaderTitleSub,
  SidebarNav,
  SidebarNavItem,
  SidebarFooter,
  SidebarSection,
  SidebarSectionTitle,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Home, ListFilter, PackagePlus, Settings, Shield, Users, LogOut, Plus, X, Search, Edit, Eye, Trash2, Bell } from "lucide-react";
import logo2 from "@/assets/logo2.jpg";
import { WarehousePanel } from "./staff/WarehousePanel";
import type { WarehouseStats } from "./staff/WarehousePanel";
import { UserManagementPanel } from "./staff/UserManagementPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router";
import { getProductCategories, createProductCategory } from "@/api/product";
import type { ProductCategory, CreateProductCategoryRequest } from "@/api/product";

type ViewKey = "warehouse" | "users" | "orders" | "equipment" | "monitoring" | "settings";

export const StaffPage: React.FC = () => {
  const [selectedMenu, setSelectedMenu] = useState<ViewKey>("warehouse");
  const [collapsed, setCollapsed] = useState(false);
  const [, setStats] = useState<WarehouseStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  
  // Monitoring states (sử dụng ProductCategory API)
  const [monitoringItems, setMonitoringItems] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  
  // Create monitoring form states
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isCreateLoading, setIsCreateLoading] = useState(false);
  const [parentCategories, setParentCategories] = useState<ProductCategory[]>([]);
  const [formData, setFormData] = useState<CreateProductCategoryRequest>({
    name: '',
    parentId: null,
    description: '',
    iconUrl: ''
  });
  
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Monitoring functions (copy từ ProductManagementPage)
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

  const handleInputChange = (field: keyof CreateProductCategoryRequest, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên thiết bị giám sát');
      return;
    }

    if (!formData.description.trim()) {
      alert('Vui lòng nhập mô tả thiết bị');
      return;
    }

    setIsCreateLoading(true);
    
    try {
      const payload = {
        name: formData.name.trim(),
        parentId: formData.parentId,
        description: formData.description.trim(),
        iconUrl: formData.iconUrl?.trim() || null
      };
      
      const result = await createProductCategory(payload);
      alert(`Tạo thiết bị giám sát "${result.name}" thành công!`);
      
      // Reset form
      setFormData({
        name: '',
        parentId: null,
        description: '',
        iconUrl: ''
      });
      
      setIsCreateFormOpen(false);
      handleMonitoringCreated();
    } catch (error: any) {
      console.error('Lỗi khi tạo thiết bị giám sát:', error);
      
      // Hiển thị chi tiết lỗi từ server
      const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tạo thiết bị giám sát';
      alert(`Lỗi: ${errorMessage}`);
    } finally {
      setIsCreateLoading(false);
    }
  };

  const handleCreateClose = () => {
    if (!isCreateLoading) {
      setIsCreateFormOpen(false);
      setFormData({
        name: '',
        parentId: null,
        description: '',
        iconUrl: ''
      });
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(monitoringItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = monitoringItems.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Load monitoring data when monitoring is selected
  useEffect(() => {
    if (selectedMenu === "monitoring") {
      fetchMonitoringItems();
    }
  }, [selectedMenu]);

  // Fetch parent categories when form opens
  useEffect(() => {
    const fetchParentCategories = async () => {
      try {
        const categories = await getProductCategories();
        setParentCategories(categories);
      } catch (error) {
        console.error('Error fetching parent categories:', error);
      }
    };

    if (isCreateFormOpen) {
      fetchParentCategories();
    }
  }, [isCreateFormOpen]);

  const sidebarVariants = {
    hidden: { x: -300, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.4 } },
  } as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <motion.div variants={sidebarVariants} initial="hidden" animate="visible">
        <Sidebar className="fixed left-0 top-0 z-30" collapsed={collapsed}>
          <SidebarHeader>
            <SidebarHeaderTitle>
              <div className="w-[90px] h-[70px] flex items-center justify-center overflow-hidden p-2">
                <img src={logo2} alt="VerdantTech Logo" className="w-full h-full object-contain" />
              </div>
              <SidebarHeaderTitleText>
                <SidebarHeaderTitleMain>VerdantTech</SidebarHeaderTitleMain>
                <SidebarHeaderTitleSub>Staff Panel</SidebarHeaderTitleSub>
              </SidebarHeaderTitleText>
            </SidebarHeaderTitle>
          </SidebarHeader>

          <SidebarNav>
            <SidebarSection>
              <SidebarSectionTitle>Chính</SidebarSectionTitle>
              <SidebarNavItem collapsed={collapsed} active={selectedMenu === "warehouse"} onClick={() => setSelectedMenu("warehouse")} icon={<Home className="w-5 h-5" />}>Quản Lý Nhập Kho</SidebarNavItem>
              <SidebarNavItem collapsed={collapsed} active={selectedMenu === "users"} onClick={() => setSelectedMenu("users")} icon={<Users className="w-5 h-5" />}>Quản Lý Người Dùng</SidebarNavItem>
              <SidebarNavItem collapsed={collapsed} active={selectedMenu === "orders"} onClick={() => setSelectedMenu("orders")} icon={<ListFilter className="w-5 h-5" />}>Quản Lý Đơn Hàng</SidebarNavItem>
            </SidebarSection>
            <SidebarSection>
              <SidebarSectionTitle>Quản lý</SidebarSectionTitle>
              <SidebarNavItem collapsed={collapsed} active={selectedMenu === "equipment"} onClick={() => setSelectedMenu("equipment")} icon={<Shield className="w-5 h-5" />}>Thiết bị</SidebarNavItem>
              <SidebarNavItem collapsed={collapsed} active={selectedMenu === "monitoring"} onClick={() => setSelectedMenu("monitoring")} icon={<PackagePlus className="w-5 h-5" />}>Giám sát</SidebarNavItem>
            </SidebarSection>
            <SidebarSection>
              <SidebarSectionTitle>Hệ thống</SidebarSectionTitle>
              <SidebarNavItem collapsed={collapsed} active={selectedMenu === "settings"} onClick={() => setSelectedMenu("settings")} icon={<Settings className="w-5 h-5" />}>Cài đặt</SidebarNavItem>
            </SidebarSection>
          </SidebarNav>

          <SidebarFooter>
            <div className="flex w-full gap-2">
              <Button className="w-full" onClick={() => setCollapsed((v) => !v)}>{collapsed ? "Mở" : "Thu gọn"}</Button>
            </div>
          </SidebarFooter>
        </Sidebar>
      </motion.div>

      <div className={collapsed ? "ml-16" : "ml-64"}>
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Staff Dashboard</h1>
              <p className="text-sm text-gray-500">Quản lý khu vực dành cho nhân viên</p>
            </div>
            <Button 
              variant="outline" 
              className="border-red-300 text-red-600 hover:bg-red-50 gap-2"
              onClick={async () => { await logout(); navigate("/login"); }}
            >
              <LogOut className="w-4 h-4" /> Đăng xuất
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {selectedMenu === "warehouse" && (
            <WarehousePanel onStatsChange={setStats} />
          )}
          {selectedMenu === "users" && (
            <UserManagementPanel />
          )}
          {selectedMenu === "monitoring" && (
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
                          {/* Tên thiết bị */}
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">
                              Tên thiết bị <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              placeholder="Nhập tên thiết bị giám sát"
                              required
                              disabled={isCreateLoading}
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
                              disabled={isCreateLoading}
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
                            placeholder="Nhập mô tả chi tiết về thiết bị giám sát"
                            rows={4}
                            required
                            disabled={isCreateLoading}
                          />
                        </div>

                        {/* URL Icon */}
                        <div className="space-y-2">
                          <Label htmlFor="iconUrl" className="text-sm font-medium">
                            URL Icon
                          </Label>
                          <Input
                            id="iconUrl"
                            type="url"
                            value={formData.iconUrl || ''}
                            onChange={(e) => handleInputChange('iconUrl', e.target.value)}
                            placeholder="https://example.com/icon.png"
                            disabled={isCreateLoading}
                          />
                          <p className="text-xs text-gray-500">
                            Đường dẫn đến hình ảnh icon cho thiết bị giám sát
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
                            onClick={handleCreateClose}
                            disabled={isCreateLoading}
                          >
                            <X size={16} className="mr-2" />
                            Hủy
                          </Button>
                          <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={isCreateLoading}
                          >
                            {isCreateLoading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Đang tạo...
                              </>
                            ) : (
                              <>
                                <Plus size={16} className="mr-2" />
                                Tạo thiết bị
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Bell size={20} />
                  </Button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600">{error}</p>
                  <Button 
                    onClick={fetchMonitoringItems} 
                    className="mt-2 bg-red-600 hover:bg-red-700"
                    size="sm"
                  >
                    Thử lại
                  </Button>
                </div>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Tổng thiết bị", value: monitoringItems.length.toString(), icon: "📡", color: "bg-blue-50 text-blue-600" },
                  { label: "Đang hoạt động", value: monitoringItems.filter(item => item.isActive).length.toString(), icon: "✓", color: "bg-green-50 text-green-600" },
                  { label: "Không hoạt động", value: monitoringItems.filter(item => !item.isActive).length.toString(), icon: "✗", color: "bg-red-50 text-red-600" },
                  { label: "Có danh mục cha", value: monitoringItems.filter(item => item.parent).length.toString(), icon: "🔗", color: "bg-purple-50 text-purple-600" }
                ].map((stat, index) => (
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
                    <Input 
                      placeholder="Tìm kiếm thiết bị..." 
                      className="pl-10"
                    />
                  </div>
                  <Button className="px-6">
                    <Search size={20} />
                  </Button>
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
                                    {item.iconUrl && (
                                      <img 
                                        src={item.iconUrl} 
                                        alt={item.name}
                                        className="w-8 h-8 rounded object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    )}
                                    <div>
                                      <p className="font-medium text-gray-900">{item.name}</p>
                                      <p className="text-sm text-gray-500">{item.description}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-gray-600">{item.slug}</td>
                                <td className="py-4 px-4 text-gray-600">
                                  {item.parent ? (
                                    <span className="text-blue-600">{item.parent.name}</span>
                                  ) : (
                                    <span className="text-gray-400">Không có</span>
                                  )}
                                </td>
                                <td className="py-4 px-4">
                                  <Badge className={`${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} border-0`}>
                                    <span className="mr-1">{item.isActive ? '✓' : '✗'}</span>
                                    {item.isActive ? 'Hoạt động' : 'Không hoạt động'}
                                  </Badge>
                                </td>
                                <td className="py-4 px-4 text-gray-600">
                                  {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center space-x-2">
                                    <Button variant="ghost" size="sm" className="p-2">
                                      <Edit size={16} />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="p-2">
                                      <Eye size={16} />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="p-2 text-red-600 hover:text-red-700">
                                      <Trash2 size={16} />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          Hiển thị {monitoringItems.length > 0 ? `${startIndex + 1}-${Math.min(endIndex, monitoringItems.length)}` : '0'} trong tổng số {monitoringItems.length} thiết bị giám sát
                        </p>
                        
                        {totalPages > 1 && (
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
                              Trước
                            </Button>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                                className={currentPage === page ? "bg-blue-600 hover:bg-blue-700" : ""}
                              >
                                {page}
                              </Button>
                            ))}
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                            >
                              Sau
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffPage;


