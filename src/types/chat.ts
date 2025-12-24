/**
 * Chat Types - Định nghĩa các kiểu dữ liệu cho hệ thống Chat
 */

// ==================== Message Types ====================

/**
 * Kiểu người gửi tin nhắn
 */
export type SenderType = 'Customer' | 'Vendor';

/**
 * Hình ảnh đính kèm trong tin nhắn
 */
export interface ChatMessageImage {
  id: number;
  imageUrl: string;
  sortOrder?: number;
}

/**
 * Tin nhắn chat từ SignalR hoặc API
 */
export interface ChatMessage {
  id: number;
  conversationId: number;
  // Backend có thể trả enum number/string nên để union cho an toàn
  senderType: SenderType | number | string;
  messageText: string;
  isRead: boolean;
  createdAt: string;
  images: ChatMessageImage[];
  product?: ProductInfo | null;
}

/**
 * Tin nhắn được chuẩn hóa để sử dụng trong UI
 */
export interface NormalizedMessage {
  id: number;
  text: string;
  sender: 'customer' | 'vendor';
  timestamp: Date;
  isRead: boolean;
  images?: ChatMessageImage[];
  product?: ProductInfo | null;
}

// ==================== Conversation Types ====================

/**
 * Thông tin người dùng trong cuộc hội thoại
 */
export interface ChatUserInfo {
  id: number;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

/**
 * Thông tin vendor chi tiết
 */
export interface VendorInfo {
  id: number;
  email: string;
  role: string;
  fullName: string;
  phoneNumber: string;
  isVerified: boolean;
  avatarUrl: string | null;
  status: string;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * Thông tin customer chi tiết
 */
export interface CustomerInfo {
  id: number;
  email: string;
  role: string;
  fullName: string;
  phoneNumber: string;
  isVerified: boolean;
  avatarUrl: string | null;
  status: string;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * Cuộc hội thoại từ API
 */
export interface Conversation {
  id: number;
  vendor?: VendorInfo;
  customer?: CustomerInfo;
  startedAt: string;
  lastMessageAt: string;
}

/**
 * Cuộc hội thoại cho Customer UI
 */
export interface CustomerConversation {
  id: number;
  vendorId: number;
  vendorName: string;
  vendorShopName: string;
  vendorAvatar: string | null;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
}

/**
 * Cuộc hội thoại cho Vendor UI
 */
export interface VendorConversation {
  id: number;
  customerId: number;
  customerName: string;
  customerAvatar: string | null;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
}

// ==================== Product Types ====================

/**
 * Thông tin sản phẩm được đính kèm trong tin nhắn
 */
export interface ProductInfo {
  id: number;
  categoryId: number;
  vendorId: number;
  productCode: string;
  productName: string;
  slug: string;
  description: string;
  unitPrice: number;
  commissionRate: number;
  discountPercentage: number;
  energyEfficiencyRating: number;
  specifications: Record<string, unknown>;
  manualUrls: string | null;
  publicUrl: string | null;
  warrantyMonths: number;
  stockQuantity: number;
  weightKg: number;
  dimensionsCm: {
    width: number;
    height: number;
    length: number;
  };
  isActive: boolean;
  viewCount: number;
  soldCount: number;
  ratingAverage: number;
  registrationId: number | null;
  createdAt: string;
  updatedAt: string;
  images: Array<{ id?: number; imageUrl?: string }>;
}

// ==================== SignalR Types ====================

/**
 * Trạng thái kết nối SignalR
 */
export type ConnectionState = 
  | 'Disconnected' 
  | 'Connecting' 
  | 'Connected' 
  | 'Reconnecting';

/**
 * Hằng số trạng thái kết nối
 */
export const CONNECTION_STATES: Record<string, ConnectionState> = {
  Disconnected: 'Disconnected',
  Connecting: 'Connecting',
  Connected: 'Connected',
  Reconnecting: 'Reconnecting',
} as const;

/**
 * Cập nhật cuộc hội thoại từ SignalR
 */
export interface ConversationUpdate {
  conversationId: number;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

/**
 * Chỉ thị đang gõ tin nhắn
 */
export interface TypingIndicator {
  conversationId: number;
  senderId: number;
  senderName: string;
  senderType: SenderType;
}

// ==================== Callback Types ====================

export type ChatMessageCallback = (message: ChatMessage) => void;
export type ConversationUpdateCallback = (update: ConversationUpdate) => void;
export type ConnectionStateCallback = (state: ConnectionState) => void;
export type TypingIndicatorCallback = (indicator: TypingIndicator) => void;

// ==================== API Response Types ====================

export interface ApiResponse<T> {
  status: boolean;
  statusCode: string;
  data: T;
  errors: string[];
}

export interface PaginatedData<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==================== Utility Types ====================

export interface ApiError {
  response?: {
    data?: {
      errors?: string[];
    };
  };
}

/**
 * Cấu hình ChatHub
 */
export interface ChatHubConfig {
  hubUrl?: string;
  reconnectDelays?: number[];
  logLevel?: 'None' | 'Error' | 'Warning' | 'Information' | 'Debug' | 'Trace';
}
