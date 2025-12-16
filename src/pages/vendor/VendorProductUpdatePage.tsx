import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import VendorSidebar from './VendorSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, Upload } from 'lucide-react';
import { createProductUpdateRequest, getProductById, type Product, type ProductImage } from '@/api/product';

type UpdateState = {
  productName: string;
  productCode: string;
  description: string;
  unitPrice: string;
  discountPercentage: string;
  energyEfficiencyRating: string;
  warrantyMonths: string;
  weightKg: string;
  width: string;
  height: string;
  length: string;
  specifications: string;
  manualFile: File | null;
  imagesToAdd: File[];
  imagesToDelete: number[];
};

const initialState: UpdateState = {
  productName: '',
  productCode: '',
  description: '',
  unitPrice: '',
  discountPercentage: '',
  energyEfficiencyRating: '',
  warrantyMonths: '',
  weightKg: '',
  width: '',
  height: '',
  length: '',
  specifications: '',
  manualFile: null,
  imagesToAdd: [],
  imagesToDelete: []
};

const VendorProductUpdatePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = useMemo(() => (id ? Number(id) : null), [id]);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<UpdateState>(initialState);

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

  const parseNumberOrNull = (value: string) => {
    if (!value) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const toggleDeleteImage = (imageId?: number) => {
    if (!imageId) return;
    setForm((prev) => {
      const exists = prev.imagesToDelete.includes(imageId);
      return {
        ...prev,
        imagesToDelete: exists
          ? prev.imagesToDelete.filter((id) => id !== imageId)
          : [...prev.imagesToDelete, imageId]
      };
    });
  };

  const handleSubmit = async () => {
    if (!productId) {
      setError('Không tìm thấy sản phẩm.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const dimensions =
        form.width || form.height || form.length
          ? {
              width: parseNumberOrNull(form.width),
              height: parseNumberOrNull(form.height),
              length: parseNumberOrNull(form.length)
            }
          : null;

      const specsObj =
        form.specifications.trim().length > 0
          ? (() => {
              try {
                const parsed = JSON.parse(form.specifications);
                return parsed && typeof parsed === 'object' ? parsed : null;
              } catch {
                return null;
              }
            })()
          : null;

      await createProductUpdateRequest({
        productId,
        productCode: form.productCode || null,
        productName: form.productName || null,
        description: form.description || null,
        unitPrice: parseNumberOrNull(form.unitPrice),
        discountPercentage: parseNumberOrNull(form.discountPercentage),
        energyEfficiencyRating: parseNumberOrNull(form.energyEfficiencyRating),
        specifications: specsObj,
        manualFile: form.manualFile,
        warrantyMonths: parseNumberOrNull(form.warrantyMonths),
        weightKg: parseNumberOrNull(form.weightKg),
        dimensionsCm: dimensions,
        imagesToAdd: form.imagesToAdd.length > 0 ? form.imagesToAdd : null,
        imagesToDelete: form.imagesToDelete.length > 0 ? form.imagesToDelete : null
      });

      setSuccess('Đã gửi yêu cầu cập nhật sản phẩm.');
      setForm(initialState);
    } catch (err: any) {
      setError(err?.message || 'Không thể gửi yêu cầu cập nhật.');
    } finally {
      setSubmitting(false);
    }
  };

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
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cập nhật sản phẩm</h1>
              <p className="text-gray-600">Gửi yêu cầu cập nhật cho nhân viên duyệt</p>
            </div>
          </div>
          {statusBadge()}
        </header>

        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {success}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Thông tin hiện tại</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Đang tải...
                </div>
              ) : product ? (
                <div className="space-y-2 text-sm text-gray-700">
                  <div><span className="font-semibold">Mã:</span> {product.productCode}</div>
                  <div><span className="font-semibold">Tên:</span> {product.productName}</div>
                  <div><span className="font-semibold">Giá:</span> {new Intl.NumberFormat('vi-VN').format(product.unitPrice)} ₫</div>
                  <div><span className="font-semibold">Giảm giá:</span> {product.discountPercentage ?? 0}%</div>
                  <div><span className="font-semibold">Kho:</span> {product.stockQuantity ?? 0}</div>
                  <div><span className="font-semibold">Năng lượng:</span> {product.energyEfficiencyRating ?? 'N/A'}</div>
                  <div><span className="font-semibold">Bảo hành:</span> {product.warrantyMonths ?? 0} tháng</div>
                  <div><span className="font-semibold">Cân nặng:</span> {product.weightKg ?? 0} kg</div>
                </div>
              ) : (
                <p className="text-gray-700">Không tìm thấy sản phẩm.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gửi yêu cầu cập nhật</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Chỉ nhập những trường cần cập nhật. Trường bỏ trống sẽ gửi giá trị <code>null</code>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Mã sản phẩm</label>
                  <Input
                    value={form.productCode}
                    placeholder={product?.productCode || 'Mã hiện tại'}
                    onChange={(e) => setForm((f) => ({ ...f, productCode: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Tên sản phẩm</label>
                  <Input
                    value={form.productName}
                    placeholder={product?.productName || 'Tên hiện tại'}
                    onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Giá</label>
                  <Input
                    type="number"
                    value={form.unitPrice}
                    placeholder={product ? String(product.unitPrice) : 'Giá hiện tại'}
                    onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Giảm giá (%)</label>
                  <Input
                    type="number"
                    value={form.discountPercentage}
                    placeholder={product ? String(product.discountPercentage ?? 0) : 'Giảm giá hiện tại'}
                    onChange={(e) => setForm((f) => ({ ...f, discountPercentage: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Năng lượng (0-5)</label>
                  <Input
                    type="number"
                    value={form.energyEfficiencyRating}
                    placeholder={product ? String(product.energyEfficiencyRating ?? '') : '0-5'}
                    onChange={(e) => setForm((f) => ({ ...f, energyEfficiencyRating: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Bảo hành (tháng)</label>
                  <Input
                    type="number"
                    value={form.warrantyMonths}
                    placeholder={product ? String(product.warrantyMonths ?? 0) : 'Tháng'}
                    onChange={(e) => setForm((f) => ({ ...f, warrantyMonths: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Cân nặng (kg)</label>
                  <Input
                    type="number"
                    value={form.weightKg}
                    placeholder={product ? String(product.weightKg ?? 0) : 'Kg'}
                    onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Mô tả</label>
                  <Textarea
                    value={form.description}
                    placeholder={product?.description || 'Mô tả hiện tại'}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Chiều rộng (cm)</label>
                  <Input
                    type="number"
                    value={form.width}
                    placeholder={product?.dimensionsCm?.width?.toString() || ''}
                    onChange={(e) => setForm((f) => ({ ...f, width: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Chiều cao (cm)</label>
                  <Input
                    type="number"
                    value={form.height}
                    placeholder={product?.dimensionsCm?.height?.toString() || ''}
                    onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Chiều dài (cm)</label>
                  <Input
                    type="number"
                    value={form.length}
                    placeholder={product?.dimensionsCm?.length?.toString() || ''}
                    onChange={(e) => setForm((f) => ({ ...f, length: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Specifications (JSON)</label>
                <Textarea
                  value={form.specifications}
                  placeholder='Ví dụ: {"Màu":"Vàng","Công suất":"100W"}'
                  onChange={(e) => setForm((f) => ({ ...f, specifications: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">File hướng dẫn sử dụng</label>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setForm((f) => ({ ...f, manualFile: file }));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Thêm ảnh mới</label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files ? Array.from(e.target.files) : [];
                      setForm((f) => ({ ...f, imagesToAdd: files }));
                    }}
                  />
                </div>
              </div>

              {/* Ảnh hiện tại của sản phẩm - chọn ảnh cần xóa */}
              {Array.isArray(product?.images) && product!.images.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Ảnh hiện tại (tick vào ảnh cần xóa)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {product!.images.map((img: ProductImage | string, idx) => {
                      const url = typeof img === 'string' ? img : img.imageUrl;
                      const imgId = typeof img === 'string' ? undefined : img.id;
                      const marked = imgId ? form.imagesToDelete.includes(imgId) : false;

                      return (
                        <label
                          key={idx}
                          className={`relative block rounded-md border overflow-hidden cursor-pointer bg-white ${
                            marked ? 'ring-2 ring-red-400' : ''
                          }`}
                        >
                          {imgId && (
                            <input
                              type="checkbox"
                              className="absolute top-2 left-2 z-10"
                              checked={marked}
                              onChange={() => toggleDeleteImage(imgId)}
                            />
                          )}
                          <img src={url} alt={`image-${idx}`} className="w-full h-32 object-cover" />
                          {imgId && marked && (
                            <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center text-white text-xs font-semibold">
                              Sẽ xóa
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button onClick={handleSubmit} disabled={submitting || !productId}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Gửi yêu cầu cập nhật
                </Button>
                {submitting && <span className="text-sm text-gray-600">Đang gửi...</span>}
              </div>

             
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default VendorProductUpdatePage;

