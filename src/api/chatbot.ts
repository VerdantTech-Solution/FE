import axios from 'axios';

const FALLBACK_ERROR_MESSAGE =
  'Xin lỗi, tôi chưa thể phản hồi ngay lúc này. Vui lòng thử lại sau ít phút.';

const DEFAULT_SESSION_ID = 'verdant-session';

/**
 * Chuẩn hóa nội dung phản hồi trả về từ API chatbot.
 */
const extractMessageFromResponse = (data: any): string => {
  if (!data) {
    return '';
  }

  if (typeof data === 'string') {
    return data;
  }

  if (typeof data === 'object') {
    if (typeof data.reply === 'string') {
      return data.reply;
    }
    if (typeof data.message === 'string') {
      return data.message;
    }
    if (typeof data.data === 'string') {
      return data.data;
    }
    if (typeof data.data === 'object') {
      if (typeof data.data.reply === 'string') {
        return data.data.reply;
      }
      if (typeof data.data.message === 'string') {
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
    import.meta.env.VITE_AI_WEBHOOK_CHATBOT_URL;

  if (!webhookUrl) {
    throw new Error('Chưa cấu hình URL cho chatbot AI.');
  }

  const authToken =
    import.meta.env.VITE_AI_CHATBOT_TOKEN ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiI5Iiwicm9sZSI6IkN1c3RvbWVyIiwibmJmIjoxNzY0MDY4NDQwLCJleHAiOjE3NjQxNTQ4NDAsImlhdCI6MTc2NDA2ODQ0MCwiaXNzIjoiVmVyZGFudFRlY2giLCJhdWQiOiJWZXJkYW50VGVjaFVzZXJzIn0.Beygwxd9riFp_UBMnkU-gaLGyfBZsuVW4lAqj68UQuk';

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

    const message = extractMessageFromResponse(response.data);
    return message || FALLBACK_ERROR_MESSAGE;
  } catch (error: any) {
    console.error('[Chatbot] Lỗi gọi API:', error);
    if (error?.response?.data) {
      const message = extractMessageFromResponse(error.response.data);
      if (message) {
        return message;
      }
    }
    throw new Error(
      error?.message || 'Không thể kết nối với chatbot. Vui lòng thử lại sau.',
    );
  }
};


