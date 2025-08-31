import React from 'react';
import { useNavigate } from 'react-router';
import { ForgotPassword } from '@/components/ForgotPassword';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const handleEmailSent = (email: string) => {
    // Redirect to reset password page with email parameter
    navigate(`/reset-password?email=${encodeURIComponent(email)}`);
  };

  const handleBack = () => {
    navigate('/login');
  };

  return (
    <ForgotPassword
      onEmailSent={handleEmailSent}
      onBack={handleBack}
    />
  );
};
