import axios from 'axios';

const FALLBACK_ERROR_MESSAGE =
  'Xin lỗi, tôi chưa thể phản hồi ngay lúc này. Vui lòng thử lại sau ít phút.';

const DEFAULT_SESSION_ID = 'verdant-session';

// const normalizeChatbotMessage = (value: string): string => {
//   if (typeof value !== 'string') {
//     return '';
//   }

//   // Check if it's a JSON string with products - don't normalize it
//   try {
//     const parsed = JSON.parse(value);
//     if (parsed && typeof parsed === 'object' && parsed.products && Array.isArray(parsed.products)) {
//       // It's a JSON with products, return as-is (but normalize the message field inside)
//       if (parsed.message && typeof parsed.message === 'string') {
//         parsed.message = parsed.message
//           .replace(/<br\s*\/?>/gi, '\n')
//           .replace(/&nbsp;/gi, ' ')
//           .replace(/\r\n/g, '\n')
//           .replace(/\n{3,}/g, '\n\n')
//           .trim();
//         return JSON.stringify(parsed);
//       }
//       return value; // Return original JSON string
//     }
//   } catch (_e) {
//     // Not JSON, continue with normalization
//   }

//   return value
//     .replace(/<br\s*\/?>/gi, '\n')
//     .replace(/&nbsp;/gi, ' ')
//     .replace(/\r\n/g, '\n')
//     .replace(/\n{3,}/g, '\n\n')
//     .trim();
// };
export const normalizeChatbotMessage = (value: string): string => {
  if (typeof value !== 'string') return '';

  // Convert HTML breaks
  const text = value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\r\n/g, '\n')
    // Chuẩn hóa nhiều dòng trống -> tối đa 1
    .replace(/\n{3,}/g, '\n\n')
    // Loại bỏ khoảng trắng thừa quanh mỗi dòng
    .split('\n')
    .map(l => l.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
};



/**
 * Chuẩn hóa nội dung phản hồi trả về từ API chatbot.
 * Nếu response có products, trả về JSON string để parser có thể xử lý.
 */
const extractMessageFromResponse = (data: any): string => {
  if (!data) {
    return '';
  }

  if (typeof data === 'string') {
    return data;
  }

  if (typeof data === 'object') {
    // Nếu có products array, trả về JSON string để parser xử lý
    if (data.products && Array.isArray(data.products) && data.products.length > 0) {
      try {
        return JSON.stringify(data);
      } catch (_err) {
        // Fallback nếu stringify fails
      }
    }
    
    // Nếu data.data có products
    if (data.data && typeof data.data === 'object' && data.data.products && Array.isArray(data.data.products) && data.data.products.length > 0) {
      try {
        return JSON.stringify(data.data);
      } catch (_err) {
        // Fallback nếu stringify fails
      }
    }
    
    if (typeof data.reply === 'string') {
      // Nếu reply là object có products, stringify nó
      try {
        const replyParsed = JSON.parse(data.reply);
        if (replyParsed && typeof replyParsed === 'object' && replyParsed.products && Array.isArray(replyParsed.products)) {
          return data.reply; // Return as JSON string
        }
      } catch (_e) {
        // Not JSON, return as string
      }
      return data.reply;
    }
    if (typeof data.message === 'string') {
      // Nếu message là JSON string có products, giữ nguyên
      try {
        const messageParsed = JSON.parse(data.message);
        if (messageParsed && typeof messageParsed === 'object' && messageParsed.products && Array.isArray(messageParsed.products)) {
          return data.message; // Return as JSON string
        }
      } catch (_e) {
        // Not JSON, return as string
      }
      return data.message;
    }
    if (typeof data.data === 'string') {
      // Nếu data là JSON string có products, giữ nguyên
      try {
        const dataParsed = JSON.parse(data.data);
        if (dataParsed && typeof dataParsed === 'object' && dataParsed.products && Array.isArray(dataParsed.products)) {
          return data.data; // Return as JSON string
        }
      } catch (_e) {
        // Not JSON, return as string
      }
      return data.data;
    }
    if (typeof data.data === 'object') {
      // Check if data.data has products array
      if (data.data.products && Array.isArray(data.data.products) && data.data.products.length > 0) {
        try {
          return JSON.stringify(data.data);
        } catch (_err) {
          // Fallback if stringify fails
        }
      }
      
      if (typeof data.data.reply === 'string') {
        // Check if reply is JSON string with products
        try {
          const replyParsed = JSON.parse(data.data.reply);
          if (replyParsed && typeof replyParsed === 'object' && replyParsed.products && Array.isArray(replyParsed.products)) {
            return data.data.reply; // Return as JSON string
          }
        } catch (_e) {
          // Not JSON, return as string
        }
        return data.data.reply;
      }
      if (typeof data.data.message === 'string') {
        // Check if message is JSON string with products
        try {
          const messageParsed = JSON.parse(data.data.message);
          if (messageParsed && typeof messageParsed === 'object' && messageParsed.products && Array.isArray(messageParsed.products)) {
            return data.data.message; // Return as JSON string
          }
        } catch (_e) {
          // Not JSON, return as string
        }
        return data.data.message;
      }
    }
  }

  try {
    return JSON.stringify(data);
  } catch (_err) {
    return '';
  }
};

