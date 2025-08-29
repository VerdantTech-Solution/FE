import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sendVerificationEmail } from "@/api/auth";
import { Mail, Send, CheckCircle, ArrowLeft } from "lucide-react";
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { toast } from "sonner";

interface SendVerificationEmailProps {
  onEmailSent: (email: string) => void;
  onBack: () => void;
}

export const SendVerificationEmail: React.FC<SendVerificationEmailProps> = ({
  onEmailSent,
  onBack
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error("Vui lòng nhập email hợp lệ!");
      return;
    }

    setIsLoading(true);
    try {
      await sendVerificationEmail(email);
      setIsSuccess(true);
      toast.success("Email xác thực đã được gửi!");
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : "Gửi email xác thực thất bại. Vui lòng thử lại.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-2xl font-bold text-green-600 mb-2">
              <CheckCircle className="h-[50px] w-[50px]" />
              Email đã được gửi
            </div>
            <p className="text-muted-foreground mt-2">
              Vui lòng kiểm tra email của bạn để xác thực
            </p>
          </div>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Chúng tôi đã gửi email xác thực đến <span className="font-medium text-green-600">{email}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Vui lòng kiểm tra hộp thư đến và spam folder
                </p>
                
                <div className="space-y-3">
                  <Button 
                    onClick={() => onEmailSent(email)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Tiếp tục xác thực
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsSuccess(false);
                      setEmail('');
                    }}
                    className="w-full"
                  >
                    Gửi email khác
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-2xl font-bold text-green-600 mb-2">
            <Mail className="h-[50px] w-[50px]" />
            Gửi Email Xác Thực
          </div>
          <p className="text-muted-foreground mt-2">
            Nhập email để nhận mã xác thực hoàn tất đăng ký
          </p>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold text-center">Nhập Email</CardTitle>
            <CardDescription className="text-center">
              Chúng tôi sẽ gửi mã xác thực đến email của bạn để hoàn tất đăng ký
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSendVerification} className="space-y-4">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Send Button */}
              <Button 
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Gửi Email Xác Thực
                  </>
                )}
              </Button>
            </form>

            {/* Back Button */}
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-muted-foreground hover:text-gray-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại đăng nhập
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
