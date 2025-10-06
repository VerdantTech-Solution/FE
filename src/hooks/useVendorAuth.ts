import { useAuth } from '@/contexts/AuthContext';

export const useVendorAuth = () => {
  const { user, isAuthenticated, loading } = useAuth();

  const isVendor = user?.role === 'Vendor';
  const canAccessVendor = isAuthenticated && isVendor;

  return {
    isVendor,
    canAccessVendor,
    user,
    isAuthenticated,
    loading
  };
};


