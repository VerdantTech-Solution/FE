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
export enum NotificationReferenceType {
  Order = "Order",
  Payment = "Payment",
  Request = "Request",
  ForumPost = "ForumPost",
  ChatbotConversation = "ChatbotConversation",
  Cashout = "Cashout",
  ProductRegistration = "ProductRegistration",
  EnvironmentalData = "EnvironmentalData"
}

/**
 * Callback khi nhận notification mới
 */
export type NotificationCallback = (notification: Notification) => void;

/**
 * Connection state
 */
export enum ConnectionState {
  Disconnected = "Disconnected",
  Connecting = "Connecting",
  Connected = "Connected",
  Reconnecting = "Reconnecting"
}

