import { TrendingUp, Shield, Users } from "lucide-react"

export default function WhyChoosePlatform() {
  return (
    <div className="max-w-6xl mx-auto py-16 px-6 mt-[50px]">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Tại Sao Chọn Nền Tảng Của Chúng Tôi
        </h2>
        <p className="text-lg text-gray-600">
          Trải nghiệm những lợi ích của công nghệ nông nghiệp hiện đại
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Cột 1: Tăng Năng Suất */}
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Tăng Năng Suất
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Tăng năng suất cây trồng của bạn lên đến 40% với các quyết định canh tác dựa trên dữ liệu và phân bổ tài nguyên tối ưu.
          </p>
        </div>

        {/* Cột 2: Bảo Vệ Môi Trường */}
        <div className="text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-10 w-10 text-orange-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Bảo Vệ Môi Trường
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Giảm 60% lượng nước sử dụng và giảm thiểu đầu vào hóa chất trong khi vẫn duy trì cây trồng khỏe mạnh, năng suất cao.
          </p>
        </div>

        {/* Cột 3: Hỗ Trợ Cộng Đồng */}
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Hỗ Trợ Cộng Đồng
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Tham gia mạng lưới nông dân bền vững chia sẻ kiến thức, thực hành tốt nhất và các giải pháp đổi mới.
          </p>
        </div>
      </div>
    </div>
  )
}
