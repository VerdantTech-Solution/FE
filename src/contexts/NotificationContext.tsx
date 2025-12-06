import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import NotificationService from '@/services/NotificationService';
import type { Notification, ConnectionState } from '@/types/notification.types';
import { CONNECTION_STATES } from '@/types/notification.types';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import {
  getNotificationsByUser,
  revertNotificationReadStatus,
  deleteNotification as deleteNotificationApi,
} from '@/api/notification';
import { useAppDispatch, useAppSelector } from '@/state/hooks';
import {
  addNotification,
  clearNotifications as clearNotificationsAction,
  deleteNotificationLocal,
  markAllAsReadLocal,
  markAsReadLocal,
  selectConnectionState,
  selectNotifications,
  selectUnreadCount,
  setConnectionState as setConnectionStateAction,
  setNotifications as setNotificationList,
} from '@/state/slices/notificationSlice';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  connectionState: ConnectionState;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
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

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const connectionState = useAppSelector(selectConnectionState);
  const { isAuthenticated } = useAuth();
  const serviceRef = useRef<NotificationService | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('[NotificationContext] 🚪 User not authenticated, cleaning up');
      if (serviceRef.current) {
        serviceRef.current.stop();
        serviceRef.current = null;
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      dispatch(clearNotificationsAction());
      dispatch(setConnectionStateAction(CONNECTION_STATES.Disconnected));
      return;
    }

    console.log('[NotificationContext] 👤 User authenticated, initializing SignalR...');

    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('[NotificationContext] No auth token found');
      return;
    }

    console.log('[NotificationContext] 🏗️ Creating NotificationService instance');
    const service = new NotificationService(token);
    serviceRef.current = service;

    console.log('[NotificationContext] 🎧 Subscribing to connection state changes');
    const unsubscribeState = service.onConnectionStateChange((state) => {
      console.log('[NotificationContext] 📊 Connection state received:', state);
      dispatch(setConnectionStateAction(state));
    });

    console.log('[NotificationContext] 🎧 Subscribing to notifications');
    const unsubscribeNotification = service.onNotification((notification) => {
      console.log('[NotificationContext] 🔔 Notification received, dispatching to Redux & showing toast', {
        id: notification.id,
        title: notification.title
      });
      dispatch(addNotification(notification));
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000,
      });
    });

    unsubscribeRef.current = () => {
      unsubscribeState();
      unsubscribeNotification();
    };

    console.log('[NotificationContext] 🚀 Starting SignalR service...');
    service.start().catch((error) => {
      console.error('[NotificationContext] ❌ Failed to start SignalR', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      toast.error('Không thể kết nối đến server thông báo');
    });

    return () => {
      console.log('[NotificationContext] 🧹 Cleaning up NotificationContext');
      if (unsubscribeRef.current) {
        console.log('[NotificationContext] 🗑️ Unsubscribing from listeners');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (serviceRef.current) {
        console.log('[NotificationContext] 🛑 Stopping SignalR service');
        serviceRef.current.stop();
        serviceRef.current = null;
      }
    };
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const loadExistingNotifications = async () => {
      console.log('[NotificationContext] 📥 Loading existing notifications from API...');
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.warn('[NotificationContext] ⚠️ No auth token found for loading notifications');
          return;
        }

        let userId: number | null = null;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = parseInt(payload.nameid || payload.sub || payload.userId);
        } catch {
          console.warn('[NotificationContext] Unable to parse user id from token');
          return;
        }

        if (!userId) {
          console.warn('[NotificationContext] ⚠️ Unable to extract userId');
          return;
        }

        console.log('[NotificationContext] 📡 Fetching notifications for user:', userId);
        const response = await getNotificationsByUser(userId, {
          page: 1,
          pageSize: 50,
        });

        if (response.status && response.data && Array.isArray(response.data.data)) {
          console.log('[NotificationContext] ✅ Loaded notifications:', {
            count: response.data.data.length,
            unread: response.data.data.filter((n: Notification) => !n.isRead).length
          });
          dispatch(setNotificationList(response.data.data));
        } else {
          console.warn('[NotificationContext] ⚠️ Failed to load notifications', response.errors);
        }
      } catch (error) {
        console.error('[NotificationContext] ❌ Error loading notifications', {
          error,
          errorMessage: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        });
      }
    };

    loadExistingNotifications();
  }, [dispatch, isAuthenticated]);

  const markAsRead = useCallback(
    async (notificationId: number) => {
      console.log('[NotificationContext] 📖 Marking notification as read:', notificationId);
      const notification = notifications.find((n) => n.id === notificationId);
      if (!notification) {
        console.warn('[NotificationContext] ⚠️ Notification not found', notificationId);
        return;
      }

      if (notification.isRead) {
        console.log('[NotificationContext] ℹ️ Notification already read', notificationId);
        return;
      }

      try {
        const response = await revertNotificationReadStatus(notificationId);
        if (response.status) {
          console.log('[NotificationContext] ✅ Notification marked as read:', notificationId);
          dispatch(markAsReadLocal(notificationId));
        } else {
          throw new Error(response.errors?.[0] || 'Failed to mark as read');
        }
      } catch (error) {
        console.error('[NotificationContext] ❌ markAsRead failed', {
          notificationId,
          error,
          timestamp: new Date().toISOString()
        });
        toast.error('Không thể đánh dấu đã đọc');
      }
    },
    [dispatch, notifications]
  );

  const markAllAsRead = useCallback(async () => {
    console.log('[NotificationContext] 📖📖 Marking all notifications as read');
    if (!serviceRef.current) {
      console.warn('[NotificationContext] ⚠️ No service instance available');
      return;
    }

    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    console.log('[NotificationContext] 📊 Unread notifications:', unreadIds.length);
    
    try {
      await Promise.all(unreadIds.map((id) => serviceRef.current!.markAsRead(id)));
      console.log('[NotificationContext] ✅ All notifications marked as read');
      dispatch(markAllAsReadLocal());
    } catch (error) {
      console.error('[NotificationContext] ❌ markAllAsRead failed', {
        error,
        unreadCount: unreadIds.length,
        timestamp: new Date().toISOString()
      });
      toast.error('Không thể đánh dấu tất cả đã đọc');
    }
  }, [dispatch, notifications]);

  const handleDeleteNotification = useCallback(
    async (notificationId: number) => {
      console.log('[NotificationContext] 🗑️ Deleting notification:', notificationId);
      try {
        const response = await deleteNotificationApi(notificationId);
        if (response.status) {
          console.log('[NotificationContext] ✅ Notification deleted:', notificationId);
          dispatch(deleteNotificationLocal(notificationId));
          toast.success('Đã xóa thông báo');
        } else {
          throw new Error(response.errors?.[0] || 'Failed to delete notification');
        }
      } catch (error) {
        console.error('[NotificationContext] ❌ deleteNotification failed', {
          notificationId,
          error,
          timestamp: new Date().toISOString()
        });
        toast.error('Không thể xóa thông báo');
      }
    },
    [dispatch]
  );

  const clearAllNotifications = useCallback(() => {
    console.log('[NotificationContext] 🧹 Clearing all notifications from state');
    dispatch(clearNotificationsAction());
  }, [dispatch]);

  const isConnected = connectionState === CONNECTION_STATES.Connected;

  const value = useMemo<NotificationContextType>(
    () => ({
      notifications,
      unreadCount,
      connectionState,
      markAsRead,
      markAllAsRead,
      deleteNotification: handleDeleteNotification,
      clearNotifications: clearAllNotifications,
      isConnected,
    }),
    [
      clearAllNotifications,
      connectionState,
      handleDeleteNotification,
      isConnected,
      markAllAsRead,
      markAsRead,
      notifications,
      unreadCount,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

