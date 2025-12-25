import { useNavigate, useLocation } from "react-router";
import { toast } from "sonner";

import logo2 from "@/assets/logo2.jpg";
import { useVendor } from "@/contexts/VendorContext";

import {
  LayoutDashboard,
  Square,
  CreditCard,
  User,
  FileText,
  History,
  Package,
  ShoppingCart,
  Crown,
  Lock,
} from "lucide-react";

const VendorSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { subscriptionActive } = useVendor();

  const menuItems = [
    {
      id: "dashboard",

      label: "Tổng quan",

      icon: LayoutDashboard,

      path: "/vendor",
    },

    {
      id: "registrations",

      label: "Quản lý đơn đăng ký",

      icon: Square,

      path: "/vendor/registrations",
    },

    {
      id: "products",

      label: "Quản lý sản phẩm",

      icon: Package,

      path: "/vendor/products",
    },

    {
      id: "orders",

      label: "Quản lý đơn hàng",

      icon: ShoppingCart,

      path: "/vendor/orders",
    },

    {
      id: "wallet",

      label: "Ví",

      icon: CreditCard,

      path: "/vendor/wallet",
    },

    {
      id: "cashout-requests",

      label: "Yêu cầu rút tiền",

      icon: FileText,

      path: "/vendor/cashout-requests",
    },

    {
      id: "cashout-history",

      label: "Lịch sử rút tiền",

      icon: History,

      path: "/vendor/cashout-history",
    },

    {
      id: "subscription",

      label: "Đăng ký gói duy trì",

      icon: Crown,

      path: "/vendor/subscription",
    },

    {
      id: "vendor-info",

      label: "Thông tin nhà cung cấp",

      icon: User,

      path: "/vendor/info",
    },
  ];

  const handleNavigation = (path: string, itemId: string) => {
    // If subscription is not active, only allow subscription page
    if (!subscriptionActive && itemId !== "subscription") {
      toast.error("Vui lòng đăng ký gói duy trì để sử dụng tính năng này", {
        duration: 3000,
      });
      navigate("/vendor/subscription");
      return;
    }
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path === "/vendor") {
      return (
        location.pathname === "/vendor" || location.pathname === "/vendor/"
      );
    }

    return location.pathname === path;
  };

  return (
    <div className="fixed left-0 top-0 w-64 bg-white border-r border-gray-200 h-screen flex flex-col z-10">
      {/* Logo */}

      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
            <img
              src={logo2}
              alt="VerdantTech Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <div>
            <h1 className="text-lg font-bold text-gray-900">VerdantTech</h1>

            <p className="text-xs text-gray-500 font-medium">Nhà cung cấp</p>
          </div>
        </div>
      </div>

      {/* Navigation */}

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const active = isActive(item.path);

            // Check if item should be disabled (not subscription page and subscription not active)
            const isDisabled =
              !subscriptionActive && item.id !== "subscription";

            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item.path, item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isDisabled
                      ? "text-gray-400 cursor-not-allowed bg-gray-50"
                      : active
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {isDisabled ? <Lock size={20} /> : <Icon size={20} />}

                  <span className="font-medium">{item.label}</span>

                  {isDisabled && (
                    <span className="ml-auto text-xs text-orange-500 font-medium">
                      Cần đăng ký
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default VendorSidebar;
