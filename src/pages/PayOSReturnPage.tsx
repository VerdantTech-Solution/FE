import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { CheckCircle2, Home, Package, FileText, Download } from 'lucide-react';
import { getOrderById } from '@/api/order';
import type { OrderEntity } from '@/api/order';
import { clearCart } from '@/api/cart';

export default function PayOSReturnPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderEntity | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        // Get order info from URL parameters
        const id = params.get('orderId') || params.get('order_id') || params.get('orderCode') || params.get('order_code');
        const amt = params.get('amount') || params.get('total');
        
        setOrderId(id);
        setAmount(amt);
        
        // Payment successful, clear cart now
        if (id) {
          console.log('[PayOS Return] Payment successful for order:', id);
          setCreatingOrder(true);
          
          try {
            // Clear cart after successful payment
            await clearCart();
            console.log('[PayOS Return] ✅ Cart cleared after successful payment');
            window.dispatchEvent(new CustomEvent('cart:updated'));
          } catch (clearError) {
            console.error('[PayOS Return] ⚠️ Error clearing cart:', clearError);
          } finally {
            setCreatingOrder(false);
          }
        }
        
        if (id) {
          // Fetch order details if orderId is available
          try {
            const orderIdNum = parseInt(id);
            if (!isNaN(orderIdNum)) {
              const orderData = await getOrderById(orderIdNum);
              if (orderData.status && orderData.data) {
                setOrder(orderData.data);
              }
            }
          } catch (error) {
            console.error('Error fetching order:', error);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading order:', error);
        setLoading(false);
      }
    };
    
    loadOrder();
  }, [params]);

  const formatCurrency = (value: string | null) => {
    if (!value) return '';
    const num = parseInt(value);
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(num);
  };

  if (loading || creatingOrder) {
    return (
      <div className="min-h-screen bg-gray-50 mt-[100px] flex items-center justify-center">
        <div className="text-center">
          <Spinner variant="circle-filled" size={60} className="text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {creatingOrder ? 'Đang tạo đơn hàng...' : 'Đang tải...'}
          </h3>
          <p className="text-gray-500">
            {creatingOrder ? 'Vui lòng chờ trong giây lát' : 'Đang xử lý thanh toán'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50 mt-[100px]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Main Content Card */}
          <Card className="shadow-2xl border-2 border-green-100">
            <CardContent className="p-8">
              {/* Success Icon */}
              <div className="text-center mb-8">
                <div className="mx-auto w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mb-6 shadow-lg">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                  Thanh toán thành công!
                </h1>
                <p className="text-lg text-gray-600 mb-4">
                  Cảm ơn bạn! Giao dịch đã được xác nhận và xử lý thành công.
                </p>
                
                {orderId && (
                  <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-2">
                    Mã đơn: #{orderId}
                  </div>
                )}
                
                {(order || amount) && (
                  <div className="text-2xl font-bold text-green-600 mt-2">
                    {order
                      ? order.totalAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
                      : formatCurrency(amount)}
                  </div>
                )}
              </div>

              {/* Success Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-6 text-center border border-blue-200">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Xác nhận đơn hàng</h3>
                  <p className="text-sm text-gray-600">Đơn hàng đã được tạo và xác nhận</p>
                </div>

                <div className="bg-green-50 rounded-lg p-6 text-center border border-green-200">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Thanh toán hoàn tất</h3>
                  <p className="text-sm text-gray-600">Giao dịch đã được xử lý thành công</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-6 text-center border border-purple-200">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email xác nhận</h3>
                  <p className="text-sm text-gray-600">Chi tiết đã được gửi đến email</p>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 p-6 mb-8 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Các bước tiếp theo
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center">
                    <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm mr-3 font-semibold">1</span>
                    <span>Bạn sẽ nhận được email xác nhận đơn hàng trong vài phút</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm mr-3 font-semibold">2</span>
                    <span>Đơn hàng sẽ được chuẩn bị và đóng gói trong 24 giờ</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm mr-3 font-semibold">3</span>
                    <span>Bạn sẽ nhận được thông báo khi đơn hàng được giao</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button
                  onClick={() => navigate('/order/history')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-12 group"
                >
                  <Package className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Đơn hàng của tôi
                </Button>
                
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  className="w-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 font-medium h-12 group"
                >
                  <Download className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Tải hóa đơn
                </Button>
                
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium h-12 group"
                >
                  <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Về trang chủ
                </Button>
              </div>

              {/* Support Section */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Cần hỗ trợ?
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Nếu bạn có bất kỳ câu hỏi nào về đơn hàng, vui lòng liên hệ với chúng tôi.
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>1900-1234</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>support@company.com</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              An toàn và bảo mật • Được bảo vệ bởi PayOS
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
