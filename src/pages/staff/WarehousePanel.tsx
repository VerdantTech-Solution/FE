import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCheck, CheckCircle2, CircleDashed, Filter, Search, Users } from "lucide-react";

type ProductStatus = "pending" | "approved" | "rejected" | "all";

export interface WarehouseStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface ProductItem {
  id: string;
  title: string;
  vendor: string;
  category: string;
  price: string;
  status: ProductStatus;
  description: string;
  notes?: string;
  images: string[];
}

const mockProductsInitial: ProductItem[] = [
  {
    id: "seed-tomato-f1",
    title: "Hạt giống cà chua F1",
    vendor: "Green Farms Co.",
    category: "Hạt giống",
    price: "25,000 đ",
    status: "pending",
    description:
      "Hạt giống cà chua F1 chất lượng cao, năng suất cao, kháng bệnh tốt. Thích hợp trồng trong nhà kính và ngoài trời.",
    notes: "Thông số kỹ thuật đi kèm",
    images: ["/src/assets/canhdep.jpg", "/src/assets/carousel1.jpg"],
  },
  {
    id: "fertilizer-organic-npk",
    title: "Phân bón hữu cơ NPK",
    vendor: "Organic Solutions",
    category: "Phân bón",
    price: "120,000 đ",
    status: "approved",
    description:
      "Phân bón hữu cơ NPK cân bằng dinh dưỡng, thân thiện với môi trường, giúp cây phát triển khỏe mạnh.",
    images: ["/src/assets/carousel2.jpg", "/src/assets/nongdan.jpg"],
  },
  {
    id: "smart-irrigation",
    title: "Dụng cụ tưới nước tự động",
    vendor: "Smart Garden Tech",
    category: "Dụng cụ",
    price: "850,000 đ",
    status: "rejected",
    description:
      "Hệ thống tưới nước tự động thông minh, có thể điều khiển qua app, tiết kiệm nước và thời gian.",
    notes: "Cần bổ sung chứng từ về bảo hành và chứng chỉ chất lượng.",
    images: ["/src/assets/drone.jpg", "/src/assets/xephunthuoc.jpg"],
  },
];

interface WarehousePanelProps {
  onStatsChange?: (stats: WarehouseStats) => void;
}

export const WarehousePanel: React.FC<WarehousePanelProps> = ({ onStatsChange }) => {
  const [statusFilter, setStatusFilter] = useState<ProductStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<ProductItem[]>(mockProductsInitial);

  const stats = useMemo<WarehouseStats>(() => {
    const total = items.length;
    const pending = items.filter((p) => p.status === "pending").length;
    const approved = items.filter((p) => p.status === "approved").length;
    const rejected = items.filter((p) => p.status === "rejected").length;
    return { total, pending, approved, rejected };
  }, [items]);

  useEffect(() => {
    onStatsChange?.(stats);
  }, [stats, onStatsChange]);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (search.trim() && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, statusFilter, categoryFilter, search]);

  const setStatus = (id: string, status: Exclude<ProductStatus, "all">) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
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

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProductStatus)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Tất cả trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="pending">Chờ duyệt</SelectItem>
            <SelectItem value="approved">Đã duyệt</SelectItem>
            <SelectItem value="rejected">Từ chối</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Tất cả danh mục" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            <SelectItem value="Hạt giống">Hạt giống</SelectItem>
            <SelectItem value="Phân bón">Phân bón</SelectItem>
            <SelectItem value="Dụng cụ">Dụng cụ</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative w-full sm:w-80">
          <Input placeholder="Tìm kiếm sản phẩm..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        <Button variant="outline" className="gap-2"><Filter className="w-4 h-4" />Bộ lọc</Button>
      </div>

      {/* Cards list */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {filtered.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <CardTitle className="text-base font-semibold">{item.title}</CardTitle>
                {item.status === "pending" && (
                  <span className="ml-2 text-xs rounded bg-yellow-100 text-yellow-700 px-2 py-0.5">Chờ duyệt</span>
                )}
                {item.status === "approved" && (
                  <span className="ml-2 text-xs rounded bg-green-100 text-green-700 px-2 py-0.5">Đã duyệt</span>
                )}
                {item.status === "rejected" && (
                  <span className="ml-2 text-xs rounded bg-red-100 text-red-700 px-2 py-0.5">Từ chối</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {item.images.slice(0, 3).map((src, idx) => (
                  <div key={idx} className="h-20 rounded-md overflow-hidden">
                    <img src={src} alt="preview" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-600 line-clamp-3">{item.description}</div>
              <div className="grid grid-cols-2 text-sm gap-x-6 gap-y-1">
                <div className="text-gray-500">Danh mục</div>
                <div className="font-medium">{item.category}</div>
                <div className="text-gray-500">Giá</div>
                <div className="font-medium">{item.price}</div>
              </div>
              {item.notes && (
                <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">Ghi chú: {item.notes}</div>
              )}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-gray-500">Gửi lúc: 15/01/2024, 14:30</div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setStatus(item.id, "approved")}>Duyệt</Button>
                  <Button size="sm" variant="destructive" onClick={() => setStatus(item.id, "rejected")}>Từ chối</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 pb-2 flex items-center justify-center gap-2">
        <Button variant="outline" size="icon">1</Button>
        <Button variant="ghost" size="icon">2</Button>
        <Button variant="ghost" size="icon">3</Button>
      </div>
    </div>
  );
};

export default WarehousePanel;


