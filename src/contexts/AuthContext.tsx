import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { logoutUser } from '@/api/auth';

interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string; 
  role: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => Promise<void>;
  loading: boolean;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra xem user đã đăng nhập chưa khi component mount
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('user');
        
        console.log('Checking auth - Token:', token ? 'exists' : 'missing');
        console.log('Checking auth - User data:', userData);
        
        if (token && userData && userData !== 'undefined') {
          const parsedUser = JSON.parse(userData);
          console.log('Parsed user:', parsedUser);
          
          // Validate user data structure
          if (parsedUser && 
              typeof parsedUser === 'object' && 
              parsedUser.id && 
              parsedUser.fullName && 
              parsedUser.email) {
            setUser(parsedUser);
          } else {
            console.error('Invalid user data structure:', parsedUser);
            // Xóa dữ liệu không hợp lệ
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
          }
        } else {
          console.log('No valid auth data found');
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        // Xóa dữ liệu không hợp lệ
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData: User, token: string) => {
    console.log('Login called with:', { userData, token });
    
    // Validate input data
    if (!userData || !token) {
      console.error('Invalid login data:', { userData, token });
      return;
    }
    
    if (!userData.id || !userData.fullName || !userData.email) {
      console.error('Invalid user data structure:', userData);
      return;
    }
    
    try {
      // Lưu vào localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('Data saved to localStorage');
      console.log('Token saved:', !!localStorage.getItem('authToken'));
      console.log('User saved:', !!localStorage.getItem('user'));
      
      // Cập nhật state
      setUser(userData);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const logout = async (): Promise<void> => {
    console.log('Logout called');
    
    try {
      // Gọi API logout TRƯỚC để request vẫn mang Authorization
      // (interceptor sẽ lấy token từ localStorage)
      await logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
      // Bỏ qua lỗi từ API, vẫn tiến hành xóa local
    } finally {
      // Đảm bảo xóa dữ liệu local và cập nhật state dù thành công hay lỗi
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
      console.log('Logout completed (local cleared)');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      console.log('AuthContext updateUser - updating user with:', userData);
      console.log('AuthContext updateUser - new user object:', updatedUser);
      
      // Cập nhật localStorage trước
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Cập nhật state
      setUser(updatedUser);
      
      console.log('AuthContext updateUser - localStorage updated, state updated');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Thêm default export
export default AuthProvider;
