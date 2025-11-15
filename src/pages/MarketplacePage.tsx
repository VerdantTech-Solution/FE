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
import { addToCart } from '@/api/cart';

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
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const products = await getAllProducts({ page: 1, pageSize: 100 });
      setProducts(products);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.';
      setError(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddToCart = async (productId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Ngăn chặn click vào card
    try {
      setAddingToCart(productId);
      setSuccessMessage(null);
      
      // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
      try {
        const { getCart } = await import('@/api/cart');
        const currentCart = await getCart();
        const cartItems = currentCart?.cartItems || [];
        const existingItem = cartItems.find((item: any) => item.productId === productId);
        
        if (existingItem) {
          console.log('Product already in cart, increasing quantity...');
          // Sản phẩm đã có trong giỏ, tăng số lượng
          const { updateCartItem } = await import('@/api/cart');
          const newQuantity = existingItem.quantity + 1;
          
          await updateCartItem(productId, newQuantity);
          
          // Dispatch event to update cart count in Navbar
          window.dispatchEvent(new CustomEvent('cart:updated'));
          
          // Show success message
          setSuccessMessage(`Đã tăng số lượng sản phẩm lên ${newQuantity}!`);
          setTimeout(() => setSuccessMessage(null), 3000);
          
          console.log('Quantity increased successfully to:', newQuantity);
          return; // Thoát khỏi function
        }
      } catch (cartError) {
        console.log('Error checking cart, proceeding with add to cart:', cartError);
      }
      
      // Nếu sản phẩm chưa có trong giỏ, thêm mới
      const response = await addToCart({ productId, quantity: 1 });
      console.log('Add to cart response:', response);
      
      // Dispatch event to update cart count in Navbar
      window.dispatchEvent(new CustomEvent('cart:updated'));
      
      // Show success message
      setSuccessMessage('Đã thêm sản phẩm vào giỏ hàng!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      console.log('Product added to cart successfully');
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      console.error('Error details:', {
        status: error?.status,
        statusCode: error?.statusCode,
        message: error?.message,
        data: error?.data,
        response: error?.response
      });
      
      // Xử lý lỗi 400 - Bad Request (sản phẩm đã có trong giỏ)
      if (error?.status === 400 || error?.statusCode === 400 || error?.response?.status === 400) {
        console.log('Handling 400 error - product already in cart');
        // Thay vì báo lỗi, thử tăng số lượng sản phẩm đã có
        try {
          console.log('Product already in cart, attempting to increase quantity...');
          
          // Import functions
          const { updateCartItem, getCart } = await import('@/api/cart');
          
          // Lấy giỏ hàng hiện tại để tìm số lượng sản phẩm
          const currentCart = await getCart();
          const cartItems = currentCart?.cartItems || [];
          const existingItem = cartItems.find((item: any) => item.productId === productId);
          
          console.log('Current cart items:', cartItems);
          console.log('Existing item:', existingItem);
          
          if (existingItem) {
            // Tăng số lượng hiện tại lên 1
            const newQuantity = existingItem.quantity + 1;
            console.log('Updating quantity from', existingItem.quantity, 'to', newQuantity);
            
            await updateCartItem(productId, newQuantity);
            
            // Dispatch event to update cart count in Navbar
            window.dispatchEvent(new CustomEvent('cart:updated'));
            
            // Show success message
            setSuccessMessage(`Đã tăng số lượng sản phẩm lên ${newQuantity}!`);
            setTimeout(() => setSuccessMessage(null), 3000);
            
            console.log('Quantity increased successfully to:', newQuantity);
            return; // Thoát khỏi function để không hiển thị lỗi
          } else {
            // Nếu không tìm thấy item trong giỏ, thử thêm lại
            console.log('Item not found in cart, retrying add to cart...');
            const retryResponse = await addToCart({ productId, quantity: 1 });
            console.log('Retry add to cart response:', retryResponse);
            
            window.dispatchEvent(new CustomEvent('cart:updated'));
            setSuccessMessage('Đã thêm sản phẩm vào giỏ hàng!');
            setTimeout(() => setSuccessMessage(null), 3000);
            return; // Thoát khỏi function để không hiển thị lỗi
          }
        } catch (updateError: any) {
          console.error('Error updating quantity:', updateError);
          alert('Có lỗi xảy ra khi cập nhật số lượng sản phẩm. Vui lòng thử lại.');
          return; // Thoát khỏi function để không hiển thị lỗi gốc
        }
      } else if (error?.status === 401 || error?.statusCode === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = '/login';
      } else {
        // Chỉ hiển thị alert nếu không phải lỗi 400
        console.log('Non-400 error, showing alert');
        alert('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng.');
      }
    } finally {
      setAddingToCart(null);
    }
  };

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
          <div className="flex justify-center mb-6">
            <Spinner variant="circle-filled" size={60} className="text-green-600" />
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
        {/* Success Message */}
        {successMessage && (
          <motion.div 
            className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span className="font-medium">{successMessage}</span>
            </div>
          </motion.div>
        )}

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
                  className="h-full"
                >
                  <Card 
                    className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    {/* Image Section - Fixed height */}
                    <div className="relative h-48">
                      <motion.img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
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

                    {/* Content Section - Flexible height */}
                    <div className="flex-1 flex flex-col">
                      <CardHeader className="pb-3 flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 min-h-[3.5rem]">
                              {product.name}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[2.5rem]">
                              {product.description}
                            </p>
                            
                            {/* Product Info Grid */}
                            <div className="space-y-2 mb-3">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{product.location}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Truck className="w-4 h-4 flex-shrink-0" />
                                <span>Giao hàng: {product.delivery}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                                <span>Còn lại: {product.stockQuantity || 0} sản phẩm</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-semibold">{product.rating}</span>
                            </div>
                            <span className="text-sm text-gray-500">({product.reviews})</span>
                          </div>
                        </div>
                      </CardContent>

                      {/* Footer - Fixed at bottom */}
                      <CardFooter className="pt-0 mt-auto">
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
                              className="flex-1"
                            >
                              <Button 
                                className="w-full bg-green-600 hover:bg-green-700"
                                onClick={(e) => handleAddToCart(product.id, e)}
                                disabled={addingToCart === product.id}
                              >
                                {addingToCart === product.id ? (
                                  <Spinner variant="circle-filled" size={16} className="mr-2" />
                                ) : (
                                  <ShoppingCart className="w-4 h-4 mr-2" />
                                )}
                                {addingToCart === product.id ? 'Đang thêm...' : 'Thêm vào giỏ'}
                              </Button>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button variant="outline" className="px-4">
                                Mua ngay
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </CardFooter>
                    </div>
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

