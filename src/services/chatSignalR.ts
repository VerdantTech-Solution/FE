import * as signalR from "@microsoft/signalr";
import { API_BASE_URL } from "@/api/apiClient";

// Types
export interface ChatMessage {
  id: number;
  conversationId: number;
  senderType: "Customer" | "Vendor" | string | number; // Server may send as enum (number) or string
  messageText: string;
  isRead: boolean;
  createdAt: string;
  images: Array<{ id: number; imageUrl: string }>;
}

export interface ConversationUpdate {
  conversationId: number;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export type ChatMessageCallback = (message: ChatMessage) => void;
export type ConversationUpdateCallback = (update: ConversationUpdate) => void;
export type ConnectionStateCallback = (state: ConnectionState) => void;

export type ConnectionState = "Disconnected" | "Connecting" | "Connected" | "Reconnecting";

export const CONNECTION_STATES = {
  Disconnected: "Disconnected" as ConnectionState,
  Connecting: "Connecting" as ConnectionState,
  Connected: "Connected" as ConnectionState,
  Reconnecting: "Reconnecting" as ConnectionState,
};

/**
 * Normalize senderType from server (can be enum number or string)
 * Server enum: 0 or 1 = Customer, 1 or 2 = Vendor (depends on backend implementation)
 */
export const normalizeSenderType = (senderType: string | number | undefined): "customer" | "vendor" | null => {
  if (senderType === undefined || senderType === null) {
    return null;
  }
  
  // If it's a number (enum)
  if (typeof senderType === 'number') {
    // Try both possible enum values
    if (senderType === 0 || senderType === 1) {
      return 'customer'; // Assuming 0 or 1 is Customer
    }
    if (senderType === 2) {
      return 'vendor'; // Assuming 2 is Vendor
    }
    // Fallback: check if it matches customer first
    return senderType === 1 ? 'customer' : 'vendor';
  }
  
  // If it's a string
  const normalized = String(senderType).toLowerCase();
  if (normalized === 'customer') return 'customer';
  if (normalized === 'vendor') return 'vendor';
  
  return null;
};

const DEFAULT_SIGNALR_PATH = "/hubs/chat";

const normalizeHubUrl = (explicitHubUrl?: string): string => {
  const envHubUrl = import.meta.env.VITE_CHAT_SIGNALR_HUB_URL?.trim();
  const candidate = explicitHubUrl?.trim() || envHubUrl;

  if (candidate) {
    return candidate.replace(/\/+$/, "");
  }

  const base = API_BASE_URL.replace(/\/+$/, "");
  return `${base}${DEFAULT_SIGNALR_PATH}`;
};

/**
 * Service quản lý kết nối SignalR cho Chat real-time
 */
class ChatSignalRService {
  private connection: signalR.HubConnection | null = null;
  private token: string;
  private hubUrl: string;
  private messageListeners: ChatMessageCallback[] = [];
  private conversationUpdateListeners: ConversationUpdateCallback[] = [];
  private connectionStateCallbacks: ConnectionStateCallback[] = [];
  private currentState: ConnectionState = CONNECTION_STATES.Disconnected;
  private isStarting: boolean = false;
  private isStopping: boolean = false;
  private supportsJoinLeave: boolean = true; // Feature flag for join/leave conversation

  constructor(token: string, hubUrl?: string) {
    this.token = token;
    this.hubUrl = normalizeHubUrl(hubUrl);
  }

