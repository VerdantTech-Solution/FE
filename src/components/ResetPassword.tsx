import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { resetPassword } from '../api/auth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertCircle, CheckCircle, Lock, Key, ArrowLeft, Mail, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from './ui/shadcn-io/spinner';

// Schema validation cho reset password
const resetPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  code: z.string().min(1, 'Code không được để trống'),
  newPassword: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordProps {
  email?: string;
  onBackToLogin?: () => void;
  onBackToForgotPassword?: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ 
  email = '', 
  onBackToLogin,
  onBackToForgotPassword 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: email,
      code: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  // Set email value when component mounts
  React.useEffect(() => {
    if (email) {
      form.setValue('email', email);
    }
  }, [email, form]);

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true);
    try {
      const response = await resetPassword(data.email, data.code, data.newPassword);
      setIsSuccess(true);
      toast.success('Đặt lại mật khẩu thành công!');
      form.reset();
    } catch (error: any) {
      const errorMessage = error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setIsSuccess(false);
    form.reset();
    onBackToLogin?.();
  };

  const handleBackToForgotPassword = () => {
    form.reset();
    onBackToForgotPassword?.();
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-2xl font-bold text-green-600 mb-2">
              <CheckCircle className="h-[50px] w-[50px]" />
              Đặt lại mật khẩu thành công!
            </div>
            <p className="text-muted-foreground mt-2">
              Mật khẩu của bạn đã được cập nhật thành công
            </p>
          </div>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Bạn có thể sử dụng mật khẩu mới để đăng nhập vào tài khoản.
                </p>
                
                <Button 
                  onClick={handleBackToLogin}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Đăng nhập ngay
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-2xl font-bold text-green-600 mb-2">
            <Lock className="h-[50px] w-[50px]" />
            Đặt lại mật khẩu
          </div>
          <p className="text-muted-foreground mt-2">
            Nhập code và mật khẩu mới để hoàn tất
          </p>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold text-center">Thông tin đặt lại</CardTitle>
            <CardDescription className="text-center">
              Nhập code đã nhận và tạo mật khẩu mới cho tài khoản
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Nhập email của bạn"
                    {...form.register('email')}
                    className={`pl-10 ${form.formState.errors.email ? 'border-red-500' : ''}`}
                    disabled={!!email}
                  />
                </div>
                {form.formState.errors.email && (
                  <div className="flex items-center gap-2 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    {form.formState.errors.email.message}
                  </div>
                )}
              </div>

              {/* Code Field */}
              <div className="space-y-2">
                <Label htmlFor="code">Code xác thực</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="code"
                    type="text"
                    placeholder="Nhập code đã nhận"
                    {...form.register('code')}
                    className={`pl-10 ${form.formState.errors.code ? 'border-red-500' : ''}`}
                  />
                </div>
                {form.formState.errors.code && (
                  <div className="flex items-center gap-2 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    {form.formState.errors.code.message}
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
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
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
                    Đang đặt lại...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Đặt lại mật khẩu
                  </>
                )}
              </Button>
            </form>

            {/* Navigation Buttons */}
            <div className="space-y-3">
              {onBackToForgotPassword && (
                <Button 
                  variant="outline"
                  onClick={handleBackToForgotPassword}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại
                </Button>
              )}
              
              {onBackToLogin && (
                <Button
                  variant="ghost"
                  onClick={onBackToLogin}
                  className="w-full text-muted-foreground hover:text-gray-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại đăng nhập
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
