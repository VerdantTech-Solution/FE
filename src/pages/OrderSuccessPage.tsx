import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import type { OrderEntity } from '@/api/order';
import { getUserProfile } from '@/api/user';

const currency = (v: number) => v.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

export default function OrderSuccessPage() {
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  const summary = useMemo(() => {
    if (!order) return null;
    return {
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      taxAmount: order.taxAmount,
      discountAmount: order.discountAmount,
      total: order.totalAmount,
    };
  }, [order]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        // Read order entity passed via navigation state
        const state = window.history.state && (window.history.state as any).usr;
        const maybeOrder: OrderEntity | null = state?.order || null;
        if (maybeOrder) {
          setOrder(maybeOrder);
        } else {
          setError('Không tìm thấy dữ liệu đơn hàng.');
        }
        // also load profile for customer display
        try {
          const profileRes: any = await getUserProfile();
          const profile: any = profileRes?.data ?? profileRes;
          setCustomerName(profile?.fullName || '');
          setCustomerEmail(profile?.email || '');
          setCustomerPhone(profile?.phoneNumber || '');
        } catch {}
      } catch (e: any) {
        setError(e?.message || 'Không thể tải trang');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 mt-[100px] flex items-center justify-center">
        <Spinner variant="circle-filled" size={60} className="text-green-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 mt-[100px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-red-600 text-sm">{error || 'Không có dữ liệu'}</div>
          <Button variant="outline" onClick={() => navigate('/')}>Về trang chủ</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 mt-[100px]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-10">
            {/* Success Icon */}
            <motion.div 
              className="mx-auto w-28 h-28 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-8 shadow-2xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            
            <motion.h1 
              className="text-4xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Thanh toán thành công!
            </motion.h1>
            <motion.p 
              className="text-lg text-gray-600 mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Cảm ơn bạn đã hoàn tất đơn hàng. Chúng tôi đã nhận được thanh toán của bạn.
            </motion.p>
            <motion.div 
              className="inline-block bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-6 py-3 rounded-full text-sm font-semibold shadow-md border-2 border-green-200"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              🔖 Mã đơn hàng: #{order.id}
            </motion.div>
          </div>
        </motion.div>

        {/* Chi tiết đơn hàng */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="mb-8 shadow-xl border-2 border-green-100">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-6">Chi tiết đơn hàng</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-gray-500 text-sm mb-1">Mã đơn hàng</div>
                  <div className="font-bold text-gray-900 text-lg">#{order.id}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="text-gray-500 text-sm mb-1">Ngày thanh toán</div>
                  <div className="font-bold text-gray-900 text-lg">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <div className="text-gray-500 text-sm mb-1">Phương thức</div>
                  <div className="font-bold text-gray-900 text-lg">{order.orderPaymentMethod}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-300">
                  <div className="text-gray-500 text-sm mb-1">Tổng tiền</div>
                  <div className="font-bold text-green-600 text-2xl">{currency(order.totalAmount)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bước tiếp theo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="mb-8 shadow-xl border-2 border-blue-100">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">Bước tiếp theo</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Email xác nhận */}
                <motion.div 
                  className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="font-bold text-gray-900 mb-1">Email xác nhận</div>
                    <div className="text-sm text-gray-600">đã được gửi</div>
                  </div>
                </motion.div>

                {/* Xử lý đơn hàng */}
                <motion.div 
                  className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200 hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="font-bold text-gray-900 mb-1">Đơn hàng sẽ được</div>
                    <div className="text-sm text-gray-600">xử lý trong 24h</div>
                  </div>
                </motion.div>

                {/* Thông báo giao hàng */}
                <motion.div 
                  className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <div className="font-bold text-gray-900 mb-1">Thông báo khi</div>
                    <div className="text-sm text-gray-600">giao hàng</div>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Khách hàng</div>
                    <div className="font-semibold">{customerName || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Email</div>
                    <div className="font-semibold">{customerEmail || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Số điện thoại</div>
                    <div className="font-semibold">{customerPhone || '—'}</div>
                  </div>
                </div>
                <Separator />
                <div className="text-sm">
                  <div className="text-gray-500">Địa chỉ giao</div>
                  <div className="font-semibold text-gray-800">
                    {[
                      order.address?.locationAddress,
                      order.address?.commune,
                      order.address?.district,
                      order.address?.province,
                    ].filter(Boolean).join(', ')}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Sản phẩm</div>
                  <div className="text-sm text-gray-500">{order.orderDetails.length} mặt hàng</div>
                </div>
                <div className="divide-y rounded-md border">
                  {order.orderDetails.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-4">
                      <div className="text-gray-800">
                        <div className="font-medium">{d.product.productName}</div>
                        <div className="text-xs text-gray-500">x{d.quantity}</div>
                      </div>
                      <div className="font-semibold">{currency(d.subtotal)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="text-gray-600">Trạng thái</div>
                  <div className="font-semibold">{order.status === 'Pending' ? 'Đang duyệt đơn hàng' : order.status}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-gray-600">Thanh toán</div>
                  <div className="font-semibold">{order.orderPaymentMethod}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-gray-600">Vận chuyển</div>
                  <div className="font-semibold">{order.shippingMethod}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="text-gray-600">Tạm tính</div>
                  <div className="font-semibold">{summary ? currency(summary.subtotal) : '—'}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-gray-600">Phí vận chuyển</div>
                  <div className="font-semibold">{summary ? (summary.shippingFee === 0 ? 'Miễn phí' : currency(summary.shippingFee)) : '—'}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-gray-600">Thuế (VAT)</div>
                  <div className="font-semibold">{summary ? currency(summary.taxAmount) : '—'}</div>
                </div>
                {summary && summary.discountAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="text-gray-600">Giảm giá</div>
                    <div className="font-semibold">-{currency(summary.discountAmount)}</div>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between text-base">
                  <div className="font-bold">Tổng cộng</div>
                  <div className="font-bold text-green-700">{summary ? currency(summary.total) : '—'}</div>
                </div>
                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/')} 
                      className="w-full bg-white"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Về trang chủ
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      className="w-full bg-green-600"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Theo dõi đơn hàng
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      
      </div>
    </div>
  );
}


