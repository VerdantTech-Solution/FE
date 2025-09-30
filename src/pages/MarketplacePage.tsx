import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Search, Filter, Star, ShoppingCart, Heart, MapPin, Truck } from "lucide-react";
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { getAllProducts, type Product } from '@/api/product';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const
    }
  }
};

const cardVariants = {
  hidden: { scale: 0.8, opacity: 0, y: 50 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const
    }
  },
  hover: {
    y: -10,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: "easeInOut" as const
    }
  }
};

const searchVariants = {
  hidden: { y: -50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut" as const
    }
  }
};

export const MarketplacePage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      console.log('Starting to fetch products...');
      console.log('Auth token:', localStorage.getItem('authToken'));
      setLoading(true);
      setError(null);
      const productsData = await getAllProducts();
      console.log('Products fetched successfully:', productsData);
      setProducts(productsData);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.';
      setError(errorMessage);
      setProducts([]); // Set empty array instead of fallback data
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Page loading screen
  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
        <div className="text-center">
          {/* Logo và branding */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">VerdantTech</h1>
            <p className="text-gray-600">Chợ trực tuyến</p>
          </div>

          {/* Spinner chính */}
          <div className="mb-6">
            <Spinner 
              variant="circle-filled" 
              size={60} 
              className="text-green-600 mx-auto"
            />
          </div>
          
          {/* Tiêu đề */}
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Đang tải chợ trực tuyến
          </h2>
          
          {/* Mô tả */}
          <p className="text-gray-600 mb-6">
            Chuẩn bị sản phẩm nông nghiệp...
          </p>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  const categories = [
    { id: 'all', name: 'Tất cả', icon: '🚜' },
    { id: 'drones', name: 'Drone & UAV', icon: '🛸' },
    { id: 'tools', name: 'Dụng cụ làm nông', icon: '🔧' },
    { id: 'machines', name: 'Máy móc nông nghiệp', icon: '⚙️' },
    { id: 'fertilizers', name: 'Phân bón & Thuốc', icon: '🧪' },
    { id: 'seeds', name: 'Hạt giống & Cây con', icon: '🌱' },
    { id: 'irrigation', name: 'Hệ thống tưới tiêu', icon: '💧' },
  ];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    return matchesCategory && matchesSearch;
  });

  return (
    <motion.div 
      className="min-h-screen bg-gray-50 pt-20"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <motion.div 
        className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-16"
        variants={itemVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1 
              className="text-4xl font-bold mb-4"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Chợ Trực Tuyến Nông Cụ & Thiết Bị
            </motion.h1>
            <motion.p 
              className="text-xl text-green-100 mb-8"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Cung cấp đầy đủ dụng cụ, máy móc và thiết bị hiện đại cho nông nghiệp thông minh
            </motion.p>
            
            {/* Search Bar */}
            <motion.div 
              className="max-w-3xl mx-auto relative"
              variants={searchVariants}
            >
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
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filters */}
        <motion.div 
          className="mb-8"
          variants={itemVariants}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Danh mục sản phẩm</h2>
          <motion.div 
            className="flex flex-wrap gap-3"
            variants={containerVariants}
          >
            {categories.map((category) => (
              <motion.div
                key={category.id}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <span className="text-lg">{category.icon}</span>
                  {category.name}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <Separator className="my-8" />

        {/* Products Grid */}
        <motion.div 
          className="mb-8"
          variants={itemVariants}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Sản phẩm {selectedCategory !== 'all' && categories.find(c => c.id === selectedCategory)?.name}
            </h2>
            <div className="flex items-center gap-2 text-gray-600">
              <Filter className="w-4 h-4" />
              <span>{filteredProducts.length} sản phẩm</span>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-red-600 mb-2">Lỗi tải dữ liệu</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button 
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  fetchProducts();
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Thử lại
              </Button>
            </motion.div>
          )}

          {/* Loading State */}
          {loading && !error && (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Spinner 
                variant="circle-filled" 
                size={60} 
                className="text-green-600 mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Đang tải sản phẩm...</h3>
              <p className="text-gray-500">Vui lòng chờ trong giây lát</p>
            </motion.div>
          )}

          {/* Products Grid - Only show when not loading and no error */}
          {!loading && !error && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
            >
              <AnimatePresence mode="wait">
                {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  whileHover="hover"
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <div className="relative">
                      <motion.img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      />
                      {product.discount && product.discount > 0 && (
                        <motion.div 
                          className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                        >
                          -{product.discount}%
                        </motion.div>
                      )}
                      {/* Energy Efficiency Badge */}
                      {product.energyEfficiencyRating && (
                        <motion.div 
                          className="absolute top-2 right-12 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                        >
                          {product.energyEfficiencyRating}
                        </motion.div>
                      )}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-600 rounded-full p-2"
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      </motion.div>
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
                          {/* Stock info */}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Còn lại: {product.stockQuantity || 0} sản phẩm
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
                            {product.discount && product.discount > 0 ? (
                              <>
                                <span className="text-2xl font-bold text-green-600">
                                  {product.price?.toLocaleString('vi-VN')}đ
                                </span>
                                <span className="text-lg text-gray-400 line-through">
                                  {product.originalPrice?.toLocaleString('vi-VN')}đ
                                </span>
                              </>
                            ) : (
                              <span className="text-2xl font-bold text-green-600">
                                {product.price?.toLocaleString('vi-VN')}đ
                              </span>
                            )}
                            <span className="text-gray-500">/{product.unit}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button className="flex-1 bg-green-600 hover:bg-green-700">
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Thêm vào giỏ
                            </Button>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button variant="outline" className="px-3">
                              Mua ngay
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Empty State */}
          <AnimatePresence>
            {!loading && !error && filteredProducts.length === 0 && (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div 
                className="text-6xl mb-4"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                🚜
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Không tìm thấy sản phẩm</h3>
              <p className="text-gray-500">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};