const isLikelyErrorMessage = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  const knownErrors = [
    'error in workflow',
    'workflow error',
    'workflow execution failed',
    'internal error',
  ];
  if (knownErrors.includes(normalized)) {
    return true;
  }
  return normalized.startsWith('error:') || normalized.startsWith('exception');
};

/**
 * Gửi tin nhắn đến AI chatbot và nhận phản hồi.
 * @param chatInput nội dung người dùng nhập
 * @param sessionId định danh cuộc trò chuyện (giữ ngữ cảnh)
 */
export const sendChatbotMessage = async (
  chatInput: string,
  sessionId?: string,
): Promise<string> => {
  const webhookUrl =
    import.meta.env.VITE_API_AI_CHATBOT ||
    import.meta.env.VITE_AI_WEBHOOK_CHATBOT_URL||
    import.meta.env.VITE_AI_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error('Chưa cấu hình URL cho chatbot AI.');
  }

  // Lấy token của người dùng đang đăng nhập từ localStorage
  const authToken =
    typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  if (!authToken) {
    throw new Error(
      'Người dùng chưa đăng nhập. Vui lòng đăng nhập để sử dụng chatbot AI.',
    );
  }

  const payload = {
    token: authToken,
    chatInput,
    session_id: sessionId || DEFAULT_SESSION_ID,
  };

  try {
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const rawMessage = extractMessageFromResponse(response.data);
    console.log('[Chatbot API] Raw message type:', typeof rawMessage);
    console.log('[Chatbot API] Raw message preview:', rawMessage?.substring(0, 200));
    
    const normalizedMessage = normalizeChatbotMessage(rawMessage);
    console.log('[Chatbot API] Normalized message preview:', normalizedMessage?.substring(0, 200));

    if (!normalizedMessage || isLikelyErrorMessage(normalizedMessage)) {
      throw new Error('Workflow error');
    }
    return normalizedMessage;
  } catch (error: any) {
    console.error('[Chatbot] Lỗi gọi API:', error);
    if (error?.response?.data) {
      const message = extractMessageFromResponse(error.response.data);
      if (message) {
        const normalizedMessage = normalizeChatbotMessage(message);
        if (normalizedMessage) {
          return isLikelyErrorMessage(normalizedMessage)
            ? FALLBACK_ERROR_MESSAGE
            : normalizedMessage;
        }
      }
    }
    throw new Error(
      error?.message || 'Không thể kết nối với chatbot. Vui lòng thử lại sau.',
    );
  }
};

// Import apiClient for backend API calls
import { apiClient } from './apiClient';

