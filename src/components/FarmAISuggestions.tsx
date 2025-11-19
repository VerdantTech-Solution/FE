import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAISuggestions, type AISuggestionsResponse, type WeatherRisk, type DetailedAdvice } from "@/api/aiSuggestions";
import { Loader2 } from "lucide-react";

const SuggestionItem = ({ title, subtitle, priority = "medium", done }: { title: string; subtitle: string; priority?: "high" | "medium" | "low"; done?: boolean }) => {
  const color = done ? "text-emerald-600" : priority === "high" ? "text-red-600" : priority === "low" ? "text-gray-500" : "text-amber-600";
  const badge = done ? "Đã hoàn thành" : priority === "high" ? "Ưu tiên cao" : priority === "low" ? "Ưu tiên thấp" : "Ưu tiên vừa";
  return (
    <div className="flex items-start justify-between p-4 rounded-lg border bg-white">
      <div>
        <div className="font-medium text-gray-900">{title}</div>
        <div className="text-sm text-gray-600 mt-1">{subtitle}</div>
      </div>
      <div className={`text-xs px-2.5 py-1 rounded-full border ${done ? "bg-emerald-50 border-emerald-200" : priority === "high" ? "bg-red-50 border-red-200" : priority === "low" ? "bg-gray-50 border-gray-200" : "bg-amber-50 border-amber-200"} ${color}`}>
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const skipInitialEffect = useRef(import.meta.env.DEV);

  useEffect(() => {
    if (skipInitialEffect.current) {
      skipInitialEffect.current = false;
      return;
    }

    const abortController = new AbortController();

    const fetchAISuggestions = async () => {
      if (!farmId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getAISuggestions(farmId, abortController.signal);
        if (!abortController.signal.aborted) {
          setData(response);
        }
      } catch (err: any) {
        if (!abortController.signal.aborted) {
          console.error("Error fetching AI suggestions:", err);
          setError(err?.message || "Không thể tải gợi ý từ AI");
          setData(null);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchAISuggestions();

    return () => {
      abortController.abort();
    };
  }, [farmId]);

  if (loading) {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">AI Gợi ý thông minh</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Đang tải gợi ý từ AI...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">AI Gợi ý thông minh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-red-50 border-red-200 text-red-700 p-3 text-sm">
            ⚠️ {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || (!data.suggestions?.length && !data.weatherRisks?.length && !data.soil && !data.co2 && !data.detailedAdvice?.length)) {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">AI Gợi ý thông minh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-gray-50 border-gray-200 text-gray-700 p-3 text-sm">
            Chưa có gợi ý từ AI. Vui lòng thử lại sau.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">AI Gợi ý thông minh</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Advice Items */}
        {data.suggestions && data.suggestions.length > 0 && (
          <>
            {data.suggestions.map((item, index) => (
              <SuggestionItem
                key={index}
                title={item.title}
                subtitle={item.subtitle}
                priority={item.priority}
                done={item.done}
              />
            ))}
          </>
        )}

        {/* Weather Risks */}
        {data.weatherRisks && data.weatherRisks.length > 0 && (
          <div className="rounded-lg border bg-blue-50 border-blue-200 p-3 text-sm">
            <div className="font-medium text-blue-900 mb-2">⚠️ Cảnh báo thời tiết</div>
            {data.weatherRisks.map((risk: WeatherRisk, index) => (
              <div key={index} className="mb-2 last:mb-0">
                <div className="text-blue-800 font-medium">{risk.time_range}</div>
                <div className="text-blue-700 mt-1">Rủi ro: {risk.risk}</div>
                <div className="text-blue-600 mt-1 text-xs">{risk.impact}</div>
                <div className="text-blue-700 mt-2 font-medium">Biện pháp: {risk.mitigation}</div>
              </div>
            ))}
          </div>
        )}

        {/* Soil Information */}
        {data.soil && (
          <div className="rounded-lg border bg-amber-50 border-amber-200 p-3 text-sm">
            <div className="font-medium text-amber-900 mb-2">🌱 Thông tin đất</div>
            <div className="text-amber-800">Loại đất: {data.soil.type}</div>
            <div className="text-amber-700 mt-1 text-xs">{data.soil.description}</div>
            {data.soil.ph_recommendation && (
              <div className="text-amber-800 mt-2">{data.soil.ph_recommendation}</div>
            )}
          </div>
        )}

        {/* CO2 Information */}
        {data.co2 && data.co2.recommendation && (
          <div className="rounded-lg border bg-green-50 border-green-200 p-3 text-sm">
            <div className="font-medium text-green-900 mb-2">🌍 Khí thải CO2e</div>
            <div className="text-green-800">{data.co2.recommendation}</div>
          </div>
        )}

        {/* Detailed Advice */}
        {data.detailedAdvice && data.detailedAdvice.length > 0 && (
          <div className="rounded-lg border bg-purple-50 border-purple-200 p-3 text-sm">
            <div className="font-medium text-purple-900 mb-2">💡 Lời khuyên chi tiết</div>
            {data.detailedAdvice.map((item: DetailedAdvice, index) => (
              <div key={index} className="mb-3 last:mb-0">
                <div className="text-purple-800 font-medium mb-1">{item.crop}</div>
                <div className="text-purple-700 whitespace-pre-line text-xs">{item.advice}</div>
              </div>
            ))}
          </div>
        )}

        {/* AI Tip */}
        <div className="rounded-lg border bg-emerald-50 text-emerald-700 p-3 text-sm">
          {data.tip || "Mẹo từ AI: Thực hiện các gợi ý ưu tiên cao trước để tối ưu hoá năng suất và giảm thiểu rủi ro cho trang trại của bạn."}
        </div>
      </CardContent>
    </Card>
  );
};

export default FarmAISuggestions;


