import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  // Animation variants
  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const
      }
    },
    hover: { 
      scale: 1.05,
      transition: { duration: 0.2 }
    }
  };

  const navVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const
      }
    }
  };

  const buttonVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const
      }
    },
    hover: { 
      scale: 1.05,
      transition: { duration: 0.2 }
    },
    tap: { 
      scale: 0.95,
      transition: { duration: 0.1 }
    }
  };

  const mobileMenuVariants = {
    hidden: { 
      opacity: 0,
      height: 0,
      y: -20
    },
    visible: { 
      opacity: 1,
      height: "auto",
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const
      }
    },
    exit: { 
      opacity: 0,
      height: 0,
      y: -20,
      transition: {
        duration: 0.2,
        ease: "easeIn" as const
      }
    }
  };

  return (
    <motion.nav 
      className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" as const }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
            variants={logoVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
            <motion.div 
              className="w-[100px] h-[80px] flex items-center justify-center overflow-hidden p-2"
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.6 }}
            >
              <img 
                src={logo2}
                alt="VerdantTech Logo" 
                className="w-full h-full object-contain"
              />
            </motion.div>
            <motion.span 
              className="text-2xl font-bold text-green-600"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              VerdantTech
            </motion.span>
          </motion.div>

          {/* Desktop Navigation - Hidden on mobile */}
          <motion.div 
            className="hidden md:flex items-center space-x-8"
            variants={navVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            {navigation.map((item, index) => (
              <motion.a
                key={item.name}
                href={item.href}
                className="text-foreground hover:text-primary transition-colors font-medium"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                whileHover={{ y: -2 }}
              >
                {item.name}
              </motion.a>
            ))}
          </motion.div>

          {/* Desktop CTA Buttons - Hidden on mobile */}
          <motion.div 
            className="hidden md:flex items-center gap-4"
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.6 }}
          >
            <motion.div
              whileHover="hover"
              whileTap="tap"
            >
              <Button onClick={handleLogin} variant="ghost">
                Đăng nhập
              </Button>
            </motion.div>

            <motion.div
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                onClick={handleSignUp}
                variant="default"
                className="relative overflow-hidden bg-black text-white font-semibold rounded-lg px-6 py-3 group"
              >
                <span className="relative z-10">Bắt Đầu Ngay</span>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" as const }}
                />
              </Button>
            </motion.div>
          </motion.div>

          {/* Mobile menu button */}
          <motion.div 
            className="md:hidden"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              onClick={toggleMobileMenu}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-6 w-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-6 w-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="md:hidden"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="py-4 space-y-2 border-t border-border">
                {navigation.map((item, index) => (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    className="block px-4 py-2 text-foreground hover:text-primary hover:bg-accent/50 rounded-lg transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </motion.a>
                ))}
                <div className="pt-4 space-y-2">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    <Button onClick={handleLogin} variant="ghost" className="w-full">
                      Đăng nhập
                    </Button>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <Button onClick={handleSignUp} variant="default" className="w-full">
                      Bắt Đầu Ngay
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;