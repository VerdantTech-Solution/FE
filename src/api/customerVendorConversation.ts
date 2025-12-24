import { apiClient } from "./apiClient";
import type { PaginatedResponse } from "./product";

// Types
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
  userAddresses: unknown[];
}

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
  userAddresses: unknown[];
}

export interface Conversation {
  id: number;
  vendor?: VendorInfo;
  customer?: CustomerInfo;
  startedAt: string;
  lastMessageAt: string;
}

export interface MessageImage {
  id: number;
  imageUrl: string;
}

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
  images: unknown[];
}

export interface ConversationMessage {
  id: number;
  conversationId?: number; // Conversation ID returned by send-message API
  product: ProductInfo | null;
  senderType: "Customer" | "Vendor";
  messageText: string;
  isRead: boolean;
  createdAt: string;
  images: MessageImage[];
}

export interface ApiResponse<T> {
  status: boolean;
  statusCode: string;
  data: T;
  errors: string[];
}

// API Functions

/**
 * Get all conversations for the current user with pagination
 * Conversations are sorted by most recent message first
 */
export const getMyConversations = async (
  page: number = 1,
  pageSize: number = 20
): Promise<ApiResponse<PaginatedResponse<Conversation>>> => {
  return apiClient.get(
    "/api/CustomerVendorConversation/my-conversations",
    {
      params: { page, pageSize },
    }
  );
};

/**
 * Get all messages in a conversation with pagination
 * Messages are sorted by most recent first
 */
export const getConversationMessages = async (
  conversationId: number,
  page: number = 1,
  pageSize: number = 20
): Promise<ApiResponse<PaginatedResponse<ConversationMessage>>> => {
  return apiClient.get(
    `/api/CustomerVendorConversation/${conversationId}/messages`,
    {
      params: { page, pageSize },
    }
  );
};

/**
 * Send a message between customer and vendor
 * This will automatically create or find the conversation
 */
export const sendMessage = async (
  customerId: number,
  vendorId: number,
  messageText: string,
  productId?: number,
  images?: File[]
): Promise<ApiResponse<ConversationMessage>> => {
  const formData = new FormData();
  formData.append("CustomerId", customerId.toString());
  formData.append("VendorId", vendorId.toString());
  formData.append("MessageText", messageText);
  
  if (productId !== undefined) {
    formData.append("ProductId", productId.toString());
  }
  
  if (images && images.length > 0) {
    images.forEach((image) => {
      formData.append("Images", image);
    });
  }

  return apiClient.post(
    "/api/CustomerVendorConversation/send-message",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};
