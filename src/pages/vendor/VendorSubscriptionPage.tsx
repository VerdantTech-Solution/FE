import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  Crown,
  Check,
  Shield,
  Clock,
  CreditCard,
  Star,
  Zap,
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  redirectToSubscriptionPayment,
  getVendorSubscription,
  type SubscriptionType,
  type VendorSubscription,
} from "@/api/payos";
import { toast } from "sonner";
import VendorSidebar from "./VendorSidebar";
import { VendorHeader } from "./VendorHeader";
import { useVendor } from "@/contexts/VendorContext";

interface SubscriptionPlan {
  id: SubscriptionType;
  name: string;
  duration: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  features: string[];
  recommended?: boolean;
  icon: React.ReactNode;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "6MONTHS",
    name: "Gói 6 Tháng",
    duration: "6 tháng",
    price: 10000,
    features: [
      "Đăng bán sản phẩm không giới hạn",
      "Hỗ trợ khách hàng 24/7",
      "Báo cáo doanh thu chi tiết",
      "Quản lý đơn hàng hiệu quả",
      "Tích hợp thanh toán PayOS",
      "Dashboard quản lý chuyên nghiệp",
    ],
    icon: <Clock className="w-8 h-8" />,
  },
  {
    id: "12MONTHS",
    name: "Gói 12 Tháng",
    duration: "12 tháng",
    price: 20000,
    originalPrice: 1000000,
    discount: 20,
    features: [
      "Tất cả tính năng gói 6 tháng",
      "Ưu tiên hiển thị sản phẩm",
      "Hỗ trợ marketing miễn phí",
      "Phân tích thị trường nâng cao",
      "Ưu đãi phí giao dịch thấp hơn",
    ],
    recommended: true,
    icon: <Crown className="w-8 h-8" />,
  },
];

