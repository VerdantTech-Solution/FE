import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Trash2,
  Plus,
  Minus,
  Truck,
  ShieldCheck,
  BadgePercent,
  Package,
  X,
  ArrowLeft,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import logo from "@/assets/logo.png";
import { Footer } from "./Footer";
import { motion } from "framer-motion";
import { getCart, updateCartItem, type CartItem } from '@/api/cart';
import { useNavigate } from 'react-router';
import { PATH_NAMES } from '@/constants';

// Sử dụng CartItem từ API thay vì định nghĩa local

// Processed cart item with images as string
interface ProcessedCartItem extends Omit<CartItem, 'images'> {
  images: string;
}

const currency = (v: number) =>
  v.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

// Constants
// const IMAGE_BASE_URL = 'https://sep490.onrender.com/images/'; // Commented out for hardcoded images
const PLACEHOLDER_IMAGE = '/placeholder-product.jpg';

// Hardcoded images for testing
const HARDCODED_IMAGES = [
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop', // Farm equipment
  'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&h=200&fit=crop', // Tractor
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop', // Agriculture
  'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&h=200&fit=crop', // Machinery
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop'  // Equipment
];

// Helper function to get image URL
const getImageUrl = (_images: string | undefined, productId: number): string => {
  // Use hardcoded images for now
  const hardcodedImage = HARDCODED_IMAGES[productId % HARDCODED_IMAGES.length];
  return hardcodedImage;
  
  // Original logic commented out for now
  /*
  if (!images || images.trim() === '') {
    console.log('No images provided, using placeholder');
    return PLACEHOLDER_IMAGE;
  }
  
  try {
    // Get the first image from comma-separated list
    const firstImage = images.split(',')[0].trim();
    
    if (!firstImage) {
      console.log('Empty first image, using placeholder');
      return PLACEHOLDER_IMAGE;
    }
    
    console.log('Processing image:', firstImage);
    
    // If images is already a full URL, use it directly
    if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
      console.log('Using full URL:', firstImage);
      return firstImage;
    }
    
    // If images is a relative path, add base URL
    const fullUrl = `${IMAGE_BASE_URL}${firstImage}`;
    console.log('Using relative path with base URL:', fullUrl);
    return fullUrl;
  } catch (error) {
    console.warn('Error processing image URL:', error);
    return PLACEHOLDER_IMAGE;
  }
  */
};

