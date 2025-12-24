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
import * as signalR from "@microsoft/signalr";
import type {
  ChatMessage,
  ConnectionState,
  ChatMessageCallback,
} from "@/services/chatSignalR";
import { CONNECTION_STATES, normalizeSenderType } from "@/services/chatSignalR";
import { useAuth } from "./AuthContext";
import { API_BASE_URL } from "@/api/apiClient";

const DEFAULT_SIGNALR_PATH = "/hubs/chat";

// Typing indicator interface
export interface TypingIndicator {
  conversationId: number;
  senderId: number;
  senderName: string;
}

export type TypingIndicatorCallback = (indicator: TypingIndicator) => void;

interface ChatContextType {
  connectionState: ConnectionState;
  isConnected: boolean;
  onMessage: (callback: ChatMessageCallback) => () => void;
  onTypingIndicator: (callback: TypingIndicatorCallback) => () => void;
  sendTypingIndicator: (
    conversationId: number,
    recipientUserId: string
  ) => Promise<void>;
  joinConversation: (conversationId: number) => Promise<void>;
  leaveConversation: (conversationId: number) => Promise<void>;
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
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const messageListenersRef = useRef<ChatMessageCallback[]>([]);
  const typingListenersRef = useRef<TypingIndicatorCallback[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    CONNECTION_STATES.Disconnected
  );
  const supportsJoinLeaveRef = useRef<boolean>(true);
  const isConnectingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated) {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
      setConnectionState(CONNECTION_STATES.Disconnected);
      return;
    }

    // Prevent multiple connection attempts
    if (isConnectingRef.current) {
      return;
    }

    // Already connected
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      return;
    }

    // Build hub URL
    const envHubUrl = import.meta.env.VITE_CHAT_SIGNALR_HUB_URL?.trim();
    const hubUrl =
      envHubUrl || `${API_BASE_URL.replace(/\/+$/, "")}${DEFAULT_SIGNALR_PATH}`;

    isConnectingRef.current = true;

    // Create connection - support both WebSockets and ServerSentEvents
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
        skipNegotiation: false,
        transport:
          signalR.HttpTransportType.WebSockets |
          signalR.HttpTransportType.ServerSentEvents,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (context) => {
          if (context.previousRetryCount === 0) return 0;
          if (context.previousRetryCount === 1) return 2000;
          if (context.previousRetryCount === 2) return 10000;
          return 30000;
        },
      })
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    // Event: Nhận tin nhắn mới
    connection.on("ReceiveMessage", (message: ChatMessage) => {
      const normalizedSenderType = normalizeSenderType(message.senderType);
      const normalizedMessage: ChatMessage = {
        ...message,
        senderType: normalizedSenderType || message.senderType,
      };

      messageListenersRef.current.forEach((listener) => {
        try {
          listener(normalizedMessage);
        } catch (err) {
          console.error("[ChatContext] Error in message listener:", err);
        }
      });
    });

    // Event: Nhận typing indicator
    connection.on("ReceiveTypingIndicator", (indicator: TypingIndicator) => {
      typingListenersRef.current.forEach((handler) => {
        try {
          handler(indicator);
        } catch (err) {
          console.error("[ChatContext] Error in typing handler:", err);
        }
      });
    });

    connection.on("Error", (errorMessage: string) => {
      console.error("[ChatContext] Server error:", errorMessage);
    });

    connection.onreconnecting(() => {
      setConnectionState(CONNECTION_STATES.Reconnecting);
    });

    connection.onreconnected(() => {
      setConnectionState(CONNECTION_STATES.Connected);
    });

    connection.onclose(() => {
      setConnectionState(CONNECTION_STATES.Disconnected);
      isConnectingRef.current = false;
    });

    // Start connection
    setConnectionState(CONNECTION_STATES.Connecting);
    connection
      .start()
      .then(async () => {
        isConnectingRef.current = false;
        setConnectionState(CONNECTION_STATES.Connected);

        // Test connection with Ping (optional)
        try {
          await connection.invoke<string>("Ping");
        } catch {
          // Ping not supported by server
        }
      })
      .catch(() => {
        isConnectingRef.current = false;
        setConnectionState(CONNECTION_STATES.Disconnected);
      });

    return () => {
      isConnectingRef.current = false;
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [isAuthenticated]);

  const onMessage = useCallback((callback: ChatMessageCallback) => {
    messageListenersRef.current.push(callback);

    return () => {
      messageListenersRef.current = messageListenersRef.current.filter(
        (l) => l !== callback
      );
    };
  }, []);

  const onTypingIndicator = useCallback((callback: TypingIndicatorCallback) => {
    typingListenersRef.current.push(callback);

    return () => {
      typingListenersRef.current = typingListenersRef.current.filter(
        (h) => h !== callback
      );
    };
  }, []);

  const sendTypingIndicator = useCallback(
    async (conversationId: number, recipientUserId: string) => {
      const connection = connectionRef.current;
      if (
        !connection ||
        connection.state !== signalR.HubConnectionState.Connected
      ) {
        return;
      }

      try {
        await connection.invoke(
          "SendTypingIndicator",
          conversationId,
          recipientUserId
        );
      } catch {
        // Error sending typing indicator
      }
    },
    []
  );

  const joinConversation = useCallback(async (conversationId: number) => {
    const connection = connectionRef.current;
    if (
      !connection ||
      connection.state !== signalR.HubConnectionState.Connected
    ) {
      return;
    }

    if (!supportsJoinLeaveRef.current) {
      return;
    }

    try {
      await connection.invoke("JoinConversation", conversationId);
    } catch (err) {
      const error = err as Error;
      if (
        error.message?.includes("Method does not exist") ||
        error.message?.includes("does not exist")
      ) {
        supportsJoinLeaveRef.current = false;
      }
    }
  }, []);

  const leaveConversation = useCallback(async (conversationId: number) => {
    const connection = connectionRef.current;
    if (
      !connection ||
      connection.state !== signalR.HubConnectionState.Connected
    ) {
      return;
    }

    if (!supportsJoinLeaveRef.current) {
      return;
    }

    try {
      await connection.invoke("LeaveConversation", conversationId);
    } catch (err) {
      const error = err as Error;
      if (
        error.message?.includes("Method does not exist") ||
        error.message?.includes("does not exist")
      ) {
        supportsJoinLeaveRef.current = false;
      }
    }
  }, []);

  const markAsRead = useCallback(async (conversationId: number) => {
    const connection = connectionRef.current;
    if (
      !connection ||
      connection.state !== signalR.HubConnectionState.Connected
    ) {
      return;
    }

    try {
      await connection.invoke("MarkAsRead", conversationId);
    } catch {
      // Error marking as read
    }
  }, []);

  const value = useMemo<ChatContextType>(
    () => ({
      connectionState,
      isConnected: connectionState === CONNECTION_STATES.Connected,
      onMessage,
      onTypingIndicator,
      sendTypingIndicator,
      joinConversation,
      leaveConversation,
      markAsRead,
    }),
    [
      connectionState,
      onMessage,
      onTypingIndicator,
      sendTypingIndicator,
      joinConversation,
      leaveConversation,
      markAsRead,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
