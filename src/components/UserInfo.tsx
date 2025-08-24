import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Shield } from "lucide-react";

export const UserInfo = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-red-600">Chưa đăng nhập</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600">Vui lòng đăng nhập để xem thông tin</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-green-600">Thông tin người dùng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3">
          <User className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm text-gray-500">Họ và tên</p>
            <p className="font-semibold">{user.fullName}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Mail className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-semibold">{user.email}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Phone className="h-5 w-5 text-purple-600" />
          <div>
            <p className="text-sm text-gray-500">Số điện thoại</p>
            <p className="font-semibold">{user.phoneNumber}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Shield className="h-5 w-5 text-orange-600" />
          <div>
            <p className="text-sm text-gray-500">Vai trò</p>
            <p className="font-semibold capitalize">{user.role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
