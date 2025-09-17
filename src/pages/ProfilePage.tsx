import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, Shield, LogOut, Edit, Key} from "lucide-react";
import { useNavigate } from "react-router";
import { useRequireAuth } from "@/hooks";
import { useState, useEffect } from "react";
import { getUserById } from "@/api/user";
import { EditProfileForm } from "@/components/EditProfileForm";
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { AvatarUpload } from "@/components/AvatarUpload";
import { motion } from "framer-motion";


export const ProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { loading: authLoading } = useRequireAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");

  // Lấy thông tin user mới nhất từ API khi component mount
  useEffect(() => {
    if (user?.id) {
      fetchLatestUserData();
    }
  }, [user?.id]);

  // Cập nhật avatarUrl khi user thay đổi
  useEffect(() => {
    console.log('ProfilePage useEffect - user.avatarUrl changed to:', user?.avatarUrl);
    if (user?.avatarUrl !== undefined) {
      const newAvatarUrl = user.avatarUrl || "";
      setAvatarUrl(newAvatarUrl);
      console.log('ProfilePage useEffect - avatarUrl state updated to:', newAvatarUrl);
    }
  }, [user?.avatarUrl]);

  // Bỏ giả lập loading

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
          avatarUrl: userData.avatarUrl || user.avatarUrl,
        });
        
        // Cập nhật avatarUrl state từ database
        if (userData.avatarUrl !== undefined) {
          setAvatarUrl(userData.avatarUrl || "");
        }
      }
    } catch (error) {
      console.error('Failed to fetch latest user data:', error);
    }
  };

  // Hiển thị loading nếu đang kiểm tra authentication
  if (authLoading) {
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
          <h2 className="text-xl font-bold text-gray-800 mb-3">Đang kiểm tra quyền truy cập...</h2>
          
          {/* Mô tả */}
          <p className="text-gray-600 mb-6">Xác thực người dùng...</p>
          
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

  const handleSaveProfile = (updatedUser: { fullName: string; phoneNumber: string; avatarUrl?: string }) => {
    // Cập nhật local state
    updateUser(updatedUser);
    setIsEditing(false);
    
    // Cập nhật avatar nếu có
    if (updatedUser.avatarUrl !== undefined) {
      setAvatarUrl(updatedUser.avatarUrl || "");
    }
    
    // Lấy dữ liệu mới nhất từ API để đảm bảo đồng bộ
    fetchLatestUserData();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    navigate("/change-password");
  };

  const handleAvatarChange = (newAvatarUrl: string | null) => {
    console.log('ProfilePage handleAvatarChange called with:', newAvatarUrl);
    
    // Cập nhật local state trước
    setAvatarUrl(newAvatarUrl || "");
    
    // Cập nhật user context với avatar mới
    updateUser({ avatarUrl: newAvatarUrl || undefined });
    
    console.log('ProfilePage - Avatar state updated to:', newAvatarUrl || "");
    console.log('ProfilePage - User context updated with avatarUrl:', newAvatarUrl || undefined);
    
    // Lấy dữ liệu mới nhất từ database để đảm bảo đồng bộ
    setTimeout(() => {
      fetchLatestUserData();
    }, 500);
  };

  return (
    <motion.div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 mt-[100px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div className="text-center mb-8" initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hồ sơ cá nhân</h1>
          <p className="text-gray-600">Quản lý thông tin tài khoản của bạn</p>
        </motion.div>

        {/* Edit Profile Form */}
        {isEditing && (
          <motion.div className="mb-6" initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
            <EditProfileForm
              user={user}
              onSave={handleSaveProfile}
              onCancel={handleCancelEdit}
              isOpen={isEditing}
            />
          </motion.div>
        )}



        {/* Profile Display */}
        {!isEditing && (
          <motion.div className="grid grid-cols-1 lg:grid-cols-12 gap-6" initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}>
            {/* Avatar Section */}
            <motion.div className="lg:col-span-2 flex justify-center" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <AvatarUpload
                currentAvatarUrl={avatarUrl}
                onAvatarChange={handleAvatarChange}
                userId={user.id}
              />
            </motion.div>

            {/* Profile Card */}
            <motion.div className="lg:col-span-6" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">Thông tin cá nhân</CardTitle>
                      <CardDescription>
                        Cập nhật thông tin cá nhân của bạn
                      </CardDescription>
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button onClick={handleEditProfile} variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Chỉnh sửa
                    </Button>
                    </motion.div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Full Name */}
                  <motion.div className="flex items-center space-x-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">Họ và tên</p>
                      <p className="text-lg font-semibold text-gray-900">{user.fullName}</p>
                    </div>
                  </motion.div>

                  <Separator />

                  {/* Email */}
                  <motion.div className="flex items-center space-x-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-lg font-semibold text-gray-900">{user.email}</p>
                    </div>
                  </motion.div>

                  <Separator />

                  {/* Phone */}
                  <motion.div className="flex items-center space-x-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">Số điện thoại</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {user.phoneNumber || 'Chưa cập nhật'}
                      </p>
                    </div>
                  </motion.div>

                  <Separator />

                  {/* Role */}
                  <motion.div className="flex items-center space-x-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Shield className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500">Vai trò</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">{user.role}</p>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar */}
            <motion.div className="lg:col-span-4 space-y-6" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              {/* Account Actions */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Tài khoản</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={handleEditProfile} className="w-full" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa profile
                  </Button>
                  </motion.div>
                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={handleChangePassword} className="w-full" variant="outline">
                    <Key className="h-4 w-4 mr-2" />
                    Đổi mật khẩu
                  </Button>
                  </motion.div>
                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={handleLogout} className="w-full" variant="destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Đăng xuất
                  </Button>
                  </motion.div>
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
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
