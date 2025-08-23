import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Search, Filter, Star, ShoppingCart, Heart, MapPin, Truck } from "lucide-react";

export const MarketplacePage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'Tất cả', icon: '🚜' },
    { id: 'drones', name: 'Drone & UAV', icon: '🛸' },
    { id: 'tools', name: 'Dụng cụ làm nông', icon: '🔧' },
    { id: 'machines', name: 'Máy móc nông nghiệp', icon: '⚙️' },
    { id: 'fertilizers', name: 'Phân bón & Thuốc', icon: '🧪' },
    { id: 'seeds', name: 'Hạt giống & Cây con', icon: '🌱' },
    { id: 'irrigation', name: 'Hệ thống tưới tiêu', icon: '💧' },
  ];

  const products = [
    {
      id: 1,
      name: 'Drone DJI Agras T30 Phun thuốc nông nghiệp',
      category: 'drones',
      price: '85.000.000',
      unit: 'chiếc',
      rating: 4.9,
      reviews: 89,
      location: 'TP. HCM',
      delivery: '3-5 ngày',
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop',
      discount: 10,
      originalPrice: '95.000.000',
      description: 'Drone phun thuốc chuyên nghiệp, tải trọng 30kg, phun 16-20ha/giờ'
    },
    {
      id: 2,
      name: 'Máy cày mini Kubota B2420R',
      category: 'machines',
      price: '45.000.000',
      unit: 'chiếc',
      rating: 4.8,
      reviews: 156,
      location: 'Hà Nội',
      delivery: '7-10 ngày',
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop',
      discount: 0,
      originalPrice: '45.000.000',
      description: 'Máy cày mini 24HP, phù hợp ruộng nhỏ, tiết kiệm nhiên liệu'
    },
    {
      id: 3,
      name: 'Bộ dụng cụ làm vườn chuyên nghiệp',
      category: 'tools',
      price: '850.000',
      unit: 'bộ',
      rating: 4.7,
      reviews: 234,
      location: 'Đà Nẵng',
      delivery: '2-3 ngày',
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop',
      discount: 15,
      originalPrice: '1.000.000',
      description: 'Bộ 15 dụng cụ: cuốc, xẻng, kéo cắt, bình tưới, găng tay...'
    },
    {
      id: 4,
      name: 'Phân bón hữu cơ vi sinh cao cấp',
      category: 'fertilizers',
      price: '180.000',
      unit: 'kg',
      rating: 4.6,
      reviews: 67,
      location: 'Cần Thơ',
      delivery: '1-2 ngày',
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop',
      discount: 0,
      originalPrice: '180.000',
      description: 'Phân bón hữu cơ 100%, tăng năng suất, an toàn cho môi trường'
    },
    {
      id: 5,
      name: 'Hệ thống tưới phun sương tự động',
      category: 'irrigation',
      price: '2.500.000',
      unit: 'bộ',
      rating: 4.8,
      reviews: 45,
      location: 'TP. HCM',
      delivery: '5-7 ngày',
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop',
      discount: 20,
      originalPrice: '3.125.000',
      description: 'Hệ thống tưới thông minh, điều khiển qua app, tiết kiệm nước'
    },
    {
      id: 6,
      name: 'Hạt giống rau sạch F1 cao sản',
      category: 'seeds',
      price: '25.000',
      unit: 'gói',
      rating: 4.5,
      reviews: 23,
      location: 'Hà Nội',
      delivery: '1 ngày',
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop',
      discount: 0,
      originalPrice: '25.000',
      description: 'Hạt giống rau F1, tỷ lệ nảy mầm 95%, năng suất cao'
    },
    {
      id: 7,
      name: 'Máy gặt đập liên hợp Kubota DC70',
      category: 'machines',
      price: '180.000.000',
      unit: 'chiếc',
      rating: 4.9,
      reviews: 78,
      location: 'An Giang',
      delivery: '10-15 ngày',
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop',
      discount: 5,
      originalPrice: '189.000.000',
      description: 'Máy gặt đập liên hợp 70HP, năng suất 0.8-1.2ha/giờ'
    },
    {
      id: 8,
      name: 'Drone mapping DJI Phantom 4 RTK',
      category: 'drones',
      price: '45.000.000',
      unit: 'chiếc',
      rating: 4.8,
      reviews: 34,
      location: 'TP. HCM',
      delivery: '5-7 ngày',
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop',
      discount: 0,
      originalPrice: '45.000.000',
      description: 'Drone mapping chuyên nghiệp, độ chính xác cm, phù hợp khảo sát nông nghiệp'
    }
  ];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Chợ Trực Tuyến Nông Cụ & Thiết Bị</h1>
            <p className="text-xl text-green-100 mb-8">
              Cung cấp đầy đủ dụng cụ, máy móc và thiết bị hiện đại cho nông nghiệp thông minh
            </p>
            
            {/* Search Bar */}
            <div className="max-w-3xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-6 h-6" />
              <Input
                type="text"
                placeholder="Tìm kiếm dụng cụ, máy móc nông nghiệp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 pr-6 py-4 text-lg border-2 border-white/30 bg-white/20 backdrop-blur-sm rounded-2xl shadow-2xl text-white placeholder:text-white/70 focus:border-white/50 focus:bg-white/30 transition-all duration-300"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <Button 
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30 px-6 py-2 rounded-xl backdrop-blur-sm transition-all duration-300"
                >
                  Tìm kiếm
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filters */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Danh mục sản phẩm</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center gap-2 px-4 py-2"
              >
                <span className="text-lg">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        <Separator className="my-8" />

        {/* Products Grid */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Sản phẩm {selectedCategory !== 'all' && categories.find(c => c.id === selectedCategory)?.name}
            </h2>
            <div className="flex items-center gap-2 text-gray-600">
              <Filter className="w-4 h-4" />
              <span>{filteredProducts.length} sản phẩm</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.discount > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                      -{product.discount}%
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-600 rounded-full p-2"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                        {product.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4" />
                        {product.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Truck className="w-4 h-4" />
                        Giao hàng: {product.delivery}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{product.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500">({product.reviews})</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {product.discount > 0 ? (
                          <>
                            <span className="text-2xl font-bold text-green-600">
                              {product.price}đ
                            </span>
                            <span className="text-lg text-gray-400 line-through">
                              {product.originalPrice}đ
                            </span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold text-green-600">
                            {product.price}đ
                          </span>
                        )}
                        <span className="text-gray-500">/{product.unit}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-green-600 hover:bg-green-700">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Thêm vào giỏ
                      </Button>
                      <Button variant="outline" className="px-3">
                        Mua ngay
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🚜</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Không tìm thấy sản phẩm</h3>
            <p className="text-gray-500">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        )}
      </div>
    </div>
  );
};
