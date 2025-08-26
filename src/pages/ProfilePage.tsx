import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, Shield, LogOut, Edit} from "lucide-react";
import { useNavigate } from "react-router";
import { useRequireAuth } from "@/hooks";
import { useState, useEffect } from "react";
import { getUserById } from "@/api/user";
import { EditProfileForm } from "@/components/EditProfileForm";
import { Spinner } from '@/components/ui/shadcn-io/spinner';

export const ProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { loading: authLoading } = useRequireAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Lấy thông tin user mới nhất từ API khi component mount
  useEffect(() => {
    if (user?.id) {
      fetchLatestUserData();
    }
  }, [user?.id]);

  // Simulate loading time for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const fetchLatestUserData = async () => {
    if (!user) return;
    
    try {
      const userData = await getUserById(user.id);
      console.log('Latest user data from API:', userData);
      
      // Cập nhật local state với dữ liệu mới nhất
      if (userData) {
        updateUser({
          fullName: userData.fullName || user.fullName,
          phoneNumber: userData.phoneNumber || user.phoneNumber,
        });
      }
    } catch (error) {
      console.error('Failed to fetch latest user data:', error);
    }
  };

  // Hiển thị loading nếu đang kiểm tra authentication hoặc đang loading
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="text-center">
        
          {/* Spinner chính */}
          <div className=" flex justify-center mb-6">
            <Spinner 
              variant="circle-filled" 
              size={60} 
              className="text-emerald-600 mx-auto"
            />
          </div>
          
          {/* Tiêu đề */}
          <h2 className="text-xl font-bold text-gray-800 mb-3">
            {authLoading ? 'Đang kiểm tra quyền truy cập...' : 'Đang tải thông tin cá nhân...'}
          </h2>
          
          {/* Mô tả */}
          <p className="text-gray-600 mb-6">
            {authLoading ? 'Xác thực người dùng...' : 'Tải dữ liệu hồ sơ...'}
          </p>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Nếu không có user, component sẽ tự động redirect về login
  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error('Logout failed:', error);
      // Vẫn chuyển hướng về trang login ngay cả khi logout thất bại
      navigate("/login");
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = (updatedUser: { fullName: string; phoneNumber: string }) => {
    // Cập nhật local state
    updateUser(updatedUser);
    setIsEditing(false);
    
    // Lấy dữ liệu mới nhất từ API
    fetchLatestUserData();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 mt-[100px]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hồ sơ cá nhân</h1>
          <p className="text-gray-600">Quản lý thông tin tài khoản của bạn</p>
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <div className="mb-6">
            <EditProfileForm
              user={user}
              onSave={handleSaveProfile}
              onCancel={handleCancelEdit}
              isOpen={isEditing}
            />
          </div>
        )}

        {/* Profile Display */}
        {!isEditing && (
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
                      <p className="text-lg font-semibold text-gray-900">
                        {user.phoneNumber || 'Chưa cập nhật'}
                      </p>
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
        )}
      </div>
    </div>
  );
};
