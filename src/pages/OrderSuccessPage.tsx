import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
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
  const [params] = useSearchParams();
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
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">Đặt hàng thành công</h1>
            <p className="text-gray-600 mt-1">Mã đơn hàng #{order.id}</p>
          </div>
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
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button onClick={() => navigate('/')}>Tiếp tục mua sắm</Button>
                  <Button variant="outline" onClick={() => navigate('/cart')}>Xem giỏ hàng</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


