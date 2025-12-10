import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Loader2 } from "lucide-react";
import { FarmWeather } from "@/components/FarmWeather";
import { CurrentFarmWeather } from "@/components";
import { FarmAISuggestions } from "@/components/FarmAISuggestions";
import CO2Info from "@/components/CO2Info";
import { WeatherDashboard } from "@/components/WeatherDashboard";
import { getFarmProfileById, type FarmProfile } from "@/api/farm";
import { getSurveyResponsesByFarmId, type SurveyResponseItem } from "@/api/survey";

// UI phần thời tiết và gợi ý AI đã được tách sang components riêng

type FarmScale = {
  scale: "Nhỏ" | "Trung bình" | "Lớn" | "Thương mại";
  area: string;
  description: string;
};

const FarmDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [farm, setFarm] = useState<FarmProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponseItem[]>([]);
  const [loadingSurvey, setLoadingSurvey] = useState<boolean>(false);

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

  useEffect(() => {
    const fetchSurveyResponses = async () => {
      if (!id) return;
      try {
        setLoadingSurvey(true);
        const response = await getSurveyResponsesByFarmId(Number(id));
        if (response.status && response.data) {
          setSurveyResponses(response.data);
        }
      } catch (e) {
        console.error("Không thể tải khảo sát:", e);
      } finally {
        setLoadingSurvey(false);
      }
    };
    fetchSurveyResponses();
  }, [id]);

  const addressText = useMemo(() => {
    if (!farm?.address) return "Chưa có địa chỉ";
    const a = farm.address;
    const parts = [a.locationAddress, a.commune, a.district, a.province].filter(Boolean);
    return parts.join(', ');
  }, [farm]);

  // Tính toán quy mô trang trại dựa trên diện tích (hecta -> m²)
  const farmScale = useMemo((): FarmScale | null => {
    if (!farm?.farmSizeHectares) return null;
    
    // Chuyển đổi hecta sang m² (1 hecta = 10,000 m²)
    const areaInSquareMeters = farm.farmSizeHectares * 10000;
    
    if (areaInSquareMeters < 100) {
      return {
        scale: "Nhỏ",
        area: "< 100 m²",
        description: "Hộ gia đình / thử nghiệm"
      };
    } else if (areaInSquareMeters >= 100 && areaInSquareMeters < 500) {
      return {
        scale: "Trung bình",
        area: "100 – 500 m²",
        description: "Sản xuất hộ, bán nhỏ"
      };
    } else if (areaInSquareMeters >= 500 && areaInSquareMeters < 2000) {
      return {
        scale: "Lớn",
        area: "500 – 2.000 m²",
        description: "Nông trại thương mại nhỏ"
      };
    } else {
      return {
        scale: "Thương mại",
        area: "> 2.000 m²",
        description: "Sản xuất lớn, công nghệ cao"
      };
    }
  }, [farm?.farmSizeHectares]);

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

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="weather">Dự báo thời tiết</TabsTrigger>
          <TabsTrigger value="CO2">Thông Tin CO2</TabsTrigger>
          <TabsTrigger value="ai">AI Gợi ý</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Weather Dashboard */}
          {id && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Thời Tiết</h2>
                <p className="text-sm text-gray-600">Theo dõi nhiệt độ và lượng mưa trong 7 ngày tới</p>
              </div>
              <WeatherDashboard farmId={Number(id)} />
            </div>
          )}

          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Đang tải thông tin trang trại...</span>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-red-600">{error}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Thông Tin Trang Trại</h2>
                <p className="text-sm text-gray-600">Chi tiết về trang trại và cây trồng</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Thông tin cơ bản */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Thông Tin Cơ Bản</CardTitle>
                  </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tên trang trại</div>
                    <div className="text-lg font-semibold text-gray-900">{farm?.farmName || 'Chưa có tên'}</div>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Diện tích</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {farm?.farmSizeHectares ? (
                        <>
                          {farm.farmSizeHectares.toLocaleString('vi-VN')} hecta
                          <span className="text-sm font-normal text-gray-500 ml-2">
                            ({(farm.farmSizeHectares * 10000).toLocaleString('vi-VN')} m²)
                          </span>
                        </>
                      ) : (
                        'Chưa cập nhật'
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quy mô sản xuất</div>
                    {farmScale ? (
                      <div className="space-y-2">
                        <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 text-sm font-semibold shadow-sm">
                          {farmScale.scale}
                        </div>
                        <div className="text-sm text-gray-600 font-medium">{farmScale.area}</div>
                        <div className="text-sm text-gray-700 leading-relaxed">{farmScale.description}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">Chưa xác định quy mô</div>
                    )}
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Trạng thái hoạt động</div>
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-medium">
                      {farm?.status === 'Active' ? '✓ Đang hoạt động' : farm?.status === 'Maintenance' ? '⚠ Bảo trì' : farm?.status === 'Deleted' ? '✗ Đã xóa' : '? Không xác định'}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Địa chỉ</div>
                    <div className="text-sm text-gray-900 leading-relaxed font-medium">{addressText}</div>
                  </div>
                  {farm?.address?.latitude && farm?.address?.longitude && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tọa độ GPS</div>
                        <div className="text-sm text-gray-900 font-mono">
                          {farm.address.latitude.toFixed(6)}, {farm.address.longitude.toFixed(6)}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Cây trồng */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Danh Sách Cây Trồng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {farm?.crops && farm.crops.length > 0 ? (
                    <div className="space-y-3">
                      {farm.crops.map((crop, index) => (
                        <div key={crop.id || index} className="p-4 border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-sm transition-all">
                          <div className="flex items-center justify-between mb-3">
                            <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                              crop.isActive 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm' 
                                : 'bg-gray-50 text-gray-600 border-gray-300'
                            }`}>
                              {crop.cropName}
                            </span>
                            {crop.isActive && (
                              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                ● Đang trồng
                              </span>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            {crop.plantingDate && (
                              <div className="text-xs text-gray-600">
                                <span className="font-medium">Ngày trồng:</span> {new Date(crop.plantingDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </div>
                            )}
                            {crop.plantingMethod && (
                              <div className="text-xs text-gray-600">
                                <span className="font-medium">Phương pháp:</span> {crop.plantingMethod}
                              </div>
                            )}
                            {crop.cropType && (
                              <div className="text-xs text-gray-600">
                                <span className="font-medium">Loại cây:</span> {crop.cropType}
                              </div>
                            )}
                            {crop.farmingType && (
                              <div className="text-xs text-gray-600">
                                <span className="font-medium">Hình thức canh tác:</span> {crop.farmingType}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : farm?.primaryCrops ? (
                    <div className="text-sm text-gray-900 font-medium">{farm.primaryCrops}</div>
                  ) : (
                    <div className="text-sm text-gray-500 italic text-center py-4">Chưa có thông tin về cây trồng</div>
                  )}
                </CardContent>
              </Card>

              {/* Thông tin khác */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thông Tin Hệ Thống</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ngày tạo</div>
                    <div className="text-sm text-gray-900 font-medium">
                      {farm?.createdAt ? new Date(farm.createdAt).toLocaleString('vi-VN', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Chưa có thông tin'}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cập nhật lần cuối</div>
                    <div className="text-sm text-gray-900 font-medium">
                      {farm?.updatedAt ? new Date(farm.updatedAt).toLocaleString('vi-VN', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Chưa có thông tin'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Kết quả khảo sát */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Kết Quả Khảo Sát</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingSurvey ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      <span className="ml-2 text-sm text-gray-600">Đang tải dữ liệu khảo sát...</span>
                    </div>
                  ) : surveyResponses.length > 0 ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {surveyResponses.map((response, index) => (
                        <div key={response.questionId || index} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <div className="text-sm font-semibold text-gray-700">
                              Câu hỏi {response.questionId}
                            </div>
                            {response.updatedAt && (
                              <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                {new Date(response.updatedAt).toLocaleDateString('vi-VN')}
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-900 mt-2 leading-relaxed">
                            {response.textAnswer}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-8 italic">
                      Chưa có kết quả khảo sát cho trang trại này
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            </>
          )}
        </TabsContent>

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


