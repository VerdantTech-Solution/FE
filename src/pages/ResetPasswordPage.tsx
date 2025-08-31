import React from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ResetPassword } from '@/components/ResetPassword';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get email from URL parameters
  const email = searchParams.get('email') || '';

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleBackToForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <ResetPassword
      email={email}
      onBackToLogin={handleBackToLogin}
      onBackToForgotPassword={handleBackToForgotPassword}
    />
  );
};
