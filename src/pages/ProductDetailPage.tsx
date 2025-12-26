import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Star,
  ShoppingCart,
  MapPin,
  Truck,
  Shield,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  getProductById,
  type Product,
  type ProductImage,
  getProductRegistrations,
} from "@/api/product";
import { addToCart } from "@/api/cart";
import { useCart } from "@/contexts/CartContext";
import ProductSpecifications from "@/components/ProductSpecifications";
import {
  getProductReviewsByProductId,
  type ProductReview,
} from "@/api/productReview";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getVendorById } from "@/api/vendor";
import { FileText } from "lucide-react";

// Helper function to get image URLs from product
const getProductImages = (product: Product): string[] => {
  const images: string[] = [];

  // Thêm image chính (đã được transform)
  if (product.image) {
    images.push(product.image);
  }

  // Thêm các images khác nếu có
  if (product.images) {
    if (typeof product.images === "string") {
      // Nếu images là string CSV
      const imageUrls = product.images
        .split(",")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);
      imageUrls.forEach((url) => {
        if (!images.includes(url)) {
          images.push(url);
        }
      });
    } else if (Array.isArray(product.images)) {
      // Nếu images là array of objects
      product.images.forEach((img: ProductImage | string) => {
        if (typeof img === "string") {
          if (!images.includes(img)) {
            images.push(img);
          }
        } else if (img && typeof img === "object" && img.imageUrl) {
          if (!images.includes(img.imageUrl)) {
            images.push(img.imageUrl);
          }
        }
      });
    }
  }

  // Fallback nếu không có images
  if (images.length === 0) {
    images.push(
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&h=600&fit=crop"
    );
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
      ease: "easeOut" as const,
    },
  },
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

const infoVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      delay: 0.2,
      ease: "easeOut" as const,
    },
  },
};

const renderReviewStars = (rating: number) =>
  Array.from({ length: 5 }, (_, index) => (
    <Star
      key={index}
      className={`h-4 w-4 ${
        index < Math.round(rating)
          ? "fill-yellow-400 text-yellow-400"
          : "text-gray-300"
      }`}
    />
  ));

const formatReviewDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState<string>("");
  const [vendorLoading, setVendorLoading] = useState(false);
  const [manualUrl, setManualUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError("Product ID not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const productData = await getProductById(parseInt(id));
        console.log("Product data from API:", productData);
        console.log("Product manualUrls:", productData.manualUrls);
        console.log("Product manualUrl:", (productData as any).manualUrl);
        console.log(
          "Product manualPublicUrl:",
          (productData as any).manualPublicUrl
        );
        setProduct(productData);

        // Fetch vendor name
        if (productData.vendorId) {
          setVendorLoading(true);
          try {
            const vendorData = await getVendorById(productData.vendorId);
            setVendorName(vendorData.companyName || "Nhà cung cấp");
          } catch (vendorErr) {
            console.error("Error fetching vendor:", vendorErr);
            setVendorName("Nhà cung cấp");
          } finally {
            setVendorLoading(false);
          }
        }

        // Fetch ProductRegistration để lấy manualUrl (giống như staff panel)
        try {
          const registrations = await getProductRegistrations();
          const relatedRegistration = registrations.find(
            (reg) =>
              reg.proposedProductCode === productData.productCode &&
              reg.status === "Approved"
          );

          if (
            relatedRegistration?.manualUrl ||
            relatedRegistration?.manualPublicUrl
          ) {
            setManualUrl(
              relatedRegistration.manualUrl ||
                relatedRegistration.manualPublicUrl ||
                null
            );
          } else {
            setManualUrl(null);
          }
        } catch (regErr) {
          console.error("Error fetching product registration:", regErr);
          setManualUrl(null);
        }
      } catch (err) {
        setError("Failed to load product details");
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const numericId = parseInt(id, 10);
    if (Number.isNaN(numericId)) return;

    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        setReviewsError(null);
        const response = await getProductReviewsByProductId(numericId, 1, 20);
        if (response.status && response.data) {
          // Support both pagination structure (data.data) and simple array (data)
          const list =
            response.data.data ||
            (Array.isArray(response.data) ? response.data : []);
          setReviews(list);
        } else {
          setReviews([]);
        }
      } catch (err: any) {
        console.error("Error fetching product reviews:", err);
        setReviews([]);
        setReviewsError(
          err?.errors?.[0] || err?.message || "Không thể tải đánh giá sản phẩm."
        );
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || !id) return;

    // Check if user is logged in
    const token = localStorage.getItem("authToken");
    if (!token) {
      setErrorMessage("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
      setShowErrorMessage(true);
      setTimeout(() => {
        navigate("/login");
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
      console.log("Adding to cart:", {
        productId: parseInt(id),
        quantity,
      });

      await addToCart({
        productId: parseInt(id),
        quantity: quantity,
      });

      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

      // Refresh cart count
      await refreshCart();

      // Dispatch custom event for cart update
      window.dispatchEvent(new Event("cart:updated"));

      console.log("Product added to cart successfully");
    } catch (err: any) {
      console.error("Error adding to cart:", err);
      const errorMsg =
        err?.message ||
        err?.errors?.[0] ||
        "Không thể thêm sản phẩm vào giỏ hàng";
      setErrorMessage(errorMsg);
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
    } finally {
      setAddingToCart(false);
    }
  };

  // Calculate review count and average rating from reviews array (same as original code)
  const reviewCount = reviews.length;
  const averageRatingValue =
    reviewCount > 0
      ? reviews.reduce((total, current) => total + (current.rating || 0), 0) /
        reviewCount
      : product?.ratingAverage ?? 0;
  const formattedAverageRating =
    averageRatingValue > 0 ? averageRatingValue.toFixed(1) : "0.0";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
     <div className="flex justify-center mb-6">
            <Spinner 
              variant="circle-filled" 
              size={60} 
              className="text-green-600 mx-auto"
            />
          </div>
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
            {error || "Sản phẩm không tồn tại hoặc đã bị xóa"}
          </p>
          <Button
            onClick={() => navigate("/marketplace")}
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
              <p className="text-sm opacity-90 mt-1">
                Đã thêm {quantity} sản phẩm vào giỏ hàng
              </p>
              <button
                onClick={() => navigate("/cart")}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => navigate("/marketplace")}
              className="flex items-center text-sm sm:text-base text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Quay lại Marketplace</span>
              <span className="sm:hidden">Quay lại</span>
            </Button>
            <div className="flex items-center space-x-2 sm:space-x-4">
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Product Images */}
          <motion.div variants={imageVariants} className="space-y-4">
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
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&h=600&fit=crop";
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
                              ? "border-green-500"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <img
                            src={imageUrl}
                            alt={`${product.productName} ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=100&h=100&fit=crop";
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
          <motion.div variants={infoVariants} className="space-y-6">
            {/* Title and Rating */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {product.productName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm text-gray-600">
                    {formattedAverageRating}/5 ({reviewCount || 0} đánh giá)
                  </span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Mã: {product.productCode}
                </Badge>
                {product.energyEfficiencyRating && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800"
                  >
                    Nhãn năng lượng: {product.energyEfficiencyRating}
                  </Badge>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-green-600">
                  {product.unitPrice?.toLocaleString("vi-VN")}₫
                </span>
                <span className="text-sm text-gray-500">/sản phẩm</span>
              </div>
              {product.discountPercentage > 0 && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-500 line-through">
                    {Math.round(
                      product.unitPrice / (1 - product.discountPercentage / 100)
                    ).toLocaleString("vi-VN")}
                    ₫
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

              {/* User Manual Button */}
              {(product.manualUrls || manualUrl) && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = product.manualUrls || manualUrl;
                      if (url) {
                        const urls =
                          typeof url === "string" ? url.split(",") : [url];
                        if (urls.length > 0) {
                          window.open(urls[0].trim(), "_blank");
                        }
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Hướng dẫn sử dụng
                  </Button>
                </div>
              )}

              {/* Product Specifications Component */}
              <div className="mt-6">
                <ProductSpecifications
                  specifications={product.specifications}
                  dimensionsCm={
                    product.dimensionsCm as
                      | { width: number; height: number; length: number }
                      | undefined
                  }
                  weightkg={product.weightKg}
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
                  <span className="w-12 text-center font-medium">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setQuantity(Math.min(product.stockQuantity, quantity + 1))
                    }
                    disabled={quantity >= product.stockQuantity}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex space-x-4">
                {product.stockQuantity === 0 ? (
                  <Button
                    disabled
                    className="flex-1 bg-gray-400 text-white cursor-not-allowed"
                  >
                    Hết hàng
                  </Button>
                ) : (
                  <Button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {addingToCart ? (
                      <>
                        <Spinner
                          variant="circle-filled"
                          size={16}
                          className="mr-2"
                        />
                        Đang thêm...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Thêm vào giỏ hàng
                      </>
                    )}
                  </Button>
                )}
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
        <motion.div variants={infoVariants} className="mt-12">
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
                    {vendorLoading
                      ? "Đang tải..."
                      : vendorName || "Nhà cung cấp"}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Sản phẩm được cung cấp bởi đối tác uy tín của VerdantTech
                  </p>
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Đã bán:</span>{" "}
                    {product.soldCount || 0} sản phẩm
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
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Product Reviews */}
        <motion.div variants={infoVariants} className="mt-12">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  Đánh giá từ khách hàng
                </span>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-900">
                      {formattedAverageRating}
                    </span>
                    <span>/5</span>
                  </div>
                  <div>{reviewCount} đánh giá</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviewsLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-600">
                  <Spinner
                    variant="circle-filled"
                    size={32}
                    className="text-green-600 mr-3"
                  />
                  <span>Đang tải đánh giá sản phẩm...</span>
                </div>
              ) : reviewsError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {reviewsError}
                </div>
              ) : reviews.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">
                  Hiện chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu
                  tiên chia sẻ trải nghiệm sau khi mua hàng!
                </div>
              ) : (
                reviews.map((review) => {
                  const customerName =
                    review.customer?.fullName || "Khách hàng ẩn danh";
                  const initials = getInitials(customerName);
                  return (
                    <div
                      key={review.id}
                      className="rounded-lg border border-gray-100 px-4 py-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                        <Avatar className="size-12">
                          <AvatarImage
                            src={review.customer?.avatarUrl || undefined}
                            alt={customerName}
                          />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {customerName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatReviewDate(review.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {renderReviewStars(review.rating)}
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                {review.rating}/5
                              </span>
                            </div>
                          </div>

                          {review.comment && (
                            <p className="text-sm leading-relaxed text-gray-700">
                              {review.comment}
                            </p>
                          )}

                          {review.images && review.images.length > 0 && (
                            <div className="flex flex-wrap gap-3">
                              {review.images.map((image, index) => (
                                <img
                                  key={
                                    image.imagePublicId ||
                                    `${review.id}-${index}`
                                  }
                                  src={image.imageUrl}
                                  alt={`Đánh giá của ${customerName} - ${
                                    index + 1
                                  }`}
                                  className="h-20 w-20 rounded-lg border object-cover"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};
