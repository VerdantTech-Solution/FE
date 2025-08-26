import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { signUpUser } from "@/api/auth";
import { useNavigate } from "react-router";
import { User, Mail, Phone, Lock, Eye, EyeOff, UserPlus } from "lucide-react";
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthRedirect } from "@/hooks";
import { toast } from "sonner";

export const SignUpPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'customer'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  
  const navigate = useNavigate();
  const { login } = useAuth();
  const { loading: authLoading } = useAuthRedirect('/');

  useEffect(() => {
    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Page loading screen
  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
        <div className="text-center">
          {/* Logo và branding */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
              <UserPlus className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">VerdantTech</h1>
            <p className="text-gray-600">Đăng ký</p>
          </div>

          {/* Spinner chính */}
          <div className="mb-6">
            <Spinner 
              variant="circle-filled" 
              size={60} 
              className="text-green-600 mx-auto"
            />
          </div>
          
          {/* Tiêu đề */}
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Đang tải trang đăng ký
          </h2>
          
          {/* Mô tả */}
          <p className="text-gray-600 mb-6">
            Chuẩn bị giao diện đăng ký...
          </p>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Nếu đang loading hoặc đã đăng nhập, hiển thị loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner 
            variant="circle-filled" 
            size={60} 
            className="text-green-600 mx-auto mb-4"
          />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Kiểm tra mật khẩu xác nhận
    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('🚀 Submitting signup form with:', formData);
      
      const response = await signUpUser(formData);
      console.log("✅ Signup API response:", response);
      
      // Validate response before calling login
      if (!response || !response.user || !response.token) {
        throw new Error('Invalid response from signup API');
      }
      
      console.log("🔐 Calling login context with:", { user: response.user, token: response.token });
      
      // Cập nhật auth context với user và token
      login(response.user, response.token);
      
      // Kiểm tra nếu là temporary token
      if (response.token.startsWith('temp_token_')) {
        toast.success("Đăng ký thành công!");
        console.log("📝 Signup successful with temporary token, redirecting to login");
        navigate("/login");
      } else {
        toast.success("Đăng ký thành công!");
        console.log("🎉 Sign up successful, redirecting to home");
        navigate("/login");
      }
      
    } catch (error: unknown) {
      console.error("💥 Sign up error:", error);
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : "Đăng ký thất bại. Vui lòng thử lại.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-2xl font-bold text-green-600 mb-2">
            <UserPlus className="h-[50px] w-[50px]" />
            VerdantTech
          </div>
          <p className="text-muted-foreground mt-2">Tham gia cùng chúng tôi xây dựng tương lai nông nghiệp bền vững</p>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Đăng ký</CardTitle>
            <CardDescription className="text-center">Tạo tài khoản mới để bắt đầu hành trình</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name Field */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Nhập họ và tên của bạn"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Nhập email của bạn"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Phone Number Field - Cập nhật tên field */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Số điện thoại</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="Nhập số điện thoại"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tạo mật khẩu"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                {isLoading ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : (
                  "Đăng ký"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Hoặc tiếp tục với</span>
              </div>
            </div>

            {/* Social Sign Up */}
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="w-full bg-transparent">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>
          </CardContent>

          <CardFooter>
            <p className="text-center text-sm text-muted-foreground w-full">
              Đã có tài khoản?{" "}
              <button 
                onClick={handleLogin}
                className="text-green-600 hover:text-green-700 hover:underline font-medium cursor-pointer"
              >
                Đăng nhập
              </button>
            </p>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Bằng việc đăng ký, bạn đồng ý với{" "}
          <a href="#" className="hover:underline">
            Điều khoản dịch vụ
          </a>{" "}
          và{" "}
          <a href="#" className="hover:underline">
            Chính sách bảo mật
          </a>
        </p>
      </div>
    </div>
  );
};
