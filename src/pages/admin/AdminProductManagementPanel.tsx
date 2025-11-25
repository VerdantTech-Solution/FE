import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Eye, Loader2, Filter } from "lucide-react";
import { getAllProducts, type Product } from "@/api/product";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductDetailDialog } from "./components/ProductDetailDialog";

const currency = (v: number) => v.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

export const AdminProductManagementPanel: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const allProducts = await getAllProducts({ page: 1, pageSize: 1000 });
      // Lọc chỉ lấy sản phẩm đã được duyệt (isActive có thể là true hoặc false, nhưng Product đã là approved)
      // Vì Product là từ ProductRegistration đã được approved
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

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.productName.toLowerCase().includes(query) ||
          p.productCode.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    // Filter by status
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h2>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các sản phẩm đã được duyệt ({filteredProducts.length} sản phẩm)
          </p>
        </div>
      </div>

      {/* Filters */}
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

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
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
                        {product.isActive ? "Hoạt động" : "Ngừng"}
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
                          {currency(product.unitPrice)}
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
                      onClick={() => handleViewDetails(product)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Xem chi tiết
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
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

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        productId={selectedProductId}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        onProductUpdated={handleProductUpdated}
      />
    </div>
  );
};

