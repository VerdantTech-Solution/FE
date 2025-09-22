import React from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ThermometerSun, Droplets, CloudRain, Edit, Sun, Cloud, CloudRain as Rain } from "lucide-react";

const StatItem = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg border bg-white">
    <div className="w-9 h-9 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
      {icon}
    </div>
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-base font-semibold text-gray-900">{value}</div>
    </div>
  </div>
);

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

const FarmDetailPage = () => {
  const navigate = useNavigate();

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
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Dự báo thời tiết 7 ngày</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { day: "Hôm nay", date: "19/09", temp: "32°", icon: <Sun className="h-6 w-6 text-yellow-500" />, humidity: "65%", rain: "10%" },
                  { day: "Thứ 6", date: "20/09", temp: "29°", icon: <Cloud className="h-6 w-6 text-gray-500" />, humidity: "70%", rain: "20%" },
                  { day: "Thứ 7", date: "21/09", temp: "31°", icon: <Sun className="h-6 w-6 text-yellow-500" />, humidity: "60%", rain: "5%" },
                  { day: "CN", date: "22/09", temp: "28°", icon: <Cloud className="h-6 w-6 text-gray-500" />, humidity: "75%", rain: "30%" },
                  { day: "Thứ 2", date: "23/09", temp: "26°", icon: <Rain className="h-6 w-6 text-blue-500" />, humidity: "80%", rain: "60%" },
                  { day: "Thứ 3", date: "24/09", temp: "30°", icon: <Sun className="h-6 w-6 text-yellow-500" />, humidity: "65%", rain: "15%" },
                  { day: "Thứ 4", date: "25/09", temp: "32°", icon: <Sun className="h-6 w-6 text-yellow-500" />, humidity: "62%", rain: "8%" }
                ].map((day, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${i===0?"bg-emerald-50 border-emerald-200":"bg-white"}`}>
                    <div className="text-xs text-gray-500">{day.day}</div>
                    <div className="text-xs text-gray-400">{day.date}</div>
                    <div className="mt-2 flex justify-center">{day.icon}</div>
                    <div className="mt-2 text-lg font-semibold text-gray-900 text-center">{day.temp}</div>
                    <div className="mt-2 text-xs text-gray-600 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Droplets className="h-3 w-3"/>
                        {day.humidity}
                      </div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <CloudRain className="h-3 w-3"/>
                        {day.rain}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border p-4 bg-white">
                <div className="text-sm font-medium text-gray-900">Thời tiết hôm nay - Chi tiết</div>
                <div className="text-sm text-gray-600 mt-1">Trời nắng, nhiệt độ cao. Thích hợp cho việc tưới nước vào sáng sớm và chiều mát.</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  <StatItem label="Nhiệt độ" value="32° / 24°" icon={<ThermometerSun className="h-4 w-4"/>} />
                  <StatItem label="Độ ẩm" value="65%" icon={<Droplets className="h-4 w-4"/>} />
                  <StatItem label="Khả năng mưa" value="10%" icon={<CloudRain className="h-4 w-4"/>} />
                </div>
              </div>

              <div className="rounded-xl border p-4 bg-amber-50 text-amber-800 border-amber-200 text-sm">
                <div className="font-medium mb-1">Cảnh báo thời tiết</div>
                Dự báo mưa vào thứ 6 và thứ 2. Nên chuẩn bị biện pháp che chắn cho cây trồng và kiểm tra hệ thống thoát nước.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
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
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Trang trại Xanh</CardTitle>
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
                <div className="text-lg font-semibold text-gray-900">5.5 hecta</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Trạng thái</div>
                <div className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm">
                  Đang hoạt động
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Ngày cập nhật gần nhất</div>
                <div className="text-sm text-gray-900">10/01/2024</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Địa chỉ</div>
                <div className="text-sm text-gray-900">123 Đường Nông Nghiệp, Xã Tân Thành, Huyện Châu Thành, Tỉnh An Giang</div>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Cây trồng chính</div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm">Lúa</span>
                <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-sm">Ngô</span>
                <span className="px-2 py-1 rounded-md bg-lime-50 text-lime-700 border border-lime-200 text-sm">Rau xanh</span>
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
              <span className="font-medium">3 tháng</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Trạng thái</span>
              <span className="text-emerald-600 font-medium">Hoạt động</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FarmDetailPage;
export { FarmDetailPage };


