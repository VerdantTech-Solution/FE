import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import logo2 from "@/assets/logo2.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router";
import { LogOut, Users, ShoppingBag, ListFilter, PackagePlus, Shield, DollarSign, MessageSquare, BookOpen } from "lucide-react";
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarHeaderTitle, 
  SidebarHeaderTitleText, 
  SidebarHeaderTitleMain, 
  SidebarHeaderTitleSub,
  SidebarNav,
  SidebarNavItem,
  SidebarFooter,
  SidebarSection,
  SidebarSectionTitle
} from "@/components/ui/sidebar";
import { 
  Home,
  Settings
} from "lucide-react";

// Import admin pages
import { 
  AdminOverviewPage, 
  AdminSettingsPage,
  AdminWarehousePanel,
  AdminProductManagementPanel,
  AdminUserManagementPanel,
  AdminOrderManagementPanel,
  AdminPostManagementPanel,
  AdminBalanceManagement,
  AdminCashoutManagementPanel,
  AdminSupportRequestManagementPanel,
  AdminCategoryManagementPanel,
} from "./admin";

type AdminView =
  | 'overview'
  | 'settings'
  | 'warehouse'
  | 'products'
  | 'users'
  | 'orders'
  | 'posts'
  | 'categories'
  | 'balance'
  | 'cashout'
  | 'support';

