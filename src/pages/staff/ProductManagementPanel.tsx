import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Package, 
  Eye, 
  EyeOff, 
  Loader2, 
  Filter, 
  RefreshCcw, 
  Pencil 
} from "lucide-react";
import { 
  getAllProducts, 
  getProductUpdateRequests, 
  updateProduct, 
  type Product, 
  type ProductUpdateRequest 
} from "@/api/product";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductDetailDialog } from "./components/ProductDetailDialog";
import { ProductUpdateRequestDialog } from "./components/ProductUpdateRequestDialog";
import { getVendorById } from "@/api/vendor";
import { toast } from "sonner";

const currency = (v: number) => v.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

export const ProductManagementPanel: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Update requests state
  const [updateRequests, setUpdateRequests] = useState<ProductUpdateRequest[]>([]);
  const [updateStatusFilter, setUpdateStatusFilter] = useState<string>("all");
  const [updateVendorId, setUpdateVendorId] = useState<string>("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updatePage, setUpdatePage] = useState(1);
  const [updatePageSize] = useState(20);
  const [selectedRequest, setSelectedRequest] = useState<ProductUpdateRequest | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [vendorNames, setVendorNames] = useState<Record<number, string>>({});

  // Toggle visibility state
  const [togglingVisibility, setTogglingVisibility] = useState<number | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const allProducts = await getAllProducts({ page: 1, pageSize: 1000 });
      setProducts(allProducts);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.errors?.join(", ") || err?.message || "Có lỗi xảy ra khi tải sản phẩm";
      setError(errorMessage);
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchUpdateRequests = async () => {
    setUpdateLoading(true);
    setUpdateError(null);
    try {
      const resp = await getProductUpdateRequests({
        page: updatePage,
        pageSize: updatePageSize,
        status: updateStatusFilter === "all" ? undefined : updateStatusFilter,
        vendorId: updateVendorId ? Number(updateVendorId) : undefined,
      });
      setUpdateRequests(resp.data || []);
    } catch (err: any) {
      const msg = err?.response?.data?.errors?.join(", ") || err?.message || "Không thể tải yêu cầu cập nhật";
      setUpdateError(msg);
      setUpdateRequests([]);
    } finally {
      setUpdateLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdateRequests();
  }, [updatePage, updateStatusFilter, updateVendorId]);

  useEffect(() => {
    const missingIds = updateRequests
      .map((r) => r.vendorId)
      .filter((id): id is number => typeof id === "number" && !(id in vendorNames));

    if (missingIds.length === 0) return;

    const loadVendors = async () => {
      const entries = await Promise.all(
        missingIds.map(async (id) => {
          try {
            const v = await getVendorById(id);
            return [id, v.companyName || v.fullName || `Vendor #${id}`] as const;
          } catch {
            return [id, `Vendor #${id}`] as const;
          }
        })
      );
      setVendorNames((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    };

    loadVendors();
  }, [updateRequests, vendorNames]);

  const handleToggleProductVisibility = async (product: Product) => {
    try {
      setTogglingVisibility(product.id);
      const newIsActive = !product.isActive;
      
      await updateProduct(product.id, {
        isActive: newIsActive,
      });

      // Cập nhật trực tiếp vào state để UI thay đổi mượt mà
      setProducts(prev => 
        prev.map(p => p.id === product.id ? { ...p, isActive: newIsActive } : p)
      );
      
      const message = newIsActive 
        ? `Sản phẩm "${product.productName}" đã được hiển thị` 
        : `Sản phẩm "${product.productName}" đã bị ẩn`;
      
      toast.success(message);
    } catch (error: any) {
      console.error("Error toggling product visibility:", error);
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái sản phẩm");
    } finally {
      setTogglingVisibility(null);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "--";
    try {
      return new Date(value).toLocaleDateString("vi-VN");
    } catch {
      return value;
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.productName.toLowerCase().includes(query) ||
          p.productCode.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    if (statusFilter === "active") {
      filtered = filtered.filter((p) => p.isActive === true);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((p) => p.isActive === false);
    }

    return filtered;
  }, [products, searchQuery, statusFilter]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  const handleViewDetails = (product: Product) => {
    setSelectedProductId(product.id);
    setIsDetailDialogOpen(true);
  };

  const handleProductUpdated = () => {
    fetchProducts();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="products">Sản phẩm</TabsTrigger>
          <TabsTrigger value="update-requests">Yêu cầu cập nhật sản phẩm</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h2>
              <p className="text-sm text-gray-500 mt-1">
                Quản lý các sản phẩm đã được duyệt ({filteredProducts.length} sản phẩm)
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Tìm kiếm theo tên, mã sản phẩm..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-[200px]">
                  <Select value={statusFilter} onValueChange={(v) => {
                    setStatusFilter(v as "all" | "active" | "inactive");
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger>
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="active">Đang hoạt động</SelectItem>
                      <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {paginatedProducts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Không tìm thấy sản phẩm nào</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedProducts.map((product) => {
                  const imageUrl = getProductImageUrl(product.images);
                  return (
                    <Card key={product.id} className="hover:shadow-lg transition-shadow flex flex-col h-full">
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
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Mã SP:</span>
                            <span className="font-medium">{product.productCode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Giá:</span>
                            <span className="font-semibold text-green-600">
                              {currency(product.unitPrice)}
                            </span>
                          </div>
                          {product.stockQuantity !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Tồn kho:</span>
                              <span className="font-medium">{product.stockQuantity} sản phẩm</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-center"
                            onClick={() => handleViewDetails(product)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Xem chi tiết
                          </Button>

                          <Button
                            variant="default"
                            size="sm"
                            className="w-full justify-center bg-slate-900 text-white hover:bg-black"
                            onClick={() => {
                              setSelectedProductId(product.id);
                              setIsDetailDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Gửi yêu cầu sửa
                          </Button>

                          <Button
                            variant="default"
                            size="sm"
                            className={`w-full justify-center ${
                              product.isActive 
                                ? "bg-green-600 hover:bg-green-700 text-white" 
                                : "bg-red-600 hover:bg-red-700 text-white"
                            }`}
                            onClick={() => handleToggleProductVisibility(product)}
                            disabled={togglingVisibility === product.id}
                          >
                            {togglingVisibility === product.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang cập nhật...
                              </>
                            ) : product.isActive ? (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                Đã hiện sản phẩm
                              </>
                            ) : (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Đã ẩn sản phẩm
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-600">
                    Hiển thị {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredProducts.length)} 
                    trong tổng số {filteredProducts.length} sản phẩm
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Trước
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        if (pageNum > totalPages) return null;
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="update-requests" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Yêu cầu cập nhật sản phẩm</h2>
              <p className="text-sm text-gray-500 mt-1">
                Lọc theo trạng thái và nhà cung cấp
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchUpdateRequests} disabled={updateLoading}>
              {updateLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
              Làm mới
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-48">
                  <Select
                    value={updateStatusFilter}
                    onValueChange={(v) => {
                      setUpdateStatusFilter(v);
                      setUpdatePage(1);
                    }}
                  >
                    <SelectTrigger>
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="Pending">Chờ duyệt</SelectItem>
                      <SelectItem value="Approved">Đã duyệt</SelectItem>
                      <SelectItem value="Rejected">Từ chối</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Input
                    placeholder="Lọc theo vendorId (tuỳ chọn)"
                    value={updateVendorId}
                    onChange={(e) => {
                      setUpdateVendorId(e.target.value);
                      setUpdatePage(1);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {updateError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4 text-red-600 text-sm">
                {updateError}
              </CardContent>
            </Card>
          )}

          {updateLoading ? (
            <Card>
              <CardContent className="py-10 flex items-center justify-center text-gray-600">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Đang tải yêu cầu...
              </CardContent>
            </Card>
          ) : updateRequests.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-gray-600">
                Chưa có yêu cầu cập nhật nào.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Mã yêu cầu</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Mã sản phẩm</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Tên sản phẩm</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Vendor</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Trạng thái</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Ngày gửi</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {updateRequests.map((req) => (
                      <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">#{req.id}</td>
                        <td className="py-3 px-4 text-sm text-gray-800">
                          {req.productCode || (req.productSnapshot as any)?.productCode || req.productId}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-800">
                          {req.productName || (req.productSnapshot as any)?.productName || '—'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-800">
                          {req.vendorId ? (vendorNames[req.vendorId] || `Vendor #${req.vendorId}`) : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              req.status === 'Rejected'
                                ? 'secondary'
                                : req.status === 'Pending'
                                  ? 'secondary'
                                  : 'default'
                            }
                          >
                            {req.status === 'Approved'
                              ? 'Đã duyệt'
                              : req.status === 'Rejected'
                                ? 'Từ chối'
                                : req.status === 'Pending'
                                  ? 'Chờ duyệt'
                                  : req.status || 'Không rõ'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {formatDate(req.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(req);
                              setIsRequestDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Xem yêu cầu
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <ProductDetailDialog
        productId={selectedProductId}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        onProductUpdated={handleProductUpdated}
      />

      <ProductUpdateRequestDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        request={selectedRequest}
        onProcessed={() => {
          fetchUpdateRequests();
          setSelectedRequest(null);
        }}
      />
    </div>
  );
};