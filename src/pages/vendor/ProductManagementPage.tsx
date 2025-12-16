import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import VendorSidebar from './VendorSidebar';
import VendorHeader from './VendorHeader';
import { useAuth } from '@/contexts/AuthContext';
import {
  getProductsByVendor,
  getProductUpdateRequests,
  type Product,
  type PaginatedResponse,
  type ProductUpdateRequest,
} from '@/api/product';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Package, Search, Eye, Filter, RefreshCcw, Pencil, ClipboardList } from 'lucide-react';
import { ProductUpdateRequestDialog } from '../staff/components/ProductUpdateRequestDialog';

const currency = (v: number) => v.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const ProductManagementPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const vendorId = useMemo(() => {
    if (!user?.id) return null;
    return typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
  }, [user]);

  const [productsPaged, setProductsPaged] = useState<PaginatedResponse<Product> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  // Tab state
  const [activeTab, setActiveTab] = useState<'products' | 'update-requests'>('products');

  // Product update requests state
  const [updateRequests, setUpdateRequests] = useState<ProductUpdateRequest[]>([]);
  const [updateRequestsLoading, setUpdateRequestsLoading] = useState(false);
  const [updateRequestsError, setUpdateRequestsError] = useState<string | null>(null);
  const [updateRequestsPage, setUpdateRequestsPage] = useState(1);
  const [updateRequestsPageSize] = useState(10);
  const [updateRequestsTotalRecords, setUpdateRequestsTotalRecords] = useState(0);
  const [updateStatusFilter, setUpdateStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');

  // Dialog state for viewing update request detail
  const [selectedRequest, setSelectedRequest] = useState<ProductUpdateRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const canLoad = vendorId !== null && !Number.isNaN(vendorId);

  const fetchProducts = async () => {
    if (!canLoad) {
      setError('Không tìm thấy thông tin nhà cung cấp. Vui lòng đăng nhập lại.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const resp = await getProductsByVendor(vendorId!, { page, pageSize });
      setProductsPaged(resp);
    } catch (err: any) {
      const message =
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tải danh sách sản phẩm.';
      setError(message);
      console.error('Error fetching vendor products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId, page, pageSize]);

  const fetchUpdateRequests = async () => {
    if (!canLoad) {
      setUpdateRequestsError('Không tìm thấy thông tin nhà cung cấp. Vui lòng đăng nhập lại.');
      return;
    }

    try {
      setUpdateRequestsLoading(true);
      setUpdateRequestsError(null);

      const statusParam = updateStatusFilter === 'all' ? undefined : updateStatusFilter;

      const resp = await getProductUpdateRequests({
        page: updateRequestsPage,
        pageSize: updateRequestsPageSize,
        status: statusParam,
        vendorId: vendorId ?? undefined,
      });

      setUpdateRequests(resp.data || []);
      setUpdateRequestsTotalRecords(resp.totalRecords || 0);
    } catch (err: any) {
      const message =
        err?.response?.data?.errors?.join(', ') ||
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tải danh sách yêu cầu cập nhật sản phẩm.';
      setUpdateRequestsError(message);
      console.error('Error fetching product update requests:', err);
    } finally {
      setUpdateRequestsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'update-requests') {
      fetchUpdateRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, vendorId, updateRequestsPage, updateRequestsPageSize, updateStatusFilter]);

  const allProducts: Product[] = useMemo(() => {
    if (!productsPaged?.data) return [];

    let result = productsPaged.data;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.productName.toLowerCase().includes(q) ||
          p.productCode.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
      );
    }

    if (statusFilter === 'active') {
      result = result.filter((p) => p.isActive === true);
    } else if (statusFilter === 'inactive') {
      result = result.filter((p) => p.isActive === false);
    }

    return result;
  }, [productsPaged, searchQuery, statusFilter]);

  const handleViewDetail = (productId: number) => {
    navigate(`/vendor/products/${productId}`);
  };

  const handleUpdateProduct = (productId: number) => {
    navigate(`/vendor/products/${productId}/update`);
  };

  const totalPages = productsPaged?.totalPages || 1;

  const updateRequestsTotalPages =
    updateRequestsTotalRecords > 0 ? Math.ceil(updateRequestsTotalRecords / updateRequestsPageSize) : 1;

  const renderUpdateRequestStatus = (status?: string) => {
    const normalized = status || 'Unknown';
    let variant: 'default' | 'secondary' | 'outline' = 'secondary';
    let label = normalized;

    if (normalized === 'Approved') {
      variant = 'default';
      label = 'Đã duyệt';
    } else if (normalized === 'Rejected') {
      variant = 'outline';
      label = 'Từ chối';
    } else if (normalized === 'Pending') {
      variant = 'secondary';
      label = 'Chờ duyệt';
    }

    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleViewUpdateRequest = (req: ProductUpdateRequest) => {
    setSelectedRequest(req);
    setDialogOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <VendorSidebar />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <VendorHeader
          title="Quản lý sản phẩm"
          subtitle="Quản lý sản phẩm và các yêu cầu cập nhật từ nhà cung cấp"
          showNotification={false}
        />

        <div className="space-y-6 p-6">

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'products' | 'update-requests')}>
            <TabsList className="mb-4">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Tất cả sản phẩm
              </TabsTrigger>
              <TabsTrigger value="update-requests" className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Yêu cầu update sản phẩm
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Tìm theo tên, mã, mô tả..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                          }}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="w-full sm:w-48">
                      <Select
                        value={statusFilter}
                        onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}
                      >
                        <SelectTrigger>
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          <SelectItem value="active">Đang bán</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button variant="outline" onClick={fetchProducts} disabled={loading}>
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCcw className="w-4 h-4 mr-2" />
                      )}
                      Làm mới
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-4 text-sm text-red-700">{error}</CardContent>
                </Card>
              )}

              {loading && !productsPaged ? (
                <div className="flex items-center justify-center min-h-[200px] text-gray-600">
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Đang tải danh sách sản phẩm...
                </div>
              ) : allProducts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-600 space-y-3">
                    <Package className="w-10 h-10 mx-auto text-gray-400" />
                    <p>Hiện tại bạn chưa có sản phẩm nào.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {allProducts.map((product) => (
                      <Card
                        key={product.id}
                        className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                      >
                        <CardHeader className="pb-3">
                          <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100">
                            {product.image || product.publicUrl ? (
                              <img
                                src={
                                  product.image ||
                                  product.publicUrl ||
                                  (Array.isArray(product.images) && product.images.length > 0
                                    ? (product.images[0] as any).imageUrl || (product.images[0] as any)
                                    : undefined)
                                }
                                alt={product.productName}
                                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-10 w-10 text-gray-300" />
                              </div>
                            )}
                          </div>

                          <CardTitle className="line-clamp-2 text-base font-semibold text-gray-900">
                            {product.productName}
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="flex flex-1 flex-col justify-between space-y-3 text-sm">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Mã sản phẩm</span>
                              <span className="font-medium text-gray-900">{product.productCode}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Giá bán</span>
                              <span className="text-base font-semibold text-emerald-600">
                                {currency(product.unitPrice)}
                              </span>
                            </div>
                            {typeof product.stockQuantity === 'number' && (
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Tồn kho</span>
                                <span className="font-medium text-gray-900">{product.stockQuantity}</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-center border-gray-300 text-gray-800 hover:bg-gray-50"
                              onClick={() => handleViewDetail(product.id)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Xem chi tiết
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full justify-center bg-gray-900 text-white hover:bg-black"
                              onClick={() => handleUpdateProduct(product.id)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Gửi yêu cầu sửa
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                      <span>
                        Trang {page} / {totalPages}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1 || loading}
                        >
                          Trước
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages || loading}
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
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ClipboardList className="w-4 h-4" />
                      <span>Danh sách yêu cầu cập nhật sản phẩm của bạn</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                      <Select
                        value={updateStatusFilter}
                        onValueChange={(v) =>
                          setUpdateStatusFilter(v as 'all' | 'Pending' | 'Approved' | 'Rejected')
                        }
                      >
                        <SelectTrigger className="w-44">
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

                      <Button
                        variant="outline"
                        onClick={fetchUpdateRequests}
                        disabled={updateRequestsLoading}
                      >
                        {updateRequestsLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCcw className="w-4 h-4 mr-2" />
                        )}
                        Làm mới
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {updateRequestsError && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-4 text-sm text-red-700">{updateRequestsError}</CardContent>
                </Card>
              )}

              {updateRequestsLoading && updateRequests.length === 0 ? (
                <div className="flex items-center justify-center min-h-[200px] text-gray-600">
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Đang tải danh sách yêu cầu cập nhật...
                </div>
              ) : updateRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-600 space-y-3">
                    <ClipboardList className="w-10 h-10 mx-auto text-gray-400" />
                    <p>Hiện tại bạn chưa có yêu cầu cập nhật sản phẩm nào.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-xs text-gray-500">
                              <th className="py-2 px-2 text-left">Mã yêu cầu</th>
                              <th className="py-2 px-2 text-left">Sản phẩm</th>
                              <th className="py-2 px-2 text-left">Trạng thái</th>
                              <th className="py-2 px-2 text-left">Ngày gửi</th>
                              <th className="py-2 px-2 text-left">Ngày xử lý</th>
                              <th className="py-2 px-2 text-right">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {updateRequests.map((req) => (
                              <tr key={req.id} className="border-b last:border-0">
                                <td className="py-2 px-2 font-mono text-xs text-gray-700">
                                  #{req.id}
                                </td>
                                <td className="py-2 px-2">
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-gray-900 line-clamp-1">
                                      {req.productSnapshot?.productName ||
                                        req.productName ||
                                        `Sản phẩm #${req.productId}`}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      Mã:{' '}
                                      {req.productSnapshot?.productCode ||
                                        req.productCode ||
                                        req.productId}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2 px-2">
                                  {renderUpdateRequestStatus(req.status)}
                                </td>
                                <td className="py-2 px-2 text-xs text-gray-700">
                                  {req.createdAt
                                    ? new Date(req.createdAt).toLocaleString('vi-VN', {
                                        timeZone: 'Asia/Ho_Chi_Minh',
                                      })
                                    : '—'}
                                </td>
                                <td className="py-2 px-2 text-xs text-gray-700">
                                  {req.processedAt
                                    ? new Date(req.processedAt).toLocaleString('vi-VN', {
                                        timeZone: 'Asia/Ho_Chi_Minh',
                                      })
                                    : '—'}
                                </td>
                                <td className="py-2 px-2 text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                    onClick={() => handleViewUpdateRequest(req)}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Xem chi tiết
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {updateRequestsTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                      <span>
                        Trang {updateRequestsPage} / {updateRequestsTotalPages}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setUpdateRequestsPage((p) => Math.max(1, p - 1))
                          }
                          disabled={updateRequestsPage === 1 || updateRequestsLoading}
                        >
                          Trước
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setUpdateRequestsPage((p) =>
                              Math.min(updateRequestsTotalPages, p + 1),
                            )
                          }
                          disabled={
                            updateRequestsPage === updateRequestsTotalPages ||
                            updateRequestsLoading
                          }
                        >
                          Sau
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <ProductUpdateRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        request={selectedRequest}
        mode="vendor"
      />
    </div>
  );
};

export default ProductManagementPage;