  /**
   * Khởi tạo và kết nối tới SignalR Chat Hub
   */
  async start(): Promise<void> {
    // Prevent multiple simultaneous start attempts
    if (this.isStarting) {
      console.log("[ChatSignalR] Connection is already starting...");
      return;
    }

    if (this.connection && this.currentState === CONNECTION_STATES.Connected) {
      console.log("[ChatSignalR] Already connected");
      return;
    }

    // If stopping, wait for it to complete
    if (this.isStopping) {
      console.log("[ChatSignalR] Waiting for stop to complete...");
      await new Promise(resolve => setTimeout(resolve, 100));
      if (this.isStopping) return;
    }

    this.isStarting = true;
    this.updateConnectionState(CONNECTION_STATES.Connecting);

    console.log("[ChatSignalR] 🔌 Connecting to hub:", this.hubUrl);

    // Tạo connection với cấu hình
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        accessTokenFactory: () => this.token,
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: false,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (context) => {
          // Exponential backoff: 0s, 2s, 10s, 30s
          console.log(`[ChatSignalR] 🔄 Retry attempt ${context.previousRetryCount + 1}`);
          if (context.previousRetryCount === 0) return 0;
          if (context.previousRetryCount === 1) return 2000;
          if (context.previousRetryCount === 2) return 10000;
          return 30000;
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Đăng ký event handlers
    this.setupEventHandlers();

    // Kết nối
    try {
      console.log("[ChatSignalR] ⏳ Starting connection...");
      await this.connection.start();
      this.updateConnectionState(CONNECTION_STATES.Connected);
      console.log("[ChatSignalR] ✅ Connected successfully to:", this.hubUrl);
      console.log("[ChatSignalR] 🔍 Connection ID:", this.connection.connectionId);
      console.log("[ChatSignalR] 📡 Connection state:", this.connection.state);
      
      // Verify event handlers are registered
      console.log("[ChatSignalR] 📋 Registered event handlers:");
      console.log("  - ReceiveMessage: YES");
      console.log("  - ConversationUpdated: YES");
      console.log("  - Message listeners count:", this.messageListeners.length);
      
      // Test message listener
      if (this.messageListeners.length > 0) {
        console.log("[ChatSignalR] ✅ Ready to receive messages");
      } else {
        console.warn("[ChatSignalR] ⚠️ No message listeners registered yet");
      }
    } catch (err) {
      // Only log error if not aborted
      if (!(err instanceof Error && err.name === "AbortError")) {
        console.error("[ChatSignalR] ❌ Connection failed:", err);
      }
      this.updateConnectionState(CONNECTION_STATES.Disconnected);
      this.connection = null;
    } finally {
      this.isStarting = false;
    }
  }

  /**
   * Ngắt kết nối
   */
  async stop(): Promise<void> {
    if (!this.connection) return;
    if (this.isStopping) return;

    this.isStopping = true;

    try {
      await this.connection.stop();
      this.updateConnectionState(CONNECTION_STATES.Disconnected);
      console.log("[ChatSignalR] Disconnected");
    } catch (err) {
      // Ignore abort errors during stop
      if (!(err instanceof Error && err.name === "AbortError")) {
        console.error("[ChatSignalR] Disconnect error:", err);
      }
    } finally {
      this.connection = null;
      this.messageListeners = [];
      this.conversationUpdateListeners = [];
      this.isStopping = false;
    }
  }

  /**
   * Đăng ký các event handlers
   */
  private setupEventHandlers(): void {
    if (!this.connection) return;

    // ✅ Lắng nghe tin nhắn mới từ server
    this.connection.on("ReceiveMessage", (message: ChatMessage) => {
      console.log("[ChatSignalR] 💬 Received message:", message);
      console.log("[ChatSignalR] 🔍 Message details:", {
        id: message.id,
        conversationId: message.conversationId,
        senderType: message.senderType,
        senderTypeType: typeof message.senderType,
        messageText: message.messageText,
        hasImages: !!message.images,
        imagesCount: message.images?.length || 0,
      });

      // Gọi tất cả listeners đã đăng ký
      this.messageListeners.forEach((listener) => {
        try {
          listener(message);
        } catch (err) {
          console.error("[ChatSignalR] Error in message listener:", err);
          console.error("[ChatSignalR] Problematic message:", message);
        }
      });
    });

    // ✅ Lắng nghe cập nhật conversation
    this.connection.on("ConversationUpdated", (update: ConversationUpdate) => {
      console.log("[ChatSignalR] 📝 Conversation updated:", update);

      this.conversationUpdateListeners.forEach((listener) => {
        try {
          listener(update);
        } catch (err) {
          console.error("[ChatSignalR] Error in conversation listener:", err);
        }
      });
    });

    // Lắng nghe khi tin nhắn đã được đánh dấu đã đọc
    this.connection.on("MessagesRead", (conversationId: number) => {
      console.log("[ChatSignalR] Messages marked as read:", conversationId);
    });

    // Lắng nghe error message từ server
    this.connection.on("Error", (errorMessage: string) => {
      console.error("[ChatSignalR] Server error:", errorMessage);
    });

    // Khi reconnecting
    this.connection.onreconnecting((error) => {
      this.updateConnectionState(CONNECTION_STATES.Reconnecting);
      console.warn("[ChatSignalR] 🔄 Reconnecting...", error?.message);
    });

    // Khi reconnected
    this.connection.onreconnected((connectionId) => {
      this.updateConnectionState(CONNECTION_STATES.Connected);
      console.log("[ChatSignalR] ✅ Reconnected:", connectionId);
    });

    // Khi close
    this.connection.onclose((error) => {
      this.updateConnectionState(CONNECTION_STATES.Disconnected);
      console.log("[ChatSignalR] Connection closed:", error?.message);
    });
  }

  /**
   * Cập nhật connection state và thông báo listeners
   */
  private updateConnectionState(state: ConnectionState): void {
    this.currentState = state;
    this.connectionStateCallbacks.forEach((cb) => {
      try {
        cb(state);
      } catch (err) {
        console.error("[ChatSignalR] Error in state callback:", err);
      }
    });
  }

  /**
   * Đăng ký listener nhận tin nhắn mới
   */
  onMessage(callback: ChatMessageCallback): () => void {
    this.messageListeners.push(callback);
    console.log("[ChatSignalR] 📝 Message listener registered. Total:", this.messageListeners.length);
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== callback);
      console.log("[ChatSignalR] 🗑️ Message listener removed. Remaining:", this.messageListeners.length);
    };
  }

