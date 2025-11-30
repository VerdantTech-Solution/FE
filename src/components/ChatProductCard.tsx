import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { addToCart, updateCartItem, getCart } from '@/api/cart';
import { getProductById, type Product } from '@/api/product';
import { toast } from 'sonner';

export interface ChatProduct {
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  productLink?: string;
  productId?: number;
}

interface ChatProductCardProps {
  product: ChatProduct;
}

export const ChatProductCard = ({ product }: ChatProductCardProps) => {
  const navigate = useNavigate();
  const [addingToCart, setAddingToCart] = useState(false);
  const [productData, setProductData] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);

  // Extract product ID from productLink or use productId
  const extractProductId = (): number | null => {
    if (product.productId) {
      return product.productId;
    }
    if (product.productLink) {
      // Extract ID from URL like "https://verdanttechsolution.verdev.id.vn/product/120"
      // or "/product/120" or "product/120"
      const match = product.productLink.match(/(?:^|\/)(?:product|products)\/(\d+)/i);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    return null;
  };

  const productId = extractProductId();

  // Always fetch product data from API when productId is available
  // This ensures we get complete and accurate information
  useEffect(() => {
    const fetchProductData = async () => {
      if (!productId) return;

      try {
        setLoadingProduct(true);
        const data = await getProductById(productId);
        setProductData(data);
        console.log('[ChatProductCard] Fetched product data:', {
          id: productId,
          name: data.productName,
          price: data.unitPrice,
          hasImage: !!data.images,
        });
      } catch (error) {
        console.error('[ChatProductCard] Error fetching product data:', error);
        // Continue with parsed data if API fails
      } finally {
        setLoadingProduct(false);
      }
    };

    fetchProductData();
  }, [productId]); // Always fetch when productId changes

  // Use API data if available, otherwise use parsed data
  const displayProduct = productData || {
    name: product.name,
    description: product.description,
    unitPrice: product.price || 0,
    images: product.imageUrl ? [{ imageUrl: product.imageUrl }] : [],
  };

  // Prioritize API data, fallback to parsed data
  const productName = productData?.productName || product.name || 'Đang tải...';
  const productDescription = productData?.description || product.description || '';
  const productPrice = productData?.unitPrice ?? product.price;
  
  // Extract image from API data
  let productImage = '';
  if (productData?.images) {
    if (Array.isArray(productData.images) && productData.images.length > 0) {
      productImage = productData.images[0]?.imageUrl || productData.images[0] || '';
    } else if (typeof productData.images === 'string') {
      productImage = productData.images;
    }
  }
  
  // Fallback to parsed image if API doesn't have one
  if (!productImage) {
    productImage = product.imageUrl || '';
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!productId) {
      toast.error('Không thể xác định sản phẩm');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    try {
      setAddingToCart(true);

      // Check if product already in cart
      try {
        const currentCart = await getCart();
        const cartItems = currentCart?.cartItems || [];
        const existingItem = cartItems.find((item: any) => item.productId === productId);

        if (existingItem) {
          const newQuantity = existingItem.quantity + 1;
          await updateCartItem(productId, newQuantity);
          toast.success(`Đã tăng số lượng sản phẩm lên ${newQuantity}!`);
        } else {
          await addToCart({ productId, quantity: 1 });
          toast.success('Đã thêm sản phẩm vào giỏ hàng!');
        }

        // Dispatch event to update cart count
        window.dispatchEvent(new CustomEvent('cart:updated'));
      } catch (error: any) {
        console.error('Error adding to cart:', error);
        const errorMsg = error?.message || error?.errors?.[0] || 'Không thể thêm sản phẩm vào giỏ hàng';
        toast.error(errorMsg);
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (productId) {
      navigate(`/product/${productId}`);
    } else {
      toast.error('Không thể xác định sản phẩm');
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="my-2 w-full max-w-full"
      whileHover={{ y: -2 }}
    >
      <Card className=" mt-[50px] overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white group relative w-full max-w-full">
        {/* Decorative gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-white to-emerald-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative flex gap-2 md:gap-3 p-2 md:p-3 w-full max-w-full">
          {/* Product Image */}
          <div className="flex-shrink-0">
            {loadingProduct ? (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 flex items-center justify-center shadow-sm">
                <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
              </div>
            ) : productImage ? (
              <motion.div 
                className="w-20 h-20 rounded-xl overflow-hidden bg-white border-2 border-gray-100 shadow-md group-hover:shadow-lg transition-shadow duration-300"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <img
                  src={productImage}
                  alt={productName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center"><svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                    }
                  }}
                />
              </motion.div>
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center border-2 border-green-200 shadow-sm">
                <ShoppingCart className="w-8 h-8 text-green-600" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 flex flex-col justify-between min-w-0 max-w-full">
            <div className="space-y-1 min-w-0">
              <h4 className="font-bold text-gray-900 text-xs md:text-sm line-clamp-2 leading-tight group-hover:text-green-700 transition-colors duration-200 break-words">
                {loadingProduct ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-green-500 flex-shrink-0" />
                    <span className="text-xs">Đang tải...</span>
                  </span>
                ) : (
                  productName
                )}
              </h4>
              {productDescription && (
                <p className="text-xs text-gray-600 line-clamp-1 leading-relaxed break-words">
                  {productDescription}
                </p>
              )}
              {productPrice !== undefined && productPrice > 0 && (
                <div className="flex items-baseline gap-2 pt-0.5">
                  <p className="text-sm md:text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                    {formatPrice(productPrice)}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons - Always show both buttons */}
            <div className="flex gap-1.5 md:gap-2 mt-3 md:mt-4">
              <Button
                onClick={handleAddToCart}
                disabled={addingToCart || !productId}
                size="sm"
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-xs h-8 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
              >
                {addingToCart ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin flex-shrink-0" />
                    <span className="truncate">Đang thêm...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                    <span className="truncate">Thêm vào giỏ</span>
                  </>
                )}
              </Button>
              <Button
                onClick={handleViewDetails}
                disabled={!productId}
                variant="outline"
                size="sm"
                className="flex-1 border-2 border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 font-semibold text-xs h-8 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                <span className="truncate">Xem chi tiết</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Hover effect border */}
        <div className="absolute inset-0 border-2 border-green-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </Card>
    </motion.div>
  );
};

