import { Button } from "@/components/ui/button";
import { User, LogOut, ChevronDown, Shield, Leaf, ShoppingCart, History } from "lucide-react";
import { useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useCart } from "@/contexts/CartContext";
import { NotificationBell } from "@/components/NotificationBell";

const Navbar = () => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { isAdmin } = useAdminAuth();
  const { cartCount } = useCart();
  const userDropdownRef = useRef<HTMLDivElement>(null);
  
  // Debug: Log khi user avatar thay đổi
  useEffect(() => {
    console.log('Navbar - User avatar changed to:', user?.avatarUrl);
  }, [user?.avatarUrl]);
  
  const navigation = [
    { name: "Trang chủ", href: "/" },
    { name: "Về chúng tôi", href: "/about" },
     { name: "Chợ", href: "/marketplace" },
    { name: "Bài viết", href: "/articles" },
    { name: "Trung tâm hỗ trợ", href: "/ticket" },
   
  ];
  
  const navigate = useNavigate();
  
  const handleLogin = () => {
    navigate("/login");
  };
  
  const handleSignUp = () => {
    navigate("/signup");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsUserDropdownOpen(false);
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const closeUserDropdown = () => {
    setIsUserDropdownOpen(false);
  };


  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserDropdownOpen]);


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

  return (
    <motion.nav 
      className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-lg"
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
            <img
              src={logo}
              alt="VerdantTech logo"
              className="w-10 h-10 border rounded-[3px] object-cover  transition-transform duration-200 hover:scale-105"
            />
            <div className="hidden sm:block">
              <h1 
                className="text-2xl font-bold text-green-600 hover:text-green-700 transition-colors"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                VerdantTech
              </h1>
              <p className="text-sm text-gray-600">
                Nông nghiệp thông minh
              </p>
            </div>
          </motion.div>

          {/* Navigation Links - Hidden on mobile, visible on md+ */}
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
                className="text-gray-700 hover:text-green-600 transition-colors duration-300 font-medium"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                whileHover={{ y: -2 }}
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                {item.name}
              </motion.a>
            ))}
          </motion.div>

          {/* CTA Buttons - Hidden on mobile, visible on md+ */}
          <motion.div 
            className="hidden md:flex items-center gap-4"
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.6 }}
          >
            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <NotificationBell />
                
                {/* Cart icon - desktop */}
                <Button
                  variant="ghost"
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
                  onClick={() => navigate('/cart')}
                  aria-label="Giỏ hàng"
                >
                  <div className="relative">
                    <ShoppingCart className="h-6 w-6" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </div>
                </Button>
                <motion.div
                  ref={userDropdownRef}
                  className="relative"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button 
                    variant="ghost" 
                    className="cursor-pointer flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-300"
                    onClick={toggleUserDropdown}
                  >
                    {user?.avatarUrl ? (
                      <img 
                        src={user.avatarUrl} 
                        alt="Avatar" 
                        className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                        {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <span className="font-medium" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {user?.fullName}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                  </Button>
                  
                  {/* User Dropdown Menu */}
                  <AnimatePresence>
                    {isUserDropdownOpen && (
                      <>
                        {/* Backdrop */}
                        <motion.div
                          className="fixed inset-0 z-40"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={closeUserDropdown}
                        />
                        <motion.div
                          className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-3 z-50"
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                        {/* User Info Section */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center gap-3 mb-2">
                            {user?.avatarUrl ? (
                              <img 
                                src={user.avatarUrl} 
                                alt="Avatar" 
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-gray-900 text-lg">{user?.fullName}</div>
                              <div className="text-sm text-gray-500">{user?.email}</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Navigation Links */}
                        <div className="py-1">
                          <button
                            className="group w-full px-4 py-2 text-left text-sm text-gray-700 rounded-md flex items-center gap-3 transition-all duration-200 ease-out hover:bg-green-500 hover:text-white hover:shadow-md hover:-translate-y-0.5"
                            onClick={() => {
                              navigate("/profile");
                              closeUserDropdown();
                            }}
                          >
                            <User className="h-4 w-4" />
                            Thông Tin Cá Nhân
                          </button>
                          
                          <button
                            className="group w-full px-4 py-2 text-left text-sm text-gray-700 rounded-md flex items-center gap-3 transition-all duration-200 ease-out hover:bg-green-500 hover:text-white hover:shadow-md hover:-translate-y-0.5"
                            onClick={() => {
                              navigate("/farmlist");
                              closeUserDropdown();
                            }}
                          >
                            <Leaf className="h-4 w-4" />
                            Thông Tin Trang Trại
                          </button>
                          
                          <button
                            className="group w-full px-4 py-2 text-left text-sm text-gray-700 rounded-md flex items-center gap-3 transition-all duration-200 ease-out hover:bg-green-500 hover:text-white hover:shadow-md hover:-translate-y-0.5"
                            onClick={() => {
                              navigate("/order/history");
                              closeUserDropdown();
                            }}
                          >
                            <History className="h-4 w-4" />
                            Lịch Sử Đơn Hàng
                          </button>
                          {/* Vendor link removed as requested */}
                          
                          <button
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 rounded-md transition-all duration-200 ease-out hover:text-white hover:bg-red-600 hover:shadow-md hover:-translate-y-0.5 flex items-center gap-3"
                            onClick={handleLogout}
                          >
                            <LogOut className="h-4 w-4" />
                            Log out
                          </button>
                        </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div
                  whileHover="hover"
                  whileTap="tap"
                >
                <Button 
                  onClick={handleLogin}
                  variant="ghost"
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium rounded-lg px-4 py-2 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                  >
                    Đăng nhập
                  </Button>
                </motion.div>

                <motion.div
                  whileHover="hover"
                  whileTap="tap"
                >
                <Button 
                  onClick={handleSignUp}
                  className="bg-green-400 hover:bg-green-500 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                  >
                    Đăng ký
                  </Button>
                </motion.div>
              </>
            )}
          </motion.div>

          {/* Mobile Navigation - Visible on mobile, hidden on md+ */}
          <div className="md:hidden flex items-center gap-4">
            {/* Mobile CTA Buttons */}
            {isAuthenticated ? (
              <motion.div
                ref={userDropdownRef}
                className="relative"
                whileHover="hover"
                whileTap="tap"
              >
                {/* Notification Bell - mobile */}
                <NotificationBell />
                
                {/* Cart icon - mobile */}
                <Button
                  variant="ghost"
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200 ease-out"
                  onClick={() => navigate('/cart')}
                  aria-label="Giỏ hàng"
                >
                  <div className="relative">
                    <ShoppingCart className="h-6 w-6" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </div>
                </Button>
                <Button 
                  variant="ghost" 
                  className="cursor-pointer flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-300"
                  onClick={toggleUserDropdown}
                >
                  {user?.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt="Avatar" 
                      className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                      {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="hidden sm:inline font-medium" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {user?.fullName}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                </Button>
                
                {/* Mobile User Dropdown */}
                <AnimatePresence>
                  {isUserDropdownOpen && (
                    <motion.div
                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3 mb-2">
                        {user?.avatarUrl ? (
                          <img 
                            src={user.avatarUrl} 
                            alt="Avatar" 
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900 text-lg">{user?.fullName}</div>
                          <div className="text-sm text-gray-500">{user?.email}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Navigation Links */}
                    <div className="py-1">
                      {/* <button
                        className="w-full px-4 py-2 text-left text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-3"
                        onClick={() => {
                          navigate("/profile");
                          closeUserDropdown();
                        }}
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </button>
                      
                      <button
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-3"
                        onClick={() => {
                          navigate("/dashboard");
                          closeUserDropdown();
                        }}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </button> */}
                      
                      {isAdmin && (
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-3"
                          onClick={() => {
                            navigate("/admin");
                            closeUserDropdown();
                          }}
                        >
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </button>
                      )}
                      
                      <button
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-3"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <>
                <Button 
                  onClick={handleLogin} 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  Đăng nhập
                </Button>
                <Button 
                  onClick={handleSignUp} 
                  size="sm"
                  className="bg-green-400 hover:bg-green-500 text-white font-semibold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  Đăng ký
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation Links - Always visible on mobile, hidden on md+ */}
        <div className="md:hidden py-4 space-y-2 border-t border-gray-200">
          {navigation.map((item, index) => (
            <motion.a
              key={item.name}
              href={item.href}
              className="block px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-gray-100 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {item.name}
            </motion.a>
          ))}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;