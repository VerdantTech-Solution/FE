/**
 * ChatContext - Context Provider cho Chat real-time
 * 
 * Cung cấp kết nối SignalR và các phương thức chat cho toàn bộ ứng dụng
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type {
  ChatMessage,
  ConnectionState,
  ChatMessageCallback,
  TypingIndicatorCallback,
} from "@/types/chat";
import { CONNECTION_STATES } from "@/types/chat";
import { chatHubService, normalizeSenderType } from "@/services/chatHub";
import { useAuth } from "./AuthContext";

interface ChatContextType {
  connectionState: ConnectionState;
  isConnected: boolean;
  joinConversation: (conversationId: number) => Promise<void>;
  leaveConversation: (conversationId: number) => Promise<void>;
  sendMessage: (conversationId: number, text: string, recipientUserId?: string) => Promise<void>;
  onMessage: (callback: ChatMessageCallback) => () => void;
  onTypingIndicator: (callback: TypingIndicatorCallback) => () => void;
  sendTypingIndicator: (
    conversationId: number,
    recipientUserId: string
  ) => Promise<void>;
  markAsRead: (conversationId: number) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const { isAuthenticated } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    CONNECTION_STATES.Disconnected
  );
  const isConnectingRef = useRef<boolean>(false);

  // Kết nối/ngắt kết nối dựa trên authentication
  useEffect(() => {
    // Ngắt kết nối nếu chưa xác thực
    if (!isAuthenticated) {
      console.log("[ChatContext] User not authenticated, disconnecting...");
      chatHubService.disconnect();
      return;
    }

    // Tránh kết nối nhiều lần
    if (isConnectingRef.current || chatHubService.isConnected()) {
      console.log("[ChatContext] Already connected or connecting, skipping...");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      console.warn("[ChatContext] No auth token found");
      return;
    }

    console.log("[ChatContext] Starting connection to ChatHub...");
    isConnectingRef.current = true;

    // Kết nối đến ChatHub
    chatHubService
      .connect(token)
      .then(() => {
        console.log("[ChatContext] ✅ Successfully connected to ChatHub");
      })
      .catch((error) => {
        console.error("[ChatContext] Failed to connect:", error);
      })
      .finally(() => {
        isConnectingRef.current = false;
      });

    // Cleanup khi unmount
    return () => {
      isConnectingRef.current = false;
    };
  }, [isAuthenticated]);

  // Theo dõi thay đổi trạng thái kết nối
  useEffect(() => {
    const unsubscribe = chatHubService.onConnectionStateChange((state) => {
      setConnectionState(state);
    });

    return unsubscribe;
  }, []);

  // Đăng ký lắng nghe tin nhắn
  const onMessage = useCallback((callback: ChatMessageCallback) => {
    return chatHubService.onMessage((message) => {
      // Chuẩn hóa senderType trước khi gửi cho callback
      const normalizedSenderType = normalizeSenderType(message.senderType);
      const normalizedMessage: ChatMessage = {
        ...message,
        senderType: normalizedSenderType === "customer" ? "Customer" : "Vendor",
      };
      callback(normalizedMessage);
    });
  }, []);

  // Đăng ký lắng nghe typing indicator
  const onTypingIndicator = useCallback((callback: TypingIndicatorCallback) => {
    return chatHubService.onTypingIndicator(callback);
  }, []);

  // Gửi typing indicator
  const sendTypingIndicator = useCallback(
    async (conversationId: number, recipientUserId: string) => {
      await chatHubService.sendTypingIndicator(conversationId, recipientUserId);
    },
    []
  );

  // Đánh dấu tin nhắn đã đọc
  const markAsRead = useCallback(async (conversationId: number) => {
    await chatHubService.markAsRead(conversationId);
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

  const value = useMemo<ChatContextType>(
    () => ({
      connectionState,
      isConnected: connectionState === CONNECTION_STATES.Connected,
      joinConversation,
      leaveConversation,
      sendMessage,
      onMessage,
      onTypingIndicator,
      sendTypingIndicator,
      markAsRead,
    }),
    [
      connectionState,
      joinConversation,
      leaveConversation,
      sendMessage,
      onMessage,
      onTypingIndicator,
      sendTypingIndicator,
      markAsRead,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
