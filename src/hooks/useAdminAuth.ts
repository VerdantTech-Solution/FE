import { useAuth } from '@/contexts/AuthContext';

export const useAdminAuth = () => {
  const { user, isAuthenticated, loading } = useAuth();
  
  const isAdmin = user?.role === 'Admin';
  const canAccessAdmin = isAuthenticated && isAdmin;
  
  return {
    isAdmin,
    canAccessAdmin,
    user,
    isAuthenticated,
    loading
  };
};
