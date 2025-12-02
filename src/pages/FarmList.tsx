import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { getFarmProfilesByUserId, updateFarmProfile, type FarmProfile } from "@/api/farm";
import { useAuth } from "@/contexts/AuthContext";

type FarmStatus = "Active" | "Maintenance" | "Deleted";

interface FarmItem {
  id: number;
  name: string;
  location: string;
  areaHectare: number;
  type: string;
  cropNames: string[];
  createdAt: string; // Ngày tạo trang trại
  status: FarmStatus;
  imageUrl: string;
}

interface DeleteDialogState {
  open: boolean;
  farm: FarmItem | null;
  loading: boolean;
}

const initialDeleteDialog: DeleteDialogState = {
  open: false,
  farm: null,
  loading: false,
};

// Helper function to convert FarmProfile to FarmItem
const convertFarmProfileToFarmItem = (farm: FarmProfile): FarmItem => {
  // Build location string with locationAddress if available
  let location = 'Chưa có địa chỉ';
  if (farm.address) {
    const addressParts = [];
    
    // Add locationAddress if available
    if (farm.address.locationAddress) {
      addressParts.push(farm.address.locationAddress);
    }
    
    // Add administrative divisions
    if (farm.address.commune) {
      addressParts.push(farm.address.commune);
    }
    if (farm.address.district) {
      addressParts.push(farm.address.district);
    }
    if (farm.address.province) {
      addressParts.push(farm.address.province);
    }
    
    location = addressParts.join(', ');
  }
  
  const createdAt = farm.createdAt || new Date().toISOString();
  
  const cropNames = (farm.crops || [])
    .filter((crop) => crop.cropName?.trim() && crop.status !== 'Deleted') // Ẩn các cây trồng có trạng thái Deleted
    .map((crop) => crop.cropName.trim());

  const primaryCropDisplay =
    (cropNames.length > 0 && cropNames.join(", ")) ||
    farm.primaryCrops ||
    "Chưa xác định";

  return {
    id: farm.id || 0,
    name: farm.farmName,
    location,
    areaHectare: farm.farmSizeHectares,
    type: primaryCropDisplay,
    cropNames,
    createdAt,
    status: farm.status || 'Active',
    imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop",
  };
};


const formatHectare = (v: number) => `${v.toFixed(1)} ha`;

