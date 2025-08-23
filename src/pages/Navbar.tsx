import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import logo2 from "@/assets/logo2.jpg";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navigation = [
    { name: "Trang chủ", href: "/" },
    { name: "Dịch vụ", href: "/services" },
    { name: "Chợ Trực Tuyến", href: "/marketplace" },
    { name: "Về chúng tôi", href: "/about" },
    { name: "Liên hệ", href: "/order" },
  ];
  
  const navigate = useNavigate();
  
  const handleLogin = () => {
    navigate("/login");
    setIsMobileMenuOpen(false);
  };
  
  const handleSignUp = () => {
    navigate("/signup");
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-[100px] h-[80px]  flex items-center justify-center overflow-hidden p-2">
              <img 
                src={logo2}
                alt="VerdantTech Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-2xl font-bold text-green-600">
              VerdantTech
            </span>
          </div>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-8">
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

          {/* Desktop CTA Buttons - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-4">
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

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              onClick={toggleMobileMenu}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-background/95 backdrop-blur-md border-t border-border">
              {/* Mobile Navigation Links */}
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-base font-medium text-foreground hover:text-primary hover:bg-accent/50 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              
              {/* Mobile CTA Buttons */}
              <div className="pt-4 pb-3 border-t border-border">
                <div className="flex flex-col space-y-3">
                  <Button 
                    onClick={handleLogin} 
                    variant="ghost" 
                    className="w-full justify-start"
                  >
                    Đăng nhập
                  </Button>
                  
                  <Button
                    onClick={handleSignUp}
                    variant="default"
                    className="w-full relative overflow-hidden bg-black text-white font-semibold rounded-lg py-3 group"
                  >
                    <span className="relative z-10">Bắt Đầu Ngay</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;