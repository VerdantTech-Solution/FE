import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router";
import logo from "@/assets/logo.png";
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react";
import { loginUser } from "@/api/auth";
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { googleLogin } from "@/api/auth";

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  
  const { login } = useAuth();
  const navigate = useNavigate();

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
              <LogIn className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">VerdantTech</h1>
            <p className="text-gray-600">Đăng nhập</p>
          </div>

          {/* Spinner chính */}
          <div className=" flex justify-center mb-6">
            <Spinner 
              variant="circle-filled" 
              size={60} 
              className="text-green-600 mx-auto"
            />
          </div>
          
          {/* Tiêu đề */}
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Đang tải trang đăng nhập
          </h2>
          
          {/* Mô tả */}
          <p className="text-gray-600 mb-6">
            Chuẩn bị giao diện đăng nhập...
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

  const handleSignUp = () => {
    navigate("/signup");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log('Submitting login form with:', { email, password });
      
      const response = await loginUser({ email, password });
      console.log("Login API response:", response);
      
      // Validate response before calling login
      if (!response || !response.user || !response.token) {
        throw new Error('Invalid response from login API');
      }
      
      console.log("Calling login context with:", { user: response.user, token: response.token });
      
      // Cập nhật auth context với user và token
      login(response.user, response.token);
      
      // toast.success("Đăng nhập thành công!"); // Removed toast as per new_code
      console.log("Login successful, redirecting to home");
      
      // Chuyển hướng sau khi đăng nhập thành công
      navigate("/");
    } catch (error: unknown) {
      console.error("Login error:", error);
      // Xử lý lỗi đăng nhập
      console.log("Login failed, please try again");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
    setIsLoading(true);
    try {
      console.log('Google login initiated with credential:', credentialResponse);
      const idToken = credentialResponse.credential;
      
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }
      
      const data = await googleLogin(idToken);
      console.log("Google login API response:", data);
      
      // Validate response before calling login
      if (!data || !data.user || !data.token) {
        throw new Error('Invalid response from Google login API');
      }
      
      console.log("Calling login context with Google data:", { user: data.user, token: data.token });
      
      // Use AuthContext login method (consistent with regular login)
      login(data.user, data.token);
      
      console.log("Google login successful, redirecting to home");
      navigate("/");
    } catch (error: unknown) {
      console.error("Google login error:", error);
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : "Đăng nhập Google thất bại. Vui lòng thử lại.";
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Logo */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-emerald-300 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-teal-300 rounded-full blur-3xl"></div>
        </div>
        
        {/* Agricultural Background Elements */}
        <div className="absolute inset-0 opacity-15">
          {/* Leaf patterns */}
          <div className="absolute top-20 left-20 w-16 h-16 bg-emerald-200 rounded-full blur-2xl"></div>
          <div className="absolute bottom-32 right-32 w-20 h-20 bg-teal-200 rounded-full blur-2xl"></div>
          <div className="absolute top-1/3 right-16 w-12 h-12 bg-cyan-200 rounded-full blur-2xl"></div>
          
          {/* Abstract farm shapes */}
          <div className="absolute top-40 left-1/4 w-8 h-8 bg-white/30 rounded-full"></div>
          <div className="absolute bottom-40 right-1/4 w-6 h-6 bg-white/40 rounded-full"></div>
          <div className="absolute top-1/2 left-16 w-10 h-10 bg-emerald-100/50 rounded-full"></div>
        </div>
        
        <div className="text-center text-white relative z-10 px-8">
          {/* Logo with enhanced glow */}
          <div className="relative mb-10">
            <div className="absolute -inset-6 bg-white/20 rounded-full blur-2xl"></div>
            <img 
              src={logo} 
              alt="VerdantTech Logo" 
              className="h-40 w-auto mx-auto relative z-10 drop-shadow-2xl"
            />
            <div className="absolute -inset-8 bg-emerald-300/30 rounded-full blur-3xl"></div>
          </div>
          
          {/* Company Name with enhanced styling */}
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white via-emerald-50 to-teal-100 bg-clip-text text-transparent drop-shadow-lg">
            VerdantTech
          </h1>
          
          {/* Enhanced tagline */}
          <div className="space-y-4">
            <p className="text-2xl font-semibold text-white/90 leading-relaxed max-w-md mx-auto">
              Giải pháp công nghệ xanh
            </p>
            <p className="text-lg text-emerald-100/80 leading-relaxed max-w-md mx-auto">
              Cho tương lai nông nghiệp bền vững
            </p>
          </div>
          
          {/* Decorative elements */}
          <div className="flex justify-center space-x-3 mt-8">
            <div className="w-3 h-3 bg-white/60 rounded-full"></div>
            <div className="w-3 h-3 bg-emerald-200/80 rounded-full"></div>
            <div className="w-3 h-3 bg-teal-200/80 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right Side - Enhanced Login Form with shadcn/ui - Compact Size */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-4 lg:p-12 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="w-full max-w-lg">
          {/* Logo and Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 text-xl font-bold text-green-600 mb-2">
              {/* <Leaf className="h-6 w-6" /> */}
              VerdantTech
            </div>
            <p className="text-sm text-gray-600">Chào mừng bạn trở lại với nông nghiệp bền vững</p>
          </div>

          {/* Login Card using shadcn/ui Card component */}
          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-bold text-center">Đăng nhập</CardTitle>
              <CardDescription className="text-center text-sm">
                Nhập thông tin đăng nhập để truy cập tài khoản
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-semibold">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Nhập email của bạn"
                      value={email}
                      onChange={handleInputChange}
                      className="pl-8 py-2 text-sm h-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-semibold">Mật khẩu</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-8 pr-8 py-2 text-sm h-10"
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <Eye className="h-3 w-3 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end items-center pt-1">
                  <button 
                    onClick={() => navigate('/forgot-password')}
                    className="text-xs text-green-600 hover:text-green-700 hover:underline font-medium"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 py-2 text-sm font-semibold h-10" disabled={isLoading}>
                  {isLoading ? <Spinner className="mr-2 h-4 w-4 animate-spin" /> : "Đăng nhập"}
                </Button>
              </form>

              {/* Divider */}
               <div className="flex items-center gap-3 py-4">
                 <span className="text-xs text-muted-foreground font-medium px-2">
                   Hoặc tiếp tục với
                 </span>
               </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <GoogleLogin
                    onSuccess={handleGoogleLogin}
                    onError={() => alert("Đăng nhập Google thất bại")}
                    width="100%"
                    size="medium"
                    text="signin_with"
                    locale="vi"
                    shape="rectangular"
                    theme="outline"
                  />
                </div>
                <Button variant="outline" className="w-full bg-transparent border border-gray-200 hover:border-gray-300 py-2 h-10 text-xs">
                  <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </Button>
              </div>
            </CardContent>

            <CardFooter className="pt-3">
              <p className="text-center text-xs text-muted-foreground w-full">
                Chưa có tài khoản?{" "}
                <a onClick={handleSignUp} className="text-green-600 hover:text-green-700 hover:underline font-semibold cursor-pointer">
                  Đăng ký ngay
                </a>
              </p>
            </CardFooter>
          </Card>

          {/* Terms */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Bằng việc đăng nhập, bạn đồng ý với{" "}
            <a href="#" className="hover:underline font-medium">
              Điều khoản dịch vụ
            </a>{" "}
            và{" "}
            <a href="#" className="hover:underline font-medium">
              Chính sách bảo mật
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};