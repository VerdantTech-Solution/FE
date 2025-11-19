import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit } from "lucide-react";
import { FarmWeather } from "@/components/FarmWeather";
import { CurrentFarmWeather } from "@/components";
import { FarmAISuggestions } from "@/components/FarmAISuggestions";
import CO2Info from "@/components/CO2Info";
import { getFarmProfileById, type FarmProfile } from "@/api/farm";

// UI phần thời tiết và gợi ý AI đã được tách sang components riêng

const FarmDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [farm, setFarm] = useState<FarmProfile | null>(null);
  const [, setLoading] = useState<boolean>(true);
  const [, setError] = useState<string | null>(null);

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
        </div>
      </div>

      <Tabs defaultValue="weather" className="mt-6">
        <TabsList>
          <TabsTrigger value="weather">Dự báo thời tiết</TabsTrigger>
          <TabsTrigger value="ai">AI Gợi ý</TabsTrigger>
          <TabsTrigger value="CO2">Thông Tin CO2</TabsTrigger>
        </TabsList>
        <TabsContent value="weather">
          {id ? <FarmWeather farmId={Number(id)} /> : null}
        </TabsContent>

        <TabsContent value="ai">
          {id ? <FarmAISuggestions farmId={Number(id)} /> : null}
        </TabsContent>

        <TabsContent value="CO2">
          <CO2Info />
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Thời Tiết Hiện Tại</CardTitle>
            </CardHeader>
            <CardContent className="text-base text-gray-700">
              {id ? <CurrentFarmWeather farmId={Number(id)} /> : null}
            </CardContent>
          </Card>
        </div>
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{farm?.farmName || "Trang trại"}</CardTitle>
                <p className="text-[12px] text-gray-500 mt-1">Thông tin chi tiết về trang trại</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={!farm}
                onClick={() => {
                  if (farm) navigate(`/update-farm/${farm.id}`)
                }}
              >
                <Edit className="h-3 w-3" />
                Chỉnh sửa
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="text-sm text-gray-600 font-semibold">Diện tích</div>
                <div className="text-sm font-medium text-gray-900">{farm?.farmSizeHectares ?? '-'} hecta</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-600">Trạng thái</div>
                <div className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
                  {farm?.status === 'Active' ? 'Đang hoạt động' : farm?.status === 'Maintenance' ? 'Bảo trì' : farm?.status === 'Deleted' ? 'Đã xóa' : 'Không xác định'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-600 font-semibold">Ngày cập nhật gần nhất</div>
                <div className="text-[12px] text-gray-900">{farm?.updatedAt ? new Date(farm.updatedAt).toLocaleDateString('vi-VN') : '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-600 font-semibold">Địa chỉ</div>
                <div className="text-[12px] text-gray-900 leading-relaxed">{addressText}</div>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="text-sm text-gray-600 font-semibold">Cây trồng chính</div>
              <div className="flex flex-wrap items-center gap-2">
                {farm?.crops && farm.crops.length > 0 ? (
                  farm.crops.map((crop, index) => (
                    <div key={crop.id || index} className="flex items-center gap-1">
                      <span className={`px-2 py-1 rounded-md text-xs border ${
                        crop.isActive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {crop.cropName}
                      </span>
                      {crop.plantingDate && (
                        <span className="text-xs text-gray-500">
                          ({new Date(crop.plantingDate).toLocaleDateString('vi-VN')})
                        </span>
                      )}
                    </div>
                  ))
                ) : farm?.primaryCrops ? (
                  <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
                    {farm.primaryCrops}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">Chưa xác định</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      
      </div>
    </div>
  );
};

export default FarmDetailPage;
export { FarmDetailPage };


