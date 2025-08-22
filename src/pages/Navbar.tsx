import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";
import { useNavigate } from "react-router";

const Navbar = () => {
  const navigation = [
    { name: "Trang chủ", href: "/" },
    { name: "Tính năng", href: "/features" },
    { name: "Dịch vụ", href: "/services" },
    { name: "Chợ Trực Tuyến", href: "/marketplace" },
    { name: "Liên hệ", href: "/order" },
  ];
  const navigate = useNavigate();
  const handleLogin = () => {
    navigate("/login");
  };
  const handleSignUp = () => {
    navigate("/signup");
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-600">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-green-600">
              VerdantTech
            </span>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-4">
            <Button onClick={handleLogin} variant="ghost">
              Đăng nhập
            </Button>

            <Button
              onClick={handleSignUp}
              variant="default"
              className="relative overflow-hidden bg-black text-white font-semibold rounded-lg px-6 py-3 group"
            >
              <span className="relative z-10">Bắt Đầu Ngay</span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
