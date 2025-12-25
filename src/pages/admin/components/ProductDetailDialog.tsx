import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Star, 
  DollarSign, 
  MessageSquare, 
  Loader2, 
  Award,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { 
  getProductById, 
  updateProductCommission,
  updateProduct,
  type Product,
  getMediaLinks,
  type MediaLinkItemDTO
} from "@/api/product";
import { 
  getProductReviewsByProductId, 
  type ProductReviewWithReply
} from "@/api/productReview";
import { toast } from "sonner";

const currency = (v: number) => v.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, index) => (
    <Star
      key={index}
      className={`h-4 w-4 ${index < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
    />
  ));
};

interface ProductDetailDialogProps {
  productId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated?: () => void;
}

export const ProductDetailDialog: React.FC<ProductDetailDialogProps> = ({
  productId,
  open,
  onOpenChange,
  onProductUpdated
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [certificates, setCertificates] = useState<MediaLinkItemDTO[]>([]);
  const [reviews, setReviews] = useState<ProductReviewWithReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Commission rate form
  const [commissionRate, setCommissionRate] = useState<number>(0);
  const [updatingCommission, setUpdatingCommission] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // Unit price form
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [updatingPrice, setUpdatingPrice] = useState(false);

  useEffect(() => {
    if (open && productId) {
      loadProductDetails();
      loadReviews();
    } else {
      // Reset state when dialog closes
      setProduct(null);
      setCertificates([]);
      setReviews([]);
      setCommissionRate(0);
      setUnitPrice(0);
      setError(null);
    }
  }, [open, productId]);

  const loadProductDetails = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      setError(null);

      // Load product
      const productData = await getProductById(productId);
      setProduct(productData);
      // Convert decimal to percentage for display (0.05 -> 5)
      const commissionRatePercent = productData.commissionRate 
        ? productData.commissionRate * 100 
        : 0;
      setCommissionRate(commissionRatePercent);
      setUnitPrice(productData.unitPrice || 0);

      // Try to load product registration to get certificates
      try {
        // We need to find the registration ID - this might need to be passed or fetched differently
        // For now, we'll try to get certificates via MediaLinks
        const mediaLinks = await getMediaLinks('products', productId);
        const certLinks = mediaLinks.filter(link => link.purpose === 'certificate' || link.purpose?.includes('cert'));
        if (certLinks.length > 0) {
          setCertificates(certLinks.map(link => ({
            id: link.id,
            imagePublicId: link.imagePublicId,
            imageUrl: link.imageUrl,
            purpose: link.purpose || 'certificate',
            sortOrder: link.sortOrder || 0
          })));
        }
      } catch (err) {
        console.log('Could not load certificates:', err);
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Không thể tải thông tin sản phẩm";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    if (!productId) return;

    try {
      setLoadingReviews(true);
      const response = await getProductReviewsByProductId(productId, 1, 20);
      if (response.status && response.data) {
        // Support both pagination structure (data.data) and simple array (data)
        const reviewsList = response.data.data || (Array.isArray(response.data) ? response.data : []);
        setReviews(reviewsList as ProductReviewWithReply[]);
      }
    } catch (err: any) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleUpdateCommission = async () => {
    if (!productId || commissionRate < 0 || commissionRate > 100) {
      toast.error("Hoa hồng phải từ 0 đến 100%");
      return;
    }

    try {
      setUpdatingCommission(true);
      // Convert percentage to decimal (5% = 0.05) for API
      const commissionRateDecimal = commissionRate / 100;
      await updateProductCommission(productId, { commissionRate: commissionRateDecimal });
      toast.success("Cập nhật hoa hồng thành công!");
      await loadProductDetails();
      onProductUpdated?.();
    } catch (err: any) {
      const errorMessage = err?.message || "Không thể cập nhật hoa hồng";
      toast.error(errorMessage);
    } finally {
      setUpdatingCommission(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!productId || unitPrice < 0) {
      toast.error("Giá sản phẩm không hợp lệ");
      return;
    }

    try {
      setUpdatingPrice(true);
      await updateProduct(productId, { unitPrice: unitPrice });
      toast.success("Cập nhật giá thành công!");
      await loadProductDetails();
      onProductUpdated?.();
    } catch (err: any) {
      const errorMessage = err?.message || "Không thể cập nhật giá";
      toast.error(errorMessage);
    } finally {
      setUpdatingPrice(false);
    }
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

  if (!productId) return null;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-w-[95vw] w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết sản phẩm</DialogTitle>
          <DialogDescription>
            Thông tin chi tiết, chứng chỉ và đánh giá sản phẩm
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : product ? (
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Thông tin</TabsTrigger>
              <TabsTrigger value="certificates">Chứng chỉ</TabsTrigger>
              <TabsTrigger value="reviews">Đánh giá ({reviews.length})</TabsTrigger>
            </TabsList>

            {/* Info Tab */}
            <TabsContent value="info" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div 
                    className="aspect-video w-full bg-gray-100 rounded-lg overflow-hidden mb-4 cursor-pointer group relative"
                    onClick={() => setIsImageZoomed(true)}
                  >
                    {getProductImageUrl(product.images) ? (
                      <>
                        <img
                          src={getProductImageUrl(product.images)}
                          alt={product.productName}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="bg-white/90 text-gray-800 text-xs font-medium px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                            Click để xem ảnh lớn
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="lg:col-span-2 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{product.productName}</h3>
                      <p className="text-sm text-gray-500">Mã: {product.productCode}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Giá:</span>
                        <span className="font-semibold text-green-600 text-lg">
                          {currency(product.unitPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trạng thái:</span>
                        <Badge
                          variant={product.isActive ? "default" : "secondary"}
                          className={product.isActive ? "bg-green-100 text-green-800" : ""}
                        >
                          {product.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hoa hồng hiện tại:</span>
                        <span className="font-medium">{(product.commissionRate * 100).toFixed(2)}%</span>
                      </div>
                      {product.stockQuantity !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tồn kho:</span>
                          <span className="font-medium">{product.stockQuantity}</span>
                        </div>
                      )}
                      {product.soldCount !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Đã bán:</span>
                          <span className="font-medium">{product.soldCount}</span>
                        </div>
                      )}
                      {product.ratingAverage !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Đánh giá:</span>
                          <div className="flex items-center gap-1">
                            {renderStars(product.ratingAverage)}
                            <span className="ml-1 font-medium">{product.ratingAverage.toFixed(1)}/5</span>
                          </div>
                        </div>
                      )}
                      {product.warrantyMonths && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bảo hành:</span>
                          <span className="font-medium">{product.warrantyMonths} tháng</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {product.description && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Mô tả</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{product.description}</p>
                </div>
              )}

              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Thông số kỹ thuật</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between border-b pb-1">
                        <span className="text-gray-600">{key}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Commission Rate Update */}
                <div className="border rounded-lg p-4 bg-gray-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <h4 className="font-semibold text-gray-900 text-sm">Cập nhật hoa hồng</h4>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        id="commissionRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className="h-9 text-sm"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(Number(e.target.value))}
                        placeholder="% hoa hồng"
                      />
                    </div>
                    <Button
                      onClick={handleUpdateCommission}
                      disabled={updatingCommission}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 h-9 px-3"
                    >
                      {updatingCommission ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Lưu
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Unit Price Update */}
                <div className="border rounded-lg p-4 bg-gray-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold text-gray-900 text-sm">Cập nhật giá</h4>
                  </div>
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input
                        id="unitPrice"
                        type="number"
                        min="0"
                        step="1000"
                        className="h-9 text-sm"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(Number(e.target.value))}
                        placeholder="Giá sản phẩm"
                      />
                      <p className="text-[10px] text-gray-500 mt-1 truncate">Hiện tại: {currency(product.unitPrice)}</p>
                    </div>
                    <Button
                      onClick={handleUpdatePrice}
                      disabled={updatingPrice}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 h-9 px-3"
                    >
                      {updatingPrice ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Lưu
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates" className="space-y-4 mt-6">
              {certificates.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Không có chứng chỉ nào</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {certificates.map((cert) => (
                    <Card key={cert.id}>
                      <CardContent className="pt-6">
                        <div className="aspect-video w-full bg-gray-100 rounded-lg overflow-hidden mb-3">
                          <img
                            src={cert.imageUrl}
                            alt="Chứng chỉ"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <p className="text-sm text-gray-600">Chứng chỉ #{cert.id}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-4 mt-6">
              {loadingReviews ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Chưa có đánh giá nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center gap-1">
                                  {renderStars(review.rating)}
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                  {review.rating}/5
                                </span>
                              </div>
                              {review.customer && (
                                <p className="text-sm text-gray-600 mb-1">
                                  {review.customer.fullName || `Khách hàng #${review.customer.id}`}
                                </p>
                              )}
                              <p className="text-xs text-gray-500">
                                {formatDate(review.createdAt)}
                              </p>
                            </div>
                          </div>

                          {review.comment && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {review.comment}
                              </p>
                            </div>
                          )}

                          {review.images && review.images.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {review.images.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img.imageUrl}
                                  alt={`Review image ${idx + 1}`}
                                  className="w-20 h-20 object-cover rounded-md border"
                                />
                              ))}
                            </div>
                          )}

                          {(review as ProductReviewWithReply).reply && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-green-800 mb-1">
                                    Phản hồi từ staff:
                                  </p>
                                  <p className="text-sm text-green-700 whitespace-pre-wrap">
                                    {(review as ProductReviewWithReply).reply}
                                  </p>
                                  {(review as ProductReviewWithReply).repliedAt && (
                                    <p className="text-xs text-green-600 mt-1">
                                      {formatDate((review as ProductReviewWithReply).repliedAt!)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>

    <Dialog open={isImageZoomed} onOpenChange={setIsImageZoomed}>
      <DialogContent className="max-w-[90vw] h-[90vh] p-0 border-none bg-transparent shadow-none flex items-center justify-center z-[9999] [&>button]:hidden">
         <div className="relative w-full h-full flex items-center justify-center outline-none" onClick={() => setIsImageZoomed(false)}>
            {product && getProductImageUrl(product.images) && (
              <img 
                src={getProductImageUrl(product.images)} 
                alt={product.productName} 
                className="max-w-full max-h-full object-contain rounded-md"
              />
            )}
         </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