const StatusPill = ({ status }: { status: FarmStatus }) => {
  const map = {
    Active: {
      label: "Hoạt động",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    Maintenance: {
      label: "Bảo trì",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    },
    Deleted: {
      label: "Xóa",
      cls: "bg-red-50 text-red-700 border-red-200",
    },
  } as const;
  const { label, cls } = map[status as keyof typeof map];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full border text-xs font-medium whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
};

export const FarmList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [farms, setFarms] = useState<FarmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>(initialDeleteDialog);

  // Fetch farms data
  useEffect(() => {
    const fetchFarms = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getFarmProfilesByUserId(Number(user.id));
        console.log('API Response:', response);
        console.log('Response type:', typeof response);
        console.log('Is Array:', Array.isArray(response));
        
        // Kiểm tra và xử lý dữ liệu trả về
        let farmProfiles: FarmProfile[] = [];
        if (Array.isArray(response)) {
          farmProfiles = response;
        } else if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data)) {
          farmProfiles = (response as any).data;
        } else if (response && typeof response === 'object') {
          // Nếu trả về một object duy nhất, chuyển thành array
          farmProfiles = [response as FarmProfile];
        } else {
          console.warn('Unexpected API response format:', response);
          farmProfiles = [];
        }
        
        console.log('Processed farmProfiles:', farmProfiles);
        
        const farmItems = farmProfiles.map(convertFarmProfileToFarmItem);
        setFarms(farmItems);
      } catch (err) {
        console.error('Error fetching farms:', err);
        setError('Không thể tải danh sách trang trại');
        setFarms([]); // Đặt farms thành array rỗng khi có lỗi
      } finally {
        setLoading(false);
      }
    };

    fetchFarms();
  }, [user?.id]);

  const openDeleteDialog = (farm: FarmItem) => {
    setDeleteDialog({
      open: true,
      farm,
      loading: false,
    });
  };

  const closeDeleteDialog = () => setDeleteDialog(initialDeleteDialog);

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.farm) {
      return;
    }

    setDeleteDialog((prev) => ({ ...prev, loading: true }));
    try {
      await updateFarmProfile(deleteDialog.farm.id, { status: "Deleted" });
      // Update the farm status in the list instead of removing it
      setFarms((prev) => 
        prev.map((farm) => 
          farm.id === deleteDialog.farm!.id 
            ? { ...farm, status: "Deleted" as FarmStatus }
            : farm
        )
      );
      closeDeleteDialog();
    } catch (err) {
      console.error("Error deleting farm:", err);
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };


  const filtered = useMemo(() => {
    let list = farms;
    
    // Loại bỏ các trang trại có status "Deleted"
    list = list.filter((f) => f.status !== "Deleted");
    
    if (filter !== "all") {
      list = list.filter((f) => f.status === (filter as FarmStatus));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (f) => f.name.toLowerCase().includes(q) || f.location.toLowerCase().includes(q)
      );
    }
    
    // Sắp xếp theo tên
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [farms, filter, query]);

  const stats = useMemo(() => {
    // Exclude deleted farms from statistics
    const nonDeleted = farms.filter((f) => f.status !== "Deleted");
    const total = nonDeleted.length;
    const active = nonDeleted.filter((f) => f.status === "Active").length;
    const area = nonDeleted.reduce((sum, f) => sum + f.areaHectare, 0);
    return { total, active, area };
  }, [farms]);

  // Phân trang
  const paginatedFarms = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // Reset về trang 1 khi filter hoặc query thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, query]);

  if (loading) {
    return (
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-[80px]">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải danh sách trang trại...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-[80px]">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Thử lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <motion.div
      className="relative max-w-[100%] mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-[80px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Decorative animated background blobs */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-16 -left-20 w-72 h-72 rounded-full blur-3xl opacity-20"
        style={{ background: "radial-gradient(closest-side, rgba(16,185,129,0.6), transparent)" }}
        animate={{ scale: [1, 1.15, 1], rotate: [0, 10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-24 w-80 h-80 rounded-full blur-3xl opacity-20"
        style={{ background: "radial-gradient(closest-side, rgba(59,130,246,0.45), transparent)" }}
        animate={{ scale: [1, 1.1, 1], rotate: [0, -12, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div className="flex items-center justify-between" initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45 }}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách trang trại</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý hệ thống trang trại của bạn</p>
        </div>
        <Button 
          className="bg-green-600 hover:bg-green-700" 
          onClick={() => navigate('/create-farm')}
        >
          <Plus className="h-4 w-4 mr-2" /> Tạo trang trại mới
        </Button>
      </motion.div>


      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[stats.total, stats.active, stats.area.toFixed(1) + ' ha'].map((value, idx) => (
          <motion.div key={idx} initial={{ y: 16, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: idx * 0.08 }} whileHover={{ y: -6, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card className="transition-shadow hover:shadow-lg">
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">{idx === 0 ? 'Tổng số farm' : idx === 1 ? 'Đang hoạt động' : 'Tổng diện tích'}</div>
                <div className={`mt-2 text-3xl font-bold ${idx === 1 ? 'text-emerald-600' : 'text-gray-900'}`}>{value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="mt-6 ">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Danh sách</CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm kiếm theo tên hoặc địa điểm..."
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="Active">Hoạt động</SelectItem>
                  <SelectItem value="Maintenance">Bảo trì</SelectItem>
                  <SelectItem value="Deleted">Xóa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

           <div className="mt-4 rounded-lg border">
             <table className="w-full divide-y divide-gray-200">
               <thead className="bg-gray-50">
                 <tr>
                   <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 w-16">Hình</th>
                   <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 w-1/8">Tên trang trại</th>
                   <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 w-32">Loại rau củ</th>
                   <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 w-1/3">Địa điểm</th>
                   <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 w-24">Diện tích</th>
                   <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 w-28">Trạng thái</th>
                   <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 w-32">Ngày tạo</th>
                   <th className="px-3 py-3 w-32" />
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 bg-white">
                 {paginatedFarms.map((farm, idx) => (
                   <motion.tr key={farm.id} initial={{ y: 12, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: idx * 0.03 }} whileHover={{ backgroundColor: "#f9fafb" }} className="">
                     <td className="px-3 py-3">
                       <motion.img
                         src={farm.imageUrl}
                         alt={farm.name}
                         className="w-12 h-12 object-cover rounded-md border"
                         whileHover={{ scale: 1.05 }}
                         transition={{ type: "spring", stiffness: 260, damping: 18 }}
                       />
                     </td>
                     <td className="px-3 py-3">
                       <div className="font-medium text-gray-900 text-sm" title={farm.name}>
                         {farm.name}
                       </div>
                     </td>
                     <td className="px-3 py-3">
                       <span className="inline-block text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                         {farm.type}
                       </span>
                     </td>
                     <td className="px-3 py-3 text-gray-700 text-sm" title={farm.location}>
                       {farm.location}
                     </td>
                     <td className="px-3 py-3 text-gray-700 text-sm">
                       {formatHectare(farm.areaHectare)}
                     </td>
                     <td className="px-3 py-3">
                       <StatusPill status={farm.status} />
                     </td>
                     <td className="px-3 py-3 text-sm text-gray-700">
                       {new Date(farm.createdAt).toLocaleDateString('vi-VN')}
                     </td>
                     <td className="px-3 py-3 text-right">
                       <div className="inline-flex items-center gap-1">
                         <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="gap-1 text-xs px-2 py-1 h-7"
                             onClick={() => navigate(`/farm-detail/${farm.id}`)}
                           >
                           <p>Thời tiết & AI</p>
                           </Button>
                         </motion.div>
                        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="gap-1 text-xs px-2 py-1 h-7 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => navigate(`/update-farm/${farm.id}`)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Xóa trang trại"
                            className="h-7 w-7 text-red-600 hover:text-red-700"
                            onClick={() => openDeleteDialog(farm)}
                            disabled={deleteDialog.loading && deleteDialog.farm?.id === farm.id}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </motion.div>
                       </div>
                     </td>
                   </motion.tr>
                 ))}
               </tbody>
             </table>
           </div>

          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>
              Hiển thị {paginatedFarms.length} / {filtered.length} trang trại 
              {totalPages > 1 && ` (Trang ${currentPage}/${totalPages})`}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Trước
                </Button>
                <span className="px-2 py-1 text-xs bg-gray-100 rounded">
                  {currentPage} / {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sau
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>

    <AlertDialog
      open={deleteDialog.open}
      onOpenChange={(open) => {
        if (!open) {
          closeDeleteDialog();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xoá trang trại</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn chắc chắn muốn xoá trang trại "{deleteDialog.farm?.name}"? Hành động này sẽ đánh dấu trang trại là đã xóa.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={(event) => {
              event.preventDefault();
              closeDeleteDialog();
            }}
            disabled={deleteDialog.loading}
          >
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteConfirm}
            disabled={deleteDialog.loading}
          >
            {deleteDialog.loading ? "Đang xử lý..." : "Xóa"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default FarmList;


