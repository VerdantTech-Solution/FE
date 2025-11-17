import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      const response = await getProductReviewsByProductId(productId);
      if (response.data) {
        setReviews(response.data as ProductReviewWithReply[]);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="aspect-video w-full bg-gray-100 rounded-lg overflow-hidden mb-4">
                    {getProductImageUrl(product.images) ? (
                      <img
                        src={getProductImageUrl(product.images)}
                        alt={product.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
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

              <Separator />

              {/* Commission Rate Update */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-gray-900">Cập nhật hoa hồng</h4>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label htmlFor="commissionRate">Hoa hồng (%)</Label>
                      <Input
                        id="commissionRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(Number(e.target.value))}
                        placeholder="Nhập % hoa hồng"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleUpdateCommission}
                        disabled={updatingCommission}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {updatingCommission ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Đang cập nhật...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Cập nhật
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
  );
};

