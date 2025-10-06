import React from 'react';
import { Navigate } from 'react-router';
import { useVendorAuth } from '@/hooks/useVendorAuth';

interface VendorProtectedRouteProps {
  children: React.ReactNode;
}

export const VendorProtectedRoute: React.FC<VendorProtectedRouteProps> = ({ children }) => {
  const { canAccessVendor, user, loading } = useVendorAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 rounded-full border-2 border-green-600 border-t-transparent" />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessVendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Truy cập bị từ chối</h1>
          <p className="text-gray-600 mb-6">Chỉ tài khoản Vendor mới được phép truy cập khu vực này.</p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>Vai trò hiện tại: <span className="font-medium text-gray-700">{user?.role || 'Không xác định'}</span></p>
            <p>Email: <span className="font-medium text-gray-700">{user?.email}</span></p>
          </div>
          <button onClick={() => (window.location.href = '/')} className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Về trang chủ</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};


