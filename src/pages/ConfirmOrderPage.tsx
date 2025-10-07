import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { createOrderFromPreview, type CreateOrderFromPreviewRequest, type OrderEntity } from '@/api/order';
import { getUserProfile } from '@/api/user';

const currency = (v: number) => v.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

export default function ConfirmOrderPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderPreviewId = params.get('previewId') || '';

  type ShippingMethodOption = 'Nhanh' | 'TietKiem';
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodOption | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderEntity | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  const canSubmit = useMemo(() => !!orderPreviewId && !!shippingMethod && !submitting, [orderPreviewId, shippingMethod, submitting]);

  useEffect(() => {
    if (!orderPreviewId) {
      setError('Thiếu previewId. Vui lòng quay lại bước trước.');
    }
  }, [orderPreviewId]);

  const handleConfirm = async () => {
    if (!orderPreviewId) {
      setError('Thiếu previewId');
      return;
    }
    if (!shippingMethod) {
      setError('Vui lòng chọn phương thức giao hàng');
      return;
    }
    // Map shipping method to a shippingDetailId (placeholder/demo mapping)
    const methodToDetailId: Record<ShippingMethodOption, string> = {
      Nhanh: 'MTFfN18xMTkw', // example id
      TietKiem: 'MTFfN18xMTkx', // example id
    };
    const payload: CreateOrderFromPreviewRequest = { shippingDetailId: methodToDetailId[shippingMethod] };
    try {
      setSubmitting(true);
      setError(null);
      const res = await createOrderFromPreview(orderPreviewId, payload);
      if (!res.status) {
        setError(res.errors?.[0] || 'Tạo đơn hàng thất bại');
        return;
      }
      setOrder(res.data);
      // Navigate to success page with order in navigation state for richer UI
      navigate('/order/success', { state: { order: res.data } });
    } catch (e: any) {
      setError(e?.message || 'Không thể tạo đơn hàng');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 mt-[100px]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Xác nhận đặt hàng</h1>
        </motion.div>

        {error && (
          <div className="mb-4 text-red-600 text-sm">{error}</div>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Chọn phương thức giao hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="radio" name="ship" checked={shippingMethod==='Nhanh'} onChange={() => setShippingMethod('Nhanh')} />
                <span>Giao hàng Nhanh (nhận sớm)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="ship" checked={shippingMethod==='TietKiem'} onChange={() => setShippingMethod('TietKiem')} />
                <span>Giao hàng Tiết kiệm (phí thấp)</span>
              </label>
            </div>
            <Button className="bg-green-600 hover:bg-green-700" disabled={!canSubmit} onClick={handleConfirm}>
              {submitting ? <Spinner variant="circle-filled" size={16} /> : 'Đặt hàng'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/order/preview')}>Quay lại</Button>
          </CardContent>
        </Card>

        {order && (
          <Card>
            <CardHeader>
              <CardTitle>Đơn hàng đã tạo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 1) Thông tin khách hàng */}
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

              {/* 2) Địa chỉ giao */}
              <div className="text-sm">
                <div className="font-semibold mb-1">Địa chỉ giao</div>
                <div className="text-gray-700">
                  {[
                    order.address?.locationAddress,
                    order.address?.commune,
                    order.address?.district,
                    order.address?.province,
                  ].filter(Boolean).join(', ')}
                </div>
              </div>

              <Separator />

              {/* 3) Sản phẩm */}
              <div className="space-y-2">
                <div className="font-semibold">Sản phẩm</div>
                {order.orderDetails.map((d) => (
                  <div key={d.id} className="flex items-center justify-between text-sm">
                    <div className="text-gray-800">{d.product.productName} x {d.quantity}</div>
                    <div className="font-semibold">{currency(d.subtotal)}</div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* 4) Trạng thái và thông tin đơn */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Mã đơn</div>
                  <div className="font-semibold">#{order.id}</div>
                </div>
                <div>
                  <div className="text-gray-500">Trạng thái</div>
                  <div className="font-semibold">{order.status === 'Pending' ? 'Đang duyệt đơn hàng' : order.status}</div>
                </div>
                <div>
                  <div className="text-gray-500">Phương thức TT</div>
                  <div className="font-semibold">{order.orderPaymentMethod}</div>
                </div>
                <div>
                  <div className="text-gray-500">Phương thức giao</div>
                  <div className="font-semibold">{order.shippingMethod}</div>
                </div>
              </div>

              <Separator />

              {/* 5) Tóm tắt tiền */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="text-gray-600">Tạm tính</div>
                  <div className="font-semibold">{currency(order.subtotal)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-gray-600">Phí vận chuyển</div>
                  <div className="font-semibold">{order.shippingFee === 0 ? 'Miễn phí' : currency(order.shippingFee)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-gray-600">Thuế (VAT)</div>
                  <div className="font-semibold">{currency(order.taxAmount)}</div>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="text-gray-600">Giảm giá</div>
                    <div className="font-semibold">-{currency(order.discountAmount)}</div>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between text-base">
                  <div className="font-bold">Tổng cộng</div>
                  <div className="font-bold text-green-700">{currency(order.totalAmount)}</div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => navigate('/cart')}>Về giỏ hàng</Button>
                <Button variant="outline" onClick={() => navigate('/')}>Tiếp tục mua sắm</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


