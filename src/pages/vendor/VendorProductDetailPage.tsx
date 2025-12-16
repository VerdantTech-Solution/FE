import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import VendorSidebar from './VendorSidebar';
import VendorHeader from './VendorHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { getProductById, type Product, type ProductImage } from '@/api/product';

const VendorProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = useMemo(() => (id ? Number(id) : null), [id]);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError('Không tìm thấy sản phẩm.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getProductById(productId);
        setProduct(data);
      } catch (err: any) {
        setError(err?.message || 'Không thể tải thông tin sản phẩm.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const statusBadge = () => {
    const status = (product as any)?.status as string | undefined;
    if (status === 'Rejected') return <Badge variant="secondary">Từ chối</Badge>;
    if (status === 'Pending') return <Badge variant="secondary">Chờ duyệt</Badge>;
    if (status === 'Approved') return <Badge>Đã duyệt</Badge>;
    if (product?.isActive === false) return <Badge variant="secondary">Ngừng bán</Badge>;
    return <Badge>Đang bán</Badge>;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <VendorSidebar />

      <div className="flex-1 flex flex-col">
        <VendorHeader
          title="Chi tiết sản phẩm"
          subtitle="Xem thông tin sản phẩm đã được duyệt"
          rightContent={
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Quay lại
              </Button>
              {statusBadge()}
            </div>
          }
        />

        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Thông tin sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Đang tải...
                </div>
              ) : product ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="w-full rounded-lg overflow-hidden border bg-white">
                      <img
                        src={
                          product.image ||
                          product.publicUrl ||
                          (Array.isArray(product.images) && product.images.length > 0
                            ? (product.images[0] as any).imageUrl || product.images[0]
                            : 'https://placehold.co/400')
                        }
                        alt={product.productName}
                        className="w-full h-64 object-cover"
                      />
                    </div>
                    <div className="space-y-1 text-sm text-gray-700">
                      <div><span className="font-semibold">Mã:</span> {product.productCode}</div>
                      <div><span className="font-semibold">Tên:</span> {product.productName}</div>
                      <div><span className="font-semibold">Giá:</span> {new Intl.NumberFormat('vi-VN').format(product.unitPrice)} ₫</div>
                      <div><span className="font-semibold">Giảm giá:</span> {product.discountPercentage ?? 0}%</div>
                      <div><span className="font-semibold">Kho:</span> {product.stockQuantity ?? 0}</div>
                      <div><span className="font-semibold">Năng lượng:</span> {product.energyEfficiencyRating ?? 'N/A'}</div>
                      <div><span className="font-semibold">Bảo hành:</span> {product.warrantyMonths ?? 0} tháng</div>
                      <div><span className="font-semibold">Cân nặng:</span> {product.weightKg ?? 0} kg</div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Mô tả</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{product.description || '—'}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Thông số kỹ thuật</h3>
                      {product.specifications && Object.keys(product.specifications).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(product.specifications).map(([key, val]) => (
                            <div key={key} className="rounded-md border px-3 py-2 bg-gray-50 text-sm">
                              <div className="font-semibold text-gray-800">{key}</div>
                              <div className="text-gray-700">{val}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-700">Chưa có thông số.</p>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Hình ảnh</h3>
                      {Array.isArray(product.images) && product.images.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {product.images.map((img: ProductImage | string, idx) => {
                            const url = typeof img === 'string' ? img : img.imageUrl;
                            return (
                              <div
                                key={idx}
                                className="relative block rounded-md border overflow-hidden bg-white"
                              >
                                <img src={url} alt={`image-${idx}`} className="w-full h-32 object-cover" />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-700">Chưa có hình ảnh.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700">Không tìm thấy sản phẩm.</p>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default VendorProductDetailPage;

