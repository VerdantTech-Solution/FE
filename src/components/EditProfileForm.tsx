import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateUser } from "@/api/user";

interface EditProfileFormProps {
  user: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    role: string;
    avatarUrl?: string;
  };
  onSave: (updatedUser: { fullName: string; phoneNumber: string; avatarUrl?: string }) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const EditProfileForm = ({ user, onSave, onCancel, isOpen }: EditProfileFormProps) => {
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    phoneNumber: user.phoneNumber || '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName.trim()) {
      toast.error('Họ và tên không được để trống');
      return;
    }

    try {
      setIsLoading(true);
      
      // Gọi API update user
      const response = await updateUser(user.id, {
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
      });

      if (response) {
        toast.success('Cập nhật thành công!');
        onSave({
          fullName: formData.fullName.trim(),
          phoneNumber: formData.phoneNumber.trim(),
        });
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data về giá trị ban đầu
    setFormData({
      fullName: user.fullName,
      phoneNumber: user.phoneNumber || '',
    });
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-2 border-blue-100">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User className="h-6 w-6 text-blue-600" />
          Chỉnh sửa hồ sơ
        </CardTitle>
        <CardDescription className="text-gray-600">
          Cập nhật thông tin cá nhân của bạn
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
              Họ và tên <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Nhập họ và tên đầy đủ"
              required
            />
          </div>

          <Separator />

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Email
            </Label>
            <Input
              type="email"
              value={user.email}
              className="h-11 bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
              disabled
            />
            <p className="text-xs text-gray-500">Email không thể thay đổi</p>
          </div>

          <Separator />

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
              Số điện thoại
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Nhập số điện thoại (không bắt buộc)"
            />
            <p className="text-xs text-gray-500">Để trống nếu không muốn cập nhật</p>
          </div>

          <Separator />

         
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Lưu thay đổi
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11 border-gray-300 hover:bg-gray-50"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Hủy bỏ
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