export const CartPage = () => {
  const navigate = useNavigate();
  const [cartResponse, setCartResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<string>("");
  const [updatingItem, setUpdatingItem] = useState<number | null>(null);
  const [removingItem, setRemovingItem] = useState<number | null>(null);

  // Debug logging for state changes
  useEffect(() => {
    console.log('updatingItem state changed:', updatingItem);
  }, [updatingItem]);

  // Fetch cart data from API
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Starting API call...');
      console.log('Auth token:', localStorage.getItem('authToken'));
      
      const cartData = await getCart();
      console.log('Raw cart data received:', cartData);
      
      // Check if we have valid cart data
      if (cartData) {
        console.log('Cart data received:', cartData);
        
        // Check for different response structures
        let hasItems = false;
        
        if (cartData.data && cartData.data.cartItems && Array.isArray(cartData.data.cartItems)) {
          console.log('Found cartItems in data.cartItems:', cartData.data.cartItems.length, 'items');
          hasItems = cartData.data.cartItems.length > 0;
        } else if (cartData.cartItems && Array.isArray(cartData.cartItems)) {
          console.log('Found cartItems directly:', cartData.cartItems.length, 'items');
          hasItems = cartData.cartItems.length > 0;
        } else if (Array.isArray(cartData)) {
          console.log('Response is array:', cartData.length, 'items');
          hasItems = cartData.length > 0;
        }
        
        // Log the actual structure for debugging
        if (cartData.data) {
          console.log('Cart data structure:', {
            hasUserInfo: !!cartData.data.userInfo,
            hasCartItems: !!cartData.data.cartItems,
            cartItemsLength: cartData.data.cartItems?.length || 0,
            firstItemImages: cartData.data.cartItems?.[0]?.images
          });
        }
        
        setCartResponse(cartData);
        console.log('Cart data set successfully, has items:', hasItems);
        setError(null); // Clear any previous errors
      } else {
        console.warn('No cart data received');
        setError('Không nhận được dữ liệu giỏ hàng');
      }
    } catch (err: any) {
      console.error('Error fetching cart:', err);
      console.error('Error details:', {
        message: err?.message,
        status: err?.status,
        statusCode: err?.statusCode,
        data: err?.data,
        response: err?.response
      });
      
      // Xử lý lỗi 401 - Unauthorized
      if (err?.status === 401 || err?.statusCode === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        // Tự động chuyển về trang login sau 2 giây
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(err?.message || 'Không thể tải giỏ hàng');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Listen for cart updates from other pages
  useEffect(() => {
    const handleCartUpdate = () => {
      console.log('Cart update event received, refreshing cart...');
      fetchCart();
    };

    window.addEventListener('cart:updated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cart:updated', handleCartUpdate);
    };
  }, []);

  // Extract items from API response - handle different response structures
  const items: ProcessedCartItem[] = useMemo(() => {
    if (!cartResponse) {
      console.log('No cart response');
      return [];
    }
    
    console.log('Processing cart response:', cartResponse);
    console.log('Cart response type:', typeof cartResponse);
    console.log('Cart response keys:', Object.keys(cartResponse));
    
    let cartItems: CartItem[] = [];
    
    // Handle different response structures
    if (cartResponse.data && cartResponse.data.cartItems && Array.isArray(cartResponse.data.cartItems)) {
      console.log('Using data.cartItems structure, found', cartResponse.data.cartItems.length, 'items');
      cartItems = cartResponse.data.cartItems;
    } else if (cartResponse.cartItems && Array.isArray(cartResponse.cartItems)) {
      console.log('Using cartItems structure, found', cartResponse.cartItems.length, 'items');
      cartItems = cartResponse.cartItems;
    } else if (Array.isArray(cartResponse)) {
      console.log('Response is array, found', cartResponse.length, 'items');
      cartItems = cartResponse;
    }
    
    // Process images to convert from array to string if needed
    const processedItems = cartItems.map(item => {
      let imageString = '';
      
      console.log('Processing item images:', item.productName, item.images);
      
      if (Array.isArray(item.images)) {
        // Convert array of image objects to comma-separated string
        imageString = item.images.map((img: any) => img.imageUrl).join(',');
        console.log('Converted array to string:', imageString);
      } else if (typeof item.images === 'string') {
        imageString = item.images;
        console.log('Using string as is:', imageString);
      }
      
      return {
        ...item,
        images: imageString
      } as ProcessedCartItem;
    });
    
    console.log('Processed items:', processedItems);
    return processedItems;
  }, [cartResponse]);
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Cart response:', cartResponse);
    console.log('Cart items:', items);
    console.log('Items length:', items.length);
  }
  
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items]
  );
  const shipping = subtotal > 500000 ? 0 : 30000;
  const vat = Math.round(subtotal * 0.08);
  const discount = useMemo(() => {
    // Simple demo: SALE10 = 10% off on subtotal (cap 100k)
    if (appliedCoupon.toUpperCase() === "SALE10") {
      return Math.min(Math.round(subtotal * 0.1), 100000);
    }
    return 0;
  }, [appliedCoupon, subtotal]);

  const total = Math.max(0, subtotal - discount) + shipping + vat;

  const updateQty = useCallback(async (id: number, delta: number) => {
    try {
      console.log('Starting update quantity for item:', id, 'delta:', delta);
      setUpdatingItem(id);
      
      // Force a re-render by using setTimeout
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const item = items.find(item => item.productId === id);
      if (!item) {
        console.log('Item not found:', id);
        setUpdatingItem(null);
        return;
      }
      
      // If quantity is 1 and user clicks minus, hard delete by setting quantity to 0
      if (delta === -1 && item.quantity === 1) {
        console.log('Quantity is 1 and minus clicked. Removing item:', id);
        setRemovingItem(id);
        await updateCartItem(id, 0);
        await fetchCart();
        window.dispatchEvent(new CustomEvent('cart:updated'));
        setRemovingItem(null);
        setUpdatingItem(null);
        return;
      }
      
      const newQuantity = Math.max(1, item.quantity + delta);
      console.log('Update quantity for item:', id, 'new quantity:', newQuantity);
      
      await updateCartItem(id, newQuantity);
      
      // Refresh cart data
      await fetchCart();
      
      // Dispatch event to update cart count in Navbar
      window.dispatchEvent(new CustomEvent('cart:updated'));
      
      console.log('Quantity updated successfully');
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      alert('Có lỗi xảy ra khi cập nhật số lượng. Vui lòng thử lại.');
    } finally {
      console.log('Clearing updating item state');
      setUpdatingItem(null);
    }
  }, [items, fetchCart]);

  const removeItem = async (id: number) => {
    try {
      if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?')) {
        return;
      }
      
      setRemovingItem(id);
      console.log('Removing item:', id);
      
      // Set quantity to 0 to remove item (HARD DELETE)
      await updateCartItem(id, 0);
      
      // Refresh cart data
      await fetchCart();
      
      // Dispatch event to update cart count in Navbar
      window.dispatchEvent(new CustomEvent('cart:updated'));
      
      console.log('Item removed successfully');
    } catch (error: any) {
      console.error('Error removing item:', error);
      alert('Có lỗi xảy ra khi xóa sản phẩm. Vui lòng thử lại.');
    } finally {
      setRemovingItem(null);
    }
  };


  const applyCoupon = () => {
    setAppliedCoupon(coupon.trim());
  };

  const removeCoupon = () => {
    setAppliedCoupon("");
    setCoupon("");
  };


  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 mt-[20px] flex items-center justify-center">
        <div className="text-center">
          <Spinner variant="circle-filled" size={60} className="text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Đang tải giỏ hàng...</h3>
          <p className="text-gray-500">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  // Only show error if we have no data at all
  if (error && !cartResponse && items.length === 0) {
    const isAuthError = error.includes('Phiên đăng nhập đã hết hạn');
    
    return (
      <div className="min-h-screen bg-gray-50 mt-[20px] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">{isAuthError ? '🔒' : '⚠️'}</div>
          <h3 className="text-xl font-semibold text-red-600 mb-2">
            {isAuthError ? 'Phiên đăng nhập hết hạn' : 'Lỗi tải giỏ hàng'}
          </h3>
          <p className="text-gray-500 mb-4">{error}</p>
          {isAuthError ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">Đang chuyển về trang đăng nhập...</p>
              <Button 
                onClick={() => window.location.href = '/login'}
                className="bg-green-600 hover:bg-green-700"
              >
                Đăng nhập ngay
              </Button>
            </div>
          ) : (
            <Button 
              onClick={fetchCart}
              className="bg-green-600 hover:bg-green-700"
            >
              Thử lại
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-[20px]">
      
      
      {/* Header */}
      <div className="bg-white border-b">
        <motion.div
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-gray-100 rounded-full"
              onClick={() => window.history.back()}
              aria-label="Quay lại"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <a href="/" aria-label="Về trang chủ">
                  <img
                    src={logo}
                    alt="VerdantTech logo"
                    className="w-8 h-8 border rounded-[3px] object-cover"
                  />
                </a>
                <span className="text-sm text-gray-500 tracking-wide">VerdantTech</span>
              </div>
              <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900">
                Shopping Cart
              </h1>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.08 } },
            }}
          >
            {items.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                    <Package className="h-8 w-8" />
                  </div>
                  <p className="text-gray-700 font-medium text-lg">Giỏ hàng đang trống</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Hãy khám phá và thêm sản phẩm yêu thích của bạn.
                  </p>
                  <div className="mt-8">
                    <Button
                      onClick={() => window.history.back()}
                      className="bg-green-600 hover:bg-green-700 px-8 py-3"
                    >
                      Tiếp tục mua sắm
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              items.map((item) => (
                <motion.div
                  key={item.productId}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <img
                        src={getImageUrl(item.images, item.productId)}
                        alt={item.productName}
                        className="w-32 h-32 object-cover rounded-xl shadow-sm"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          e.currentTarget.src = PLACEHOLDER_IMAGE;
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                              {item.productName}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-green-700 font-semibold text-lg">
                                {currency(item.unitPrice)}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-500">★</span>
                                <span className="text-sm text-gray-500">{item.ratingAverage}</span>
                              </div>
                            </div>
                          </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-white hover:bg-red-500 rounded-full p-2 transition-all duration-200"
                              onClick={() => removeItem(item.productId)}
                              disabled={removingItem === item.productId}
                              aria-label="Xóa sản phẩm"
                            >
                              {removingItem === item.productId ? (
                                <Spinner variant="circle-filled" size={16} />
                              ) : (
                                <Trash2 className="h-5 w-5" />
                              )}
                            </Button>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-10 h-10 rounded-full border-2 hover:bg-gray-50"
                              onClick={() => {
                                console.log('Minus button clicked for item:', item.productId);
                                console.log('Current updatingItem:', updatingItem);
                                updateQty(item.productId, -1);
                              }}
                              disabled={updatingItem === item.productId}
                              aria-label="Giảm số lượng"
                            >
                              {updatingItem === item.productId ? (
                                <Spinner variant="circle-filled" size={16} />
                              ) : (
                                <Minus className="h-4 w-4" />
                              )}
                            </Button>
                            <span className="min-w-12 text-center font-semibold text-lg">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-10 h-10 rounded-full border-2 hover:bg-gray-50"
                              onClick={() => {
                                console.log('Plus button clicked for item:', item.productId);
                                console.log('Current updatingItem:', updatingItem);
                                updateQty(item.productId, 1);
                              }}
                              disabled={updatingItem === item.productId}
                              aria-label="Tăng số lượng"
                            >
                              {updatingItem === item.productId ? (
                                <Spinner variant="circle-filled" size={16} />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                            <div className="text-right">
                            <div className="text-sm text-gray-500 mb-1">Tạm tính</div>
                            <div className="font-bold text-gray-900 text-xl">
                              {currency(item.unitPrice * item.quantity)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </motion.div>
              ))
            )}

            {items.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.5 }}
              >
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Truck className="h-6 w-6 text-green-700" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">
                        Đơn hàng trên <span className="font-semibold text-green-800">500.000đ</span> sẽ được{" "}
                        <span className="font-bold text-green-800">miễn phí vận chuyển</span>.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            )}
          </motion.div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
              <Card className="shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-gray-900">Tóm tắt đơn hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
                      <BadgePercent className="h-4 w-4 text-green-700" />
                      <span>Mã ưu đãi</span>
                    </div>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between rounded-lg border-2 border-green-200 px-4 py-3 bg-green-50 text-green-800">
                        <span className="font-semibold">{appliedCoupon}</span>
                        <Button variant="ghost" size="sm" onClick={removeCoupon} aria-label="Xóa mã" className="text-green-600 hover:text-green-800">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={coupon}
                          onChange={(e) => setCoupon(e.target.value)}
                          placeholder="Nhập mã (vd: SALE10)"
                          className="flex-1"
                        />
                        <Button onClick={applyCoupon} className="bg-green-600 hover:bg-green-700 px-6">
                          Áp dụng
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-700">
                      <span>Tạm tính</span>
                      <span className="font-semibold">{currency(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex items-center justify-between text-sm text-gray-700">
                        <span>Giảm giá</span>
                        <span className="font-semibold text-green-700">- {currency(discount)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-700">
                      <span>Phí vận chuyển</span>
                      <span className="font-semibold">
                        {shipping === 0 ? (
                          <span className="text-green-700">Miễn phí</span>
                        ) : (
                          currency(shipping)
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-700">
                      <span>VAT (8%)</span>
                      <span className="font-semibold">{currency(vat)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-lg">Tổng cộng</span>
                    <span className="font-bold text-green-700 text-2xl">
                      {currency(total)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <Button
                      disabled={items.length === 0}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl py-4 text-lg transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                      onClick={() => navigate(PATH_NAMES.ORDER_PREVIEW)}
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      Xem trước đơn hàng
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full rounded-xl py-4 text-lg border-2 border-green-200 text-green-700 hover:bg-green-50 font-semibold"
                      onClick={() => window.history.back()}
                    >
                      Tiếp tục mua sắm
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    <span>Thanh toán an toàn • Bảo vệ người mua</span>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
     <Footer />
    </div>
  );
}
