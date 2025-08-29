import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { EmailVerification } from '@/components/EmailVerification';
import { Spinner } from '@/components/ui/shadcn-io/spinner';
import { toast } from 'sonner';

export const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  
  useEffect(() => {
    // Get email from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    setEmail(emailParam);
    
    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner 
            variant="circle-filled" 
            size={60} 
            className="text-green-600 mx-auto mb-4"
          />
          <p className="text-gray-600">Đang tải trang xác thực email...</p>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-8 shadow-lg">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Lỗi</h1>
            <p className="text-gray-600 mb-6">
              Không tìm thấy email để xác thực. Vui lòng kiểm tra lại link hoặc đăng ký lại.
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Đăng ký lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <EmailVerification
      email={email}
      onVerificationSuccess={() => {
        toast.success("Email đã được xác thực thành công! Chào mừng bạn đến với VerdantTech!");
        navigate('/');
      }}
      onBack={() => navigate('/signup')}
    />
  );
};