  /**
   * Đăng ký listener nhận cập nhật conversation
   */
  onConversationUpdate(callback: ConversationUpdateCallback): () => void {
    this.conversationUpdateListeners.push(callback);
    return () => {
      this.conversationUpdateListeners = this.conversationUpdateListeners.filter(
        (l) => l !== callback
      );
    };
  }

  /**
   * Đăng ký callback theo dõi trạng thái kết nối
   */
  onConnectionStateChange(callback: ConnectionStateCallback): () => void {
    this.connectionStateCallbacks.push(callback);
    // Gọi ngay với state hiện tại
    callback(this.currentState);
    return () => {
      this.connectionStateCallbacks = this.connectionStateCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Lấy trạng thái kết nối hiện tại
   */
  getConnectionState(): ConnectionState {
    return this.currentState;
  }

  /**
   * Kiểm tra đã kết nối chưa
   */
  isConnected(): boolean {
    return this.currentState === CONNECTION_STATES.Connected;
  }

  /**
   * Test connection and listeners
   */
  testConnection(): void {
    console.log("[ChatSignalR] 🧪 ===== CONNECTION TEST =====");
    console.log("Connection exists:", !!this.connection);
    console.log("Connection state:", this.currentState);
    console.log("Is connected:", this.isConnected());
    console.log("Hub URL:", this.hubUrl);
    console.log("Message listeners:", this.messageListeners.length);
    console.log("Conversation listeners:", this.conversationUpdateListeners.length);
    
    if (this.connection) {
      console.log("SignalR Connection ID:", this.connection.connectionId);
      console.log("SignalR State:", this.connection.state);
    }
    
    console.log("[ChatSignalR] 🧪 ===== END TEST =====");
  }

  /**
   * Join vào một conversation để nhận tin nhắn real-time
   * Note: Nếu server không support method này, tin nhắn vẫn được nhận auto
   */
  async joinConversation(conversationId: number): Promise<void> {
    if (!this.connection || !this.isConnected()) {
      console.warn("[ChatSignalR] ⚠️ Not connected, cannot join conversation", conversationId);
      return;
    }

    // Skip if server doesn't support this feature
    if (!this.supportsJoinLeave) {
      console.log("[ChatSignalR] 🔕 JoinConversation not supported by server, messages will be received automatically");
      return;
    }

    try {
      console.log("[ChatSignalR] 🚺 Joining conversation:", conversationId);
      await this.connection.invoke("JoinConversation", conversationId);
      console.log("[ChatSignalR] ✅ Successfully joined conversation:", conversationId);
    } catch (err: unknown) {
      const error = err as Error;
      // If method doesn't exist, disable feature and log
      if (error.message?.includes("Method does not exist") || 
          error.message?.includes("does not exist")) {
        console.warn("[ChatSignalR] 🔕 JoinConversation method not available on server. Disabling feature.");
        console.log("[ChatSignalR] 📡 Messages will be received automatically without explicit join.");
        this.supportsJoinLeave = false;
      } else {
        console.error("[ChatSignalR] ❌ Error joining conversation:", conversationId, err);
      }
    }
  }

  /**
   * Leave khỏi một conversation
   * Note: Nếu server không support method này, không làm gì
   */
  async leaveConversation(conversationId: number): Promise<void> {
    if (!this.connection || !this.isConnected()) {
      return;
    }

    // Skip if server doesn't support this feature
    if (!this.supportsJoinLeave) {
      return;
    }

    try {
      console.log("[ChatSignalR] 👋 Leaving conversation:", conversationId);
      await this.connection.invoke("LeaveConversation", conversationId);
      console.log("[ChatSignalR] ✅ Successfully left conversation:", conversationId);
    } catch (err: unknown) {
      const error = err as Error;
      // If method doesn't exist, just disable feature silently
      if (error.message?.includes("Method does not exist") || 
          error.message?.includes("does not exist")) {
        this.supportsJoinLeave = false;
      } else {
        console.error("[ChatSignalR] ❌ Error leaving conversation:", conversationId, err);
      }
    }
  }

  /**
   * Gửi tin nhắn qua SignalR (optional - có thể dùng REST API thay thế)
   */
  async sendMessage(
    conversationId: number,
    messageText: string
  ): Promise<void> {
    if (!this.connection || !this.isConnected()) {
      throw new Error("Not connected to chat hub");
    }

    try {
      await this.connection.invoke("SendMessage", conversationId, messageText);
      console.log("[ChatSignalR] Message sent");
    } catch (err) {
      console.error("[ChatSignalR] Error sending message:", err);
      throw err;
    }
  }

  /**
   * Đánh dấu tin nhắn đã đọc
   */
  async markAsRead(conversationId: number): Promise<void> {
    if (!this.connection || !this.isConnected()) {
      return;
    }

    try {
      await this.connection.invoke("MarkAsRead", conversationId);
      console.log("[ChatSignalR] Marked as read:", conversationId);
    } catch (err) {
      console.error("[ChatSignalR] Error marking as read:", err);
    }
  }
}

// Singleton instance
let chatServiceInstance: ChatSignalRService | null = null;
let currentToken: string | null = null;

/**
 * Khởi tạo hoặc lấy instance của ChatSignalRService
 */
export const getChatSignalRService = (): ChatSignalRService | null => {
  return chatServiceInstance;
};

/**
 * Khởi tạo mới ChatSignalRService (reset instance cũ nếu token khác)
 */
export const initChatSignalRService = (token: string): ChatSignalRService => {
  // Reuse existing instance if token is the same
  if (chatServiceInstance && currentToken === token) {
    return chatServiceInstance;
  }

  // Only stop if token changed and we have an existing instance
  if (chatServiceInstance && currentToken !== token) {
    chatServiceInstance.stop();
  }

  currentToken = token;
  chatServiceInstance = new ChatSignalRService(token);
  return chatServiceInstance;
};

/**
 * Ngắt kết nối và xóa instance
 */
export const destroyChatSignalRService = async (): Promise<void> => {
  if (chatServiceInstance) {
    await chatServiceInstance.stop();
    chatServiceInstance = null;
  }
};

export default ChatSignalRService;
