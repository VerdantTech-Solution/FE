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
  Mail,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { getProductById, type Product, type ProductImage } from '@/api/product';
import { addToCart } from '@/api/cart';
import { useCart } from '@/contexts/CartContext';
import ProductSpecifications from '@/components/ProductSpecifications';

// Helper function to get image URLs from product
const getProductImages = (product: Product): string[] => {
  const images: string[] = [];
  
  // Thêm image chính (đã được transform)
  if (product.image) {
    images.push(product.image);
  }
  
  // Thêm các images khác nếu có
  if (product.images) {
    if (typeof product.images === 'string') {
      // Nếu images là string CSV
      const imageUrls = product.images.split(',').map(url => url.trim()).filter(url => url.length > 0);
      imageUrls.forEach(url => {
        if (!images.includes(url)) {
          images.push(url);
        }
      });
    } else if (Array.isArray(product.images)) {
      // Nếu images là array of objects
      product.images.forEach((img: ProductImage | string) => {
        if (typeof img === 'string') {
          if (!images.includes(img)) {
            images.push(img);
          }
        } else if (img && typeof img === 'object' && img.imageUrl) {
          if (!images.includes(img.imageUrl)) {
            images.push(img.imageUrl);
          }
        }
      });
    }
  }
  
  // Fallback nếu không có images
  if (images.length === 0) {
    images.push('https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&h=600&fit=crop');
  }
  
  return images;
};

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
  const { refreshCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

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

  const handleAddToCart = async () => {
    if (!product || !id) return;

    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (!token) {
      setErrorMessage('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      setShowErrorMessage(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    // Check stock availability
    if (quantity > product.stockQuantity) {
      setErrorMessage(`Chỉ còn ${product.stockQuantity} sản phẩm trong kho`);
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
      return;
    }

    try {
      setAddingToCart(true);
      console.log('Adding to cart:', { 
        productId: parseInt(id), 
        quantity 
      });

      await addToCart({
        productId: parseInt(id),
        quantity: quantity
      });

      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

      // Refresh cart count
      await refreshCart();

      // Dispatch custom event for cart update
      window.dispatchEvent(new Event('cart:updated'));

      console.log('Product added to cart successfully');
    } catch (err: any) {
      console.error('Error adding to cart:', err);
      const errorMsg = err?.message || err?.errors?.[0] || 'Không thể thêm sản phẩm vào giỏ hàng';
      setErrorMessage(errorMsg);
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
    } finally {
      setAddingToCart(false);
    }
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
      {/* Success/Error Messages */}
      {showSuccessMessage && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg"
        >
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Thêm vào giỏ hàng thành công!</p>
              <p className="text-sm opacity-90 mt-1">Đã thêm {quantity} sản phẩm vào giỏ hàng</p>
              <button
                onClick={() => navigate('/cart')}
                className="text-sm font-medium underline mt-2 hover:opacity-80"
              >
                Xem giỏ hàng →
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {showErrorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3"
        >
          <AlertCircle className="w-6 h-6" />
          <div>
            <p className="font-semibold">Lỗi!</p>
            <p className="text-sm opacity-90">{errorMessage}</p>
          </div>
        </motion.div>
      )}

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
            {(() => {
              const productImages = getProductImages(product);
              return (
                <>
                  <div className="aspect-square bg-white rounded-lg shadow-sm border overflow-hidden">
                    <img 
                      src={productImages[selectedImage] || productImages[0]} 
                      alt={product.productName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback nếu ảnh không load được
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&h=600&fit=crop';
                      }}
                    />
                  </div>
                  
                  {/* Thumbnail Images */}
                  {productImages.length > 1 && (
                    <div className="flex space-x-2 overflow-x-auto">
                      {productImages.map((imageUrl, index) => (
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
                            src={imageUrl} 
                            alt={`${product.productName} ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=100&h=100&fit=crop';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
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
              
              {/* Product Specifications Component */}
              <div className="mt-6">
                <ProductSpecifications
                  specifications={product.specifications}
                  dimensionsCm={product.dimensionsCm}
                  weightkg={product.weightkg}
                  warrantyMonths={product.warrantyMonths}
                  energyEfficiencyRating={product.energyEfficiencyRating}
                  categoryName={product.category}
                />
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
                    onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                    disabled={quantity >= product.stockQuantity}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button 
                  onClick={handleAddToCart}
                  disabled={addingToCart || product.stockQuantity === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {addingToCart ? (
                    <>
                      <Spinner variant="circle-filled" size={16} className="mr-2" />
                      Đang thêm...
                    </>
                  ) : product.stockQuantity === 0 ? (
                    'Hết hàng'
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Thêm vào giỏ hàng
                    </>
                  )}
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
