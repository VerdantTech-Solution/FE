import { useNavigate, useLocation } from "react-router";
import logo2 from "@/assets/logo2.jpg";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  CreditCard,
  MessageSquare,
  Warehouse,
  BookOpen,
  FolderTree,
  Shield,
  ArrowLeftRight,
} from "lucide-react";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      id: "dashboard",
      label: "Tổng quan",
      icon: LayoutDashboard,
      path: "/admin",
    },
    {
      id: "warehouse",
      label: "Quản lý đơn đăng ký",
      icon: Warehouse,
      path: "/admin/warehouse",
    },
    {
      id: "products",
      label: "Quản lý sản phẩm",
      icon: Package,
      path: "/admin/products",
    },
    {
      id: "users",
      label: "Quản lý người dùng",
      icon: Users,
      path: "/admin/users",
    },
    {
      id: "orders",
      label: "Quản lý đơn hàng",
      icon: ShoppingCart,
      path: "/admin/orders",
    },
    {
      id: "posts",
      label: "Quản lý bài viết",
      icon: BookOpen,
      path: "/admin/posts",
    },
    {
      id: "categories",
      label: "Quản lý danh mục",
      icon: FolderTree,
      path: "/admin/categories",
    },
    {
      id: "balance",
      label: "Quản lý số dư",
      icon: CreditCard,
      path: "/admin/balance",
    },
    {
      id: "cashout",
      label: "Quản lý rút tiền",
      icon: FileText,
      path: "/admin/cashout",
    },
    {
      id: "support",
      label: "Quản lý hỗ trợ",
      icon: MessageSquare,
      path: "/admin/support",
    },
    {
      id: "vendors",
      label: "Quản lý nhà cung cấp",
      icon: Shield,
      path: "/admin/vendors",
    },
    {
      id: "transactions",
      label: "Các giao dịch",
      icon: ArrowLeftRight,
      path: "/admin/transactions",
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin" || location.pathname === "/admin/";
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
            <p className="text-xs text-gray-500 font-medium">Quản trị viên</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    active
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default AdminSidebar;
