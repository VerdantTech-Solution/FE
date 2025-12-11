import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { fetchFarmAIAdvisory } from "@/services/farmAdvisoryService";
import { saveAdvisoryToHistory } from "@/services/aiAdvisoryHistoryService";
import type { FarmProfile } from "@/api/farm";
import type { SurveyResponseItem } from "@/api/survey";

interface AIAdvisoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farm: FarmProfile | null;
  surveyResponses: SurveyResponseItem[];
  soilData: any;
  onSuccess?: () => void; // Callback khi tạo gợi ý thành công
  initialAdvisory?: string | null; // Gợi ý ban đầu từ lịch sử (nếu có)
}

export const AIAdvisoryDialog = ({
  open,
  onOpenChange,
  farm,
  surveyResponses,
  soilData,
  onSuccess,
  initialAdvisory,
}: AIAdvisoryDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && farm) {
      // Nếu có gợi ý ban đầu từ lịch sử, hiển thị nó
      if (initialAdvisory) {
        setAiResponse(initialAdvisory);
        setError(null);
      } else {
        // Nếu không có, gọi AI mới
        fetchAIAdvisory();
      }
    } else {
      // Reset khi đóng dialog
      setAiResponse(null);
      setError(null);
    }
  }, [open, farm, initialAdvisory]);

  const fetchAIAdvisory = async () => {
    if (!farm) return;

    setLoading(true);
    setError(null);
    setAiResponse(null);

    try {
      // Sử dụng service để gọi AI tư vấn
      const response = await fetchFarmAIAdvisory(farm, surveyResponses, soilData);
      setAiResponse(response);

      // Lưu vào lịch sử
      if (response && farm.id) {
        saveAdvisoryToHistory(
          farm.id,
          farm.farmName,
          response,
          surveyResponses.length,
          !!soilData
        );
        
        // Gọi callback để refresh danh sách ở parent component
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      console.error("Error fetching AI advisory:", err);
      setError(
        err?.message || "Đã có lỗi xảy ra khi gọi dịch vụ AI. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            AI Tư Vấn Tổng Quan Trang Trại
          </DialogTitle>
          <DialogDescription>
            Phân tích và tư vấn dựa trên thông tin trang trại, khảo sát và dữ liệu đất
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
              <p className="text-gray-600">Đang phân tích và tạo tư vấn...</p>
              <p className="text-sm text-gray-500 mt-2">Vui lòng đợi trong giây lát</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Lỗi</h3>
              <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>
              <Button
                onClick={fetchAIAdvisory}
                variant="outline"
                className="mt-4"
                disabled={loading}
              >
                Thử lại
              </Button>
            </div>
          ) : aiResponse ? (
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {aiResponse}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <p className="text-gray-600">Chưa có dữ liệu tư vấn</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Đóng
          </Button>
          {aiResponse && (
            <Button
              onClick={fetchAIAdvisory}
              disabled={loading}
              variant="secondary"
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Làm mới
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

