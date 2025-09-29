import React, { useState } from "react";
import { motion } from "framer-motion";
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
  SidebarSectionTitle,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Home, ListFilter, PackagePlus, Settings, Shield, Users, LogOut } from "lucide-react";
import logo2 from "@/assets/logo2.jpg";
import { WarehousePanel } from "./staff/WarehousePanel";
import type { WarehouseStats } from "./staff/WarehousePanel";
import { UserManagementPanel } from "./staff/UserManagementPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router";
import { MonitoringPage } from "./staff/MonitoringPage";

type ViewKey = "warehouse" | "users" | "orders" | "equipment" | "monitoring" | "settings";

export const StaffPage: React.FC = () => {
  const [selectedMenu, setSelectedMenu] = useState<ViewKey>("warehouse");
  const [collapsed, setCollapsed] = useState(false);
  const [, setStats] = useState<WarehouseStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  
  const { logout } = useAuth();
  const navigate = useNavigate();

  const sidebarVariants = {
    hidden: { x: -300, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.4 } },
  } as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <motion.div variants={sidebarVariants} initial="hidden" animate="visible">
        <Sidebar className="fixed left-0 top-0 z-30" collapsed={collapsed}>
          <SidebarHeader>
            <SidebarHeaderTitle>
              <div className="w-[90px] h-[70px] flex items-center justify-center overflow-hidden p-2">
                <img src={logo2} alt="VerdantTech Logo" className="w-full h-full object-contain" />
              </div>
              <SidebarHeaderTitleText>
                <SidebarHeaderTitleMain>VerdantTech</SidebarHeaderTitleMain>
                <SidebarHeaderTitleSub>Staff Panel</SidebarHeaderTitleSub>
              </SidebarHeaderTitleText>
            </SidebarHeaderTitle>
          </SidebarHeader>

          <SidebarNav>
            <SidebarSection>
              <SidebarSectionTitle>Chính</SidebarSectionTitle>
              <SidebarNavItem collapsed={collapsed} active={selectedMenu === "warehouse"} onClick={() => setSelectedMenu("warehouse")} icon={<Home className="w-5 h-5" />}>Quản Lý Nhập Kho</SidebarNavItem>
              <SidebarNavItem collapsed={collapsed} active={selectedMenu === "users"} onClick={() => setSelectedMenu("users")} icon={<Users className="w-5 h-5" />}>Quản Lý Người Dùng</SidebarNavItem>
              <SidebarNavItem collapsed={collapsed} active={selectedMenu === "orders"} onClick={() => setSelectedMenu("orders")} icon={<ListFilter className="w-5 h-5" />}>Quản Lý Đơn Hàng</SidebarNavItem>
            </SidebarSection>
            <SidebarSection>
              <SidebarSectionTitle>Quản lý</SidebarSectionTitle>
              <SidebarNavItem collapsed={collapsed} active={selectedMenu === "equipment"} onClick={() => setSelectedMenu("equipment")} icon={<Shield className="w-5 h-5" />}>Thiết bị</SidebarNavItem>
              <SidebarNavItem collapsed={collapsed} active={selectedMenu === "monitoring"} onClick={() => setSelectedMenu("monitoring")} icon={<PackagePlus className="w-5 h-5" />}>Giám sát</SidebarNavItem>
            </SidebarSection>
            <SidebarSection>
              <SidebarSectionTitle>Hệ thống</SidebarSectionTitle>
              <SidebarNavItem collapsed={collapsed} active={selectedMenu === "settings"} onClick={() => setSelectedMenu("settings")} icon={<Settings className="w-5 h-5" />}>Cài đặt</SidebarNavItem>
            </SidebarSection>
          </SidebarNav>

          <SidebarFooter>
            <div className="flex w-full gap-2">
              <Button className="w-full" onClick={() => setCollapsed((v) => !v)}>{collapsed ? "Mở" : "Thu gọn"}</Button>
            </div>
          </SidebarFooter>
        </Sidebar>
      </motion.div>

      <div className={collapsed ? "ml-16" : "ml-64"}>
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Staff Dashboard</h1>
              <p className="text-sm text-gray-500">Quản lý khu vực dành cho nhân viên</p>
            </div>
            <Button 
              variant="outline" 
              className="border-red-300 text-red-600 hover:bg-red-50 gap-2"
              onClick={async () => { await logout(); navigate("/login"); }}
            >
              <LogOut className="w-4 h-4" /> Đăng xuất
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {selectedMenu === "warehouse" && (
            <WarehousePanel onStatsChange={setStats} />
          )}
          {selectedMenu === "users" && (
            <UserManagementPanel />
          )}
          {selectedMenu === "monitoring" && (
            <MonitoringPage/>
          )}
       
        </div>
      </div>
    </div>
  );
};

export default StaffPage;


