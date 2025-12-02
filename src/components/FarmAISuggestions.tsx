import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { getAISuggestions, type AISuggestionsResponse, type WeatherRisk, type DetailedAdvice } from "@/api/aiSuggestions";
import { Loader2, AlertTriangle, Droplets, Leaf, Factory, Lightbulb, TrendingUp, Shield, Sparkles } from "lucide-react";

const aiSuggestionsCache = new Map<number, { data: AISuggestionsResponse; timestamp: number }>();

const SuggestionItem = ({ title, subtitle, priority = "medium", done }: { title: string; subtitle: string; priority?: "high" | "medium" | "low"; done?: boolean }) => {
  const color = done ? "text-emerald-600" : priority === "high" ? "text-red-600" : priority === "low" ? "text-gray-500" : "text-amber-600";
  const badge = done ? "Đã hoàn thành" : priority === "high" ? "Ưu tiên cao" : priority === "low" ? "Ưu tiên thấp" : "Ưu tiên vừa";
  const bgColor = done ? "bg-emerald-50 border-emerald-200" : priority === "high" ? "bg-red-50 border-red-200" : priority === "low" ? "bg-gray-50 border-gray-200" : "bg-amber-50 border-amber-200";
  
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${bgColor} transition-all hover:shadow-md`}>
      <div className="flex-1">
        <div className="font-semibold text-gray-900 mb-1.5">{title}</div>
        <div className="text-sm text-gray-700 leading-relaxed">{subtitle}</div>
      </div>
      <div className={`text-xs font-medium px-3 py-1.5 rounded-full border shrink-0 ${bgColor} ${color}`}>
        {badge}
      </div>
    </div>
  );
};

interface FarmAISuggestionsProps {
  farmId?: number;
}

export const FarmAISuggestions = ({ farmId }: FarmAISuggestionsProps) => {
  const [data, setData] = useState<AISuggestionsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRequested, setHasRequested] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAISuggestions = useCallback(async () => {
    if (!farmId) {
      setHasRequested(true);
      setError("Vui lòng chọn trang trại trước khi yêu cầu gợi ý.");
      setData(null);
      setLastUpdated(null);
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setHasRequested(true);
      setLoading(true);
      setError(null);
      const response = await getAISuggestions(farmId, controller.signal);
      if (!controller.signal.aborted) {
        setData(response);
        const timestamp = Date.now();
        setLastUpdated(new Date(timestamp));
        aiSuggestionsCache.set(farmId, { data: response, timestamp });
      }
    } catch (err: any) {
      if (!controller.signal.aborted) {
        console.error("Error fetching AI suggestions:", err);
        setError(err?.message || "Không thể tải gợi ý từ AI");
        setData(null);
        setLastUpdated(null);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [farmId]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    abortControllerRef.current?.abort();
    setError(null);
    setLoading(false);

    if (!farmId) {
      setData(null);
      setHasRequested(false);
      setLastUpdated(null);
      return;
    }

    const cached = aiSuggestionsCache.get(farmId);
    if (cached) {
      setData(cached.data);
      setHasRequested(true);
      setLastUpdated(new Date(cached.timestamp));
    } else {
      setData(null);
      setHasRequested(false);
      setLastUpdated(null);
    }
  }, [farmId]);

  const hasResults =
    !!data &&
    !!(
      data.suggestions?.length ||
      data.weatherRisks?.length ||
      data.soil ||
      data.co2 ||
      data.detailedAdvice?.length
    );

  return (
    <div className="mt-4 space-y-4">
      <Card className="border border-dashed border-emerald-200 bg-emerald-50/40">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              AI Gợi ý thông minh
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Nhận khuyến nghị nông nghiệp từ AI dựa trên dữ liệu thời tiết và trang trại của bạn. Vui lòng cung cấp số liệu CO2 trước khi yêu cầu gợi ý.
            </p>
          </div>
          <Button
            onClick={fetchAISuggestions}
            disabled={loading}
            size="lg"
            className="w-full sm:w-auto"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Ai gợi ý nông nghiệp
          </Button>
        </CardHeader>
        {(!hasRequested || !farmId || lastUpdated) && (
          <CardContent className="space-y-3 text-sm text-gray-600">
            {!hasRequested && (
              <div className="rounded-lg border border-emerald-200/70 bg-white/70 p-3">
                Nhấn nút để AI phân tích đất, thời tiết và khí thải nhằm đề xuất hành động phù hợp nhất.
              </div>
            )}
            {!farmId && (
              <div className="rounded-lg border border-red-200 bg-red-50/80 p-3 text-red-700">
                Vui lòng chọn trang trại trước khi yêu cầu gợi ý.
              </div>
            )}
            {lastUpdated && (
              <div className="text-xs text-emerald-700">
                Cập nhật lần cuối: {lastUpdated.toLocaleString()}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {loading && (
        <Card className="overflow-hidden border-none shadow-lg">
          <CardContent className="p-0">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-lime-50 via-emerald-50 to-sky-50 p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_60%)]" />
              <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                <Spinner variant="circle-filled" className="text-emerald-600" size={48} />
                <div>
                  <p className="text-base font-semibold text-emerald-900">AI đang phân tích trang trại của bạn...</p>
                  <p className="text-sm text-emerald-700">Chỉ mất vài giây để tạo ra gợi ý cá nhân hoá.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && hasRequested && error && (
        <Card className="border-red-200 bg-red-50/80">
          <CardContent className="flex flex-col gap-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <div>⚠️ {error}</div>
            <Button variant="outline" size="sm" onClick={fetchAISuggestions}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && hasRequested && !error && !hasResults && (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="flex flex-col items-center gap-3 text-center text-gray-700">
            <Lightbulb className="h-6 w-6 text-amber-500" />
            <p>Chưa có gợi ý từ AI. Vui lòng thử lại sau.</p>
            <Button variant="secondary" onClick={fetchAISuggestions}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && hasResults && data && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              AI Gợi ý thông minh
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Advice Items */}
            {data.suggestions && data.suggestions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Gợi ý hành động</h3>
                </div>
                {data.suggestions.map((item, index) => (
                  <SuggestionItem
                    key={index}
                    title={item.title}
                    subtitle={item.subtitle}
                    priority={item.priority}
                    done={item.done}
                  />
                ))}
              </div>
            )}

            {/* Weather Risks */}
            {data.weatherRisks && data.weatherRisks.length > 0 && (
              <div className="rounded-lg border-2 bg-gradient-to-br from-red-50 to-rose-50 border-red-300 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold text-red-900">Cảnh báo thời tiết</h3>
                </div>
                <div className="space-y-4">
                  {data.weatherRisks.map((risk: WeatherRisk, index) => (
                    <div key={index} className="bg-white/80 rounded-lg p-4 border border-red-200">
                      <div className="flex items-start gap-2 mb-2">
                        <Shield className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <div className="text-red-900 font-semibold mb-1">{risk.time_range}</div>
                          <div className="text-red-800 font-medium mb-2">Rủi ro: {risk.risk}</div>
                          <div className="text-red-700 text-sm mb-2 leading-relaxed">{risk.impact}</div>
                          <div className="bg-red-100 rounded p-2 mt-2">
                            <div className="text-red-900 font-medium text-sm mb-1">🛡️ Biện pháp:</div>
                            <div className="text-red-800 text-sm leading-relaxed">{risk.mitigation}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Soil Information */}
            {data.soil && (
              <div className="rounded-lg border-2 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Leaf className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-900">Thông tin đất</h3>
                </div>
                <div className="bg-white/70 rounded-lg p-4 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-900 font-semibold">Loại đất:</span>
                    <span className="text-amber-800">{data.soil.type}</span>
                  </div>
                  {data.soil.ph !== undefined && data.soil.ph !== null && (
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-amber-600" />
                      <span className="text-amber-900 font-semibold">pH:</span>
                      <span className="text-amber-800">{data.soil.ph}</span>
                      {data.soil.ph_status && (
                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                          {data.soil.ph_status}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="text-amber-700 text-sm leading-relaxed mt-2">{data.soil.description}</div>
                  {data.soil.ph_recommendation && (
                    <div className="bg-amber-100 rounded p-3 mt-3">
                      <div className="text-amber-900 font-medium text-sm mb-1">💡 Khuyến nghị về pH:</div>
                      <div className="text-amber-800 text-sm leading-relaxed">{data.soil.ph_recommendation}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CO2 Information */}
            {data.co2 && (
              <div className="rounded-lg border-2 bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Factory className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Khí thải CO₂</h3>
                </div>
                <div className="bg-white/70 rounded-lg p-4 border border-green-200">
                  {data.co2.total && (
                    <div className="mb-3">
                      <div className="text-green-900 font-bold text-lg mb-2">Tổng phát thải: {data.co2.total} kg CO₂e</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {data.co2.fertilizer && (
                          <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                            <span className="text-green-700">Phân bón:</span>
                            <span className="text-green-900 font-semibold">{data.co2.fertilizer}</span>
                          </div>
                        )}
                        {data.co2.fuel && (
                          <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                            <span className="text-green-700">Nhiên liệu:</span>
                            <span className="text-green-900 font-semibold">{data.co2.fuel}</span>
                          </div>
                        )}
                        {data.co2.irrigation_energy && (
                          <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                            <span className="text-green-700">Năng lượng tưới:</span>
                            <span className="text-green-900 font-semibold">{data.co2.irrigation_energy}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {data.co2.recommendation && (
                    <div className="bg-green-100 rounded p-3 mt-3">
                      <div className="text-green-900 font-medium text-sm mb-1">💡 Khuyến nghị:</div>
                      <div className="text-green-800 text-sm leading-relaxed">{data.co2.recommendation}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Detailed Advice */}
            {data.detailedAdvice && data.detailedAdvice.length > 0 && (
              <div className="rounded-lg border-2 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-300 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Lời khuyên chi tiết</h3>
                </div>
                <div className="space-y-4">
                  {data.detailedAdvice.map((item: DetailedAdvice, index) => (
                    <div key={index} className="bg-white/70 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-purple-900 font-bold text-base">{item.crop}</span>
                      </div>
                      <div className="text-purple-800 text-sm leading-relaxed whitespace-pre-line">{item.advice}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Tip */}
            {data.tip && (
              <div className="rounded-lg border-2 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300 p-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="text-emerald-800 text-sm leading-relaxed">{data.tip}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FarmAISuggestions;


