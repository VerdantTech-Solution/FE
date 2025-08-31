import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router";
import { useRequireAuth } from "@/hooks";
import { ChangePassword } from "@/components/ChangePassword";

export const ChangePasswordPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { loading: authLoading } = useRequireAuth();

  // Hiển thị loading nếu đang kiểm tra authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Nếu không có user, component sẽ tự động redirect về login
  if (!user) {
    return null;
  }

  const handleSuccess = () => {
    navigate("/profile");
  };

  const handleCancel = () => {
    navigate("/profile");
  };

  return (
    <ChangePassword
      email={user.email}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
      isPage={true}
    />
  );
};
