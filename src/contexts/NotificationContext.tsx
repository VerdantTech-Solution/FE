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

    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('[NotificationContext] No auth token found');
      return;
    }

    const service = new NotificationService(token);
    serviceRef.current = service;

    const unsubscribeState = service.onConnectionStateChange((state) => {
      dispatch(setConnectionStateAction(state));
    });

    const unsubscribeNotification = service.onNotification((notification) => {
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

    service.start().catch((error) => {
      console.error('[NotificationContext] Failed to start SignalR', error);
      toast.error('Không thể kết nối đến server thông báo');
    });

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
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const loadExistingNotifications = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        let userId: number | null = null;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = parseInt(payload.nameid || payload.sub || payload.userId);
        } catch {
          console.warn('[NotificationContext] Unable to parse user id from token');
          return;
        }

        if (!userId) return;

        const response = await getNotificationsByUser(userId, {
          page: 1,
          pageSize: 50,
        });

        if (response.status && response.data && Array.isArray(response.data.data)) {
          dispatch(setNotificationList(response.data.data));
        } else {
          console.warn('[NotificationContext] Failed to load notifications', response.errors);
        }
      } catch (error) {
        console.error('[NotificationContext] Error loading notifications', error);
      }
    };

    loadExistingNotifications();
  }, [dispatch, isAuthenticated]);

  const markAsRead = useCallback(
    async (notificationId: number) => {
      const notification = notifications.find((n) => n.id === notificationId);
      if (!notification) {
        console.warn('[NotificationContext] Notification not found', notificationId);
        return;
      }

      if (notification.isRead) {
        return;
      }

      try {
        const response = await revertNotificationReadStatus(notificationId);
        if (response.status) {
          dispatch(markAsReadLocal(notificationId));
        } else {
          throw new Error(response.errors?.[0] || 'Failed to mark as read');
        }
      } catch (error) {
        console.error('[NotificationContext] markAsRead failed', error);
        toast.error('Không thể đánh dấu đã đọc');
      }
    },
    [dispatch, notifications]
  );

  const markAllAsRead = useCallback(async () => {
    if (!serviceRef.current) {
      return;
    }

    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    try {
      await Promise.all(unreadIds.map((id) => serviceRef.current!.markAsRead(id)));
      dispatch(markAllAsReadLocal());
    } catch (error) {
      console.error('[NotificationContext] markAllAsRead failed', error);
      toast.error('Không thể đánh dấu tất cả đã đọc');
    }
  }, [dispatch, notifications]);

  const handleDeleteNotification = useCallback(
    async (notificationId: number) => {
      try {
        const response = await deleteNotificationApi(notificationId);
        if (response.status) {
          dispatch(deleteNotificationLocal(notificationId));
          toast.success('Đã xóa thông báo');
        } else {
          throw new Error(response.errors?.[0] || 'Failed to delete notification');
        }
      } catch (error) {
        console.error('[NotificationContext] deleteNotification failed', error);
        toast.error('Không thể xóa thông báo');
      }
    },
    [dispatch]
  );

  const clearAllNotifications = useCallback(() => {
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

