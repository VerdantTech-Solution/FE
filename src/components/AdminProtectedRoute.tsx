import React from 'react';
import { Navigate } from 'react-router';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Loader2, ShieldX } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { canAccessAdmin, user, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Kiểm tra xem user đã đăng nhập chưa
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra xem user có quyền admin không
  if (!canAccessAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <ShieldX className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Truy cập bị từ chối</h1>
            <p className="text-gray-600 mb-6">
              Bạn không có quyền truy cập vào trang Admin. Chỉ có quản trị viên mới được phép truy cập trang này.
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Vai trò hiện tại: <span className="font-medium text-gray-700">{user?.role || 'Không xác định'}</span>
            </p>
            <p className="text-sm text-gray-500">
              Email: <span className="font-medium text-gray-700">{user?.email}</span>
            </p>
          </div>
          <div className="mt-8">
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors mr-3"
            >
              Quay lại
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
