import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { createOrderFromPreview, type CreateOrderFromPreviewRequest } from '@/api/order';
import { clearCart } from '@/api/cart';
import { redirectToPayOS } from '@/api/payos';

export default function ConfirmOrderPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderPreviewId = params.get('previewId') || '';

  type ShippingMethodOption = 'Nhanh' | 'TietKiem';
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodOption | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    // Map shipping method to a priceTableId (placeholder/demo mapping)
    const methodToDetailId: Record<ShippingMethodOption, number> = {
      Nhanh: 1, // example id
      TietKiem: 2, // example id
    };
    const payload: CreateOrderFromPreviewRequest = { priceTableId: methodToDetailId[shippingMethod] };
    try {
      setSubmitting(true);
      setError(null);
      const res = await createOrderFromPreview(orderPreviewId, payload);
      if (!res.status) {
        setError(res.errors?.[0] || 'Tạo đơn hàng thất bại');
        return;
      }
      // Clear cart after successful order creation
      try {
        await clearCart();
        // Dispatch event to update cart count in Navbar and other components
        window.dispatchEvent(new CustomEvent('cart:updated'));
        console.log('Cart cleared after successful order');
      } catch (clearError) {
        console.error('Error clearing cart:', clearError);
        // Don't block navigation if cart clearing fails
      }
      // For Banking payment method, redirect to PayOS
      console.log('✅ Order created successfully!');
      console.log('📦 Order ID:', res.data.id);
      console.log('💳 Payment method:', res.data.orderPaymentMethod);
      
      if (res.data.orderPaymentMethod === 'Banking') {
        console.log('🔄 Redirecting to PayOS for Banking payment...');
        // Call PayOS API to get payment link and redirect
        await redirectToPayOS(res.data.id, 'Thanh toán đơn hàng');
        return; // Exit function, navigation happens in redirectToPayOS
      } else {
        console.log('ℹ️ Payment method is', res.data.orderPaymentMethod, '- skipping PayOS');
        // Navigate to order history for COD/Wallet payments
        navigate('/order/history');
      }
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

      </div>
    </div>
  );
}