export default function VendorSubscriptionPage() {
  const { user } = useAuth();
  const { refreshVendorInfo } = useVendor();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState<SubscriptionType | null>(null);
  const [currentSubscription, setCurrentSubscription] =
    useState<VendorSubscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Check for payment success/cancelled from URL params
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      setPaymentSuccess(true);
      toast.success("Thanh toán thành công! Gói duy trì đã được kích hoạt.", {
        duration: 5000,
      });
      // Clear the payment param from URL
      searchParams.delete("payment");
      setSearchParams(searchParams, { replace: true });
      // Refresh vendor info to update subscription status
      refreshVendorInfo();
    } else if (payment === "cancelled") {
      toast.error("Thanh toán đã bị hủy. Vui lòng thử lại.", {
        duration: 5000,
      });
      // Clear the payment param from URL
      searchParams.delete("payment");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshVendorInfo]);

  // Fetch current subscription status
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user?.id) {
        setLoadingSubscription(false);
        return;
      }

      try {
        setLoadingSubscription(true);
        const response = await getVendorSubscription(parseInt(user.id));
        if (response.status && response.data) {
          setCurrentSubscription(response.data);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setLoadingSubscription(false);
      }
    };

    fetchSubscription();
  }, [user?.id, paymentSuccess]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user?.id) {
      toast.error("Vui lòng đăng nhập để đăng ký gói");
      return;
    }

    // Check if already has active subscription
    if (currentSubscription?.status === "Active") {
      toast.error(
        "Bạn đã có gói đăng ký đang hoạt động. Vui lòng đợi gói hiện tại hết hạn."
      );
      return;
    }

    setLoading(plan.id);

    try {
      await redirectToSubscriptionPayment(
        parseInt(user.id),
        plan.id,
        plan.price
      );
    } catch (error: unknown) {
      console.error("Subscription error:", error);

      // Handle API error response - error is already the data object from apiClient interceptor
      interface ApiErrorData {
        status?: boolean;
        statusCode?: string;
        data?: unknown;
        errors?: string[];
        message?: string;
      }

      const errorData = error as ApiErrorData;
      const errorMessages = errorData?.errors;

      if (errorMessages && errorMessages.length > 0) {
        // Show the exact error message from API
        toast.error(errorMessages[0], {
          duration: 5000,
        });

        // Refresh subscription status if it's an active subscription error
        if (errorMessages[0].includes("gói đăng ký hoạt động")) {
          try {
            const response = await getVendorSubscription(parseInt(user.id));
            if (response.status && response.data) {
              setCurrentSubscription(response.data);
            }
          } catch {
            // Ignore refresh error
          }
        }
      } else {
        toast.error("Có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại.");
      }
    } finally {
      setLoading(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <VendorSidebar />

      <div className="flex-1 ml-64">
        <VendorHeader
          title="Đăng ký gói duy trì"
          subtitle="Chọn gói phù hợp để tiếp tục bán hàng trên nền tảng VerdantTech"
        />

        <div className="p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto"
          >
            {/* Current Subscription Status */}
            {loadingSubscription ? (
              <div className="mb-10">
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardContent className="flex items-center justify-center py-8">
                    <Spinner
                      variant="circle-filled"
                      size={24}
                      className="text-green-600"
                    />
                    <span className="ml-3 text-gray-600">
                      Đang kiểm tra gói đăng ký...
                    </span>
                  </CardContent>
                </Card>
              </div>
            ) : currentSubscription?.status === "Active" ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
              >
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg">
                  <CardContent className="py-6">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-gray-900">
                              Gói đang hoạt động
                            </h3>
                            <Badge className="bg-green-500 text-white">
                              Active
                            </Badge>
                          </div>
                          <p className="text-gray-600">
                            Gói:{" "}
                            <span className="font-semibold text-green-700">
                              {currentSubscription.type === "6MONTHS"
                                ? "Gói 6 Tháng"
                                : "Gói 12 Tháng"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-8">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-sm text-gray-500">
                              Ngày hết hạn
                            </p>
                            <p className="font-semibold text-gray-900">
                              {new Date(
                                currentSubscription.endDate
                              ).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <RefreshCw className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-sm text-gray-500">Còn lại</p>
                            <p className="font-semibold text-gray-900">
                              {Math.ceil(
                                (new Date(
                                  currentSubscription.endDate
                                ).getTime() -
                                  new Date().getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )}{" "}
                              ngày
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-green-200">
                      <p className="text-sm text-green-700 text-center">
                        <CheckCircle2 className="w-4 h-4 inline mr-1" />
                        Bạn đang sử dụng gói duy trì. Bạn có thể gia hạn khi gói
                        hiện tại sắp hết hạn.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : currentSubscription?.status === "Expired" ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
              >
                <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 shadow-lg">
                  <CardContent className="py-6">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                          <Clock className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-gray-900">
                              Gói đã hết hạn
                            </h3>
                            <Badge className="bg-amber-500 text-white">
                              Expired
                            </Badge>
                          </div>
                          <p className="text-gray-600">
                            Gói{" "}
                            <span className="font-semibold">
                              {currentSubscription.type === "6MONTHS"
                                ? "6 Tháng"
                                : "12 Tháng"}
                            </span>{" "}
                            đã hết hạn vào ngày{" "}
                            <span className="font-semibold">
                              {new Date(
                                currentSubscription.endDate
                              ).toLocaleDateString("vi-VN")}
                            </span>
                          </p>
                        </div>
                      </div>

                      <p className="text-amber-700 font-medium text-center lg:text-right">
                        Vui lòng đăng ký gói mới để tiếp tục sử dụng dịch vụ!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : null}

            {/* Benefits Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-4xl mx-auto">
              {[
                {
                  icon: <Shield className="w-6 h-6" />,
                  title: "An toàn",
                  desc: "Bảo mật cao",
                },
                {
                  icon: <Zap className="w-6 h-6" />,
                  title: "Nhanh chóng",
                  desc: "Kích hoạt tự động",
                },
                {
                  icon: <TrendingUp className="w-6 h-6" />,
                  title: "Tăng trưởng",
                  desc: "Hỗ trợ kinh doanh",
                },
                {
                  icon: <Award className="w-6 h-6" />,
                  title: "Uy tín",
                  desc: "Vendor chính thức",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Subscription Plans */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10 max-w-4xl mx-auto">
              {subscriptionPlans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.15 }}
                >
                  <Card
                    className={`relative h-full transition-all duration-300 hover:shadow-xl ${
                      plan.recommended
                        ? "border-2 border-green-500 shadow-lg shadow-green-100"
                        : "border border-gray-200 hover:border-green-300"
                    }`}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 text-sm font-semibold">
                          <Star className="w-4 h-4 mr-1" />
                          Được đề xuất
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pt-8">
                      <div
                        className={`inline-flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4 ${
                          plan.recommended
                            ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {plan.icon}
                      </div>
                      <CardTitle className="text-2xl font-bold">
                        {plan.name}
                      </CardTitle>
                      <CardDescription className="text-gray-500">
                        Thời hạn: {plan.duration}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Pricing */}
                      <div className="text-center">
                        {plan.originalPrice && (
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <span className="text-gray-400 line-through text-lg">
                              {formatCurrency(plan.originalPrice)}
                            </span>
                            <Badge variant="destructive" className="text-xs">
                              -{plan.discount}%
                            </Badge>
                          </div>
                        )}
                        <div className="text-4xl font-bold text-gray-900">
                          {formatCurrency(plan.price)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatCurrency(
                            Math.round(
                              plan.price / (plan.id === "12MONTHS" ? 12 : 6)
                            )
                          )}
                          /tháng
                        </p>
                      </div>

                      {/* Features */}
                      <ul className="space-y-3">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-3 h-3 text-green-600" />
                            </div>
                            <span className="text-gray-700 text-sm">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* Subscribe Button */}
                      <Button
                        onClick={() => handleSubscribe(plan)}
                        disabled={
                          loading !== null ||
                          currentSubscription?.status === "Active"
                        }
                        className={`w-full h-12 text-base font-semibold transition-all ${
                          currentSubscription?.status === "Active"
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : plan.recommended
                            ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                            : "bg-gray-900 hover:bg-gray-800 text-white"
                        }`}
                      >
                        {loading === plan.id ? (
                          <span className="flex items-center gap-2">
                            <Spinner
                              variant="circle-filled"
                              size={20}
                              className="text-white"
                            />
                            Đang xử lý...
                          </span>
                        ) : currentSubscription?.status === "Active" ? (
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            Đã có gói đang hoạt động
                          </span>
                        ) : currentSubscription?.status === "Expired" ? (
                          <span className="flex items-center gap-2">
                            <RefreshCw className="w-5 h-5" />
                            Gia hạn ngay
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Đăng ký ngay
                          </span>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* FAQ or Notes */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>
                Có câu hỏi? Liên hệ với chúng tôi qua{" "}
                <a href="/ticket" className="text-green-600 hover:underline">
                  hỗ trợ khách hàng
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
