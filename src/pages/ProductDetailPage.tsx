import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Star, 
  ShoppingCart, 
  Heart, 
  MapPin, 
  Truck, 
  Shield, 
  Clock,
  User,
  Phone,
  Mail
} from "lucide-react";
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { getProductById, type Product } from '@/api/product';

// Animation variants
const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const
    }
  }
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const
    }
  }
};

const infoVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      delay: 0.2,
      ease: "easeOut" as const
    }
  }
};

export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError('Product ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const productData = await getProductById(parseInt(id));
        setProduct(productData);
      } catch (err) {
        setError('Failed to load product details');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    // TODO: Implement add to cart functionality
    console.log('Adding to cart:', { product, quantity });
  };

  const handleToggleFavorite = () => {
    // TODO: Implement favorite functionality
    console.log('Toggle favorite');
  };

  const handleContactVendor = () => {
    // TODO: Implement contact vendor functionality
    console.log('Contact vendor');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner 
            variant="circle-filled" 
            size={60} 
            className="text-green-600 mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Đang tải thông tin sản phẩm...
          </h2>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Không tìm thấy sản phẩm
          </h2>
          <p className="text-gray-600 mb-4">
            {error || 'Sản phẩm không tồn tại hoặc đã bị xóa'}
          </p>
          <Button 
            onClick={() => navigate('/marketplace')}
            className="bg-green-600 hover:bg-green-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={pageVariants}
      className="min-h-screen bg-gray-50"
    >
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/marketplace')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại Marketplace
            </Button>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleToggleFavorite}
                className="text-gray-600 hover:text-red-500"
              >
                <Heart className="w-4 h-4 mr-1" />
                Yêu thích
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleContactVendor}
                className="text-gray-600 hover:text-green-600"
              >
                <Phone className="w-4 h-4 mr-1" />
                Liên hệ
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <motion.div 
            variants={imageVariants}
            className="space-y-4"
          >
            <div className="aspect-square bg-white rounded-lg shadow-sm border overflow-hidden">
              <img 
                src={product.images?.split(',')[selectedImage] || '/placeholder-product.jpg'} 
                alt={product.productName}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Thumbnail Images */}
            {product.images && product.images.split(',').length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.split(',').map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                      selectedImage === index 
                        ? 'border-green-500' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img 
                      src={image.trim()} 
                      alt={`${product.productName} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div 
            variants={infoVariants}
            className="space-y-6"
          >
            {/* Title and Rating */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.productName}
              </h1>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm text-gray-600">
                    {product.ratingAverage || '4.5'} ({product.viewCount || 0} lượt xem)
                  </span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Mã: {product.productCode}
                </Badge>
                {product.energyEfficiencyRating && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {product.energyEfficiencyRating}
                  </Badge>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-green-600">
                  {product.unitPrice?.toLocaleString('vi-VN')}₫
                </span>
                <span className="text-sm text-gray-500">/chiếc</span>
              </div>
              {product.discountPercentage > 0 && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-500 line-through">
                    {Math.round(product.unitPrice / (1 - product.discountPercentage / 100)).toLocaleString('vi-VN')}₫
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    -{product.discountPercentage}%
                  </Badge>
                </div>
              )}
              <p className="text-sm text-gray-600 mt-1">
                Còn lại: {product.stockQuantity} sản phẩm
              </p>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Mô tả sản phẩm
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
              
              {/* Specifications */}
              {product.specifications && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Thông số kỹ thuật:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{key}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Dimensions */}
              {product.dimensionsCm && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Kích thước:</h4>
                  <div className="text-sm text-gray-600">
                    {product.dimensionsCm.width}cm × {product.dimensionsCm.height}cm × {product.dimensionsCm.length}cm
                  </div>
                </div>
              )}
              
              {/* Weight */}
              {product.weightkg && (
                <div className="mt-2">
                  <span className="text-sm text-gray-600">Trọng lượng: {product.weightkg}kg</span>
                </div>
              )}
              
              {/* Warranty */}
              <div className="mt-4">
                <span className="text-sm text-gray-600">
                  Bảo hành: {product.warrantyMonths} tháng
                </span>
              </div>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng
                </label>
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button 
                  onClick={handleAddToCart}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Thêm vào giỏ hàng
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleToggleFavorite}
                  className="px-4"
                >
                  <Heart className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Đảm bảo chất lượng</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Truck className="w-4 h-4 text-green-600" />
                <span>Giao hàng nhanh</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-green-600" />
                <span>Hỗ trợ 24/7</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-green-600" />
                <span>Nguồn gốc rõ ràng</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Vendor Info */}
        <motion.div 
          variants={infoVariants}
          className="mt-12"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2 text-green-600" />
                Thông tin người bán
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Nhà cung cấp ID: {product.vendorId}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Sản phẩm được cung cấp bởi đối tác uy tín của VerdantTech
                  </p>
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Đã bán:</span> {product.soldCount || 0} sản phẩm
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>Liên hệ qua hệ thống</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>Hỗ trợ khách hàng 24/7</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>Giao hàng toàn quốc</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleContactVendor}
                    className="flex-1"
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Liên hệ
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleContactVendor}
                    className="flex-1"
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Hỗ trợ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};
