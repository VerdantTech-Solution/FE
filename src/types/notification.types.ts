/**
 * Interface cho Notification từ backend
 */
export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  referenceType: NotificationReferenceType | null;
  referenceId: number | null;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Enum các loại reference (phải khớp với backend)
 */
export const NOTIFICATION_REFERENCE_TYPES = {
  Order: "Order",
  Payment: "Payment",
  Request: "Request",
  ForumPost: "ForumPost",
  ChatbotConversation: "ChatbotConversation",
  Cashout: "Cashout",
  ProductRegistration: "ProductRegistration",
  EnvironmentalData: "EnvironmentalData"
} as const;

export type NotificationReferenceType =
  typeof NOTIFICATION_REFERENCE_TYPES[keyof typeof NOTIFICATION_REFERENCE_TYPES];

/**
 * Callback khi nhận notification mới
 */
export type NotificationCallback = (notification: Notification) => void;

/**
 * Connection state
 */
export const CONNECTION_STATES = {
  Disconnected: "Disconnected",
  Connecting: "Connecting",
  Connected: "Connected",
  Reconnecting: "Reconnecting"
} as const;

export type ConnectionState = typeof CONNECTION_STATES[keyof typeof CONNECTION_STATES];