export const AdminPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedView, setSelectedView] = useState<AdminView>('overview');
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Animation variants
  const sidebarVariants = {
    hidden: { x: -300, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const
      }
    }
  };

  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: {
        duration: 0.2,
        ease: "easeIn" as const
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.div
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
      >
        <Sidebar className="fixed left-0 top-0 z-30 h-screen overflow-y-auto" collapsed={collapsed}>
          <SidebarHeader>
            <SidebarHeaderTitle>
              <motion.div 
                className="w-[100px] h-[80px] flex items-center justify-center overflow-hidden p-2"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <img 
                  src={logo2}
                  alt="VerdantTech Logo" 
                  className="w-full h-full object-contain"
                />
              </motion.div>
              <SidebarHeaderTitleText>
                <SidebarHeaderTitleMain>VerdantTech</SidebarHeaderTitleMain>
                <SidebarHeaderTitleSub>Admin Panel</SidebarHeaderTitleSub>
              </SidebarHeaderTitleText>
            </SidebarHeaderTitle>
          </SidebarHeader>
          
          <SidebarNav>
            <SidebarSection>
              <SidebarSectionTitle>Quản lý</SidebarSectionTitle>
              <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                <SidebarNavItem
                  collapsed={collapsed}
                  active={selectedView === 'warehouse'}
                  onClick={() => setSelectedView('warehouse')}
                  icon={<Home className="w-5 h-5" />}
                >
                  Quản Lý Nhập Kho
                </SidebarNavItem>
              </motion.div>
              <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                <SidebarNavItem
                  collapsed={collapsed}
                  active={selectedView === 'products'}
                  onClick={() => setSelectedView('products')}
                  icon={<ShoppingBag className="w-5 h-5" />}
                >
                  Quản lý sản phẩm
                </SidebarNavItem>
              </motion.div>
              <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                <SidebarNavItem
                  collapsed={collapsed}
                  active={selectedView === 'users'}
                  onClick={() => setSelectedView('users')}
                  icon={<Users className="w-5 h-5" />}
                >
                  Quản Lý Người Dùng
                </SidebarNavItem>
              </motion.div>
              <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                <SidebarNavItem
                  collapsed={collapsed}
                  active={selectedView === 'orders'}
                  onClick={() => setSelectedView('orders')}
                  icon={<ListFilter className="w-5 h-5" />}
                >
                  Quản Lý Đơn Hàng
                </SidebarNavItem>
              </motion.div>
              <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                <SidebarNavItem
                  collapsed={collapsed}
                  active={selectedView === 'posts'}
                  onClick={() => setSelectedView('posts')}
                  icon={<BookOpen className="w-5 h-5" />}
                >
                  Quản lý bài viết
                </SidebarNavItem>
              </motion.div>
              <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                <SidebarNavItem
                  collapsed={collapsed}
                  active={selectedView === 'categories'}
                  onClick={() => setSelectedView('categories')}
                  icon={<PackagePlus className="w-5 h-5" />}
                >
                  Danh mục sản phẩm
                </SidebarNavItem>
              </motion.div>
              <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                <SidebarNavItem
                  collapsed={collapsed}
                  active={selectedView === 'balance'}
                  onClick={() => setSelectedView('balance')}
                  icon={<Shield className="w-5 h-5" />}
                >
                  Số dư tài khoản
                </SidebarNavItem>
              </motion.div>
              <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                <SidebarNavItem
                  collapsed={collapsed}
                  active={selectedView === 'cashout'}
                  onClick={() => setSelectedView('cashout')}
                  icon={<DollarSign className="w-5 h-5" />}
                >
                  Quản lý rút tiền
                </SidebarNavItem>
              </motion.div>
              <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                <SidebarNavItem
                  collapsed={collapsed}
                  active={selectedView === 'support'}
                  onClick={() => setSelectedView('support')}
                  icon={<MessageSquare className="w-5 h-5" />}
                >
                  Yêu cầu hỗ trợ
                </SidebarNavItem>
              </motion.div>
            </SidebarSection>
            
            <SidebarSection>
              <SidebarSectionTitle>Chung</SidebarSectionTitle>
              <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                <SidebarNavItem
                  collapsed={collapsed}
                  active={selectedView === 'overview'}
                  onClick={() => setSelectedView('overview')}
                  icon={<Home className="w-5 h-5" />}
                >
                  Tổng quan
                </SidebarNavItem>
              </motion.div>
              <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                <SidebarNavItem
                  collapsed={collapsed}
                  active={selectedView === 'settings'}
                  onClick={() => setSelectedView('settings')}
                  icon={<Settings className="w-5 h-5" />}
                >
                  Cài đặt
                </SidebarNavItem>
              </motion.div>
            </SidebarSection>
          </SidebarNav>
          
          <SidebarFooter>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="w-full" onClick={() => setCollapsed((v) => !v)}>
                {collapsed ? "Mở" : "Thu gọn"}
              </Button>
            </motion.div>
          </SidebarFooter>
        </Sidebar>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        className={collapsed ? "ml-16" : "ml-64"}
        variants={contentVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
      >
        {/* Header */}
        <motion.header 
          className="bg-white shadow-sm border-b border-gray-200 px-8 py-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <motion.h1 
                className="text-3xl font-bold text-gray-900"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                {selectedView === 'warehouse' && 'Quản Lý Nhập Kho'}
                {selectedView === 'products' && 'Quản lý sản phẩm'}
                {selectedView === 'users' && 'Quản Lý Người Dùng'}
                {selectedView === 'orders' && 'Quản Lý Đơn Hàng'}
                {selectedView === 'posts' && 'Quản lý bài viết'}
                {selectedView === 'categories' && 'Danh mục sản phẩm'}
                {selectedView === 'balance' && 'Số dư tài khoản'}
                {selectedView === 'cashout' && 'Quản lý rút tiền'}
                {selectedView === 'support' && 'Yêu cầu hỗ trợ'}
                {selectedView === 'overview' && 'Tổng quan hệ thống'}
                {selectedView === 'settings' && 'Cài đặt hệ thống'}
              </motion.h1>
              <motion.p 
                className="text-gray-600 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                Quản lý và giám sát toàn bộ hệ thống nông nghiệp thông minh
              </motion.p>
            </div>
            
            <div className="flex items-center gap-4">
              {selectedView === 'overview' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9, duration: 0.3 }}
                >
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Hôm nay</SelectItem>
                      <SelectItem value="week">Tuần này</SelectItem>
                      <SelectItem value="month">Tháng này</SelectItem>
                      <SelectItem value="year">Năm nay</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0, duration: 0.3 }}
              >
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1, duration: 0.3 }}
              >
                <Button 
                  variant="outline" 
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* Page Content */}
        <motion.div 
          className="p-8"
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          key={selectedView}
        >
          <AnimatePresence mode="wait">
            {selectedView === 'warehouse' && (
              <motion.div
                key="warehouse"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <AdminWarehousePanel />
              </motion.div>
            )}
            {selectedView === 'products' && (
              <motion.div
                key="products"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <AdminProductManagementPanel />
              </motion.div>
            )}
            {selectedView === 'users' && (
              <motion.div
                key="users"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <AdminUserManagementPanel />
              </motion.div>
            )}
            {selectedView === 'orders' && (
              <motion.div
                key="orders"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <AdminOrderManagementPanel />
              </motion.div>
            )}
            {selectedView === 'posts' && (
              <motion.div
                key="posts"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <AdminPostManagementPanel />
              </motion.div>
            )}
            {selectedView === 'categories' && (
              <motion.div
                key="categories"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* <CategoryManagementPanel /> */}
                <AdminCategoryManagementPanel />

              </motion.div>
            )}
            {selectedView === 'balance' && (
              <motion.div
                key="balance"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <AdminBalanceManagement />
              </motion.div>
            )}
            {selectedView === 'cashout' && (
              <motion.div
                key="cashout"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <AdminCashoutManagementPanel />
              </motion.div>
            )}
            {selectedView === 'support' && (
              <motion.div
                key="support"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <AdminSupportRequestManagementPanel />
              </motion.div>
            )}
            {selectedView === 'overview' && (
              <motion.div
                key="overview"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <AdminOverviewPage 
                  selectedPeriod={selectedPeriod}
                  setSelectedPeriod={setSelectedPeriod}
                />
              </motion.div>
            )}
            {selectedView === 'settings' && (
              <motion.div
                key="settings"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <AdminSettingsPage />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
};
