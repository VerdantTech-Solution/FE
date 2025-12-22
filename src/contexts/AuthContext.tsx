import { useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { logoutUser } from "@/api/auth";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  clearCredentials,
  initializeAuth,
  selectAuthInitialized,
  selectAuthStatus,
  selectAuthUser,
  selectIsAuthenticated,
  setCredentials,
  updateUserProfile,
  type User,
} from "@/state/slices/authSlice";

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => Promise<void>;
  loading: boolean;
  updateUser: (userData: Partial<User>) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): UseAuthReturn => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectAuthUser);
  const status = useAppSelector(selectAuthStatus);
  const initialized = useAppSelector(selectAuthInitialized);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const login = useCallback(
    (userData: User, token: string) => {
      if (!userData || !token) {
        console.error("[AuthContext] Invalid login payload", {
          userData,
          token,
        });
        return;
      }

      if (!userData.id || !userData.fullName || !userData.email) {
        console.error("[AuthContext] Invalid user structure", userData);
        return;
      }

      try {
        localStorage.setItem("authToken", token);
        localStorage.setItem("userId", userData.id); // Lưu userId riêng để dễ truy xuất
        localStorage.setItem("user", JSON.stringify(userData));
        dispatch(setCredentials({ user: userData, token }));
      } catch (error) {
        console.error("[AuthContext] Failed to persist login", error);
      }
    },
    [dispatch]
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("[AuthContext] Logout API failed", error);
    } finally {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userId"); // Xóa userId khi logout
      localStorage.removeItem("user");
      dispatch(clearCredentials());
    }
  }, [dispatch]);

  const updateUser = useCallback(
    (userData: Partial<User>) => {
      if (!user) {
        return;
      }

      const updatedUser = { ...user, ...userData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      dispatch(updateUserProfile(userData));
    },
    [dispatch, user]
  );

  const loading = status === "loading" || !initialized;

  return {
    user,
    isAuthenticated,
    login,
    logout,
    loading,
    updateUser,
  };
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return <>{children}</>;
};

export default AuthProvider;
