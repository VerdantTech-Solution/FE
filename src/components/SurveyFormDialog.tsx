import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { submitFarmSurvey } from "@/services/farmAdvisoryService";

interface SurveyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmId: number;
  onSuccess?: () => void;
}

export const SurveyFormDialog = ({
  open,
  onOpenChange,
  farmId,
  onSuccess,
}: SurveyFormDialogProps) => {
  const [surveyAnswers, setSurveyAnswers] = useState<Record<number, string>>({
    1: "", // Mục đích chính
    2: "", // Công cụ/phương pháp canh tác
    3: "", // Phân bón/chất dinh dưỡng
    4: "", // Chất lượng đất
    5: "", // Điều kiện ánh sáng
    6: "", // Nguồn nước
    7: "", // Sâu bệnh
    8: "", // Khó khăn gần đây
    9: "", // Biện pháp xử lý
    10: "", // Mong muốn cải thiện
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSurveyAnswer = (questionId: number, answer: string) => {
    setSurveyAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const validateForm = (): boolean => {
    return Object.keys(surveyAnswers).every(
      (key) => surveyAnswers[Number(key)] && surveyAnswers[Number(key)].trim() !== ""
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError("Vui lòng trả lời đầy đủ tất cả các câu hỏi");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const surveyAnswersArray = Object.keys(surveyAnswers).map((key) => ({
        questionId: Number(key),
        textAnswer: surveyAnswers[Number(key)].trim(),
      }));

      // Sử dụng service để gửi khảo sát (tự động lưu bản mới nhất)
      await submitFarmSurvey(farmId, surveyAnswersArray);

      // Reset form
      setSurveyAnswers({
        1: "",
        2: "",
        3: "",
        4: "",
        5: "",
        6: "",
        7: "",
        8: "",
        9: "",
        10: "",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error submitting survey:", err);
      setError(err?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] lg:max-w-[85vw] xl:max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Làm Khảo Sát Trang Trại</DialogTitle>
          <DialogDescription>
            Vui lòng trả lời đầy đủ các câu hỏi sau để cập nhật thông tin khảo sát mới nhất
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Question 1: Mục đích chính */}
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <Label className="text-base font-semibold mb-4 block">
                1. Mục đích chính khi bạn canh tác nông trại này là gì? <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-3">
                {[
                  { value: "A. Tự cung cấp", label: "A. Tự cung cấp" },
                  { value: "B. Kinh doanh nhỏ", label: "B. Kinh doanh nhỏ" },
                  { value: "C. Sản xuất thương mại", label: "C. Sản xuất thương mại" },
                  { value: "D. Khác", label: "D. Khác" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="question1"
                      value={option.value}
                      checked={surveyAnswers[1] === option.value || (option.value === "D. Khác" && surveyAnswers[1].startsWith("D. Khác"))}
                      onChange={(e) => handleSurveyAnswer(1, e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
                {(surveyAnswers[1] === "D. Khác" || surveyAnswers[1].startsWith("D. Khác")) && (
                  <Input
                    placeholder="Nhập mục đích khác..."
                    value={surveyAnswers[1].startsWith("D. Khác") ? surveyAnswers[1].replace("D. Khác", "").trim() : ""}
                    onChange={(e) => handleSurveyAnswer(1, e.target.value ? `D. Khác ${e.target.value}` : "D. Khác")}
                    className="mt-2 ml-6"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Question 2: Công cụ/phương pháp canh tác */}
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <Label className="text-base font-semibold mb-4 block">
                2. Bạn đang sử dụng những công cụ hoặc phương pháp canh tác nào? <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Ví dụ: Máy cày, tưới nhỏ giọt, canh tác hữu cơ..."
                value={surveyAnswers[2]}
                onChange={(e) => handleSurveyAnswer(2, e.target.value)}
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Question 3: Phân bón/chất dinh dưỡng */}
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <Label className="text-base font-semibold mb-4 block">
                3. Bạn có đang sử dụng phân bón hoặc chất dinh dưỡng cho cây không? <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-3">
                {[
                  { value: "A. Không sử dụng", label: "A. Không sử dụng" },
                  { value: "B. Phân hữu cơ", label: "B. Phân hữu cơ" },
                  { value: "C. Phân vi sinh", label: "C. Phân vi sinh" },
                  { value: "D. NPK / phân hóa học", label: "D. NPK / phân hóa học" },
                  { value: "E. Khác", label: "E. Khác" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="question3"
                      value={option.value}
                      checked={surveyAnswers[3] === option.value || (option.value === "E. Khác" && surveyAnswers[3].startsWith("E. Khác"))}
                      onChange={(e) => handleSurveyAnswer(3, e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
                {(surveyAnswers[3] === "E. Khác" || surveyAnswers[3].startsWith("E. Khác")) && (
                  <Input
                    placeholder="Ghi rõ loại phân đang dùng..."
                    value={surveyAnswers[3].startsWith("E. Khác") ? surveyAnswers[3].replace("E. Khác", "").trim() : ""}
                    onChange={(e) => handleSurveyAnswer(3, e.target.value ? `E. Khác ${e.target.value}` : "E. Khác")}
                    className="mt-2 ml-6"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Question 4: Chất lượng đất */}
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <Label className="text-base font-semibold mb-4 block">
                4. Chất lượng đất hoặc giá thể tại nông trại hiện như thế nào? <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-3">
                {[
                  { value: "A. Đất khô / thiếu ẩm", label: "A. Đất khô / thiếu ẩm" },
                  { value: "B. Đất bị úng – thoát nước kém", label: "B. Đất bị úng – thoát nước kém" },
                  { value: "C. Đất chua / pH thấp", label: "C. Đất chua / pH thấp" },
                  { value: "D. Đất thiếu dinh dưỡng", label: "D. Đất thiếu dinh dưỡng" },
                  { value: "E. Đất nén chặt", label: "E. Đất nén chặt" },
                  { value: "F. Không gặp vấn đề", label: "F. Không gặp vấn đề" },
                  { value: "G. Khác", label: "G. Khác" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="question4"
                      value={option.value}
                      checked={surveyAnswers[4] === option.value || (option.value === "G. Khác" && surveyAnswers[4].startsWith("G. Khác"))}
                      onChange={(e) => handleSurveyAnswer(4, e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
                {(surveyAnswers[4] === "G. Khác" || surveyAnswers[4].startsWith("G. Khác")) && (
                  <Input
                    placeholder="Mô tả..."
                    value={surveyAnswers[4].startsWith("G. Khác") ? surveyAnswers[4].replace("G. Khác", "").trim() : ""}
                    onChange={(e) => handleSurveyAnswer(4, e.target.value ? `G. Khác ${e.target.value}` : "G. Khác")}
                    className="mt-2 ml-6"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Question 5: Điều kiện ánh sáng */}
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <Label className="text-base font-semibold mb-4 block">
                5. Điều kiện ánh sáng tại khu vực trồng như thế nào? <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-3">
                {[
                  { value: "A. Nắng đầy đủ", label: "A. Nắng đầy đủ" },
                  { value: "B. Bán râm", label: "B. Bán râm" },
                  { value: "C. Râm nhiều", label: "C. Râm nhiều" },
                  { value: "D. Có che chắn", label: "D. Có che chắn (nhà lưới, lưới lan, mái tôn, vật liệu khác…)" },
                  { value: "E. Ánh sáng thay đổi không ổn định", label: "E. Ánh sáng thay đổi không ổn định" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="question5"
                      value={option.value}
                      checked={surveyAnswers[5] === option.value}
                      onChange={(e) => handleSurveyAnswer(5, e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Question 6: Nguồn nước */}
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <Label className="text-base font-semibold mb-4 block">
                6. Nguồn nước và tình trạng nước hiện tại ra sao? <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-3">
                {[
                  { value: "A. Ổn định – đủ dùng", label: "A. Ổn định – đủ dùng" },
                  { value: "B. Thiếu nước", label: "B. Thiếu nước" },
                  { value: "C. Nguồn nước yếu / áp lực thấp", label: "C. Nguồn nước yếu / áp lực thấp" },
                  { value: "D. Nước bị phèn", label: "D. Nước bị phèn" },
                  { value: "E. Nước bị mặn", label: "E. Nước bị mặn" },
                  { value: "F. Không rõ / chưa kiểm tra", label: "F. Không rõ / chưa kiểm tra" },
                  { value: "G. Khác", label: "G. Khác" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="question6"
                      value={option.value}
                      checked={surveyAnswers[6] === option.value || (option.value === "G. Khác" && surveyAnswers[6].startsWith("G. Khác"))}
                      onChange={(e) => handleSurveyAnswer(6, e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
                {(surveyAnswers[6] === "G. Khác" || surveyAnswers[6].startsWith("G. Khác")) && (
                  <Input
                    placeholder="Mô tả..."
                    value={surveyAnswers[6].startsWith("G. Khác") ? surveyAnswers[6].replace("G. Khác", "").trim() : ""}
                    onChange={(e) => handleSurveyAnswer(6, e.target.value ? `G. Khác ${e.target.value}` : "G. Khác")}
                    className="mt-2 ml-6"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Question 7: Sâu bệnh */}
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <Label className="text-base font-semibold mb-4 block">
                7. Rau củ có đang gặp sâu bệnh hoặc dấu hiệu bất thường nào không? <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Mô tả triệu chứng nếu có..."
                value={surveyAnswers[7]}
                onChange={(e) => handleSurveyAnswer(7, e.target.value)}
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Question 8: Khó khăn gần đây */}
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <Label className="text-base font-semibold mb-4 block">
                8. Trong quá trình chăm sóc gần đây, bạn gặp khó khăn hay thay đổi gì không? <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Ví dụ: thời tiết, tưới nước, thiếu nhân lực, thay đổi vật tư…"
                value={surveyAnswers[8]}
                onChange={(e) => handleSurveyAnswer(8, e.target.value)}
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Question 9: Biện pháp xử lý */}
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <Label className="text-base font-semibold mb-4 block">
                9. Nếu có vấn đề xảy ra, bạn thường xử lý bằng biện pháp nào? <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-3">
                {[
                  { value: "A. Chế phẩm sinh học", label: "A. Chế phẩm sinh học" },
                  { value: "B. Thuốc hóa học", label: "B. Thuốc hóa học" },
                  { value: "C. Biện pháp thủ công", label: "C. Biện pháp thủ công (bắt sâu – tỉa lá…)" },
                  { value: "D. Thiết bị hỗ trợ", label: "D. Thiết bị hỗ trợ (bẫy côn trùng, cảm biến…)" },
                  { value: "E. Chưa áp dụng biện pháp nào", label: "E. Chưa áp dụng biện pháp nào" },
                  { value: "F. Khác", label: "F. Khác" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="question9"
                      value={option.value}
                      checked={surveyAnswers[9] === option.value || (option.value === "F. Khác" && surveyAnswers[9].startsWith("F. Khác"))}
                      onChange={(e) => handleSurveyAnswer(9, e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
                {(surveyAnswers[9] === "F. Khác" || surveyAnswers[9].startsWith("F. Khác")) && (
                  <Input
                    placeholder="Ghi rõ..."
                    value={surveyAnswers[9].startsWith("F. Khác") ? surveyAnswers[9].replace("F. Khác", "").trim() : ""}
                    onChange={(e) => handleSurveyAnswer(9, e.target.value ? `F. Khác ${e.target.value}` : "F. Khác")}
                    className="mt-2 ml-6"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Question 10: Mong muốn cải thiện */}
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <Label className="text-base font-semibold mb-4 block">
                10. Bạn muốn cải thiện điều gì và mong muốn hệ thống AI hỗ trợ những gì? <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Mô tả mong muốn của bạn..."
                value={surveyAnswers[10]}
                onChange={(e) => handleSurveyAnswer(10, e.target.value)}
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !validateForm()}
            className="gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu Khảo Sát"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

