import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BadgeCheck, CheckCircle2, CircleDashed, Filter, Search, Users, Loader2, Eye, FileText, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getProductRegistrations, 
  updateProductRegistrationStatus,
  getMediaLinks,
  getProductRegistrationById,
  getAllProducts,
  type ProductRegistration,
  type MediaLink
} from "@/api/product";
import { ProductDetailDialog } from "./components/ProductDetailDialog";

type ProductStatus = "Pending" | "Approved" | "Rejected" | "all";

export interface WarehouseStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface WarehousePanelProps {
  onStatsChange?: (stats: WarehouseStats) => void;
}

export const WarehousePanel: React.FC<WarehousePanelProps> = ({ onStatsChange }) => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<ProductStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [registrations, setRegistrations] = useState<ProductRegistration[]>([]);
  const [mediaLinksMap, setMediaLinksMap] = useState<Map<number, MediaLink[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Detail dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRegistrationDetail, setSelectedRegistrationDetail] = useState<ProductRegistration | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<{ url: string; name: string } | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  
  // Product detail dialog states
  const [productDetailDialogOpen, setProductDetailDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [resultAlert, setResultAlert] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: "success" | "error";
  }>({
    open: false,
    title: "",
    description: "",
    variant: "success",
  });

  // Parse images từ ProductRegistration response
  const parseImagesFromRegistration = (registration: ProductRegistration): MediaLink[] => {
    // ✅ Ưu tiên 1: Backend trả về trong field productImages (từ HydrateMediaAsync)
    if (registration.productImages && Array.isArray(registration.productImages) && registration.productImages.length > 0) {
      return registration.productImages.map((item) => ({
        id: item.id,
        ownerType: 'product_registrations',
        ownerId: registration.id,
        imageUrl: item.imageUrl,
        imagePublicId: item.imagePublicId,
        purpose: item.purpose,
        sortOrder: item.sortOrder ?? 0
      })) as MediaLink[];
    }

    // Fallback: Parse từ field images (nếu có)
    if (!registration.images) {
      return [];
    }

    // Trường hợp 1: images là string (CSV hoặc single URL)
    if (typeof registration.images === 'string') {
      const urls = registration.images.split(',').map(url => url.trim()).filter(Boolean);
      return urls.map((url, index) => ({
        id: index + 1,
        ownerType: 'product_registrations',
        ownerId: registration.id,
        imageUrl: url,
        imagePublicId: '',
        sortOrder: index
      }));
    }

    // Trường hợp 2: images là array of strings
    if (Array.isArray(registration.images) && registration.images.length > 0) {
      if (typeof registration.images[0] === 'string') {
        return (registration.images as string[]).map((url, index) => ({
          id: index + 1,
          ownerType: 'product_registrations',
          ownerId: registration.id,
          imageUrl: url,
          imagePublicId: '',
          sortOrder: index
        }));
      }

      // Trường hợp 3: images là array of objects (ProductImage hoặc MediaLink)
      if (typeof registration.images[0] === 'object') {
        return (registration.images as any[]).map((item, index) => {
          // Nếu đã là MediaLink format
          if (item.imageUrl && item.ownerId) {
            return item as MediaLink;
          }
          // Nếu là ProductImage format
          if (item.imageUrl) {
            return {
              id: item.id || index + 1,
              ownerType: 'product_registrations',
              ownerId: registration.id,
              imageUrl: item.imageUrl,
              imagePublicId: item.imagePublicId || '',
              purpose: item.purpose,
              sortOrder: item.sortOrder ?? index
            } as MediaLink;
          }
          return null;
        }).filter(Boolean) as MediaLink[];
      }
    }

    return [];
  };

  // Fetch media links cho một registration
  const fetchMediaLinksForRegistration = async (registrationId: number, registration?: ProductRegistration) => {
    // Ưu tiên 1: Parse từ registration object nếu có
    if (registration) {
      const parsedImages = parseImagesFromRegistration(registration);
      if (parsedImages.length > 0) {
        return parsedImages;
      }
    }

    // Ưu tiên 2: Thử lấy từ ProductRegistration detail
    try {
      const { getProductRegistrationById } = await import('@/api/product');
      const registrationDetail = await getProductRegistrationById(registrationId);
      
      // Parse images từ detail
      const parsedImages = parseImagesFromRegistration(registrationDetail);
      if (parsedImages.length > 0) {
        return parsedImages;
      }
      
      // Kiểm tra xem detail có chứa media links trong các field khác không
      // Backend có thể trả về productImages hoặc các field khác
      const possibleFields = ['productImages', 'ProductImages', 'mediaLinks', 'media_links', 'imageUrls'];
      for (const field of possibleFields) {
        if ((registrationDetail as any)[field] && Array.isArray((registrationDetail as any)[field])) {
          const links = (registrationDetail as any)[field];
          // Kiểm tra xem có phải là MediaLink format không
          if (links.length > 0 && links[0].imageUrl) {
            // Nếu là MediaLinkItemDTO format từ backend, map sang MediaLink
            if (field === 'productImages' || field === 'ProductImages') {
              return links.map((item: any) => ({
                id: item.id,
                ownerType: 'product_registrations',
                ownerId: registrationId,
                imageUrl: item.imageUrl,
                imagePublicId: item.imagePublicId || '',
                purpose: item.purpose,
                sortOrder: item.sortOrder ?? 0
              })) as MediaLink[];
            }
            return links as MediaLink[];
          }
        }
      }
    } catch (err) {
      // Không log để tránh spam console
    }
    
    // Ưu tiên 3: Thử lấy từ MediaLinks API
    // Chỉ thử với owner_type = 'product_registrations' (đúng format từ database)
    try {
      const mediaLinks = await getMediaLinks('product_registrations', registrationId);
      if (mediaLinks && mediaLinks.length > 0) {
        return mediaLinks;
      }
    } catch (err) {
      // Không log để tránh spam console
    }
    
    return [];
  };

  // Fetch registrations và media links từ API
  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProductRegistrations();
      setRegistrations(data);
      
      // Fetch media links cho tất cả registrations (chỉ khi cần)
      const mediaLinksMap = new Map<number, MediaLink[]>();
      
      // Fetch song song để tăng tốc độ
      const mediaLinksPromises = data.map(async (reg) => {
        // Truyền registration object để parse images field trước
        const links = await fetchMediaLinksForRegistration(reg.id, reg);
        if (links.length > 0) {
          mediaLinksMap.set(reg.id, links);
        }
        return { id: reg.id, links };
      });
      
      await Promise.all(mediaLinksPromises);
      setMediaLinksMap(mediaLinksMap);
    } catch (err: any) {
      console.error('Error fetching product registrations:', err);
      
      // Hiển thị thông báo lỗi rõ ràng hơn
      let errorMessage = 'Có lỗi xảy ra khi tải danh sách đăng ký sản phẩm';
      
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

  // Get unique categories from registrations
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    registrations.forEach(reg => {
      // You might need to fetch category name from categoryId
      categorySet.add(`Category ${reg.categoryId}`);
    });
    return Array.from(categorySet);
  }, [registrations]);

  const stats = useMemo<WarehouseStats>(() => {
    const total = registrations.length;
    const pending = registrations.filter((p) => p.status === "Pending").length;
    const approved = registrations.filter((p) => p.status === "Approved").length;
    const rejected = registrations.filter((p) => p.status === "Rejected").length;
    return { total, pending, approved, rejected };
  }, [registrations]);

  useEffect(() => {
    onStatsChange?.(stats);
  }, [stats, onStatsChange]);

  const filtered = useMemo(() => {
    return registrations.filter((reg) => {
      // Status filter
      if (statusFilter !== "all" && reg.status !== statusFilter) return false;
      
      // Category filter
      if (categoryFilter !== "all") {
        const regCategory = `Category ${reg.categoryId}`;
        if (regCategory !== categoryFilter) return false;
      }
      
      // Search filter
      if (search.trim()) {
        const searchLower = search.toLowerCase();
        const matchesName = reg.proposedProductName?.toLowerCase().includes(searchLower);
        const matchesCode = reg.proposedProductCode?.toLowerCase().includes(searchLower);
        const matchesDesc = reg.description?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesCode && !matchesDesc) return false;
      }
      
      return true;
    });
  }, [registrations, statusFilter, categoryFilter, search]);

  // Handle approve
  const handleApprove = async (id: number) => {
    if (!user?.id) {
      setResultAlert({
        open: true,
        title: "Không thể duyệt",
        description: "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.",
        variant: "error",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await updateProductRegistrationStatus(id, {
        status: 'Approved',
        approvedBy: parseInt(user.id),
      });
      
      // Refresh data
      await fetchRegistrations();
      setResultAlert({
        open: true,
        title: "Duyệt thành công",
        description: "Đăng ký sản phẩm đã được duyệt thành công.",
        variant: "success",
      });
    } catch (err: any) {
      console.error('Error approving registration:', err);
      setResultAlert({
        open: true,
        title: "Không thể duyệt",
        description: err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi duyệt đăng ký',
        variant: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reject - open dialog
  const handleRejectClick = (id: number) => {
    setSelectedRegistrationId(id);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  // Handle reject - submit
  const handleRejectSubmit = async () => {
    if (!selectedRegistrationId || !user?.id) {
      setResultAlert({
        open: true,
        title: "Không thể từ chối",
        description: "Không tìm thấy thông tin cần thiết.",
        variant: "error",
      });
      return;
    }

    if (!rejectionReason.trim()) {
      setResultAlert({
        open: true,
        title: "Thiếu lý do",
        description: "Vui lòng nhập lý do từ chối.",
        variant: "error",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await updateProductRegistrationStatus(selectedRegistrationId, {
        status: 'Rejected',
        rejectionReason: rejectionReason.trim(),
        approvedBy: parseInt(user.id),
      });
      
      // Refresh data
      await fetchRegistrations();
      setRejectDialogOpen(false);
      setSelectedRegistrationId(null);
      setRejectionReason("");
      setResultAlert({
        open: true,
        title: "Đã từ chối",
        description: "Đăng ký sản phẩm đã bị từ chối thành công.",
        variant: "success",
      });
    } catch (err: any) {
      console.error('Error rejecting registration:', err);
      setResultAlert({
        open: true,
        title: "Không thể từ chối",
        description: err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi từ chối đăng ký',
        variant: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle view details
  const handleViewDetails = async (id: number) => {
    setDetailDialogOpen(true);
    setLoadingDetail(true);
    setDetailError(null);
    setSelectedRegistrationDetail(null);
    
    try {
      const detail = await getProductRegistrationById(id);
      
      // Backend đã trả về certificates, nhưng vẫn giữ fallback nếu cần
      if (!detail.certificates || detail.certificates.length === 0) {
        // Fallback: thử lấy từ certificateFiles (backward compatibility)
        if (detail.certificateFiles && detail.certificateFiles.length > 0) {
          detail.certificates = [{
            id: 0,
            productId: 0,
            registrationId: id,
            certificationCode: '',
            certificationName: 'Chứng chỉ',
            status: 'Pending' as const,
            uploadedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            files: detail.certificateFiles
          }];
        } else {
          // Fallback: thử lấy từ media links
          try {
            const mediaLinks = await getMediaLinks('product_registrations', id);
            const certLinks = mediaLinks.filter(link => 
              link.purpose === 'certificatepdf' || 
              link.purpose === 'certificate' || 
              link.purpose?.toLowerCase().includes('cert')
            );
            
            if (certLinks.length > 0) {
              detail.certificates = [{
                id: 0,
                productId: 0,
                registrationId: id,
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
                  purpose: link.purpose || 'certificatepdf',
                  sortOrder: link.sortOrder || 0
                }))
              }];
            }
          } catch (mediaErr) {
            console.log('Could not fetch certificates from media links:', mediaErr);
          }
        }
      }
      
      setSelectedRegistrationDetail(detail);
    } catch (err: any) {
      console.error('Error fetching registration detail:', err);
      setDetailError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tải chi tiết đăng ký');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Lấy images từ media links
  const getImagesFromMediaLinks = (registrationId: number): string[] => {
    const mediaLinks = mediaLinksMap.get(registrationId);
    if (!mediaLinks || mediaLinks.length === 0) {
      return [];
    }
    
    // Sắp xếp theo sortOrder nếu có, sau đó lấy imageUrl
    const sortedLinks = [...mediaLinks].sort((a, b) => {
      const orderA = a.sortOrder ?? 0;
      const orderB = b.sortOrder ?? 0;
      return orderA - orderB;
    });
    
    return sortedLinks.map(link => link.imageUrl).filter(Boolean);
  };

  return (
    <div className="w-full">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Chờ duyệt</p>
              <p className="text-2xl font-semibold">{stats.pending}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
              <CircleDashed className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Đã duyệt</p>
              <p className="text-2xl font-semibold">{stats.approved}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Từ chối</p>
              <p className="text-2xl font-semibold">{stats.rejected}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <BadgeCheck className="h-5 w-5 rotate-45" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tổng cộng</p>
              <p className="text-2xl font-semibold">{stats.total}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchRegistrations} className="mt-2 bg-red-600 hover:bg-red-700" size="sm">
            Thử lại
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProductStatus)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="Pending">Chờ duyệt</SelectItem>
            <SelectItem value="Approved">Đã duyệt</SelectItem>
            <SelectItem value="Rejected">Từ chối</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tất cả danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative w-full sm:w-80">
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Bộ lọc
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mt-6 flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Đang tải...</span>
        </div>
      )}

      {/* Cards list */}
      {!loading && (
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              Không có đăng ký sản phẩm nào
            </div>
          ) : (
            filtered.map((reg) => {
              // Lấy images từ media links
              const images = getImagesFromMediaLinks(reg.id);
              console.log(`Registration ${reg.id} - Images from media links:`, images);
              
              const isProcessed = reg.status !== 'Pending';
              
              return (
                <Card key={reg.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      <CardTitle className="text-base font-semibold line-clamp-1">
                        {reg.proposedProductName}
                      </CardTitle>
                      {reg.status === "Pending" && (
                        <span className="ml-2 text-xs rounded bg-yellow-100 text-yellow-700 px-2 py-0.5">
                          Chờ duyệt
                        </span>
                      )}
                      {reg.status === "Approved" && (
                        <span className="ml-2 text-xs rounded bg-green-100 text-green-700 px-2 py-0.5">
                          Đã duyệt
                        </span>
                      )}
                      {reg.status === "Rejected" && (
                        <span className="ml-2 text-xs rounded bg-red-100 text-red-700 px-2 py-0.5">
                          Từ chối
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Images */}
                    <div className="grid grid-cols-3 gap-2">
                      {images.length > 0 ? (
                        images.slice(0, 3).map((src, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="h-20 rounded-md overflow-hidden bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                            onClick={() => {
                              setImagePreview({ url: src, name: reg.proposedProductName ?? `Image ${idx + 1}` });
                              setImageDialogOpen(true);
                            }}
                          >
                            <img
                              src={src}
                              alt={`${reg.proposedProductName} ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error(`Failed to load image ${idx} for registration ${reg.id}:`, src);
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                              }}
                            />
                          </button>
                        ))
                      ) : (
                        // Hiển thị placeholder nếu không có images
                        <>
                          {[0, 1, 2].map((idx) => (
                            <div key={idx} className="h-20 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                              <span className="text-xs text-gray-400">No Image</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                    
                    {/* Description */}
                    <div className="text-sm text-gray-600 line-clamp-3">
                      {reg.description || 'Không có mô tả'}
                    </div>
                    
                    {/* Details */}
                    <div className="grid grid-cols-2 text-sm gap-x-6 gap-y-1">
                      <div className="text-gray-500">Mã sản phẩm</div>
                      <div className="font-medium">{reg.proposedProductCode}</div>
                      <div className="text-gray-500">Giá</div>
                      <div className="font-medium">{formatPrice(reg.unitPrice)}</div>
                      <div className="text-gray-500">Danh mục</div>
                      <div className="font-medium">Category {reg.categoryId}</div>
                    </div>
                    
                    {/* Rejection reason if rejected */}
                    {reg.status === "Rejected" && reg.rejectionReason && (
                      <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                        <strong>Lý do từ chối:</strong> {reg.rejectionReason}
                      </div>
                    )}
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-xs text-gray-500">
                        Gửi lúc: {formatDate(reg.createdAt)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(reg.id)}
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(reg.id)}
                          disabled={isProcessed || isProcessing}
                        >
                          {isProcessing && selectedRegistrationId === reg.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Duyệt'
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectClick(reg.id)}
                          disabled={isProcessed || isProcessing}
                        >
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối đăng ký sản phẩm</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối đăng ký sản phẩm này
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Lý do từ chối *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Nhập lý do từ chối..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                disabled={isProcessing}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
                setSelectedRegistrationId(null);
              }}
              disabled={isProcessing}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận từ chối'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="!max-w-[70vw] w-[70vw] sm:!max-w-[70vw] sm:w-[95vw] max-h-[95vh] h-[95vh] p-6 overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">Chi tiết đăng ký sản phẩm</DialogTitle>
            <DialogDescription>
              Xem tất cả thông tin chi tiết của sản phẩm đăng ký
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Đang tải chi tiết...</span>
            </div>
          ) : detailError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{detailError}</p>
            </div>
          ) : selectedRegistrationDetail ? (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Trạng thái:</span>
                {selectedRegistrationDetail.status === "Pending" && (
                  <span className="text-xs rounded bg-yellow-100 text-yellow-700 px-2 py-1">
                    Chờ duyệt
                  </span>
                )}
                {selectedRegistrationDetail.status === "Approved" && (
                  <span className="text-xs rounded bg-green-100 text-green-700 px-2 py-1">
                    Đã duyệt
                  </span>
                )}
                {selectedRegistrationDetail.status === "Rejected" && (
                  <span className="text-xs rounded bg-red-100 text-red-700 px-2 py-1">
                    Từ chối
                  </span>
                )}
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Tên sản phẩm</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRegistrationDetail.proposedProductName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Mã sản phẩm</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-sm text-gray-900">{selectedRegistrationDetail.proposedProductCode}</p>
                    {selectedRegistrationDetail.status === "Approved" && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-blue-600 hover:text-blue-800 text-sm"
                        onClick={async () => {
                          try {
                            // Tìm product từ productCode
                            const products = await getAllProducts({ page: 1, pageSize: 1000 });
                            const product = products.find(
                              p => p.productCode === selectedRegistrationDetail.proposedProductCode
                            );
                            if (product) {
                              setSelectedProductId(product.id);
                              setProductDetailDialogOpen(true);
                            } else {
                              alert("Không tìm thấy sản phẩm đã được duyệt với mã này");
                            }
                          } catch (err) {
                            console.error("Error finding product:", err);
                            alert("Có lỗi xảy ra khi tìm sản phẩm");
                          }
                        }}
                      >
                        {/* Xem chi tiết sản phẩm → */}
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Giá</Label>
                  <p className="mt-1 text-sm text-gray-900 font-semibold">{formatPrice(selectedRegistrationDetail.unitPrice)}</p>
                </div>
                {/* <div>
                  <Label className="text-sm font-medium text-gray-700">Danh mục</Label>
                  <p className="mt-1 text-sm text-gray-900"> {selectedRegistrationDetail.categoryId}</p>
                </div> */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Bảo hành</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRegistrationDetail.warrantyMonths} tháng</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Trọng lượng</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRegistrationDetail.weightKg} kg</p>
                </div>
                {selectedRegistrationDetail.dimensionsCm && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Kích thước (cm)</Label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedRegistrationDetail.dimensionsCm.Width ?? selectedRegistrationDetail.dimensionsCm.width ?? '-'} x {' '}
                      {selectedRegistrationDetail.dimensionsCm.Height ?? selectedRegistrationDetail.dimensionsCm.height ?? '-'} x {' '}
                      {selectedRegistrationDetail.dimensionsCm.Length ?? selectedRegistrationDetail.dimensionsCm.length ?? '-'}
                    </p>
                  </div>
                )}
                {selectedRegistrationDetail.energyEfficiencyRating && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Mức tiết kiệm năng lượng</Label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRegistrationDetail.energyEfficiencyRating}</p>
                  </div>
                )}
              </div>

              {/* Description and Specifications - Side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Description */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Mô tả</Label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {selectedRegistrationDetail.description || 'Không có mô tả'}
                  </p>
                </div>

                {/* Specifications */}
                {selectedRegistrationDetail.specifications && Object.keys(selectedRegistrationDetail.specifications).length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Thông số kỹ thuật</Label>
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {Object.entries(selectedRegistrationDetail.specifications).map(([key, value]) => (
                        <div key={key} className="flex gap-2 text-sm">
                          <span className="text-gray-600 font-medium text-xs w-24 truncate">{key}:</span>
                          <span className="text-gray-900 flex-1 text-xs">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Product Images */}
              {(() => {
                const detailImages = selectedRegistrationDetail.productImages || [];
                const parsedImages = parseImagesFromRegistration(selectedRegistrationDetail);
                const allImages = detailImages.length > 0 
                  ? detailImages.map(img => img.imageUrl)
                  : parsedImages.map(img => img.imageUrl);
                
                return allImages.length > 0 ? (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Hình ảnh sản phẩm ({allImages.length})</Label>
                    <div className="grid grid-cols-4 gap-3">
                      {allImages.map((src, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={src}
                            alt={`${selectedRegistrationDetail.proposedProductName} ${idx + 1}`}
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

              {/* Certificates */}
              {selectedRegistrationDetail.certificates && selectedRegistrationDetail.certificates.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Giấy chứng nhận ({selectedRegistrationDetail.certificates.length})
                  </Label>
                  <div className="space-y-3">
                    {selectedRegistrationDetail.certificates.map((cert, certIdx) => (
                      <div key={cert.id || certIdx} className="border border-gray-200 rounded-lg p-3 space-y-2">
                        {/* Certificate Header */}
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
                            {cert.status === 'Rejected' && cert.rejectionReason && (
                              <div className="flex items-center gap-2 mt-2 ml-7">
                                <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                                  Từ chối
                                </span>
                                <p className="text-xs text-red-600">Lý do: {cert.rejectionReason}</p>
                              </div>
                            )}
                            {cert.status === 'Approved' && (
                              <div className="flex items-center gap-2 mt-2 ml-7">
                                <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                                  Đã duyệt
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
                                    <Download className="h-3 w-3" />
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
                </div>
              )}
              
              {/* Fallback: Certificate Files (backward compatibility) */}
              {(!selectedRegistrationDetail.certificates || selectedRegistrationDetail.certificates.length === 0) &&
               selectedRegistrationDetail.certificateFiles && selectedRegistrationDetail.certificateFiles.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Giấy chứng nhận ({selectedRegistrationDetail.certificateFiles.length})
                  </Label>
                  <div className="space-y-3">
                    {selectedRegistrationDetail.certificateFiles.map((cert, idx) => (
                      <div key={cert.id || idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {cert.purpose || `Giấy chứng nhận ${idx + 1}`}
                            </p>
                            <p className="text-xs text-gray-500">ID: {cert.id}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(cert.imageUrl, '_blank')}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Xem/Tải
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual URL - Hiển thị giống với giấy chứng nhận */}
              {selectedRegistrationDetail.manualUrl && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    File hướng dẫn sử dụng
                  </Label>
                  <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <p className="text-sm font-semibold text-gray-900">
                            Hướng dẫn sử dụng
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 ml-7">
                          {selectedRegistrationDetail.manualUrl}
                        </p>
                      </div>
                    </div>
                    <div className="ml-7">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(selectedRegistrationDetail.manualUrl, '_blank')}
                        className="gap-1 h-7 text-xs"
                      >
                        <Download className="h-3 w-3" />
                        Xem/Tải
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedRegistrationDetail.status === "Rejected" && selectedRegistrationDetail.rejectionReason && (
                <div className="rounded-md bg-red-50 border border-red-200 p-4">
                  <Label className="text-sm font-medium text-red-700">Lý do từ chối</Label>
                  <p className="mt-1 text-sm text-red-600">{selectedRegistrationDetail.rejectionReason}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Ngày tạo</Label>
                  <p className="mt-1 text-sm text-gray-600">{formatDate(selectedRegistrationDetail.createdAt)}</p>
                </div>
                {selectedRegistrationDetail.approvedAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Ngày duyệt</Label>
                    <p className="mt-1 text-sm text-gray-600">{formatDate(selectedRegistrationDetail.approvedAt)}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Cập nhật lần cuối</Label>
                  <p className="mt-1 text-sm text-gray-600">{formatDate(selectedRegistrationDetail.updatedAt)}</p>
                </div>
              </div>
            </div>
          ) : null}
          
          <DialogFooter className="pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{imagePreview?.name ?? 'Xem hình ảnh'}</DialogTitle>
          </DialogHeader>
          <div className="w-full">
            {imagePreview ? (
              <img
                src={imagePreview.url}
                alt={imagePreview.name}
                className="w-full h-auto rounded-lg object-contain"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Không có hình ảnh
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Alert Dialog */}
      <AlertDialog open={resultAlert.open} onOpenChange={(open) => setResultAlert((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={resultAlert.variant === "success" ? "text-green-700" : "text-red-700"}>
              {resultAlert.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {resultAlert.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setResultAlert((prev) => ({ ...prev, open: false }))}>
              Đóng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        productId={selectedProductId}
        open={productDetailDialogOpen}
        onOpenChange={setProductDetailDialogOpen}
      />
    </div>
  );
};

export default WarehousePanel;
