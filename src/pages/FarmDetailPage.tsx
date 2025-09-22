import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit } from "lucide-react";
import { FarmWeather } from "@/components/FarmWeather";
import { FarmAISuggestions } from "@/components/FarmAISuggestions";
import { getFarmProfileById, type FarmProfile } from "@/api/farm";

// UI phần thời tiết và gợi ý AI đã được tách sang components riêng

const FarmDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [farm, setFarm] = useState<FarmProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getFarmProfileById(Number(id));
        setFarm(data);
      } catch (e) {
        setError("Không thể tải thông tin trang trại");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const addressText = useMemo(() => {
    if (!farm?.address) return "Chưa có địa chỉ";
    const a = farm.address;
    const parts = [a.locationAddress, a.commune, a.district, a.province].filter(Boolean);
    return parts.join(', ');
  }, [farm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-[80px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông Tin Trang Trại</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý thông tin tối ưu hoá và trang trại của bạn</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2"><ArrowLeft className="h-4 w-4"/>Quay lại</Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700"><Edit className="h-4 w-4"/>Chỉnh sửa</Button>
        </div>
      </div>

      <Tabs defaultValue="weather" className="mt-6">
        <TabsList>
          <TabsTrigger value="weather">Dự báo thời tiết</TabsTrigger>
          <TabsTrigger value="ai">AI Gợi ý</TabsTrigger>
        </TabsList>
        <TabsContent value="weather">
          {id ? <FarmWeather farmId={Number(id)} /> : null}
        </TabsContent>

        <TabsContent value="ai">
          <FarmAISuggestions />
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{farm?.farmName || "Trang trại"}</CardTitle>
                <p className="text-xs text-gray-500 mt-1">Thông tin chi tiết về trang trại</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1">
                <Edit className="h-3 w-3" />
                Chỉnh sửa
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Diện tích</div>
                <div className="text-lg font-semibold text-gray-900">{farm?.farmSizeHectares ?? '-'} hecta</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Trạng thái</div>
                <div className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm">
                  {farm?.status === 'Active' ? 'Đang hoạt động' : farm?.status === 'Maintenance' ? 'Bảo trì' : farm?.status === 'Deleted' ? 'Đã xóa' : 'Không xác định'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Ngày cập nhật gần nhất</div>
                <div className="text-sm text-gray-900">{farm?.updatedAt ? new Date(farm.updatedAt).toLocaleDateString('vi-VN') : '-'}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Địa chỉ</div>
                <div className="text-sm text-gray-900">{addressText}</div>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Cây trồng chính</div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm">{farm?.primaryCrops || 'Chưa xác định'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Thống kê trang trại</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span>Quy mô</span>
              <span className="font-medium">Vừa</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Đã đăng ký công</span>
              <span className="font-medium">{farm?.createdAt ? `${Math.max(1, Math.ceil((Date.now() - new Date(farm.createdAt).getTime()) / (1000*60*60*24*30)))} tháng` : '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Trạng thái</span>
              <span className="text-emerald-600 font-medium">{farm?.status === 'Active' ? 'Hoạt động' : farm?.status === 'Maintenance' ? 'Bảo trì' : farm?.status === 'Deleted' ? 'Đã xóa' : 'Không xác định'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FarmDetailPage;
export { FarmDetailPage };


