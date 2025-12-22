import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router';
import { NotificationBell } from '@/components/NotificationBell';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  /**
   * Custom content shown on the right side of the header,
   * before the notification, avatar and logout button.
   */
  rightContent?: ReactNode;
  /**
   * Show notification bell icon on the right.
   * Defaults to true for a consistent admin experience.
   */
  showNotification?: boolean;
  /**
   * Override name displayed next to the avatar.
   * Falls back to current user full name or 'Quản trị viên'.
   */
  displayNameOverride?: string;
}

export const AdminHeader = ({
  title,
  subtitle,
  rightContent,
  showNotification = true,
  displayNameOverride,
}: AdminHeaderProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = displayNameOverride || user?.fullName || 'Quản trị viên';

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>
        <div className="flex items-center space-x-4">
          {rightContent}

          {showNotification && <NotificationBell />}

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full" />
            <span className="text-sm font-medium text-gray-700">
              {displayName}
            </span>
          </div>

          <Button
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            Đăng xuất
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;

