import axios from 'axios';

const FALLBACK_ERROR_MESSAGE =
  'Xin lỗi, tôi chưa thể phản hồi ngay lúc này. Vui lòng thử lại sau ít phút.';

const DEFAULT_SESSION_ID = 'verdant-session';

const normalizeChatbotMessage = (value: string): string => {
  if (typeof value !== 'string') {
    return '';
  }

  // Check if it's a JSON string with products - don't normalize it
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && parsed.products && Array.isArray(parsed.products)) {
      // It's a JSON with products, return as-is (but normalize the message field inside)
      if (parsed.message && typeof parsed.message === 'string') {
        parsed.message = parsed.message
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/&nbsp;/gi, ' ')
          .replace(/\r\n/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        return JSON.stringify(parsed);
      }
      return value; // Return original JSON string
    }
  } catch (_e) {
    // Not JSON, continue with normalization
  }

  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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


