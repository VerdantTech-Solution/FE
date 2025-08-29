import React from 'react';
import { useNavigate } from 'react-router';
import { SendVerificationEmail } from '@/components/SendVerificationEmail';

export const SendVerificationPage: React.FC = () => {
  const navigate = useNavigate();

  const handleEmailSent = (email: string) => {
    // Redirect to verification page with email parameter
    navigate(`/verify-email?email=${encodeURIComponent(email)}`);
  };

  const handleBack = () => {
    navigate('/login');
  };

  return (
    <SendVerificationEmail
      onEmailSent={handleEmailSent}
      onBack={handleBack}
    />
  );
};
