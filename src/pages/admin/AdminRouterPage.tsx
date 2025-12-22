import AdminDashboardPage from './AdminDashboardPage';
import { AdminWarehousePanel } from './AdminWarehousePanel';
import { AdminProductManagementPanel } from './AdminProductManagementPanel';
import { AdminUserManagementPanel } from './AdminUserManagementPanel';
import { AdminOrderManagementPanel } from './AdminOrderManagementPanel';
import { AdminPostManagementPanel } from './AdminPostManagementPanel';
import { AdminCategoryManagementPanel } from './AdminCategoryManagementPanel';
import { AdminBalanceManagement } from './AdminBalanceManagement';
import { AdminCashoutManagementPanel } from './AdminCashoutManagementPanel';
import { AdminSupportRequestManagementPanel } from './AdminSupportRequestManagementPanel';
import { AdminVendorManagementPanel } from './AdminVendorManagementPanel';
import AdminSidebar from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { Route, Routes as RRDRoutes, Navigate } from 'react-router';

// Wrapper component cho các pages có sidebar và header
const AdminPageWrapper = ({ 
  title, 
  subtitle, 
  children 
}: { 
  title: string; 
  subtitle: string; 
  children: React.ReactNode;
}) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col ml-64">
        <AdminHeader title={title} subtitle={subtitle} />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const AdminRouterPage = () => {
  return (
    <RRDRoutes>
      <Route 
        path="" 
        element={
          <AdminPageWrapper 
            title="Tổng quan hệ thống" 
            subtitle="Thống kê toàn hệ thống: doanh thu, đơn hàng, người dùng, sản phẩm và hàng đợi"
          >
            <AdminDashboardPage />
          </AdminPageWrapper>
        } 
      />
      <Route 
        path="warehouse" 
        element={
          <AdminPageWrapper 
            title="Quản lý đơn đăng ký" 
            subtitle="Duyệt và quản lý các đơn đăng ký sản phẩm từ vendor"
          >
            <AdminWarehousePanel />
          </AdminPageWrapper>
        } 
      />
      <Route 
        path="products" 
        element={
          <AdminPageWrapper 
            title="Quản lý sản phẩm" 
            subtitle="Quản lý tất cả sản phẩm trong hệ thống"
          >
            <AdminProductManagementPanel />
          </AdminPageWrapper>
        } 
      />
      <Route 
        path="users" 
        element={
          <AdminPageWrapper 
            title="Quản lý người dùng" 
            subtitle="Quản lý khách hàng, vendors và staff"
          >
            <AdminUserManagementPanel />
          </AdminPageWrapper>
        } 
      />
      <Route 
        path="orders" 
        element={
          <AdminPageWrapper 
            title="Quản lý đơn hàng" 
            subtitle="Quản lý tất cả đơn hàng trong hệ thống"
          >
            <AdminOrderManagementPanel />
          </AdminPageWrapper>
        } 
      />
      <Route 
        path="posts" 
        element={
          <AdminPageWrapper 
            title="Quản lý bài viết" 
            subtitle="Quản lý các bài viết và nội dung"
          >
            <AdminPostManagementPanel />
          </AdminPageWrapper>
        } 
      />
      <Route 
        path="categories" 
        element={
          <AdminPageWrapper 
            title="Quản lý danh mục" 
            subtitle="Quản lý danh mục sản phẩm"
          >
            <AdminCategoryManagementPanel />
          </AdminPageWrapper>
        } 
      />
      <Route 
        path="balance" 
        element={
          <AdminPageWrapper 
            title="Quản lý số dư" 
            subtitle="Quản lý số dư tài khoản"
          >
            <AdminBalanceManagement />
          </AdminPageWrapper>
        } 
      />
      <Route 
        path="cashout" 
        element={
          <AdminPageWrapper 
            title="Quản lý rút tiền" 
            subtitle="Quản lý các yêu cầu rút tiền"
          >
            <AdminCashoutManagementPanel />
          </AdminPageWrapper>
        } 
      />
      <Route 
        path="support" 
        element={
          <AdminPageWrapper 
            title="Quản lý hỗ trợ" 
            subtitle="Quản lý các yêu cầu hỗ trợ"
          >
            <AdminSupportRequestManagementPanel />
          </AdminPageWrapper>
        } 
      />
      <Route 
        path="vendors" 
        element={
          <AdminPageWrapper 
            title="Quản lý nhà cung cấp" 
            subtitle="Quản lý thông tin nhà cung cấp"
          >
            <AdminVendorManagementPanel />
          </AdminPageWrapper>
        } 
      />
      <Route path="*" element={<Navigate to="" replace />} />
    </RRDRoutes>
  );
};

export default AdminRouterPage;

