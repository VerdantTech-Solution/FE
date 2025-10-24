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
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50 mt-[100px]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            {/* Success Icon */}
            <div className="mx-auto w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            {/* Decorative dots */}
            <div className="flex justify-center space-x-2 mb-6">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
            
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Thanh toán thành công!</h1>
            <p className="text-lg text-gray-600 mb-4">Cảm ơn bạn đã hoàn tất đơn hàng. Chúng tôi đã nhận được thanh toán của bạn.</p>
            <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
              Mã đơn hàng: #{order.id}
            </div>
          </div>
        </motion.div>

        {/* Chi tiết đơn hàng */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Chi tiết đơn hàng</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Mã đơn hàng</div>
                <div className="font-semibold">#{order.id}</div>
              </div>
              <div>
                <div className="text-gray-500">Ngày thanh toán</div>
                <div className="font-semibold">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</div>
              </div>
              <div>
                <div className="text-gray-500">Phương thức</div>
                <div className="font-semibold">{order.orderPaymentMethod}</div>
              </div>
              <div>
                <div className="text-gray-500">Tổng tiền</div>
                <div className="font-semibold text-green-600 text-lg">{currency(order.totalAmount)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bước tiếp theo */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Bước tiếp theo</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Email xác nhận */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Email xác nhận</div>
                    <div className="text-sm text-gray-600">đã được gửi</div>
                  </div>
                </div>
              </div>

              {/* Xử lý đơn hàng */}
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Đơn hàng sẽ được</div>
                    <div className="text-sm text-gray-600">xử lý trong 24h</div>
                  </div>
                </div>
              </div>

              {/* Thông báo giao hàng */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 0115 0v5z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Thông báo khi</div>
                    <div className="text-sm text-gray-600">giao hàng</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button className="bg-green-600 hover:bg-green-700 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Tải hóa đơn</span>
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/')} className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Về trang chủ</span>
                  </Button>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>Theo dõi đơn hàng</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-12 text-center">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cần hỗ trợ? Liên hệ với chúng tôi</h3>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-8">
              <div className="flex items-center space-x-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>1900-1234</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>support@company.com</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Live Chat</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


