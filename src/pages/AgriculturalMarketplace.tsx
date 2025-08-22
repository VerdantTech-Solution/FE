import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, ShoppingCart, Package, Shield, Users, ArrowRight } from "lucide-react"
import { useNavigate } from "react-router";

export default function AgriculturalMarketplace() {

    const navigate = useNavigate();
    const handleMarketplace = () => {
        navigate("/marketplace")
    }
  return (
    <div className="mx-auto py-12 px-6 bg-gray-100">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold">
          Chợ Nông Nghiệp
        </h2>
        <p className="text-muted-foreground mt-2">
          Mua bán sản phẩm nông nghiệp bền vững, thiết bị và dịch vụ trong marketplace đáng tin cậy của chúng tôi
        </p>
      </div>

      {/* Product Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Card 1: Organic Vegetables */}
        <Card className="bg-green-50 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-300">
          <div className="h-32 bg-gradient-to-br from-green-200 to-green-300 rounded-t-lg flex items-center justify-center">
            <div className="text-4xl">🥬</div>
          </div>
          <CardHeader className="pb-2 flex-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Rau Hữu Cơ</CardTitle>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">4.8</span>
              </div>
            </div>
            <CardDescription className="text-sm">
              Rau hữu cơ tươi từ các nông trại địa phương
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 flex-1 flex flex-col justify-end">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-bold text-green-600">25.000đ/kg</span>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Còn hàng</span>
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-200">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Thêm vào giỏ
            </Button>
          </CardContent>
        </Card>

        {/* Card 2: Smart Irrigation */}
        <Card className="bg-green-50 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-300">
          <div className="h-32 bg-gradient-to-br from-green-200 to-green-300 rounded-t-lg flex items-center justify-center">
            <div className="text-4xl">💧</div>
          </div>
          <CardHeader className="pb-2 flex-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Tưới Tiêu Thông Minh</CardTitle>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">4.9</span>
              </div>
            </div>
            <CardDescription className="text-sm">
              Hệ thống tưới tiêu AI tối ưu hóa việc sử dụng nước
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 flex-1 flex flex-col justify-end">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-bold text-green-600">1.299.000đ</span>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Còn 5</span>
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-200">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Thêm vào giỏ
            </Button>
          </CardContent>
        </Card>

        {/* Card 3: Organic Fertilizer */}
        <Card className="bg-green-50 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-300">
          <div className="h-32 bg-gradient-to-br from-green-200 to-green-300 rounded-t-lg flex items-center justify-center">
            <div className="text-4xl">🌱</div>
          </div>
          <CardHeader className="pb-2 flex-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Phân Bón Hữu Cơ</CardTitle>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">4.7</span>
              </div>
            </div>
            <CardDescription className="text-sm">
              100% phân bón tự nhiên cho canh tác bền vững
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 flex-1 flex flex-col justify-end">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-bold text-green-600">45.000đ/túi</span>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Còn hàng</span>
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-200">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Thêm vào giỏ
            </Button>
          </CardContent>
        </Card>

        {/* Card 4: Agricultural Drone */}
        <Card className="bg-green-50 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-300">
          <div className="h-32 bg-gradient-to-br from-green-200 to-green-300 rounded-t-lg flex items-center justify-center">
            <div className="text-4xl">🚁</div>
          </div>
          <CardHeader className="pb-2 flex-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Drone Nông Nghiệp</CardTitle>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">4.6</span>
              </div>
            </div>
            <CardDescription className="text-sm">
              Drone chuyên nghiệp giám sát và phun thuốc cây trồng
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 flex-1 flex flex-col justify-end">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-bold text-green-600">3.499.000đ</span>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Còn 2</span>
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-200">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Thêm vào giỏ
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Chất Lượng Đảm Bảo</h3>
          <p className="text-sm text-muted-foreground">
            Tất cả sản phẩm đều được kiểm tra chất lượng và tiêu chuẩn bền vững trước khi đăng bán.
          </p>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Giao Dịch An Toàn</h3>
          <p className="text-sm text-muted-foreground">
            Xử lý thanh toán an toàn và bảo mật với sự bảo vệ người mua và người bán.
          </p>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Cộng Đồng Định Hướng</h3>
          <p className="text-sm text-muted-foreground">
            Kết nối trực tiếp với nông dân, nhà cung cấp và chuyên gia nông nghiệp trong khu vực của bạn.
          </p>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center">
        <Button onClick={handleMarketplace} size="lg" className="bg-green-600 hover:bg-green-700 hover:scale-105 hover:shadow-xl px-8 py-3 transition-all duration-300">
          Xem Tất Cả Sản Phẩm
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}
