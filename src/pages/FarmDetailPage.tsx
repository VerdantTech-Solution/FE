import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Loader2, FileText, Sparkles, Eye, Trash2, MapPin, Sprout, Ruler } from "lucide-react";
import { FarmWeather } from "@/components/FarmWeather";
import { CurrentFarmWeather } from "@/components";
import { FarmAISuggestions } from "@/components/FarmAISuggestions";
import CO2Info from "@/components/CO2Info";
import { WeatherDashboard } from "@/components/WeatherDashboard";
import { SurveyFormDialog } from "@/components/SurveyFormDialog";
import { AIAdvisoryDialog } from "@/components/AIAdvisoryDialog";
import { getFarmProfileById, type FarmProfile } from "@/api/farm";
import { getSurveyResponsesByFarmId, type SurveyResponseItem } from "@/api/survey";
import { getSoilDataByFarmId, type SoilData } from "@/api/co2";
import { formatVietnamDate, formatVietnamDateTime } from "@/lib/utils";
import {
  getAdvisoryHistoryByFarmId,
  deleteAdvisoryFromHistory,
  type AIAdvisoryHistoryItem,
} from "@/services/aiAdvisoryHistoryService";

// UI phần thời tiết và gợi ý AI đã được tách sang components riêng

type FarmScale = {
  scale: "Nhỏ" | "Trung bình" | "Lớn" | "Thương mại";
  area: string;
  description: string;
};

const getPlantingMethodLabel = (method?: string) => {
  if (!method) return "Chưa rõ";
  const map: Record<string, string> = {
    GieoHatTrucTiep: "Gieo hạt trực tiếp",
    UomTrongKhay: "Ươm trong khay",
    CayCayCon: "Cấy cây con",
    SinhSanSinhDuong: "Sinh sản sinh dưỡng",
    GiamCanh: "Giâm cành",
  };
  return map[method] || method;
};

const getCropTypeLabel = (type?: string) => {
  if (!type) return "Chưa rõ";
  const map: Record<string, string> = {
    RauAnLa: "Rau ăn lá",
    RauAnQua: "Rau ăn quả",
    RauCu: "Rau củ",
    RauThom: "Rau thơm",
  };
  return map[type] || type;
};

const getFarmingTypeLabel = (type?: string) => {
  if (!type) return "Chưa rõ";
  const map: Record<string, string> = {
    ThamCanh: "Thâm canh",
    LuanCanh: "Luân canh",
    XenCanh: "Xen canh",
    NhaLuoi: "Nhà lưới",
    ThuyCanh: "Thủy canh",
  };
  return map[type] || type;
};

