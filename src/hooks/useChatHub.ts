/**
 * Chat Hooks - Custom hooks để sử dụng ChatHub trong React components
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import type {
  ChatMessage,
  ConnectionState,
  TypingIndicator,
  NormalizedMessage,
} from '@/types/chat';
import { CONNECTION_STATES } from '@/types/chat';
import { chatHubService, normalizeSenderType } from '@/services/chatHub';
import { useAuth } from '@/contexts/AuthContext';

// ==================== useChatHub ====================

interface UseChatHubOptions {
  autoConnect?: boolean;
}

interface UseChatHubReturn {
  connectionState: ConnectionState;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  joinConversation: (conversationId: number) => Promise<void>;
  leaveConversation: (conversationId: number) => Promise<void>;
  sendMessage: (conversationId: number, text: string, recipientUserId?: string) => Promise<void>;
  onMessage: (callback: (message: ChatMessage) => void) => () => void;
  onTypingIndicator: (callback: (indicator: TypingIndicator) => void) => () => void;
  sendTypingIndicator: (conversationId: number, recipientUserId: string) => Promise<void>;
  markAsRead: (conversationId: number) => Promise<void>;
}

/**
 * Hook chính để quản lý kết nối ChatHub
 * Tự động kết nối khi user đã xác thực và ngắt kết nối khi unmount
 */
export function useChatHub(options: UseChatHubOptions = {}): UseChatHubReturn {
  const { autoConnect = true } = options;
  const { isAuthenticated } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    chatHubService.getConnectionState()
  );
  const isConnectingRef = useRef(false);

  // Theo dõi thay đổi trạng thái kết nối
  useEffect(() => {
    const unsubscribe = chatHubService.onConnectionStateChange((state) => {
      setConnectionState(state);
    });

    return unsubscribe;
  }, []);

  // Tự động kết nối/ngắt kết nối dựa trên authentication
  useEffect(() => {
    if (!autoConnect) return;

    const connectToHub = async () => {
      if (!isAuthenticated) {
        await chatHubService.disconnect();
        return;
      }

      // Tránh kết nối nhiều lần
      if (isConnectingRef.current || chatHubService.isConnected()) {
        return;
      }

      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('[useChatHub] No auth token found');
        return;
      }

      isConnectingRef.current = true;

      try {
        await chatHubService.connect(token);
      } catch (error) {
        console.error('[useChatHub] Failed to connect:', error);
      } finally {
        isConnectingRef.current = false;
      }
    };

    connectToHub();

    return () => {
      // Không ngắt kết nối khi unmount để giữ connection cho các component khác
    };
  }, [isAuthenticated, autoConnect]);

  const connect = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No auth token found');
    }
    await chatHubService.connect(token);
  }, []);

  const disconnect = useCallback(async () => {
    await chatHubService.disconnect();
  }, []);

  const onMessage = useCallback((callback: (message: ChatMessage) => void) => {
    return chatHubService.onMessage(callback);
  }, []);

  const joinConversation = useCallback(async (conversationId: number) => {
    await chatHubService.joinConversation(conversationId);
  }, []);

  const leaveConversation = useCallback(async (conversationId: number) => {
    await chatHubService.leaveConversation(conversationId);
  }, []);

  const sendMessage = useCallback(
    async (conversationId: number, text: string, recipientUserId?: string) => {
      await chatHubService.sendMessage(conversationId, text, recipientUserId);
    },
    []
  );

  const onTypingIndicator = useCallback(
    (callback: (indicator: TypingIndicator) => void) => {
      return chatHubService.onTypingIndicator(callback);
    },
    []
  );

  const sendTypingIndicator = useCallback(
    async (conversationId: number, recipientUserId: string) => {
      await chatHubService.sendTypingIndicator(conversationId, recipientUserId);
    },
    []
  );

  const markAsRead = useCallback(async (conversationId: number) => {
    await chatHubService.markAsRead(conversationId);
  }, []);

  return {
    connectionState,
    isConnected: connectionState === CONNECTION_STATES.Connected,
    connect,
    disconnect,
    joinConversation,
    leaveConversation,
    sendMessage,
    onMessage,
    onTypingIndicator,
    sendTypingIndicator,
    markAsRead,
  };
}

// ==================== useChatMessages ====================

interface UseChatMessagesOptions {
  initialMessages?: NormalizedMessage[];
}

