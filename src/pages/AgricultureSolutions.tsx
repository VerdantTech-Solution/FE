import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Brain, Leaf, Shield, CheckCircle, Monitor, TrendingUp, Bug, Droplets, Thermometer, Sprout, Recycle } from "lucide-react"

export default function AgricultureSolutions() {
  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold">Giải Pháp Nông Nghiệp Thông Minh</h2>
        <p className="text-muted-foreground mt-2">
          Khám phá cách nền tảng AI của chúng tôi cách mạng hóa canh tác rau bền vững
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <Card className="bg-green-100  hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-300">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 hover:bg-green-200 transition-colors duration-300">
              <Brain className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="hover:text-green-700 transition-colors duration-300">Thông Tin AI</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="hover:text-green-800 transition-colors duration-300">
              Thuật toán máy học tiên tiến phân tích dữ liệu nông trại để đưa ra khuyến nghị thực tế
            </CardDescription>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2 hover:translate-x-1 transition-transform duration-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Giám sát sức khỏe cây trồng</span>
              </li>
              <li className="flex items-center gap-2 hover:translate-x-1 transition-transform duration-200">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span>Dự đoán năng suất</span>
              </li>
              <li className="flex items-center gap-2 hover:translate-x-1 transition-transform duration-200">
                <Bug className="h-4 w-4 text-green-600" />
                <span>Phát hiện sâu bệnh</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card className="bg-yellow-50  hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-yellow-300">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 hover:bg-yellow-200 transition-colors duration-300">
              <Leaf className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle className="hover:text-yellow-700 transition-colors duration-300">Thiết Bị Thông Minh</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="hover:text-yellow-800 transition-colors duration-300">
              Thiết bị nông nghiệp IoT tối ưu hóa việc sử dụng tài nguyên và tự động hóa quy trình
            </CardDescription>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2 hover:translate-x-1 transition-transform duration-200">
                <Droplets className="h-4 w-4 text-yellow-600" />
                <span>Tưới tiêu tự động</span>
              </li>
              <li className="flex items-center gap-2 hover:translate-x-1 transition-transform duration-200">
                <Monitor className="h-4 w-4 text-yellow-600" />
                <span>Giám sát đất</span>
              </li>
              <li className="flex items-center gap-2 hover:translate-x-1 transition-transform duration-200">
                <Thermometer className="h-4 w-4 text-yellow-600" />
                <span>Kiểm soát khí hậu</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card className="bg-blue-50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-300">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors duration-300">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="hover:text-blue-700 transition-colors duration-300">Thực Hành Bền Vững</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="hover:text-blue-800 transition-colors duration-300">
              Phương pháp canh tác thân thiện với môi trường bảo tồn tài nguyên cho thế hệ tương lai
            </CardDescription>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2 hover:translate-x-1 transition-transform duration-200">
                <Droplets className="h-4 w-4 text-blue-600" />
                <span>Tiết kiệm nước</span>
              </li>
              <li className="flex items-center gap-2 hover:translate-x-1 transition-transform duration-200">
                <Sprout className="h-4 w-4 text-blue-600" />
                <span>Canh tác hữu cơ</span>
              </li>
              <li className="flex items-center gap-2 hover:translate-x-1 transition-transform duration-200">
                <Recycle className="h-4 w-4 text-blue-600" />
                <span>Giảm lượng khí thải carbon</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
