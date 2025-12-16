import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import VendorSidebar from './VendorSidebar';
import VendorHeader from './VendorHeader';
import { 
  Search,
  Eye,
  Check,
  X,
  Clock,
  Loader2,
  Plus,
  Star,
  AlertCircle,
  FileText,
  Package,
  FileSpreadsheet,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router';
import { useState, useEffect, useCallback } from 'react';
import { getProductRegistrations, getProductRegistrationById, getAllProducts, getProductById, getMediaLinks, type Product } from '@/api/product';
import { getProductReviewsByProductId, type ProductReviewWithReply } from '@/api/productReview';
import type { ProductRegistration } from '@/api/product';
import { PATH_NAMES } from '@/constants';

const statusConfig = {
  Pending: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  Approved: { label: "Đã duyệt", color: "bg-green-100 text-green-800", icon: Check },
  Rejected: { label: "Từ chối", color: "bg-red-100 text-red-800", icon: X }
};


const RegistrationStatsCards = ({ registrations }: { registrations: ProductRegistration[] }) => {
  const totalRegistrations = registrations.length;
  const pendingCount = registrations.filter(r => r.status === 'Pending').length;
  const approvedCount = registrations.filter(r => r.status === 'Approved').length;
  const rejectedCount = registrations.filter(r => r.status === 'Rejected').length;

  const stats = [
    { label: "Tổng đơn đăng ký", value: totalRegistrations.toString(), icon: "📋", color: "bg-blue-50 text-blue-600" },
    { label: "Chờ duyệt", value: pendingCount.toString(), icon: "⏰", color: "bg-yellow-50 text-yellow-600" },
    { label: "Đã duyệt", value: approvedCount.toString(), icon: "✓", color: "bg-green-50 text-green-600" },
    { label: "Từ chối", value: rejectedCount.toString(), icon: "✗", color: "bg-red-50 text-red-600" }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ">
      {stats.map((stat, index) => (
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
  );
};

const RegistrationFilters = () => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <Select>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Tất cả trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trạng thái</SelectItem>
          <SelectItem value="pending">Chờ duyệt</SelectItem>
          <SelectItem value="approved">Đã duyệt</SelectItem>
          <SelectItem value="rejected">Từ chối</SelectItem>
        </SelectContent>
      </Select>

      <Select>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Tất cả danh mục" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả danh mục</SelectItem>
          <SelectItem value="biotech">Công nghệ sinh học</SelectItem>
          <SelectItem value="renewable">Năng lượng tái tạo</SelectItem>
          <SelectItem value="water">Xử lý nước</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex-1 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input 
            placeholder="Tìm kiếm đơn đăng ký..." 
            className="pl-10"
          />
        </div>
        <Button className="px-6">
          <Search size={20} />
        </Button>
      </div>
    </div>
  );
};

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, index) => (
    <Star
      key={index}
      className={`h-4 w-4 ${index < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
    />
  ));
};

// Helper function to parse images from ProductRegistration
const parseImagesFromRegistration = (registration: ProductRegistration): string[] => {
  // ✅ Ưu tiên 1: Backend trả về trong field productImages (từ HydrateMediaAsync)
  if (registration.productImages && Array.isArray(registration.productImages) && registration.productImages.length > 0) {
    return registration.productImages.map((item) => item.imageUrl).filter(Boolean);
  }

  // Fallback: Parse từ field images (nếu có)
  if (!registration.images) {
    return [];
  }

  // Trường hợp 1: images là string (CSV hoặc single URL)
  if (typeof registration.images === 'string') {
    return registration.images.split(',').map(url => url.trim()).filter(Boolean);
  }

  // Trường hợp 2: images là array of strings
  if (Array.isArray(registration.images)) {
    return registration.images.map((img: any) => {
      if (typeof img === 'string') {
        return img;
      } else if (img && typeof img === 'object' && img.imageUrl) {
        return img.imageUrl;
      }
      return null;
    }).filter(Boolean) as string[];
  }

  return [];
};

const RegistrationTable = ({ registrations, loading, onView }: { registrations: ProductRegistration[], loading: boolean, onView: (registration: ProductRegistration) => void }) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Danh sách đơn đăng ký</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Danh sách đơn đăng ký</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Hình ảnh</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Mã sản phẩm</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Tên sản phẩm</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Giá</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Trạng thái</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Ngày tạo</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Không có đơn đăng ký nào
                  </td>
                </tr>
              ) : (
                registrations.map((registration) => {
                  const statusInfo = statusConfig[registration.status];
                  const StatusIcon = statusInfo.icon;
                  const images = parseImagesFromRegistration(registration);
                  const firstImage = images.length > 0 ? images[0] : null;
                  
                  return (
                    <tr key={registration.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        {firstImage ? (
                          <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={firstImage}
                              alt={registration.proposedProductName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=No+Image';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-gray-900">{registration.proposedProductCode}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-gray-900">{registration.proposedProductName}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">{registration.description}</p>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {registration.unitPrice.toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={`${statusInfo.color} border-0`}>
                          <StatusIcon size={12} className="mr-1" />
                          {statusInfo.label}
                        </Badge>
                        {registration.status === 'Rejected' && registration.rejectionReason && (
                          <p className="text-xs text-red-600 mt-1">{registration.rejectionReason}</p>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-600">{formatDate(registration.createdAt)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" className="p-2" title="Xem chi tiết" onClick={() => onView(registration)}>
                            <Eye size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {registrations.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Hiển thị 1-{registrations.length} trong tổng số {registrations.length} đơn đăng ký
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">1</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const RegistrationManagementPage = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<ProductRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<ProductRegistration | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [productReviews, setProductReviews] = useState<ProductReviewWithReply[]>([]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProductRegistrations();
      setRegistrations(data);
    } catch (err: any) {
      console.error('Error fetching registrations:', err);
      
      // Hiển thị thông báo lỗi rõ ràng hơn
      let errorMessage = 'Không thể tải danh sách đơn đăng ký';
      
      if (err?.isBackendError) {
        errorMessage = err.message || errorMessage;
      } else if (err?.response?.data?.message) {
        const backendMsg = err.response.data.message;
        if (backendMsg.includes('registration_id') || backendMsg.includes('Unknown column')) {
          errorMessage = 'Lỗi cơ sở dữ liệu từ backend. Vui lòng liên hệ quản trị viên để sửa lỗi SQL trong ProductRegistrationRepository.LoadMediaAsync.';
        } else {
          errorMessage = backendMsg;
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const findMatchingProduct = useCallback(async (registration: ProductRegistration): Promise<Product | null> => {
    // Try to detect productId field if backend provides it
    const registrationAny = registration as any;
    const possibleProductId = registrationAny?.productId || registrationAny?.approvedProductId;
    if (possibleProductId) {
      try {
        const product = await getProductById(Number(possibleProductId));
        return product;
      } catch (err) {
        console.warn('Unable to fetch product by ID', err);
      }
    }

    // Fallback: fetch product list and find by product code
    try {
      const allProducts = await getAllProducts({ page: 1, pageSize: 500 });
      const matched = allProducts.find(
        (p) =>
          p.productCode?.toLowerCase() === registration.proposedProductCode.toLowerCase() ||
          p.productName?.toLowerCase() === registration.proposedProductName.toLowerCase()
      );
      return matched ?? null;
    } catch (err) {
      console.warn('Unable to fetch product list for matching', err);
      return null;
    }
  }, []);

  const loadProductExtras = useCallback(async (registration: ProductRegistration) => {
    setProductLoading(true);
    setProductError(null);
    setProductInfo(null);
    setProductReviews([]);

    try {
      const product = await findMatchingProduct(registration);
      setProductInfo(product);

      if (product) {
        const reviewRes = await getProductReviewsByProductId(product.id, 1, 20);
        if (reviewRes.status && reviewRes.data) {
          // Support both pagination structure (data.data) and simple array (data)
          const reviewsList = reviewRes.data.data || (Array.isArray(reviewRes.data) ? reviewRes.data : []);
          setProductReviews(reviewsList as ProductReviewWithReply[]);
        } else {
          setProductReviews([]);
        }
      }
    } catch (err: any) {
      setProductError(err?.message || 'Không thể tải thông tin sản phẩm thực tế');
    } finally {
      setProductLoading(false);
    }
  }, [findMatchingProduct]);

  const loadRegistrationDetail = useCallback(async (registration: ProductRegistration) => {
    setDetailLoading(true);
    setDetailError(null);
    setDetailData(null);

    try {
      const detail = await getProductRegistrationById(registration.id);
      
      // Debug: Log certificates data
      console.log('=== Registration Detail Certificates Debug ===');
      console.log('certificates:', detail.certificates);
      console.log('certificateFiles:', detail.certificateFiles);
      console.log('certificationCode:', detail.certificationCode);
      console.log('certificationName:', detail.certificationName);
      
      // Backend đã trả về certificates với files, nhưng cần kiểm tra và load files nếu thiếu
      if (detail.certificates && detail.certificates.length > 0) {
        // Load media links cho mỗi certificate nếu files rỗng hoặc thiếu
        detail.certificates = await Promise.all(
          detail.certificates.map(async (cert) => {
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
      } else {
        // Fallback: Nếu không có certificates từ backend, thử tạo từ các field khác
        // Fallback 1: Nếu có certificationCode và certificationName arrays, tạo certificates từ đó
        if (detail.certificationName && Array.isArray(detail.certificationName) && detail.certificationName.length > 0) {
          const certNames = detail.certificationName;
          const certCodes = detail.certificationCode && Array.isArray(detail.certificationCode) 
            ? detail.certificationCode 
            : [];
          
          // Nếu có certificateFiles, map với names
          if (detail.certificateFiles && Array.isArray(detail.certificateFiles) && detail.certificateFiles.length > 0) {
            detail.certificates = certNames.map((name, idx) => ({
              id: idx,
              productId: 0,
              registrationId: registration.id,
              certificationCode: certCodes[idx] || '',
              certificationName: name,
              status: 'Pending' as const,
              uploadedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              files: detail.certificateFiles ? detail.certificateFiles.filter((_, fileIdx) => fileIdx === idx) : []
            }));
          } else {
            // Chỉ có names, không có files
            detail.certificates = certNames.map((name, idx) => ({
              id: idx,
              productId: 0,
              registrationId: registration.id,
              certificationCode: certCodes[idx] || '',
              certificationName: name,
              status: 'Pending' as const,
              uploadedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              files: []
            }));
          }
        }
        // Fallback 2: thử lấy từ certificateFiles (backward compatibility)
        else if (detail.certificateFiles && Array.isArray(detail.certificateFiles) && detail.certificateFiles.length > 0) {
          detail.certificates = [{
            id: 0,
            productId: 0,
            registrationId: registration.id,
            certificationCode: '',
            certificationName: 'Chứng chỉ',
            status: 'Pending' as const,
            uploadedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            files: detail.certificateFiles
          }];
        } else {
          // Fallback 3: thử lấy từ media links với product_registrations
          try {
            const mediaLinks = await getMediaLinks('product_registrations', registration.id);
            const certLinks = mediaLinks.filter(link => 
              link.purpose === 'ProductCertificatePdf' ||
              link.purpose === 'productcertificatepdf' ||
              link.purpose === 'certificatepdf' ||
              link.purpose === 'certificate' || 
              link.purpose?.toLowerCase().includes('cert')
            );
          
            if (certLinks.length > 0) {
              detail.certificates = [{
                id: 0,
                productId: 0,
                registrationId: registration.id,
                certificationCode: '',
                certificationName: 'Chứng chỉ từ media links',
                status: 'Pending' as const,
                uploadedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                files: certLinks.map(link => ({
                  id: link.id,
                  imagePublicId: link.imagePublicId,
                  imageUrl: link.imageUrl,
                  purpose: link.purpose || 'ProductCertificatePdf',
                  sortOrder: link.sortOrder || 0
                }))
              }];
            }
          } catch (mediaErr) {
            console.log('Could not fetch certificates from media links:', mediaErr);
          }
        }
      }
      
      setDetailData(detail);
      await loadProductExtras(detail);
    } catch (err: any) {
      setDetailError(err?.response?.data?.message || err?.message || 'Không thể tải chi tiết đăng ký');
      setDetailData(registration);
    } finally {
      setDetailLoading(false);
    }
  }, [loadProductExtras]);

  const handleView = (registration: ProductRegistration) => {
    setDetailOpen(true);
    loadRegistrationDetail(registration);
  };

  const handleRegisterNewProduct = () => {
    navigate(PATH_NAMES.VENDOR_REGISTER_PRODUCT);
  };

  useEffect(() => {
    if (!detailOpen) {
      setDetailData(null);
      setDetailError(null);
      setProductInfo(null);
      setProductReviews([]);
      setProductError(null);
      setProductLoading(false);
      setDetailLoading(false);
    }
  }, [detailOpen]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <VendorSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <VendorHeader
          title="Quản lý đơn đăng ký"
          subtitle="Duyệt và quản lý các đơn đăng ký sản phẩm"
          rightContent={
            <div className="flex items-center space-x-4">
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={handleRegisterNewProduct}
              >
                <Plus size={20} className="mr-2" />
                Đăng ký sản phẩm thủ công
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate('/vendor/registrations/new-excel')}
              >
                <FileSpreadsheet size={20} className="mr-2" />
                Đăng ký bằng Excel
              </Button>
            </div>
          }
        />

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={fetchRegistrations}
              >
                Thử lại
              </Button>
            </div>
          )}
          <RegistrationStatsCards registrations={registrations} />
          <RegistrationFilters />
          <RegistrationTable registrations={registrations} loading={loading} onView={handleView} />

          <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Chi tiết đơn đăng ký</DialogTitle>
                <DialogDescription>
                  Thông tin đầy đủ về sản phẩm, chứng chỉ và phản hồi khách hàng
                </DialogDescription>
              </DialogHeader>

              {detailLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-600">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Đang tải chi tiết...
                </div>
              ) : detailError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <p className="text-sm text-red-600">{detailError}</p>
                </div>
              ) : detailData ? (
                <Tabs defaultValue="info" className="mt-4">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="info">Thông tin</TabsTrigger>
                    <TabsTrigger value="certs">Chứng chỉ</TabsTrigger>
                    <TabsTrigger value="reviews">
                      Đánh giá ({productReviews.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Mã sản phẩm đề xuất</p>
                        <p className="font-medium text-gray-900">{detailData.proposedProductCode}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tên sản phẩm đề xuất</p>
                        <p className="font-medium text-gray-900">{detailData.proposedProductName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Giá</p>
                        <p className="font-medium text-gray-900">{detailData.unitPrice.toLocaleString('vi-VN')} VNĐ</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Trạng thái</p>
                        <p className="font-medium text-gray-900">{detailData.status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Ngày tạo</p>
                        <p className="font-medium text-gray-900">{new Date(detailData.createdAt).toLocaleString('vi-VN')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Xếp hạng năng lượng</p>
                        <p className="font-medium text-gray-900">{detailData.energyEfficiencyRating || '-'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Bảo hành (tháng)</p>
                        <p className="font-medium text-gray-900">{detailData.warrantyMonths}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Khối lượng (kg)</p>
                        <p className="font-medium text-gray-900">{detailData.weightKg}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Kích thước (cm)</p>
                        <p className="font-medium text-gray-900">
                          {detailData.dimensionsCm 
                            ? `${detailData.dimensionsCm.Length ?? detailData.dimensionsCm.length ?? '-'} x ${detailData.dimensionsCm.Width ?? detailData.dimensionsCm.width ?? '-'} x ${detailData.dimensionsCm.Height ?? detailData.dimensionsCm.height ?? '-'}`
                            : '-'
                          }
                        </p>
                        <p className="text-xs text-gray-400 mt-1">(Dài x Rộng x Cao)</p>
                      </div>
                    </div>

                    {/* Product Images */}
                    {(() => {
                      const images = parseImagesFromRegistration(detailData);
                      return images.length > 0 ? (
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Hình ảnh sản phẩm</p>
                          <div className="grid grid-cols-3 gap-4">
                            {images.map((imageUrl, idx) => (
                              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                                <img
                                  src={imageUrl}
                                  alt={`${detailData.proposedProductName} ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}

                    <div>
                      <p className="text-sm text-gray-500">Mô tả</p>
                      <p className="text-gray-900 whitespace-pre-wrap">{detailData.description || '-'}</p>
                    </div>

                    {detailData.specifications && Object.keys(detailData.specifications).length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Thông số kỹ thuật</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.entries(detailData.specifications).map(([k, v]) => (
                            <div key={k} className="flex items-start justify-between gap-4 text-sm">
                              <span className="text-gray-600">{k}</span>
                              <span className="font-medium text-gray-900">{v as string}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="rounded-lg border p-4 bg-gray-50">
                      {productLoading ? (
                        <div className="flex items-center text-sm text-gray-600">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Đang tải thông tin sản phẩm đã duyệt...
                        </div>
                      ) : productError ? (
                        <div className="flex items-start gap-2 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4 mt-0.5" />
                          {productError}
                        </div>
                      ) : productInfo ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Hoa hồng đã được staff thiết lập</p>
                            <p className="text-2xl font-semibold text-green-600">
                              { (productInfo.commissionRate * 100).toFixed(2) }%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Mã sản phẩm thực tế</p>
                            <p className="text-lg font-semibold text-gray-900">{productInfo.productCode}</p>
                            <p className="text-sm text-gray-500">{productInfo.productName}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">
                          Sản phẩm chưa được duyệt nên chưa có thông tin hoa hồng.
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="certs" className="mt-6">
                    {(() => {
                      // Ưu tiên hiển thị certificates từ backend (cấu trúc mới)
                      const certificates = detailData.certificates || [];
                      // Fallback: certificateFiles (backward compatibility)
                      const certificateFiles = detailData.certificateFiles || [];
                      
                      if (certificates.length > 0) {
                        return (
                          <div className="space-y-4">
                            {certificates.map((cert, certIdx) => (
                              <div key={cert.id || certIdx} className="border border-gray-200 rounded-lg p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <FileText className="h-5 w-5 text-blue-600" />
                                      <p className="text-sm font-semibold text-gray-900">
                                        {cert.certificationName || `Chứng chỉ ${certIdx + 1}`}
                                      </p>
                                    </div>
                                    {cert.certificationCode && (
                                      <p className="text-xs text-gray-500 ml-7">Mã: {cert.certificationCode}</p>
                                    )}
                                    {(cert.status === 'Approved' || cert.status === 'Rejected') && (
                                      <div className="flex items-center gap-2 mt-2 ml-7">
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                          cert.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                          'bg-red-100 text-red-700'
                                        }`}>
                                          {cert.status === 'Approved' ? 'Đã duyệt' : 'Từ chối'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Certificate Files */}
                                {cert.files && cert.files.length > 0 && (
                                  <div className="ml-7 space-y-2">
                                    <p className="text-xs font-medium text-gray-600">Files ({cert.files.length}):</p>
                                    <div className="space-y-2">
                                      {cert.files.map((file, fileIdx) => (
                                        <div key={file.id || fileIdx} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-gray-600" />
                                            <span className="text-sm text-gray-700">
                                              {file.purpose || `File ${fileIdx + 1}`}
                                            </span>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => window.open(file.imageUrl, '_blank')}
                                            className="gap-1 h-7 text-xs"
                                          >
                                            <FileText className="h-3 w-3" />
                                            Xem/Tải
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      } else if (certificateFiles.length > 0) {
                        // Fallback: hiển thị certificateFiles
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {certificateFiles.map((cert, idx) => (
                              <div key={cert.id || idx} className="border rounded-lg p-4 flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {cert.purpose || `Chứng chỉ #${idx + 1}`}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">ID: {cert.id}</p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => window.open(cert.imageUrl, '_blank')} className="gap-2">
                                  <FileText className="h-4 w-4" />
                                  Xem
                                </Button>
                              </div>
                            ))}
                          </div>
                        );
                      } else {
                        return (
                          <div className="text-center py-12 text-gray-500">
                            <div className="flex flex-col items-center gap-3">
                              <span className="text-4xl">🏅</span>
                              <p>Không có chứng chỉ nào</p>
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-6">
                    {!productInfo ? (
                      <div className="text-center py-12 text-gray-500">
                        <p>Sản phẩm chưa được duyệt nên chưa có đánh giá.</p>
                      </div>
                    ) : productLoading ? (
                      <div className="flex items-center justify-center py-12 text-gray-600">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Đang tải đánh giá...
                      </div>
                    ) : productReviews.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <p>Chưa có đánh giá nào cho sản phẩm này.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {productReviews.map((review) => (
                          <Card key={review.id}>
                            <CardContent className="pt-6 space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    {renderStars(review.rating)}
                                    <span className="text-sm font-medium text-gray-700">{review.rating}/5</span>
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {review.customer?.fullName || `Khách hàng #${review.customerId}`}
                                  </p>
                                </div>
                                <span className="text-xs text-gray-400">
                                  {new Date(review.createdAt).toLocaleString('vi-VN')}
                                </span>
                              </div>
                              {review.comment && (
                                <p className="text-sm text-gray-700">{review.comment}</p>
                              )}
                              {review.images && review.images.length > 0 && (
                                <div className="flex gap-2 flex-wrap">
                                  {review.images.map((img, idx) => (
                                    <img
                                      key={idx}
                                      src={img.imageUrl}
                                      alt={`Review ${idx + 1}`}
                                      className="w-16 h-16 rounded object-cover border"
                                    />
                                  ))}
                                </div>
                              )}
                              {review.reply && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                                  <p className="font-medium">Phản hồi từ staff:</p>
                                  <p>{review.reply}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : null}

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>Đóng</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default RegistrationManagementPage;