const getStatusMeta = (status?: string) => {
  switch (status) {
    case "Growing":
      return { label: "Đang sinh trưởng", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "Harvested":
      return { label: "Đã thu hoạch", color: "bg-amber-50 text-amber-700 border-amber-200" };
    case "Failed":
      return { label: "Thất bại", color: "bg-red-50 text-red-700 border-red-200" };
    case "Deleted":
      return { label: "Đã xóa", color: "bg-gray-50 text-gray-600 border-gray-200" };
    default:
      return { label: "Không xác định", color: "bg-gray-50 text-gray-600 border-gray-200" };
  }
};

const FarmDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [farm, setFarm] = useState<FarmProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponseItem[]>([]);
  const [loadingSurvey, setLoadingSurvey] = useState<boolean>(false);
  const [soilData, setSoilData] = useState<SoilData | null>(null);
  const [loadingSoil, setLoadingSoil] = useState<boolean>(false);
  const [showSurveyDialog, setShowSurveyDialog] = useState<boolean>(false);
  const [showAIAdvisoryDialog, setShowAIAdvisoryDialog] = useState<boolean>(false);
  const [aiAdvisoryHistory, setAiAdvisoryHistory] = useState<AIAdvisoryHistoryItem[]>([]);
  const [selectedAdvisory, setSelectedAdvisory] = useState<AIAdvisoryHistoryItem | null>(null);

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

  useEffect(() => {
    const fetchSoilData = async () => {
      if (!id) return;
      try {
        setLoadingSoil(true);
        const response = await getSoilDataByFarmId(Number(id));
        if (response.status && response.data) {
          setSoilData(response.data);
        }
      } catch (e) {
        console.error("Không thể tải dữ liệu đất:", e);
      } finally {
        setLoadingSoil(false);
      }
    };
    fetchSoilData();
  }, [id]);

  // Load lịch sử AI advisory
  useEffect(() => {
    if (id) {
      const history = getAdvisoryHistoryByFarmId(Number(id));
      setAiAdvisoryHistory(history);
    }
  }, [id]);

  const refreshAdvisoryHistory = () => {
    if (id) {
      const history = getAdvisoryHistoryByFarmId(Number(id));
      setAiAdvisoryHistory(history);
    }
  };

  const handleViewAdvisory = (item: AIAdvisoryHistoryItem) => {
    setSelectedAdvisory(item);
    setShowAIAdvisoryDialog(true);
  };

  const handleDeleteAdvisory = (id: string) => {
    if (confirm("Bạn có chắc muốn xóa gợi ý này khỏi lịch sử?")) {
      deleteAdvisoryFromHistory(id);
      refreshAdvisoryHistory();
      if (selectedAdvisory?.id === id) {
        setSelectedAdvisory(null);
      }
    }
  };

  // Helper function để parse và lấy overview từ advisoryText
  const getAdvisoryOverview = (advisoryText: string): string => {
    try {
      // Thử parse JSON nếu là string JSON
      const parsed = JSON.parse(advisoryText);
      if (parsed && typeof parsed === 'object' && parsed.overview) {
        return parsed.overview;
      }
    } catch (e) {
      // Nếu không parse được, trả về text gốc
    }
    // Nếu không phải JSON hoặc không có overview, trả về text gốc
    return advisoryText;
  };

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
                <Card className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 border-blue-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sprout className="h-5 w-5 text-emerald-600" />
                      Thông Tin Cơ Bản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-white/70 border border-gray-100 shadow-sm">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tên trang trại</div>
                        <div className="text-base font-semibold text-gray-900 mt-1">{farm?.farmName || 'Chưa có tên'}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-white/70 border border-gray-100 shadow-sm">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                          <Ruler className="h-3.5 w-3.5" /> Diện tích
                        </div>
                        <div className="text-base font-semibold text-gray-900 mt-1">
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
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quy mô sản xuất</div>
                        {farmScale ? (
                          <div className="space-y-2 p-3 rounded-lg bg-white/80 border border-blue-100">
                            <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-sm font-semibold shadow-sm">
                              {farmScale.scale}
                            </div>
                            <div className="text-sm text-gray-700 font-medium">{farmScale.area}</div>
                            <div className="text-sm text-gray-600 leading-relaxed">{farmScale.description}</div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 italic">Chưa xác định quy mô</div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Trạng thái hoạt động</div>
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-medium mt-1">
                            {farm?.status === 'Active' ? '✓ Đang hoạt động' : farm?.status === 'Maintenance' ? '⚠ Bảo trì' : farm?.status === 'Deleted' ? '✗ Đã xóa' : '? Không xác định'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> Địa chỉ
                          </div>
                          <div className="text-sm text-gray-900 leading-relaxed font-medium mt-1">{addressText}</div>
                        </div>
                        {farm?.address?.latitude && farm?.address?.longitude && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tọa độ GPS</div>
                            <div className="text-sm text-gray-900 font-mono mt-1">
                              {farm.address.latitude.toFixed(6)}, {farm.address.longitude.toFixed(6)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
                      {farm.crops.map((crop, index) => {
                        const status = getStatusMeta(crop.isActive ? "Growing" : (crop.status as string));
                        return (
                          <div
                            key={crop.id || index}
                            className="p-4 border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-sm transition-all bg-white"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                                  crop.isActive 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm' 
                                    : 'bg-gray-50 text-gray-600 border-gray-300'
                                }`}>
                                  {crop.cropName}
                                </span>
                                {crop.cropType && (
                                  <span className="px-2 py-1 rounded-md text-[11px] bg-purple-50 text-purple-700 border border-purple-200">
                                    {getCropTypeLabel(crop.cropType)}
                                  </span>
                                )}
                              </div>
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${status.color}`}>
                                ● {status.label}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              {crop.plantingDate && (
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-gray-500">Ngày trồng</div>
                                  <div className="text-sm text-gray-800 font-medium">
                                    {formatVietnamDate(crop.plantingDate)}
                                  </div>
                                </div>
                              )}
                              {crop.plantingMethod && (
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-gray-500">Phương thức trồng</div>
                                  <div className="px-2 py-1 rounded-md bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700">
                                    {getPlantingMethodLabel(crop.plantingMethod)}
                                  </div>
                                </div>
                              )}
                              {crop.farmingType && (
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-gray-500">Hình thức canh tác</div>
                                  <div className="px-2 py-1 rounded-md bg-green-50 border border-green-200 text-xs font-medium text-green-700">
                                    {getFarmingTypeLabel(crop.farmingType)}
                                  </div>
                                </div>
                              )}
                              {crop.status && (
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-gray-500">Trạng thái</div>
                                  <div className={`px-2 py-1 rounded-md border text-xs font-medium ${status.color}`}>
                                    {status.label}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : farm?.primaryCrops ? (
                    <div className="text-sm text-gray-900 font-medium">{farm.primaryCrops}</div>
                  ) : (
                    <div className="text-sm text-gray-500 italic text-center py-4">Chưa có thông tin về cây trồng</div>
                  )}
                </CardContent>
              </Card>

              {/* Thông tin đất */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dữ Liệu Đất</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingSoil ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      <span className="ml-2 text-sm text-gray-600">Đang tải dữ liệu đất...</span>
                    </div>
                  ) : soilData ? (
                    <div className="space-y-4">
                      {/* 3 lớp đất: 0-5cm, 5-15cm, 15-30cm */}
                      {[
                        { label: "Độ sâu 0–5 cm", index: 0 },
                        { label: "Độ sâu 5-15cm", index: 1 },
                        { label: "Độ sâu 15-30cm", index: 2 },
                      ].map((layer) => (
                        <div key={layer.index} className="p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50">
                          <div className="text-sm font-semibold text-gray-900 mb-3">{layer.label}</div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-gray-600">Cát (%)</div>
                              <div className="text-base font-semibold text-amber-700">
                                {soilData.sandLayers[layer.index]?.toFixed(1) || '-'}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-gray-600">Bùn (%)</div>
                              <div className="text-base font-semibold text-blue-700">
                                {soilData.siltLayers[layer.index]?.toFixed(1) || '-'}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-gray-600">Sét (%)</div>
                              <div className="text-base font-semibold text-red-700">
                                {soilData.clayLayers[layer.index]?.toFixed(1) || '-'}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-gray-600">pH</div>
                              <div className="text-base font-semibold text-green-700">
                                {soilData.phLayers[layer.index]?.toFixed(1) || '-'}
                              </div>
                            </div>
                          </div>
                          {/* Progress bars để hiển thị tỷ lệ */}
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-amber-500" 
                                  style={{ width: `${soilData.sandLayers[layer.index] || 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600 w-12 text-right">Cát</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500" 
                                  style={{ width: `${soilData.siltLayers[layer.index] || 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600 w-12 text-right">Bùn</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-red-500" 
                                  style={{ width: `${soilData.clayLayers[layer.index] || 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600 w-12 text-right">Sét</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-8 italic">
                      Chưa có dữ liệu đất cho trang trại này
                    </div>
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
                      {farm?.createdAt ? formatVietnamDateTime(farm.createdAt) : 'Chưa có thông tin'}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cập nhật lần cuối</div>
                    <div className="text-sm text-gray-900 font-medium">
                      {farm?.updatedAt ? formatVietnamDateTime(farm.updatedAt) : 'Chưa có thông tin'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Kết quả khảo sát */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Kết Quả Khảo Sát</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSurveyDialog(true)}
                        className="gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Làm khảo sát
                      </Button>
                    </div>
                  </div>
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
                                {formatVietnamDate(response.updatedAt)}
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
                    <div className="space-y-4">
                      <div className="text-sm text-gray-500 text-center py-8 italic">
                        Chưa có kết quả khảo sát cho trang trại này
                      </div>
                      <div className="text-center">
                        <Button
                          variant="default"
                          onClick={() => setShowSurveyDialog(true)}
                          className="gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Bắt đầu làm khảo sát
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lịch sử AI Tư vấn */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">AI Đánh Giá Trang Trại</CardTitle>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setSelectedAdvisory(null);
                        setShowAIAdvisoryDialog(true);
                      }}
                      className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      disabled={surveyResponses.length === 0}
                    >
                      <Sparkles className="h-4 w-4" />
                      AI đánh giá trang trại
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {aiAdvisoryHistory.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">Thời gian</TableHead>
                            <TableHead>Nội dung tư vấn</TableHead>
                            <TableHead className="w-[120px]">Thông tin</TableHead>
                            <TableHead className="w-[100px]">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {aiAdvisoryHistory.map((item) => (
                            <TableRow
                              key={item.id}
                              className={selectedAdvisory?.id === item.id ? "bg-purple-50" : ""}
                            >
                              <TableCell className="font-medium">
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm">{formatVietnamDate(item.createdAt)}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(item.createdAt).toLocaleTimeString("vi-VN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm text-gray-900 line-clamp-2">
                                  {(() => {
                                    const overview = getAdvisoryOverview(item.advisoryText);
                                    return overview.length > 200 
                                      ? `${overview.substring(0, 200)}...` 
                                      : overview;
                                  })()}
                                </p>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  {item.surveyResponsesCount && (
                                    <Badge variant="outline" className="w-fit text-xs">
                                      {item.surveyResponsesCount} khảo sát
                                    </Badge>
                                  )}
                                  {item.hasSoilData && (
                                    <Badge variant="outline" className="w-fit text-xs">
                                      Có dữ liệu đất
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewAdvisory(item)}
                                    className="h-8 w-8 p-0"
                                    title="Xem chi tiết"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteAdvisory(item.id)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    title="Xóa"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-500 text-center py-8 italic">
                        Chưa có lịch sử tư vấn AI cho trang trại này
                      </div>
                      {surveyResponses.length > 0 && (
                        <div className="text-center">
                          <Button
                            variant="default"
                            onClick={() => {
                              setSelectedAdvisory(null);
                              setShowAIAdvisoryDialog(true);
                            }}
                            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          >
                            <Sparkles className="h-4 w-4" />
                            Tạo tư vấn AI đầu tiên
                          </Button>
                        </div>
                      )}
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
                <div className="text-[12px] text-gray-900">{farm?.updatedAt ? formatVietnamDate(farm.updatedAt) : '-'}</div>
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
                          ({formatVietnamDate(crop.plantingDate)})
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

      {/* Survey Form Dialog */}
      {id && (
        <SurveyFormDialog
          open={showSurveyDialog}
          onOpenChange={setShowSurveyDialog}
          farmId={Number(id)}
          onSuccess={() => {
            // Reload survey responses after successful submission
            const fetchSurveyResponses = async () => {
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
          }}
        />
      )}

      {/* AI Advisory Dialog */}
      {id && (
        <AIAdvisoryDialog
          open={showAIAdvisoryDialog}
          onOpenChange={(open) => {
            setShowAIAdvisoryDialog(open);
            if (!open) {
              setSelectedAdvisory(null);
            }
          }}
          farm={farm}
          surveyResponses={surveyResponses}
          soilData={soilData}
          onSuccess={refreshAdvisoryHistory}
          initialAdvisory={selectedAdvisory?.advisoryText || null}
        />
      )}
    </div>
  );
};

export default FarmDetailPage;
export { FarmDetailPage };


