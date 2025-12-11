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
  AlertCircle,
  FileText,
  Eye,
  Download
} from "lucide-react";
import { 
  getProductById, 
  updateProductCommission,
  updateProduct,
  type Product,
  getMediaLinks,
  type Certificate,
  getProductRegistrations
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
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [reviews, setReviews] = useState<ProductReviewWithReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Commission rate form
  const [commissionRate, setCommissionRate] = useState<number>(0);
  const [updatingCommission, setUpdatingCommission] = useState(false);

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
      // CommissionRate trong database đã là % (10.00 = 10%), không cần convert
      setCommissionRate(productData.commissionRate || 0);
      setUnitPrice(productData.unitPrice || 0);

      // Load certificates for this product
      try {
        // Method 1: Tìm ProductRegistration ban đầu của product này để lấy certificates
        // Vì Product được tạo từ ProductRegistration đã approved
        const registrations = await getProductRegistrations();
        const relatedRegistration = registrations.find(
          reg => reg.proposedProductCode === productData.productCode && 
                 reg.status === 'Approved'
        );
        
        if (relatedRegistration && relatedRegistration.certificates && relatedRegistration.certificates.length > 0) {
          // Load media links cho mỗi certificate nếu files rỗng
          const certificatesWithFiles = await Promise.all(
            relatedRegistration.certificates.map(async (cert) => {
              if (cert.files && cert.files.length > 0) {
                return cert; // Đã có files, dùng luôn
              }
              // Nếu files rỗng, thử fetch từ media links với owner_type = 'product_certificates'
              try {
                const mediaLinks = await getMediaLinks('product_certificates', cert.id);
                const certLinks = mediaLinks.filter(link => 
                  link.purpose === 'ProductCertificatePdf' ||
                  link.purpose === 'productcertificatepdf' ||
                  link.purpose === 'certificatepdf' ||
                  link.purpose?.toLowerCase().includes('cert')
                );
                return {
                  ...cert,
                  files: certLinks.map(link => ({
                    id: link.id,
                    imagePublicId: link.imagePublicId,
                    imageUrl: link.imageUrl,
                    purpose: link.purpose || 'ProductCertificatePdf',
                    sortOrder: link.sortOrder || 0
                  }))
                };
              } catch (err) {
                console.log(`Could not fetch files for certificate ${cert.id}:`, err);
                return cert; // Giữ nguyên nếu không fetch được
              }
            })
          );
          setCertificates(certificatesWithFiles);
        } else {
          // Method 2: Fallback - thử lấy từ media links với product_registrations
          // Tìm registration ID từ product code
          if (relatedRegistration) {
            try {
              const mediaLinks = await getMediaLinks('product_registrations', relatedRegistration.id);
              const certLinks = mediaLinks.filter(link => 
                link.purpose === 'ProductCertificatePdf' ||
                link.purpose === 'productcertificatepdf' ||
                link.purpose === 'certificatepdf' ||
                link.purpose === 'certificate' || 
                link.purpose?.toLowerCase().includes('cert')
              );
              
              if (certLinks.length > 0) {
                // Tạo certificates từ media links
                const certNames = relatedRegistration.certificationName || [];
                const certCodes = relatedRegistration.certificationCode || [];
                setCertificates(certLinks.map((link, idx) => ({
                  id: idx,
                  productId: productId,
                  registrationId: relatedRegistration.id,
                  certificationCode: certCodes[idx] || '',
                  certificationName: certNames[idx] || `Chứng chỉ ${idx + 1}`,
                  status: 'Pending' as const,
                  uploadedAt: new Date().toISOString(),
                  verifiedAt: undefined,
                  verifiedBy: undefined,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  files: [{
                    id: link.id,
                    imagePublicId: link.imagePublicId,
                    imageUrl: link.imageUrl,
                    purpose: link.purpose || 'ProductCertificatePdf',
                    sortOrder: link.sortOrder || 0
                  }]
                })));
              }
            } catch (err) {
              console.log('Could not load certificates from media links:', err);
            }
          }
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
      // CommissionRate trong database đã là % (10.00 = 10%), không cần convert
      await updateProductCommission(productId, { commissionRate: commissionRate });
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
    if (!productId || unitPrice <= 0) {
      toast.error("Giá sản phẩm phải lớn hơn 0");
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-2xl">Chi tiết sản phẩm</DialogTitle>
          <DialogDescription>
            Thông tin chi tiết, chứng chỉ và đánh giá sản phẩm
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 flex-1">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : error ? (
          <div className="py-12 text-center flex-1">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : product ? (
          <div className="overflow-y-auto px-6 py-4 flex-1 min-h-0">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 h-12">
                <TabsTrigger value="info" className="text-base font-semibold">Thông tin</TabsTrigger>
                <TabsTrigger value="certificates" className="text-base font-semibold">Chứng chỉ ({certificates.length})</TabsTrigger>
                <TabsTrigger value="reviews" className="text-base font-semibold">Đánh giá ({reviews.length})</TabsTrigger>
              </TabsList>

              {/* Info Tab */}
              <TabsContent value="info" className="space-y-6 mt-0">
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
                      <span className="font-medium">{product.commissionRate.toFixed(2)}%</span>
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

              <Separator />

              {/* Unit Price Update */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">Cập nhật giá sản phẩm</h4>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label htmlFor="unitPrice">Giá sản phẩm (VNĐ)</Label>
                      <Input
                        id="unitPrice"
                        type="number"
                        min="0"
                        step="1000"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(Number(e.target.value))}
                        placeholder="Nhập giá sản phẩm"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleUpdatePrice}
                        disabled={updatingPrice}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {updatingPrice ? (
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
                  <p className="text-xs text-gray-500 mt-2">
                    Giá hiện tại: {currency(product.unitPrice)}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

                  {/* Reviews Tab */}
                  <TabsContent value="reviews" className="space-y-4 mt-0">
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

              {/* Certificates Tab */}
              <TabsContent value="certificates" className="space-y-4 mt-0">
                {certificates.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Không có chứng chỉ nào</p>
                    <p className="text-sm text-gray-400 mt-2">Sản phẩm này chưa có chứng chỉ được đăng tải</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {certificates.map((cert) => (
                      <Card key={cert.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            {/* Certificate Header */}
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Award className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                  <h4 className="text-base font-semibold text-gray-900 truncate">
                                    {cert.certificationName || `Chứng chỉ ${cert.id}`}
                                  </h4>
                                </div>
                                {cert.certificationCode && (
                                  <p className="text-sm text-gray-600 ml-7">
                                    <span className="font-medium">Mã:</span> {cert.certificationCode}
                                  </p>
                                )}
                                {(cert.status === 'Approved' || cert.status === 'Rejected') && (
                                  <div className="ml-7 mt-2">
                                    <Badge 
                                      variant={
                                        cert.status === 'Approved' ? 'default' : 
                                        'destructive'
                                      }
                                      className={
                                        cert.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                        'bg-red-100 text-red-800'
                                      }
                                    >
                                      {cert.status === 'Approved' ? 'Đã duyệt' : 'Đã từ chối'}
                                    </Badge>
                                  </div>
                                )}
                                {cert.rejectionReason && (
                                  <div className="ml-7 mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                    <span className="font-medium">Lý do từ chối:</span> {cert.rejectionReason}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Certificate Files */}
                            {cert.files && cert.files.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                  Tài liệu đính kèm ({cert.files.length})
                                </p>
                                <div className="space-y-2">
                                  {cert.files.map((file, fileIdx) => (
                                    <div 
                                      key={file.id || fileIdx} 
                                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                                    >
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                          <FileText className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-900 truncate">
                                            {file.imagePublicId || `Chứng chỉ ${fileIdx + 1}.pdf`}
                                          </p>
                                          <p className="text-xs text-gray-500 truncate">
                                            PDF Document
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => window.open(file.imageUrl, '_blank')}
                                          className="h-9 px-3"
                                          title="Xem chứng chỉ"
                                        >
                                          <Eye className="h-4 w-4 mr-1.5" />
                                          Xem
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = file.imageUrl;
                                            link.download = file.imagePublicId || `certificate-${file.id}.pdf`;
                                            link.click();
                                          }}
                                          className="h-9 px-3"
                                          title="Tải xuống"
                                        >
                                          <Download className="h-4 w-4 mr-1.5" />
                                          Tải
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
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
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

