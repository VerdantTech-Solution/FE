import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { signUpUser, sendVerificationEmail, googleLogin } from "@/api/auth";
import { useNavigate } from "react-router";
import { User, Mail, Phone, Lock, Eye, EyeOff, UserPlus } from "lucide-react";
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";


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
          <div className=" flex justify-center  mb-6">
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

  // Nếu đang loading, hiển thị loading
  if (isLoading) {
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
      
      // Kiểm tra nếu là temporary token
      if (response.token.startsWith('temp_token_')) {
        // Tự động gửi email xác thực
        try {
          await sendVerificationEmail(formData.email);
          toast.success("Đăng ký thành công! Email xác thực đã được gửi.");
          console.log("📧 Verification email sent automatically");
        } catch (error) {
          console.error("Failed to send verification email:", error);
          toast.error("Đăng ký thành công nhưng không thể gửi email xác thực. Vui lòng thử lại.");
        }
        
        console.log("📝 Signup successful with temporary token, redirecting to email verification");
        // Chuyển đến trang verify email với email parameter
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      } else {
        // Nếu có token thật, đăng nhập và chuyển đến home
        login(response.user, response.token);
        toast.success("Đăng ký thành công!");
        console.log("🎉 Sign up successful, redirecting to home");
        navigate("/");
      }
      
    } catch (error: unknown) {
      console.error("💥 Sign up error:", error);
      
      let errorMessage = "Đăng ký thất bại. Vui lòng thử lại.";
      
      // Check if error is InternalServerError with "Lỗi máy chủ nội bộ"
      if (error && typeof error === 'object') {
        // Check if error has response.data structure
        if ('response' in error && error.response && typeof error.response === 'object' && 'data' in error.response) {
          const errorData = error.response.data as any;
          if (
            errorData?.statusCode === 'InternalServerError' &&
            errorData?.errors &&
            Array.isArray(errorData.errors) &&
            errorData.errors.some((err: string) => err.includes('Lỗi máy chủ nội bộ'))
          ) {
            errorMessage = 'Tài khoản này đã được sử dụng';
          } else if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
            errorMessage = errorData.errors[0];
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          }
        }
        // Check if error is directly the response data structure
        else if ('statusCode' in error && (error as any).statusCode === 'InternalServerError') {
          const errorData = error as any;
          if (
            errorData.errors &&
            Array.isArray(errorData.errors) &&
            errorData.errors.some((err: string) => err.includes('Lỗi máy chủ nội bộ'))
          ) {
            errorMessage = 'Tài khoản này đã được sử dụng';
          } else if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
            errorMessage = errorData.errors[0];
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        }
        // Check if error has message property
        else if ('message' in error) {
          const message = String(error.message);
          // Check if message contains "Lỗi máy chủ nội bộ" and statusCode is InternalServerError
          if (message.includes('Lỗi máy chủ nội bộ')) {
            errorMessage = 'Tài khoản này đã được sử dụng';
          } else {
            errorMessage = message;
          }
        }
      }
      
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

  const handleGoogleSignup = async (credentialResponse: CredentialResponse) => {
    setIsLoading(true);
    try {
      const idToken = credentialResponse.credential;
      if (!idToken) {
        throw new Error('Không nhận được mã xác thực từ Google');
      }

      const data = await googleLogin(idToken);

      if (!data || !data.user || !data.token) {
        throw new Error('Phản hồi không hợp lệ từ Google');
      }

      login(data.user, data.token);
      toast.success("Đăng ký/đăng nhập bằng Google thành công!");

      const role = data.user?.role;
      if (role === 'Vendor') {
        navigate('/vendor', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error: unknown) {
      console.error("Google signup error:", error);
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : "Đăng ký bằng Google thất bại. Vui lòng thử lại.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSignup}
                onError={() => toast.error("Đăng ký bằng Google thất bại. Vui lòng thử lại.")}
                width="100%"
                size="large"
                text="signup_with"
                locale="vi"
                shape="rectangular"
                theme="outline"
              />
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
