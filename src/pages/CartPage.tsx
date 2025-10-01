import React, { useMemo, useState, useEffect } from "react";
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
import { getCart, type CartItem } from '@/api/cart';

// Sử dụng CartItem từ API thay vì định nghĩa local

const currency = (v: number) =>
  v.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

export const CartPage = () => {
  const [cartResponse, setCartResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<string>("");

  // Fetch cart data from API
  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Starting API call...');
      console.log('Auth token:', localStorage.getItem('authToken'));
      
      const cartData = await getCart();
      console.log('Cart data received:', cartData);
      console.log('Cart items:', cartData?.cartItems);
      
      // Accept any response that has data
      if (cartData) {
        setCartResponse(cartData);
        console.log('Cart data set successfully');
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
        data: err?.data
      });
      setError(err?.message || 'Không thể tải giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Extract items from API response - handle actual response structure
  const items = cartResponse?.cartItems || [];
  
  // Debug logging
  console.log('Cart response:', cartResponse);
  console.log('Cart items:', items);
  console.log('Items length:', items.length);
  
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

  const updateQty = (id: number, delta: number) => {
    // TODO: Implement API call to update quantity
    console.log('Update quantity for item:', id, 'delta:', delta);
  };

  const removeItem = (id: number) => {
    // TODO: Implement API call to remove item
    console.log('Remove item:', id);
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
    return (
      <div className="min-h-screen bg-gray-50 mt-[20px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-600 mb-2">Lỗi tải giỏ hàng</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button 
            onClick={fetchCart}
            className="bg-green-600 hover:bg-green-700"
          >
            Thử lại
          </Button>
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
                        src={item.images ? `https://sep490.onrender.com/images/${item.images.split(',')[0]}` : '/placeholder-product.jpg'}
                        alt={item.productName}
                        className="w-32 h-32 object-cover rounded-xl shadow-sm"
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
                              aria-label="Xóa sản phẩm"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-10 h-10 rounded-full border-2 hover:bg-gray-50"
                              onClick={() => updateQty(item.productId, -1)}
                              aria-label="Giảm số lượng"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="min-w-12 text-center font-semibold text-lg">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-10 h-10 rounded-full border-2 hover:bg-gray-50"
                              onClick={() => updateQty(item.productId, 1)}
                              aria-label="Tăng số lượng"
                            >
                              <Plus className="h-4 w-4" />
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
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      Thanh toán
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
