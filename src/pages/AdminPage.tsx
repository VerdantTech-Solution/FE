import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import logo2 from "@/assets/logo2.jpg";
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

  return (
    <div className="min-h-screen bg-gray-50">
             {/* Sidebar */}
       <Sidebar className="fixed left-0 top-0 z-30">
         <SidebarHeader>
           <SidebarHeaderTitle>
             <div className="w-[100px] h-[80px] flex items-center justify-center overflow-hidden p-2">
               <img 
                 src={logo2}
                 alt="VerdantTech Logo" 
                 className="w-full h-full object-contain"
               />
             </div>
             <SidebarHeaderTitleText>
               <SidebarHeaderTitleMain>VerdantTech</SidebarHeaderTitleMain>
               <SidebarHeaderTitleSub>Admin Panel</SidebarHeaderTitleSub>
             </SidebarHeaderTitleText>
           </SidebarHeaderTitle>
         </SidebarHeader>
         
         <SidebarNav>
           <SidebarSection>
             <SidebarSectionTitle>Chính</SidebarSectionTitle>
             <SidebarNavItem
               active={selectedView === 'overview'}
               onClick={() => setSelectedView('overview')}
               icon={<Home className="w-5 h-5" />}
             >
               Tổng quan
             </SidebarNavItem>
             
             <SidebarNavItem
               active={selectedView === 'analytics'}
               onClick={() => setSelectedView('analytics')}
               icon={<BarChart className="w-5 h-5" />}
             >
               Phân tích
             </SidebarNavItem>
           </SidebarSection>
           
           <SidebarSection>
             <SidebarSectionTitle>Quản lý</SidebarSectionTitle>
             <SidebarNavItem
               active={selectedView === 'equipment'}
               onClick={() => setSelectedView('equipment')}
               icon={<Target className="w-5 h-5" />}
             >
               Thiết bị
             </SidebarNavItem>
             
             <SidebarNavItem
               active={selectedView === 'monitoring'}
               onClick={() => setSelectedView('monitoring')}
               icon={<Activity className="w-5 h-5" />}
             >
               Giám sát
             </SidebarNavItem>
           </SidebarSection>
           
           <SidebarSection>
             <SidebarSectionTitle>Hệ thống</SidebarSectionTitle>
             <SidebarNavItem
               active={selectedView === 'settings'}
               onClick={() => setSelectedView('settings')}
               icon={<Settings className="w-5 h-5" />}
             >
               Cài đặt
             </SidebarNavItem>
           </SidebarSection>
         </SidebarNav>
         
         <SidebarFooter>
           <div className="text-xs text-gray-400 text-center w-full">
             © 2024 VerdantTech Solutions
           </div>
         </SidebarFooter>
       </Sidebar>

      {/* Main Content */}
      <div className="ml-64 pt-20">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {selectedView === 'overview' && 'Dashboard Tổng quan'}
                {selectedView === 'analytics' && 'Phân tích dữ liệu'}
                {selectedView === 'equipment' && 'Quản lý thiết bị'}
                {selectedView === 'monitoring' && 'Giám sát hệ thống'}
                {selectedView === 'settings' && 'Cài đặt hệ thống'}
              </h1>
              <p className="text-gray-600 mt-2">
                {selectedView === 'overview' && 'Quản lý và theo dõi hoạt động nông nghiệp'}
                {selectedView === 'analytics' && 'Phân tích chi tiết dữ liệu kinh doanh'}
                {selectedView === 'equipment' && 'Quản lý thiết bị và máy móc nông nghiệp'}
                {selectedView === 'monitoring' && 'Giám sát hiệu suất và trạng thái hệ thống'}
                {selectedView === 'settings' && 'Cấu hình và tùy chỉnh hệ thống'}
              </p>
            </div>
            <div className="flex gap-3">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Tuần</SelectItem>
                  <SelectItem value="month">Tháng</SelectItem>
                  <SelectItem value="year">Năm</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Xuất báo cáo
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Thêm mới
              </Button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {selectedView === 'overview' && (
            <OverviewPage 
              selectedPeriod={selectedPeriod}
              setSelectedPeriod={setSelectedPeriod}
            />
          )}

          {selectedView === 'analytics' && <AnalyticsPage />}

          {selectedView === 'equipment' && <EquipmentPage />}

          {selectedView === 'monitoring' && <MonitoringPage />}

          {selectedView === 'settings' && <SettingsPage />}
        </div>
      </div>
    </div>
  );
};
