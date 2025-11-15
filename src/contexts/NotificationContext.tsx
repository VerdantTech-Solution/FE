import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import NotificationService from '@/services/NotificationService';
import type { Notification } from '@/types/notification.types';
import { ConnectionState } from '@/types/notification.types';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { getNotificationsByUser, revertNotificationReadStatus } from '@/api/notification';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  connectionState: ConnectionState;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => void;
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const { isAuthenticated } = useAuth();
  const serviceRef = useRef<NotificationService | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize SignalR connection when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // Cleanup if not authenticated
      if (serviceRef.current) {
        serviceRef.current.stop();
        serviceRef.current = null;
      }
      setNotifications([]);
      setConnectionState(ConnectionState.Disconnected);
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('[NotificationContext] No token found');
      return;
    }

    // Initialize service
    const service = new NotificationService(token);
    serviceRef.current = service;

    // Setup connection state listener
    const unsubscribeState = service.onConnectionStateChange((state) => {
      setConnectionState(state);
    });

    // Setup notification listener
    const unsubscribeNotification = service.onNotification((notification) => {
      console.log('[NotificationContext] New notification received:', notification);
      
      // Add to notifications list
      setNotifications((prev) => {
        // Prevent duplicates
        if (prev.some(n => n.id === notification.id)) {
          return prev;
        }
        return [notification, ...prev].slice(0, 100); // Keep max 100
      });

      // Show toast notification
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000,
      });
    });

    unsubscribeRef.current = () => {
      unsubscribeState();
      unsubscribeNotification();
    };

    // Start connection
    service.start().catch((err) => {
      console.error('[NotificationContext] Failed to start SignalR:', err);
      toast.error('Không thể kết nối đến server thông báo');
    });

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (serviceRef.current) {
        serviceRef.current.stop();
        serviceRef.current = null;
      }
    };
  }, [isAuthenticated]);

  // Load existing notifications from API
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadExistingNotifications = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        // Try to get userId from token
        let userId: number | null = null;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = parseInt(payload.nameid || payload.sub || payload.userId);
        } catch {
          console.warn('[NotificationContext] Could not parse userId from token');
          return;
        }

        if (!userId) return;

        // Load notifications với pagination (mặc định page 1, pageSize 50)
        const response = await getNotificationsByUser(userId, {
          page: 1,
          pageSize: 50, // Load 50 notifications đầu tiên
        });

        if (response.status && response.data && Array.isArray(response.data.data)) {
          console.log(`[NotificationContext] Loaded ${response.data.data.length} existing notifications`);
          setNotifications(response.data.data);
        } else {
          console.warn('[NotificationContext] Failed to load existing notifications:', response.errors);
        }
      } catch (err) {
        console.error('[NotificationContext] Error loading existing notifications:', err);
      }
    };

    loadExistingNotifications();
  }, [isAuthenticated]);

  // Mark notification as read (sử dụng API để tránh trùng lặp)
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      // Tìm notification hiện tại
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) {
        console.warn('[NotificationContext] Notification not found:', notificationId);
        return;
      }

      // Chỉ gọi API nếu notification chưa đọc
      // API revert-read-status sẽ đảo ngược trạng thái: chưa đọc -> đã đọc
      if (!notification.isRead) {
        const response = await revertNotificationReadStatus(notificationId);
        
        if (response.status) {
          // Update local state: đánh dấu đã đọc
          setNotifications((prev) =>
            prev.map((n) => 
              n.id === notificationId ? { ...n, isRead: true } : n
            )
          );
        } else {
          throw new Error(response.errors?.[0] || 'Failed to update read status');
        }
      }
      // Nếu đã đọc rồi thì không làm gì (tránh đảo ngược)
    } catch (err) {
      console.error('[NotificationContext] Error marking as read:', err);
      toast.error('Không thể đánh dấu đã đọc');
    }
  }, [notifications]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!serviceRef.current) {
      return;
    }

    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    
    try {
      await Promise.all(unreadIds.map(id => serviceRef.current!.markAsRead(id)));
      
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error('[NotificationContext] Error marking all as read:', err);
      toast.error('Không thể đánh dấu tất cả đã đọc');
    }
  }, [notifications]);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const isConnected = connectionState === ConnectionState.Connected;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    connectionState,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    isConnected,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

