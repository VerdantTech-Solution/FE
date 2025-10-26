import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { HomePage } from '@/pages/HomePage';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import Navbar from '@/pages/Navbar';
import { Footer } from '@/pages';

export const SimpleRoleRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    console.log('SimpleRoleRedirect useEffect:', { loading, isAuthenticated, user: user?.role });
    
    // Chỉ xử lý khi không còn loading và đã xác thực
    if (!loading && isAuthenticated && user) {
      const role = user.role;
      const target = role === 'Admin' ? '/admin' : role === 'Staff' ? '/staff' : null;
      console.log('SimpleRoleRedirect: role =', role, 'target =', target);
      
      if (target) {
        console.log('SimpleRoleRedirect: Setting spinner and redirecting to', target);
        setShowSpinner(true);
        const timer = setTimeout(() => {
          console.log('SimpleRoleRedirect: Executing navigation to', target);
          navigate(target, { replace: true });
        }, 1000); // Giảm thời gian từ 2s xuống 1s
        return () => clearTimeout(timer);
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

  // Hiển thị spinner khi chuyển theo role (không có Navbar)
  if (showSpinner) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <div className="text-center">
          {/* Spinner chính với hiệu ứng đẹp */}
          <div className="flex justify-center mb-6">
            <Spinner 
              variant="circle-filled" 
              size={80} 
              className="text-green-600 mx-auto"
            />
          </div>
          
          {/* Tiêu đề */}
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Đang chuyển đến bảng điều khiển
          </h2>
          
          {/* Mô tả */}
          <p className="text-gray-600 mb-6 text-lg">
            Vui lòng đợi trong giây lát...
          </p>
          
          {/* Spinner phụ với text */}
          <div className="flex items-center justify-center space-x-3">
            <Spinner variant="ellipsis" size={20} className="text-green-600" />
            <span className="text-sm font-medium text-gray-700">
              Vui lòng đợi trong giây lát
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Nếu chưa đăng nhập hoặc role khác Admin, hiển thị HomePage với Layout (có Navbar)
  return (
    <div className="flex flex-col min-h-screen bg-green-50">
      <Navbar />
      <main className="flex-1 overflow-hidden">
        <HomePage />
      </main>
      <Footer />
    </div>
  );
};
