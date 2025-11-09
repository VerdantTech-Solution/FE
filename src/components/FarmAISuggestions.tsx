import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export const FarmAISuggestions = () => {
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">AI Gợi ý thông minh</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <SuggestionItem title="Tưới nước cho lúa" subtitle="Độ ẩm đất hiện tại thấp (45%). Nên tưới nước trong 2 ngày tới trước khi mưa." priority="high" />
        <SuggestionItem title="Kiểm tra sâu bệnh trên ngô" subtitle="Thời tiết ẩm ướt tạo điều kiện cho sâu bệnh phát triển. Kiểm tra và phun thuốc phòng trừ." />
        <SuggestionItem title="Bón phân cho rau xanh" subtitle="Đang phát triển mạnh, nên bón phân NPK để tăng năng suất." />
        <SuggestionItem title="Chuẩn bị thu hoạch lúa" subtitle="Lúa sẽ chín trong 2-3 tuần. Chuẩn bị máy móc và lên kế hoạch thu hoạch." priority="low" />
        <SuggestionItem title="Bảo trì hệ thống tưới" subtitle="Kiểm tra và làm sạch hệ thống tưới để đảm bảo hoạt động tốt trong mưa sắp tới." done />
        <div className="rounded-lg border bg-emerald-50 text-emerald-700 p-3 text-sm">Mẹo từ AI: Thực hiện các gợi ý ưu tiên cao trước để tối ưu hoá năng suất và giảm thiểu rủi ro cho trang trại của bạn.</div>
      </CardContent>
    </Card>
  );
};

export default FarmAISuggestions;


