import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { HomePage } from '@/pages/HomePage';

export const SimpleRoleRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Chỉ xử lý khi không còn loading và đã xác thực
    if (!loading && isAuthenticated && user) {
      // Nếu user có role là 'Admin', chuyển đến trang admin
      if (user.role === 'Admin') {
        navigate('/admin');
      }
    }
  }, [user, isAuthenticated, loading, navigate]);

  // Hiển thị loading khi đang kiểm tra xác thực
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Nếu chưa đăng nhập hoặc role khác Admin, hiển thị HomePage
  return <HomePage />;
};
