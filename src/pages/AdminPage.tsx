import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import logo2 from "@/assets/logo2.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router";
import { LogOut } from "lucide-react";
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
  Settings,
  BarChart,
  Target,
  Activity,
  Download,
  Plus
} from "lucide-react";

// Import admin pages
import { 
  OverviewPage, 
  AnalyticsPage, 
  EquipmentPage, 
  MonitoringPage, 
  SettingsPage 
} from "./admin";

export const AdminPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedView, setSelectedView] = useState('overview');
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
        <Sidebar className="fixed left-0 top-0 z-30">
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
              <SidebarSectionTitle>Chính</SidebarSectionTitle>
              <motion.div
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <SidebarNavItem
                  active={selectedView === 'overview'}
                  onClick={() => setSelectedView('overview')}
                  icon={<Home className="w-5 h-5" />}
                >
                  Tổng quan
                </SidebarNavItem>
              </motion.div>
              
              <motion.div
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <SidebarNavItem
                  active={selectedView === 'analytics'}
                  onClick={() => setSelectedView('analytics')}
                  icon={<BarChart className="w-5 h-5" />}
                >
                  Phân tích
                </SidebarNavItem>
              </motion.div>
            </SidebarSection>
            
            <SidebarSection>
              <SidebarSectionTitle>Quản lý</SidebarSectionTitle>
              <motion.div
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <SidebarNavItem
                  active={selectedView === 'equipment'}
                  onClick={() => setSelectedView('equipment')}
                  icon={<Target className="w-5 h-5" />}
                >
                  Thiết bị
                </SidebarNavItem>
              </motion.div>
              
              <motion.div
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <SidebarNavItem
                  active={selectedView === 'monitoring'}
                  onClick={() => setSelectedView('monitoring')}
                  icon={<Activity className="w-5 h-5" />}
                >
                  Giám sát
                </SidebarNavItem>
              </motion.div>
            </SidebarSection>
            
            <SidebarSection>
              <SidebarSectionTitle>Hệ thống</SidebarSectionTitle>
              <motion.div
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <SidebarNavItem
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
              <Button className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Xuất báo cáo
              </Button>
            </motion.div>
          </SidebarFooter>
        </Sidebar>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        className="ml-64"
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
                {selectedView === 'overview' && 'Tổng quan hệ thống'}
                {selectedView === 'analytics' && 'Phân tích dữ liệu'}
                {selectedView === 'equipment' && 'Quản lý thiết bị'}
                {selectedView === 'monitoring' && 'Giám sát hệ thống'}
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
                      <SelectItem value="week">Tuần này</SelectItem>
                      <SelectItem value="month">Tháng này</SelectItem>
                      <SelectItem value="quarter">Quý này</SelectItem>
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
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm mới
                </Button>
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
            {selectedView === 'overview' && (
              <motion.div
                key="overview"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <OverviewPage 
                  selectedPeriod={selectedPeriod}
                  setSelectedPeriod={setSelectedPeriod}
                />
              </motion.div>
            )}
            {selectedView === 'analytics' && (
              <motion.div
                key="analytics"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <AnalyticsPage />
              </motion.div>
            )}
            {selectedView === 'equipment' && (
              <motion.div
                key="equipment"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <EquipmentPage />
              </motion.div>
            )}
            {selectedView === 'monitoring' && (
              <motion.div
                key="monitoring"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <MonitoringPage />
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
                <SettingsPage />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
};
