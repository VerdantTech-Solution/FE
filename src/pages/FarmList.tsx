import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, MoreHorizontal, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { apiClient } from "@/api";
import type { AxiosResponse } from "axios";
import MapAreaPage from "./MapAreaPage";

type FarmStatus = "active" | "maintenance" | "inactive";

interface FarmItem {
  id: string;
  name: string;
  location: string;
  areaHectare: number;
  type: string;
  establishedYear: number;
  productivityPercent: number; // 0..100
  status: FarmStatus;
  imageUrl: string;
}

const initialFarms: FarmItem[] = [
  {
    id: "f1",
    name: "Trang trại rau sạch Đông Anh",
    location: "Đông Anh, Hà Nội",
    areaHectare: 2.5,
    type: "Rau củ quả",
    establishedYear: 2020,
    productivityPercent: 85,
    status: "active",
    imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "f2",
    name: "Nông trại lúa hữu cơ Mỹ Đức",
    location: "Mỹ Đức, Hà Nội",
    areaHectare: 8.2,
    type: "Lúa gạo",
    establishedYear: 2018,
    productivityPercent: 92,
    status: "active",
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "f3",
    name: "Vườn cây ăn quả Vĩnh Phúc",
    location: "Vĩnh Phúc",
    areaHectare: 4.7,
    type: "Cây ăn quả",
    establishedYear: 2019,
    productivityPercent: 78,
    status: "maintenance",
    imageUrl: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "f4",
    name: "Trang trại chăn nuôi Sóc Sơn",
    location: "Sóc Sơn, Hà Nội",
    areaHectare: 6.3,
    type: "Chăn nuôi",
    establishedYear: 2017,
    productivityPercent: 88,
    status: "active",
    imageUrl: "https://images.unsplash.com/photo-1550156490-7a0b3a2d8d8e?q=80&w=1200&auto=format&fit=crop",
  },
];

const formatHectare = (v: number) => `${v.toFixed(1)} ha`;

