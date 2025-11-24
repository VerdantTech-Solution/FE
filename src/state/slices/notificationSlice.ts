import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { CONNECTION_STATES, type ConnectionState, type Notification } from '@/types/notification.types';
import type { RootState } from '../store';

interface NotificationState {
  notifications: Notification[];
  connectionState: ConnectionState;
  initialized: boolean;
}

const initialState: NotificationState = {
  notifications: [],
  connectionState: CONNECTION_STATES.Disconnected,
  initialized: false,
};

const MAX_NOTIFICATIONS = 100;

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload.slice(0, MAX_NOTIFICATIONS);
      state.initialized = true;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      const exists = state.notifications.some((notification) => notification.id === action.payload.id);
      if (!exists) {
        state.notifications.unshift(action.payload);
        state.notifications = state.notifications.slice(0, MAX_NOTIFICATIONS);
      }
    },
    markAsReadLocal: (state, action: PayloadAction<number>) => {
      state.notifications = state.notifications.map((notification) =>
        notification.id === action.payload ? { ...notification, isRead: true } : notification
      );
    },
    markAllAsReadLocal: (state) => {
      state.notifications = state.notifications.map((notification) => ({
        ...notification,
        isRead: true,
      }));
    },
    deleteNotificationLocal: (state, action: PayloadAction<number>) => {
      state.notifications = state.notifications.filter((notification) => notification.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.initialized = false;
    },
    setConnectionState: (state, action: PayloadAction<ConnectionState>) => {
      state.connectionState = action.payload;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  markAsReadLocal,
  markAllAsReadLocal,
  deleteNotificationLocal,
  clearNotifications,
  setConnectionState,
} = notificationSlice.actions;

export const selectNotifications = (state: RootState) => state.notifications.notifications;
export const selectUnreadCount = (state: RootState) =>
  state.notifications.notifications.filter((notification) => !notification.isRead).length;
export const selectConnectionState = (state: RootState) => state.notifications.connectionState;

export default notificationSlice.reducer;

