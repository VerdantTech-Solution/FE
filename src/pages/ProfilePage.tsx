import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, Shield, LogOut, Edit } from "lucide-react";
import { useNavigate } from "react-router";
import { useRequireAuth } from "@/hooks";

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { loading } = useRequireAuth();

  // Hiển thị loading nếu đang kiểm tra authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Nếu không có user, component sẽ tự động redirect về login
  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleEditProfile = () => {
    // TODO: Implement edit profile functionality
    console.log("Edit profile clicked");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 mt-[100px]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hồ sơ cá nhân</h1>
          <p className="text-gray-600">Quản lý thông tin tài khoản của bạn</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Thông tin cá nhân</CardTitle>
                    <CardDescription>
                      Cập nhật thông tin cá nhân của bạn
                    </CardDescription>
                  </div>
                  <Button onClick={handleEditProfile} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Full Name */}
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Họ và tên</p>
                    <p className="text-lg font-semibold text-gray-900">{user.fullName}</p>
                  </div>
                </div>

                <Separator />

                {/* Email */}
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-lg font-semibold text-gray-900">{user.email}</p>
                  </div>
                </div>

                <Separator />

                {/* Phone */}
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Phone className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Số điện thoại</p>
                    <p className="text-lg font-semibold text-gray-900">{user.phoneNumber}</p>
                  </div>
                </div>

                <Separator />

                {/* Role */}
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Shield className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Vai trò</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">{user.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Actions */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Tài khoản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleEditProfile} className="w-full" variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Chỉnh sửa profile
                </Button>
                <Button onClick={handleLogout} className="w-full" variant="destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Đăng xuất
                </Button>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Thông tin tài khoản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Trạng thái:</span>
                  <span className="text-sm font-medium text-green-600">Hoạt động</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Ngày tham gia:</span>
                  <span className="text-sm font-medium text-gray-900">Hôm nay</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
       
      </div>
    </div>
  );
};
