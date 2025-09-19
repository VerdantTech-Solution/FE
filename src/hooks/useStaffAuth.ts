import { useAuth } from '@/contexts/AuthContext';

export const useStaffAuth = () => {
  const { user, isAuthenticated, loading } = useAuth();
  
  const isStaff = user?.role === 'Staff';
  const canAccessStaff = isAuthenticated && isStaff;
  
  return {
    isStaff,
    canAccessStaff,
    user,
    isAuthenticated,
    loading
  };
};
