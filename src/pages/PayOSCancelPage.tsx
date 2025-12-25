import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { XCircle, ShoppingCart, Home, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function PayOSCancelPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Check if this is a vendor subscription payment - redirect to subscription page
    const description = params.get("description") || "";
    const isSubscription =
      description.includes("MONTHS") ||
      description.includes("subscription") ||
      description.includes("6MONTHS") ||
      description.includes("12MONTHS");

    if (isSubscription) {
      // Redirect to vendor subscription page with cancelled status
      navigate(`/vendor/subscription?payment=cancelled`, {
        replace: true,
      });
      return;
    }

    // For other vendor payments, redirect to vendor dashboard
    if (user?.role === "Vendor") {
      navigate(`/vendor?payment=cancelled&${location.search.slice(1)}`, {
        replace: true,
      });
      return;
    }

    // Get order ID from URL parameters
    const id =
      params.get("orderId") ||
      params.get("order_id") ||
      params.get("orderCode") ||
      params.get("order_code");
    setOrderId(id);

    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, [params, user, navigate, location.search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 mt-[100px] flex items-center justify-center">
        <Spinner
          variant="circle-filled"
          size={60}
          className="text-orange-600"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-red-50 mt-[100px]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Main Content Card */}
          <Card className="shadow-2xl border-2 border-red-100">
            <CardContent className="p-8">
              {/* Cancel Icon */}
              <div className="text-center mb-8">
                <div className="mx-auto w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-6 shadow-lg">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>

                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                  Thanh toán đã bị hủy
                </h1>
                <p className="text-lg text-gray-600 mb-4">
                  Bạn đã hủy quá trình thanh toán. Đơn hàng của bạn chưa được xử
                  lý.
                </p>

                {orderId && (
                  <div className="inline-block bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-semibold">
                    Mã đơn: {orderId}
                  </div>
                )}
              </div>

              {/* Information Box */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-yellow-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                      Điều gì xảy ra tiếp theo?
                    </h3>
                    <ul className="list-disc list-inside text-yellow-800 space-y-2">
                      <li>Đơn hàng của bạn chưa được tạo</li>
                      <li>Không có khoản phí nào được tính</li>
                      <li>Sản phẩm vẫn còn trong giỏ hàng của bạn</li>
                      <li>Bạn có thể thử thanh toán lại bất cứ lúc nào</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button
                  onClick={() => navigate("/cart")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-12 group"
                >
                  <ShoppingCart className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Về giỏ hàng
                </Button>

                <Button
                  onClick={() => navigate("/order/preview")}
                  variant="outline"
                  className="w-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 font-medium h-12 group"
                >
                  <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform" />
                  Thử lại
                </Button>

                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium h-12 group"
                >
                  <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Về trang chủ
                </Button>
              </div>

              {/* Help Section */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg
                      className="w-6 h-6 text-blue-600 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Cần hỗ trợ?
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Nếu bạn gặp vấn đề trong quá trình thanh toán hoặc có câu
                    hỏi, đừng ngần ngại liên hệ với chúng tôi.
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <svg
                        className="w-5 h-5 mr-2 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <span>1900-1234</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <svg
                        className="w-5 h-5 mr-2 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
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
            <p className="text-sm text-gray-500">
              An toàn và bảo mật • Được bảo vệ bởi PayOS
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
