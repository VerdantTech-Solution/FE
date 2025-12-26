import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import VendorSidebar from './VendorSidebar';
import VendorHeader from './VendorHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertCircle, 
  ArrowLeft, 
  Loader2,
  Package,
  Star,
  FileText,
  Eye,
  MessageSquare
} from 'lucide-react';
import { 
  getProductById, 
  type Product, 
  getMediaLinks,
  type Certificate,
  getProductRegistrations,
  getProductCertificatesByProductId
} from '@/api/product';
import { 
  getProductReviewsByProductId, 
  type ProductReviewWithReply
} from '@/api/productReview';

const currency = (v: number) => v.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, index) => (
    <Star
      key={index}
      className={`h-4 w-4 ${index < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
    />
  ));
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const VendorProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = useMemo(() => (id ? Number(id) : null), [id]);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("info");
  
  // Additional data
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [reviews, setReviews] = useState<ProductReviewWithReply[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

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
        
        // Load certificates
        loadCertificates(productId, data.productCode);
        
        // Load reviews
        loadReviews(productId);
        
      } catch (err: any) {
        setError(err?.message || 'Không thể tải thông tin sản phẩm.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const loadCertificates = async (pId: number, productCode: string) => {
    try {
      // Sử dụng API chính thức để lấy certificates theo productId
      const productCertificates = await getProductCertificatesByProductId(pId);
      if (productCertificates && productCertificates.length > 0) {
        setCertificates(productCertificates);
      } else {
        // Fallback: Thử tìm từ ProductRegistration nếu không có certificates trực tiếp
        const registrations = await getProductRegistrations();
        const relatedRegistration = registrations.find(
          reg => reg.proposedProductCode === productCode && 
                 reg.status === 'Approved'
        );
        
        if (relatedRegistration) {
          // Thử lấy từ media links với product_registrations
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
                productId: pId,
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
  };

  const loadReviews = async (pId: number) => {
    try {
      setLoadingReviews(true);
      const response = await getProductReviewsByProductId(pId, 1, 20);
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

  const statusBadge = () => {
    if (!product) return null;
    const status = (product as any)?.status;
    
    // Ưu tiên hiển thị trạng thái duyệt
    if (status === 'Rejected') return <Badge variant="destructive">Từ chối</Badge>;
    if (status === 'Pending') return <Badge variant="secondary">Chờ duyệt</Badge>;
    
    // Nếu đã duyệt, hiển thị trạng thái active/inactive
    return (
      <Badge
        variant={product.isActive ? "default" : "secondary"}
        className={product.isActive ? "bg-green-100 text-green-800" : ""}
      >
        {product.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
      </Badge>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <VendorSidebar />

      <div className="flex-1 flex flex-col ml-64">
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

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : product ? (
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-8 h-14 bg-slate-100 p-1 rounded-xl">
                    <TabsTrigger value="info" className="text-lg font-bold border-2 border-transparent data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:border-green-600 data-[state=active]:shadow-md rounded-lg transition-all duration-200">Thông tin</TabsTrigger>
                    <TabsTrigger value="certificates" className="text-lg font-bold border-2 border-transparent data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:border-green-600 data-[state=active]:shadow-md rounded-lg transition-all duration-200">Chứng chỉ</TabsTrigger>
                    <TabsTrigger value="reviews" className="text-lg font-bold border-2 border-transparent data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:border-green-600 data-[state=active]:shadow-md rounded-lg transition-all duration-200">Đánh giá</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-6 mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-1">
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
                              <span className="font-medium">{product.commissionRate?.toFixed(2) || 0}%</span>
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
                            {product.warrantyMonths !== undefined && (
                              <div className="flex justify-between">
                                {product.warrantyMonths > 0 ? (
                                  <>
                                    <span className="text-gray-600">Thời gian bảo hành:</span>
                                    <span className="font-medium">{product.warrantyMonths} tháng</span>
                                  </>
                                ) : (
                                  <span className="font-medium text-gray-500">Sản phẩm không được bảo hành</span>
                                )}
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

                    {product.manualUrls && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Tài liệu hướng dẫn</h4>
                        <Button variant="outline" size="sm" className="border-2" asChild>
                          <a href={product.manualUrls} target="blank" rel="noopener noreferrer">
                            <FileText className="w-4 h-4 mr-2" />
                            Xem hướng dẫn sử dụng
                          </a>
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="certificates" className="space-y-6 mt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Chứng chỉ sản phẩm</h3>
                      </div>
                      
                      {certificates.length > 0 ? (
                        <div className="grid gap-4">
                          {certificates.map((cert) => (
                            <div key={cert.id} className="border rounded-lg p-4 flex items-start justify-between">
                              <div className="flex gap-4">
                                <div className="p-2 bg-blue-50 rounded-lg h-fit">
                                  <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{cert.certificationName}</h4>
                                  <p className="text-sm text-gray-500 mb-1">Mã: {cert.certificationCode}</p>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={cert.status === 'Approved' ? 'default' : 'secondary'}>
                                      {cert.status === 'Approved' ? 'Đã xác minh' : 'Chờ xác minh'}
                                    </Badge>
                                    <span className="text-xs text-gray-400">
                                      Cập nhật: {formatDate(cert.updatedAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {cert.files && cert.files.length > 0 && (
                                  <Button variant="outline" size="sm" className="border-2" asChild>
                                    <a href={cert.files[0].imageUrl} target="_blank" rel="noopener noreferrer">
                                      <Eye className="w-4 h-4 mr-1" />
                                      Xem
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          <FileText className="w-12 h-12 text-gray-300 mb-3" />
                          <p className="text-gray-500 font-medium text-lg">Không có chứng chỉ</p>
                          <p className="text-gray-400 text-sm mt-1">Sản phẩm này chưa được cập nhật chứng chỉ nào</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="reviews" className="space-y-6 mt-0">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Đánh giá từ khách hàng</h3>
                      
                      {loadingReviews ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                      ) : reviews.length > 0 ? (
                        <div className="space-y-4">
                          {reviews.map((review) => (
                            <div key={review.id} className="border rounded-lg p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="font-semibold text-gray-600">
                                      {review.customer?.fullName ? review.customer.fullName.charAt(0).toUpperCase() : 'U'}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="font-medium">{review.customer?.fullName || 'Người dùng ẩn danh'}</div>
                                    <div className="text-xs text-gray-500">{formatDate(review.createdAt)}</div>
                                  </div>
                                </div>
                                <div className="flex">{renderStars(review.rating)}</div>
                              </div>
                              
                              <p className="text-gray-700 text-sm">{review.comment}</p>
                              
                              {review.reply && (
                                <div className="bg-gray-50 p-3 rounded-md mt-2 ml-4 border-l-2 border-primary">
                                  <div className="flex items-center gap-2 mb-1">
                                    <MessageSquare className="w-3 h-3 text-primary" />
                                    <span className="text-xs font-semibold text-primary">Phản hồi từ cửa hàng</span>
                                    {review.repliedAt && (
                                      <span className="text-xs text-gray-400">• {formatDate(review.repliedAt)}</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">{review.reply}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                          <p className="text-gray-500 font-medium text-lg">Không có đánh giá</p>
                          <p className="text-gray-400 text-sm mt-1">Sản phẩm này chưa có đánh giá nào từ khách hàng</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Không tìm thấy sản phẩm.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default VendorProductDetailPage;