interface UseChatMessagesReturn {
  messages: NormalizedMessage[];
  isTyping: boolean;
  addMessage: (message: ChatMessage) => void;
  setMessages: React.Dispatch<React.SetStateAction<NormalizedMessage[]>>;
  clearMessages: () => void;
}

/**
 * Hook để quản lý tin nhắn cho một cuộc hội thoại cụ thể
 */
export function useChatMessages(
  conversationId: number,
  options: UseChatMessagesOptions = {}
): UseChatMessagesReturn {
  const { initialMessages = [] } = options;
  const [messages, setMessages] = useState<NormalizedMessage[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Lắng nghe tin nhắn mới
  useEffect(() => {
    const unsubscribe = chatHubService.onMessage((message) => {
      // Chỉ thêm tin nhắn thuộc cuộc hội thoại này
      if (message.conversationId !== conversationId) return;

      const senderType = normalizeSenderType(message.senderType);
      if (!senderType) return;

      const normalizedMessage: NormalizedMessage = {
        id: message.id,
        text: message.messageText,
        sender: senderType,
        timestamp: new Date(message.createdAt),
        isRead: message.isRead,
        images: message.images,
      };

      setMessages((prev) => {
        // Kiểm tra tin nhắn đã tồn tại chưa
        if (prev.some((m) => m.id === normalizedMessage.id)) {
          return prev;
        }
        return [...prev, normalizedMessage];
      });
    });

    return unsubscribe;
  }, [conversationId]);

  // Lắng nghe typing indicator
  useEffect(() => {
    const unsubscribe = chatHubService.onTypingIndicator((indicator) => {
      if (indicator.conversationId !== conversationId) return;

      setIsTyping(true);

      // Xóa typing indicator sau 3 giây
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    });

    return () => {
      unsubscribe();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId]);

  const addMessage = useCallback((message: ChatMessage) => {
    const senderType = normalizeSenderType(message.senderType);
    if (!senderType) return;

    const normalizedMessage: NormalizedMessage = {
      id: message.id,
      text: message.messageText,
      sender: senderType,
      timestamp: new Date(message.createdAt),
      isRead: message.isRead,
      images: message.images,
    };

    setMessages((prev) => {
      if (prev.some((m) => m.id === normalizedMessage.id)) {
        return prev;
      }
      return [...prev, normalizedMessage];
    });
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isTyping,
    addMessage,
    setMessages,
    clearMessages,
  };
}

// ==================== useUnreadCount ====================

interface UseUnreadCountReturn {
  totalUnread: number;
  incrementUnread: () => void;
  decrementUnread: (count?: number) => void;
  resetUnread: () => void;
  setTotalUnread: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * Hook để quản lý số lượng tin nhắn chưa đọc
 */
export function useUnreadCount(initialCount = 0): UseUnreadCountReturn {
  const [totalUnread, setTotalUnread] = useState(initialCount);

  // Lắng nghe tin nhắn mới để tăng unread count
  useEffect(() => {
    const unsubscribe = chatHubService.onMessage((message) => {
      // Chỉ tăng nếu tin nhắn chưa đọc
      if (!message.isRead) {
        setTotalUnread((prev) => prev + 1);
      }
    });

    return unsubscribe;
  }, []);

  const incrementUnread = useCallback(() => {
    setTotalUnread((prev) => prev + 1);
  }, []);

  const decrementUnread = useCallback((count = 1) => {
    setTotalUnread((prev) => Math.max(0, prev - count));
  }, []);

  const resetUnread = useCallback(() => {
    setTotalUnread(0);
  }, []);

  return {
    totalUnread,
    incrementUnread,
    decrementUnread,
    resetUnread,
    setTotalUnread,
  };
}

// ==================== useConnectionStatus ====================

interface UseConnectionStatusReturn {
  connectionState: ConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  isDisconnected: boolean;
}

/**
 * Hook đơn giản để theo dõi trạng thái kết nối
 */
export function useConnectionStatus(): UseConnectionStatusReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    chatHubService.getConnectionState()
  );

  useEffect(() => {
    const unsubscribe = chatHubService.onConnectionStateChange((state) => {
      setConnectionState(state);
    });

    return unsubscribe;
  }, []);

  return {
    connectionState,
    isConnected: connectionState === CONNECTION_STATES.Connected,
    isConnecting: connectionState === CONNECTION_STATES.Connecting,
    isReconnecting: connectionState === CONNECTION_STATES.Reconnecting,
    isDisconnected: connectionState === CONNECTION_STATES.Disconnected,
  };
}

export default useChatHub;