// Interfaces for conversation API
export interface ChatbotConversation {
  id: number;
  userId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatbotMessage {
  id: number;
  conversationId: number;
  content: string;
  sender: 'user' | 'ai';
  createdAt: string;
}

export interface ConversationApiResponse<T> {
  status: boolean;
  statusCode: string | number;
  data: T | string;
  errors: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const parseApiData = <T>(data: T | string): T => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }
  return data;
};

export const getChatbotConversations = async (
  page: number = 1,
  pageSize: number = 10,
): Promise<PaginatedResponse<ChatbotConversation>> => {
  try {
    const response = await apiClient.get<ConversationApiResponse<PaginatedResponse<ChatbotConversation>>>(
      '/api/ChatbotConversation',
      { params: { page, pageSize } },
    ) as unknown as ConversationApiResponse<PaginatedResponse<ChatbotConversation>>;
    if (!response.status) {
      throw new Error(response.errors?.[0] || 'Không thể lấy danh sách cuộc hội thoại');
    }
    const data = parseApiData(response.data);
    if (Array.isArray(data)) {
      return { items: data, totalCount: data.length, page: 1, pageSize: data.length, totalPages: 1 };
    }
    if (typeof data === 'object' && 'items' in data) {
      return data as PaginatedResponse<ChatbotConversation>;
    }
    if (typeof data === 'object' && 'data' in data) {
      const innerData = (data as any).data;
      if (Array.isArray(innerData)) {
        return { items: innerData, totalCount: innerData.length, page: 1, pageSize: innerData.length, totalPages: 1 };
      }
    }
    return { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
  } catch (error: any) {
    console.error('[Chatbot] Error fetching conversations:', error);
    throw new Error(error?.message || 'Không thể lấy danh sách cuộc hội thoại. Vui lòng thử lại sau.');
  }
};

export const getChatbotMessages = async (
  conversationId: number,
  page: number = 1,
  pageSize: number = 10,
): Promise<PaginatedResponse<ChatbotMessage>> => {
  try {
    const response = await apiClient.get<ConversationApiResponse<PaginatedResponse<ChatbotMessage>>>(
      `/api/ChatbotConversation/${conversationId}/messages`,
      { params: { page, pageSize } },
    ) as unknown as ConversationApiResponse<PaginatedResponse<ChatbotMessage>>;
    if (!response.status) {
      throw new Error(response.errors?.[0] || 'Không thể lấy danh sách tin nhắn');
    }
    const data = parseApiData(response.data);
    if (Array.isArray(data)) {
      return { items: data, totalCount: data.length, page: 1, pageSize: data.length, totalPages: 1 };
    }
    if (typeof data === 'object' && 'items' in data) {
      return data as PaginatedResponse<ChatbotMessage>;
    }
    if (typeof data === 'object' && 'data' in data) {
      const innerData = (data as any).data;
      if (Array.isArray(innerData)) {
        return { items: innerData, totalCount: innerData.length, page: 1, pageSize: innerData.length, totalPages: 1 };
      }
    }
    return { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
  } catch (error: any) {
    console.error('[Chatbot] Error fetching messages:', error);
    throw new Error(error?.message || 'Không thể lấy danh sách tin nhắn. Vui lòng thử lại sau.');
  }
};

export const createChatbotConversation = async (title: string): Promise<ChatbotConversation> => {
  try {
    const response = await apiClient.post<ConversationApiResponse<ChatbotConversation>>(
      '/api/ChatbotConversation',
      { title },
    ) as unknown as ConversationApiResponse<ChatbotConversation>;
    if (!response.status) {
      throw new Error(response.errors?.[0] || 'Không thể tạo cuộc hội thoại');
    }
    const data = parseApiData(response.data);
    return data as ChatbotConversation;
  } catch (error: any) {
    console.error('[Chatbot] Error creating conversation:', error);
    throw new Error(error?.message || 'Không thể tạo cuộc hội thoại. Vui lòng thử lại sau.');
  }
};