const StatusPill: React.FC<{ status: FarmStatus }> = ({ status }) => {
  const map = {
    active: {
      label: "Hoạt động",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    maintenance: {
      label: "Bảo trì",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    },
    inactive: {
      label: "Tạm ngừng",
      cls: "bg-gray-100 text-gray-700 border-gray-200",
    },
  } as const;
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
};

type CreateResponse = { id?: number } | AxiosResponse<{ id: number }>;

export const FarmList = () => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [farms] = useState<FarmItem[]>(initialFarms);
  const [openCreate, setOpenCreate] = useState(false);

  // Inline form state (matches DB schema)
  const [form, setForm] = useState({
    user_id: 0,
    farm_name: "",
    farm_size_hectares: "",
    location_address: "",
    province: "",
    district: "",
    commune: "",
    latitude: "",
    longitude: "",
    primary_crops: "",
    status: "Active",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };


  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const payload = {
        user_id: Number(form.user_id),
        farm_name: form.farm_name,
        farm_size_hectares: form.farm_size_hectares === "" ? null : Number(form.farm_size_hectares),
        location_address: form.location_address || undefined,
        province: form.province || undefined,
        district: form.district || undefined,
        commune: form.commune || undefined,
        latitude: form.latitude === "" ? null : Number(form.latitude),
        longitude: form.longitude === "" ? null : Number(form.longitude),
        primary_crops: form.primary_crops || undefined,
        status: form.status as "Active" | "Maintenance" | "Deleted",
      };
      const res: CreateResponse = await apiClient.post('/api/farm-profiles', payload);
      const maybeAxios = res as AxiosResponse<{ id: number }>;
      const newId = (maybeAxios && typeof (maybeAxios as AxiosResponse<{ id: number }>).data?.id === 'number')
        ? (maybeAxios as AxiosResponse<{ id: number }>).data.id
        : (res as { id?: number }).id;
      setMessage(`Tạo thành công${newId ? ` (ID: ${newId})` : ''}`);
      setTimeout(() => setOpenCreate(false), 800);
    } catch (error) {
      const errObj = error as { message?: string };
      const msg = errObj?.message ?? 'Tạo trang trại thất bại';
      setMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    let list = farms;
    if (filter !== "all") {
      list = list.filter((f) => f.status === (filter as FarmStatus));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (f) => f.name.toLowerCase().includes(q) || f.location.toLowerCase().includes(q)
      );
    }
    return list;
  }, [farms, filter, query]);

  const stats = useMemo(() => {
    const total = farms.length;
    const active = farms.filter((f) => f.status === "active").length;
    const area = farms.reduce((s, f) => s + f.areaHectare, 0);
    return { total, active, area };
  }, [farms]);

  return (
    <motion.div
      className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-[80px]"
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
        <Button className="bg-green-600 hover:bg-green-700" onClick={() => setOpenCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Tạo trang trại mới
        </Button>
      </motion.div>

      <Sheet open={openCreate} onOpenChange={setOpenCreate}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
            <SheetHeader className="px-6 py-4">
              <SheetTitle className="text-lg font-semibold">Tạo trang trại mới</SheetTitle>
              <p className="text-xs text-gray-500">Nhập đầy đủ thông tin để quản lý tốt hơn hồ sơ trang trại</p>
            </SheetHeader>
          </div>

          <form onSubmit={submitForm} className="px-6 py-5 space-y-6">
            {/* Thông tin cơ bản */}
            <div>
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Thông tin cơ bản</h3>
                <p className="text-xs text-gray-500">Các trường có dấu <span className="text-red-500">*</span> là bắt buộc</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">User ID <span className="text-red-500">*</span></label>
                  <Input value={form.user_id} onChange={handleChange('user_id')} placeholder="VD: 101" required inputMode="numeric" />
                  <p className="mt-1 text-[11px] text-gray-500">ID người dùng sở hữu trang trại</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tên trang trại <span className="text-red-500">*</span></label>
                  <Input value={form.farm_name} onChange={handleChange('farm_name')} placeholder="VD: Trang trại A" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Diện tích (ha)</label>
                  <Input value={form.farm_size_hectares} onChange={handleChange('farm_size_hectares')} placeholder="VD: 12.5" inputMode="decimal" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cây trồng chính</label>
                  <Input value={form.primary_crops} onChange={handleChange('primary_crops')} placeholder="Lúa, ngô, sắn" />
                  <p className="mt-1 text-[11px] text-gray-500">Nhập nhiều loại, phân tách bằng dấu phẩy</p>
                </div>
              </div>
            </div>

            {/* Địa chỉ hành chính */}
            <div>
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Địa chỉ</h3>
                <p className="text-xs text-gray-500">Thông tin vị trí hành chính</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Địa chỉ chi tiết</label>
                  <Input value={form.location_address} onChange={handleChange('location_address')} placeholder="Số nhà, đường..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tỉnh/Thành</label>
                  <Input value={form.province} onChange={handleChange('province')} placeholder="VD: Hà Nội" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Quận/Huyện</label>
                  <Input value={form.district} onChange={handleChange('district')} placeholder="VD: Đông Anh" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Xã/Phường</label>
                  <Input value={form.commune} onChange={handleChange('commune')} placeholder="VD: Kim Chung" />
                </div>
              </div>
            </div>

            {/* Tọa độ */}
            <div>
              <MapAreaPage/>
              {/* <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Tọa độ</h3>
                <p className="text-xs text-gray-500">Sử dụng nút lấy tọa độ để điền nhanh</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Vĩ độ (lat)</label>
                  <Input value={form.latitude} onChange={handleChange('latitude')} placeholder="VD: 10.7769" inputMode="decimal" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Kinh độ (lng)</label>
                  <Input value={form.longitude} onChange={handleChange('longitude')} placeholder="VD: 106.7009" inputMode="decimal" />
                </div>
                <div className="md:col-span-2">
                  <Button type="button" variant="outline" onClick={getCurrentLocation} className="gap-2">
                    <MapPin className="h-4 w-4" /> Lấy tọa độ hiện tại
                  </Button>
                </div>
              </div> */}
            </div>

            {/* Trạng thái */}
            <div>
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Trạng thái</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant={form.status === 'Active' ? 'default' : 'outline'} onClick={() => setForm((f) => ({ ...f, status: 'Active' }))}>Active</Button>
                <Button type="button" variant={form.status === 'Maintenance' ? 'default' : 'outline'} onClick={() => setForm((f) => ({ ...f, status: 'Maintenance' }))}>Maintenance</Button>
                <Button type="button" variant={form.status === 'Deleted' ? 'default' : 'outline'} onClick={() => setForm((f) => ({ ...f, status: 'Deleted' }))}>Deleted</Button>
              </div>
            </div>

            {/* Footer actions */}
            <div className="sticky bottom-0 left-0 right-0 bg-white/80 backdrop-blur border-t -mx-6 px-6 py-4 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>Hủy</Button>
              <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700 gap-2">
                {submitting ? 'Đang tạo...' : (<><CheckCircle2 className="h-4 w-4" /> Tạo trang trại</>)}
              </Button>
            </div>

            {message && (
              <div className="text-sm text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">{message}</div>
            )}
          </form>
        </SheetContent>
      </Sheet>

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

      <Card className="mt-6">
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
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="maintenance">Bảo trì</SelectItem>
                  <SelectItem value="inactive">Tạm ngừng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          <div className="mt-4 overflow-hidden rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Hình ảnh</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Tên trang trại</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Loại</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Địa điểm</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Diện tích</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Năm thành lập</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Năng suất</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filtered.map((farm, idx) => (
                  <motion.tr key={farm.id} initial={{ y: 12, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: idx * 0.03 }} whileHover={{ backgroundColor: "#f9fafb" }} className="">
                    <td className="px-4 py-3">
                      <motion.img
                        src={farm.imageUrl}
                        alt={farm.name}
                        className="w-14 h-14 object-cover rounded-md border"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 260, damping: 18 }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <motion.div className="font-medium text-gray-900" whileHover={{ x: 2 }}>{farm.name}</motion.div>
                      <div className="text-xs text-gray-500">Sản xuất {farm.type.toLowerCase()}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block text-xs px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {farm.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{farm.location}</td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{formatHectare(farm.areaHectare)}</td>
                    <td className="px-4 py-3"><StatusPill status={farm.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-700">{farm.establishedYear}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{farm.productivityPercent}%</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Eye className="h-3.5 w-3.5" /> Xem
                        </Button>
                        </motion.div>
                        <motion.div whileHover={{ rotate: 90 }} whileTap={{ rotate: 0 }}>
                        <Button variant="ghost" size="icon" aria-label="Hành động">
                          <MoreHorizontal className="h-4 w-4" />
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
            <span>Hiển thị {filtered.length} / {farms.length} trang trại</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">Trước</Button>
              <Button variant="outline" size="sm">Sau</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FarmList;


