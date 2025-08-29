import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleOTPInput } from "@/components/ui/simple-otp-input";
import { sendVerificationEmail, verifyEmail } from "@/api/auth";
import { Mail, CheckCircle, ArrowLeft } from "lucide-react";
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";

interface EmailVerificationProps {
  email: string;
  onVerificationSuccess: () => void;
  onBack: () => void;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({
  email,
  onVerificationSuccess,
  onBack
}) => {
  const { login } = useAuth();
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend button
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerifyEmail = async () => {
    if (!verificationCode || verificationCode.length < 8) {
      toast.error("Vui lòng nhập đầy đủ mã xác thực!");
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyEmail(email, verificationCode);
      
      // Sau khi verify thành công, đăng nhập user tự động
      const mockUser = {
        id: 'temp_id_' + Date.now(),
        fullName: email.split('@')[0], // Tạm thời lấy tên từ email
        email: email,
        phoneNumber: '',
        role: 'customer'
      };
      
      // Đăng nhập với temporary token (sẽ được refresh khi user đăng nhập thật)
      const mockToken = 'verified_token_' + Date.now();
      login(mockUser, mockToken);
      
      toast.success(response.message || "Xác thực email thành công!");
      onVerificationSuccess();
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : "Xác thực email thất bại. Vui lòng thử lại.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      await sendVerificationEmail(email);
      toast.success("Mã xác thực đã được gửi lại!");
      setCountdown(60); // 60 seconds countdown
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : "Gửi lại mã xác thực thất bại. Vui lòng thử lại.";
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-2xl font-bold text-green-600 mb-2">
            <Mail className="h-[50px] w-[50px]" />
            Xác thực Email
          </div>
          <p className="text-muted-foreground mt-2">
            Vui lòng xác thực email để hoàn tất quá trình đăng ký
          </p>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold text-center">Nhập mã xác thực</CardTitle>
            <CardDescription className="text-center">
              Mã xác thực đã được gửi đến <span className="font-medium text-green-600">{email}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Verification Code Input */}
            <div className="space-y-4">
              <Label htmlFor="verificationCode" className="text-center block">
                Mã xác thực 8 số
              </Label>
              
              <div className="flex justify-center">
                <SimpleOTPInput
                  value={verificationCode}
                  onChange={setVerificationCode}
                  length={8}
                  disabled={isLoading}
                />
              </div>
              
              <p className="text-xs text-center text-muted-foreground">
                Nhập mã 8 số từ email của bạn
              </p>
            </div>

            {/* Verify Button */}
                          <Button 
                onClick={handleVerifyEmail}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading || verificationCode.length < 8}
              >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Đang xác thực...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Hoàn tất đăng ký
                </>
              )}
            </Button>

            {/* Resend Code */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Không nhận được mã?
              </p>
              <Button
                variant="ghost"
                onClick={handleResendCode}
                disabled={isResending || countdown > 0}
                className="text-green-600 hover:text-green-700"
              >
                {isResending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Đang gửi...
                  </>
                ) : countdown > 0 ? (
                  `Gửi lại sau ${countdown}s`
                ) : (
                  "Gửi lại mã xác thực"
                )}
              </Button>
            </div>

            {/* Back Button */}
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-muted-foreground hover:text-gray-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại đăng ký
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Mã xác thực có hiệu lực trong 10 phút
        </p>
      </div>
    </div>
  );
};
