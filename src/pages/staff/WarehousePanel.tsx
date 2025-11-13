import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BadgeCheck, CheckCircle2, CircleDashed, Filter, Search, Users, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getProductRegistrations, 
  updateProductRegistrationStatus,
  getMediaLinks,
  type ProductRegistration,
  type MediaLink
} from "@/api/product";

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
      setError(err?.message || 'Có lỗi xảy ra khi tải danh sách đăng ký sản phẩm');
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
      alert('Không tìm thấy thông tin người dùng');
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
      alert('Duyệt đăng ký sản phẩm thành công!');
    } catch (err: any) {
      console.error('Error approving registration:', err);
      alert(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi duyệt đăng ký');
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
      alert('Không tìm thấy thông tin cần thiết');
      return;
    }

    if (!rejectionReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
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
      alert('Từ chối đăng ký sản phẩm thành công!');
    } catch (err: any) {
      console.error('Error rejecting registration:', err);
      alert(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi từ chối đăng ký');
    } finally {
      setIsProcessing(false);
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
                          <div key={idx} className="h-20 rounded-md overflow-hidden bg-gray-100">
                            <img
                              src={src}
                              alt={`${reg.proposedProductName} ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error(`Failed to load image ${idx} for registration ${reg.id}:`, src);
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                              }}
                              onLoad={() => {
                                console.log(`Successfully loaded image ${idx} for registration ${reg.id}:`, src);
                              }}
                            />
                          </div>
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
    </div>
  );
};

export default WarehousePanel;
