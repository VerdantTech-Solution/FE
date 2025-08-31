import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { changePassword } from '../api/auth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertCircle, CheckCircle, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from './ui/shadcn-io/spinner';

// Schema validation cho change password
const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Mật khẩu cũ không được để trống'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
}).refine((data) => data.oldPassword !== data.newPassword, {
  message: "Mật khẩu mới không được trùng với mật khẩu cũ",
  path: ["newPassword"],
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

interface ChangePasswordProps {
  email: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  isPage?: boolean;
}

export const ChangePassword: React.FC<ChangePasswordProps> = ({ 
  email, 
  onSuccess,
  onCancel,
  isPage = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data: ChangePasswordForm) => {
    setIsLoading(true);
    try {
      const response = await changePassword(email, data.oldPassword, data.newPassword);
      setIsSuccess(true);
      toast.success('Đổi mật khẩu thành công!');
      form.reset();
    } catch (error: any) {
      const errorMessage = error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (isSuccess) {
      onSuccess?.();
    } else {
      onCancel?.();
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className={`${isPage ? 'min-h-screen' : ''} bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4`}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-2xl font-bold text-green-600 mb-2">
              <CheckCircle className="h-[50px] w-[50px]" />
              Đổi mật khẩu thành công!
            </div>
            <p className="text-muted-foreground mt-2">
              Mật khẩu của bạn đã được cập nhật thành công
            </p>
          </div>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Bạn có thể sử dụng mật khẩu mới cho lần đăng nhập tiếp theo.
                </p>
                
                <Button 
                  onClick={handleBack}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Quay lại Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main component
  return (
    <div className={`${isPage ? 'min-h-screen' : ''} bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-2xl font-bold text-green-600 mb-2">
            <Lock className="h-[50px] w-[50px]" />
            Đổi mật khẩu
          </div>
          <p className="text-muted-foreground mt-2">
            Cập nhật mật khẩu mới cho tài khoản của bạn
          </p>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold text-center">Thông tin đổi mật khẩu</CardTitle>
            <CardDescription className="text-center">
              Nhập mật khẩu cũ và tạo mật khẩu mới
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Old Password Field */}
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Mật khẩu hiện tại</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="oldPassword"
                    type={showOldPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu hiện tại"
                    {...form.register('oldPassword')}
                    className={`pl-10 pr-8 ${form.formState.errors.oldPassword ? 'border-red-500' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    disabled={isLoading}
                  >
                    {showOldPassword ? (
                      <EyeOff className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <Eye className="h-3 w-3 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.oldPassword && (
                  <div className="flex items-center gap-2 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    {form.formState.errors.oldPassword.message}
                  </div>
                )}
              </div>

              {/* New Password Field */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu mới"
                    {...form.register('newPassword')}
                    className={`pl-10 pr-8 ${form.formState.errors.newPassword ? 'border-red-500' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={isLoading}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <Eye className="h-3 w-3 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.newPassword && (
                  <div className="flex items-center gap-2 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    {form.formState.errors.newPassword.message}
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu mới"
                    {...form.register('confirmPassword')}
                    className={`pl-10 pr-8 ${form.formState.errors.confirmPassword ? 'border-red-500' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <Eye className="h-3 w-3 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <div className="flex items-center gap-2 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    {form.formState.errors.confirmPassword.message}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Đang đổi mật khẩu...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Đổi mật khẩu
                  </>
                )}
              </Button>
            </form>

            {/* Navigation Buttons */}
            <div className="space-y-3">
              {onCancel && (
                <Button
                  variant="ghost"
                  onClick={onCancel}
                  className="w-full text-muted-foreground hover:text-gray-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
