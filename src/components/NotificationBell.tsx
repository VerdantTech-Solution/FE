import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import type { Notification } from '@/types/notification.types';
import { NotificationReferenceType, ConnectionState } from '@/types/notification.types';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { format } from 'date-fns';

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    connectionState,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate based on reference type
    if (notification.referenceType && notification.referenceId) {
      handleNavigation(notification);
    }

    setIsOpen(false);
  };

  const handleNavigation = (notification: Notification) => {
    const routes: Record<NotificationReferenceType, string> = {
      [NotificationReferenceType.Order]: `/order/history`,
      [NotificationReferenceType.Payment]: `/order/history`,
      [NotificationReferenceType.Request]: `/ticket`,
      [NotificationReferenceType.ProductRegistration]: `/profile`,
      [NotificationReferenceType.Cashout]: `/profile`,
      [NotificationReferenceType.ForumPost]: `/articles`,
      [NotificationReferenceType.ChatbotConversation]: `/chat`,
      [NotificationReferenceType.EnvironmentalData]: `/farmlist`,
    };

    const route = routes[notification.referenceType];
    if (route) {
      navigate(route);
    }
  };

  const getConnectionIndicatorColor = () => {
    switch (connectionState) {
      case ConnectionState.Connected:
        return 'bg-green-500';
      case ConnectionState.Connecting:
      case ConnectionState.Reconnecting:
        return 'bg-yellow-500';
      case ConnectionState.Disconnected:
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getConnectionIndicatorTitle = () => {
    switch (connectionState) {
      case ConnectionState.Connected:
        return 'Đã kết nối';
      case ConnectionState.Connecting:
        return 'Đang kết nối...';
      case ConnectionState.Reconnecting:
        return 'Đang kết nối lại...';
      case ConnectionState.Disconnected:
        return 'Mất kết nối';
      default:
        return 'Không xác định';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        className="relative text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Thông báo"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        <span
          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${getConnectionIndicatorColor()}`}
          title={getConnectionIndicatorTitle()}
        />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Thông báo</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-600 hover:text-gray-900"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Đánh dấu tất cả đã đọc
                </Button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  Không có thông báo mới
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                        !notification.isRead ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm')}
                            </span>
                            {notification.referenceType && (
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                {notification.referenceType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

