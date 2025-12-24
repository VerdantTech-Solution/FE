import { Button } from "@/components/ui/button";
import {
  User,
  LogOut,
  ChevronDown,
  Shield,
  Leaf,
  ShoppingCart,
  History,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useCart } from "@/contexts/CartContext";
import { NotificationBell } from "@/components/NotificationBell";
import { CustomerChatBubble } from "@/components/CustomerChatBubble";

const Navbar = () => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { isAdmin } = useAdminAuth();
  const { cartCount } = useCart();
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Debug: Log khi user avatar thay đổi
  useEffect(() => {
    console.log("Navbar - User avatar changed to:", user?.avatarUrl);
  }, [user?.avatarUrl]);

  const navigation = [
    { name: "Trang chủ", href: "/" },
    { name: "Giới thiệu", href: "/about" },
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Close user dropdown when opening mobile menu
    if (!isMobileMenuOpen) {
      setIsUserDropdownOpen(false);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isUserDropdownOpen || isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserDropdownOpen, isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  // Animation variants
  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 },
    },
  };

  const navVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const,
      },
    },
  };

  const buttonVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const,
      },
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 },
    },
    tap: {
      scale: 0.95,
      transition: { duration: 0.1 },
    },
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
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
            variants={logoVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
            <img
              src={logo}
              alt="VerdantTech logo"
              className="w-10 h-10 border rounded-[3px] object-cover transition-transform duration-200 hover:scale-105"
            />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-lg font-bold text-green-600">
                VerdantTech
              </span>
              <span className="text-xs text-gray-500 font-medium">
                SOLUTION
              </span>
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
                style={{ fontFamily: "Playfair Display, serif" }}
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

                {/* Customer Chat Bubble */}
                <CustomerChatBubble />

                {/* Cart icon - desktop */}
                <Button
                  variant="ghost"
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
                  onClick={() => navigate("/cart")}
                  aria-label="Giỏ hàng"
                >
                  <div className="relative">
                    <ShoppingCart className="h-6 w-6" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                        {cartCount > 99 ? "99+" : cartCount}
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
                        {user?.fullName
                          ? user.fullName.charAt(0).toUpperCase()
                          : "U"}
                      </div>
                    )}
                    <span
                      className="font-medium"
                      style={{ fontFamily: "Playfair Display, serif" }}
                    >
                      {user?.fullName}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isUserDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
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
                                  {user?.fullName
                                    ? user.fullName.charAt(0).toUpperCase()
                                    : "U"}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-gray-900 text-lg">
                                  {user?.fullName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user?.email}
                                </div>
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
                <motion.div whileHover="hover" whileTap="tap">
                  <Button
                    onClick={handleLogin}
                    variant="ghost"
                    className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium rounded-lg px-4 py-2 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    Đăng nhập
                  </Button>
                </motion.div>

                <motion.div whileHover="hover" whileTap="tap">
                  <Button
                    onClick={handleSignUp}
                    className="bg-green-400 hover:bg-green-500 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    Đăng ký
                  </Button>
                </motion.div>
              </>
            )}
          </motion.div>

          {/* Mobile Navigation - Visible on mobile, hidden on md+ */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile CTA Buttons */}
            {isAuthenticated && (
              <>
                {/* Notification Bell - mobile */}
                <NotificationBell />

                {/* Cart icon - mobile */}
                <Button
                  variant="ghost"
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200 ease-out"
                  onClick={() => navigate("/cart")}
                  aria-label="Giỏ hàng"
                >
                  <div className="relative">
                    <ShoppingCart className="h-6 w-6" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </div>
                </Button>
              </>
            )}

            {/* Hamburger Menu Button */}
            <Button
              variant="ghost"
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200"
              onClick={toggleMobileMenu}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown - Slide down animation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeMobileMenu}
              />

              {/* Mobile Menu */}
              <motion.div
                ref={mobileMenuRef}
                className="fixed top-20 left-0 right-0 bg-white border-t border-gray-200 shadow-xl z-50 md:hidden max-h-[calc(100vh-5rem)] overflow-y-auto"
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="px-4 py-4 space-y-1">
                  {/* Navigation Links */}
                  {navigation.map((item, index) => (
                    <motion.a
                      key={item.name}
                      href={item.href}
                      onClick={closeMobileMenu}
                      className="block px-4 py-3 rounded-lg text-gray-700 hover:text-green-600 hover:bg-gray-100 transition-colors font-medium"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      style={{ fontFamily: "Playfair Display, serif" }}
                    >
                      {item.name}
                    </motion.a>
                  ))}

                  {/* Divider */}
                  {isAuthenticated && (
                    <div className="border-t border-gray-200 my-2" />
                  )}

                  {/* User Section for Mobile */}
                  {isAuthenticated ? (
                    <div className="space-y-1">
                      {/* User Info */}
                      <div className="px-4 py-3 bg-gray-50 rounded-lg mb-2">
                        <div className="flex items-center gap-3">
                          {user?.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt="Avatar"
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                              {user?.fullName
                                ? user.fullName.charAt(0).toUpperCase()
                                : "U"}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">
                              {user?.fullName}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {user?.email}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* User Menu Items */}
                      <motion.button
                        className="w-full px-4 py-3 text-left rounded-lg text-gray-700 hover:text-green-600 hover:bg-gray-100 transition-colors flex items-center gap-3 font-medium"
                        onClick={() => {
                          navigate("/profile");
                          closeMobileMenu();
                        }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1, duration: 0.2 }}
                      >
                        <User className="h-5 w-5" />
                        Thông Tin Cá Nhân
                      </motion.button>

                      <motion.button
                        className="w-full px-4 py-3 text-left rounded-lg text-gray-700 hover:text-green-600 hover:bg-gray-100 transition-colors flex items-center gap-3 font-medium"
                        onClick={() => {
                          navigate("/farmlist");
                          closeMobileMenu();
                        }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15, duration: 0.2 }}
                      >
                        <Leaf className="h-5 w-5" />
                        Thông Tin Trang Trại
                      </motion.button>

                      <motion.button
                        className="w-full px-4 py-3 text-left rounded-lg text-gray-700 hover:text-green-600 hover:bg-gray-100 transition-colors flex items-center gap-3 font-medium"
                        onClick={() => {
                          navigate("/order/history");
                          closeMobileMenu();
                        }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.2 }}
                      >
                        <History className="h-5 w-5" />
                        Lịch Sử Đơn Hàng
                      </motion.button>

                      {isAdmin && (
                        <motion.button
                          className="w-full px-4 py-3 text-left rounded-lg text-gray-700 hover:text-green-600 hover:bg-gray-100 transition-colors flex items-center gap-3 font-medium"
                          onClick={() => {
                            navigate("/admin");
                            closeMobileMenu();
                          }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.25, duration: 0.2 }}
                        >
                          <Shield className="h-5 w-5" />
                          Admin Panel
                        </motion.button>
                      )}

                      <motion.button
                        className="w-full px-4 py-3 text-left rounded-lg text-red-600 hover:text-white hover:bg-red-600 transition-colors flex items-center gap-3 font-medium mt-2"
                        onClick={() => {
                          handleLogout();
                          closeMobileMenu();
                        }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.2 }}
                      >
                        <LogOut className="h-5 w-5" />
                        Đăng xuất
                      </motion.button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 pt-2">
                      <motion.button
                        className="w-full px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium border border-gray-200"
                        onClick={() => {
                          handleLogin();
                          closeMobileMenu();
                        }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1, duration: 0.2 }}
                        style={{ fontFamily: "Playfair Display, serif" }}
                      >
                        Đăng nhập
                      </motion.button>
                      <motion.button
                        className="w-full px-4 py-3 rounded-lg bg-green-400 hover:bg-green-500 text-white transition-colors font-semibold"
                        onClick={() => {
                          handleSignUp();
                          closeMobileMenu();
                        }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15, duration: 0.2 }}
                        style={{ fontFamily: "Playfair Display, serif" }}
                      >
                        Đăng ký
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;
