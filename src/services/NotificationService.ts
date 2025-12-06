import * as signalR from "@microsoft/signalr";
import type { 
  Notification, 
  NotificationCallback,
  ConnectionState
} from "@/types/notification.types";
import { 
  CONNECTION_STATES 
} from "@/types/notification.types";
import { API_BASE_URL } from "@/api/apiClient";

const DEFAULT_SIGNALR_PATH = "/hubs/notification";

const normalizeHubUrl = (explicitHubUrl?: string): string => {
  const envHubUrl = import.meta.env.VITE_SIGNALR_HUB_URL?.trim();
  const candidate = explicitHubUrl?.trim() || envHubUrl;

  if (candidate) {
    return candidate.replace(/\/+$/, "");
  }

  const base = API_BASE_URL.replace(/\/+$/, "");
  return `${base}${DEFAULT_SIGNALR_PATH}`;
};

/**
 * Service quản lý kết nối SignalR và nhận thông báo real-time
 */
class NotificationService {
  private connection: signalR.HubConnection | null = null;
  private token: string;
  private hubUrl: string;
  private listeners: NotificationCallback[] = [];
  private connectionStateCallbacks: ((state: ConnectionState) => void)[] = [];
  private currentState: ConnectionState = CONNECTION_STATES.Disconnected;

  constructor(token: string, hubUrl?: string) {
    this.token = token;
    this.hubUrl = normalizeHubUrl(hubUrl);
    console.log('[SignalR Service] 🚀 Initialized', {
      hubUrl: this.hubUrl,
      tokenLength: token.length,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Khởi tạo và kết nối tới SignalR Hub
   */
  async start(): Promise<void> {
    if (this.connection) {
      console.log("[SignalR] Already connected", {
        state: this.connection.state,
        connectionId: this.connection.connectionId
      });
      return;
    }

    console.log('[SignalR] 🔌 Starting connection...', {
      hubUrl: this.hubUrl,
      timestamp: new Date().toISOString()
    });
    this.updateConnectionState(CONNECTION_STATES.Connecting);

    // Tạo connection với cấu hình
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        // ✅ accessTokenFactory gửi JWT token qua Query String
        // SignalR client tự động append: ?access_token=eyJhbGc...
        // WebSocket KHÔNG thể gửi Authorization header khi handshake!
        accessTokenFactory: () => this.token,
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: false
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (context) => {
          // Exponential backoff: 0s, 2s, 10s, 30s
          if (context.previousRetryCount === 0) return 0;
          if (context.previousRetryCount === 1) return 2000;
          if (context.previousRetryCount === 2) return 10000;
          return 30000;
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Đăng ký event handlers
    this.setupEventHandlers();

    // Kết nối
    try {
      console.log('[SignalR] 📡 Attempting connection...');
      await this.connection.start();
      this.updateConnectionState(CONNECTION_STATES.Connected);
      console.log("[SignalR] ✅ Connected successfully", {
        connectionId: this.connection.connectionId,
        state: this.connection.state,
        baseUrl: this.connection.baseUrl,
        timestamp: new Date().toISOString()
      });
      
      // Note: Ping method removed - server doesn't implement it
      // If needed, can be called manually via ping() method
    } catch (err) {
      this.updateConnectionState(CONNECTION_STATES.Disconnected);
      console.error("[SignalR] ❌ Connection failed:", {
        error: err,
        errorMessage: err instanceof Error ? err.message : String(err),
        hubUrl: this.hubUrl,
        timestamp: new Date().toISOString()
      });
      throw err;
    }
  }

  /**
   * Ngắt kết nối
   */
  async stop(): Promise<void> {
    if (!this.connection) {
      console.log('[SignalR] 🔌 Stop called but no active connection');
      return;
    }

    console.log('[SignalR] 🛑 Stopping connection...', {
      connectionId: this.connection.connectionId,
      listenerCount: this.listeners.length
    });

    try {
      await this.connection.stop();
      this.updateConnectionState(CONNECTION_STATES.Disconnected);
      console.log("[SignalR] ✅ Disconnected successfully", {
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("[SignalR] Disconnect error:", err);
    } finally {
      this.connection = null;
      this.listeners = [];
    }
  }

  /**
   * Đăng ký các event handlers
   */
  private setupEventHandlers(): void {
    if (!this.connection) {
      console.warn('[SignalR] ⚠️ Cannot setup event handlers - no connection');
      return;
    }

    console.log('[SignalR] 🎧 Setting up event handlers...');

    // ✅ Lắng nghe thông báo mới từ server
    this.connection.on("ReceiveNotification", (notification: Notification) => {
      console.log("[SignalR] 🔔 Received notification:", {
        notification,
        listenerCount: this.listeners.length,
        timestamp: new Date().toISOString()
      });
      
      // Gọi tất cả listeners đã đăng ký
      this.listeners.forEach((listener, index) => {
        try {
          console.log(`[SignalR] 📤 Dispatching to listener #${index + 1}`);
          listener(notification);
        } catch (err) {
          console.error(`[SignalR] ❌ Error in listener #${index + 1}:`, {
            error: err,
            notification
          });
        }
      });
    });

    // Lắng nghe khi notification đã được đánh dấu đã đọc
    this.connection.on("NotificationMarkedAsRead", (notificationId: number) => {
      console.log("[SignalR] Notification marked as read:", notificationId);
    });

    // Lắng nghe error message từ server
    this.connection.on("Error", (errorMessage: string) => {
      console.error("[SignalR] Server error:", errorMessage);
    });

    // Khi reconnecting
    this.connection.onreconnecting((error) => {
      this.updateConnectionState(CONNECTION_STATES.Reconnecting);
      console.warn("[SignalR] 🔄 Reconnecting...", {
        error: error?.message,
        stack: error?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Khi reconnected
    this.connection.onreconnected((connectionId) => {
      this.updateConnectionState(CONNECTION_STATES.Connected);
      console.log("[SignalR] ✅ Reconnected:", {
        connectionId,
        timestamp: new Date().toISOString()
      });
    });

    // Khi connection bị đóng
    this.connection.onclose((error) => {
      this.updateConnectionState(CONNECTION_STATES.Disconnected);
      console.error("[SignalR] ❌ Connection closed:", {
        error: error?.message,
        stack: error?.stack,
        timestamp: new Date().toISOString()
      });
    });

    console.log('[SignalR] ✅ Event handlers setup completed');
  }

  /**
   * Đăng ký listener để nhận thông báo mới
   * Returns unsubscribe function
   */
  onNotification(callback: NotificationCallback): () => void {
    this.listeners.push(callback);
    console.log('[SignalR] 🎯 Listener registered', {
      totalListeners: this.listeners.length
    });
    
    // Return unsubscribe function
    return () => {
      const beforeCount = this.listeners.length;
      this.listeners = this.listeners.filter(l => l !== callback);
      console.log('[SignalR] 🗑️ Listener unregistered', {
        before: beforeCount,
        after: this.listeners.length
      });
    };
  }

  /**
   * Đăng ký listener cho connection state changes
   */
  onConnectionStateChange(callback: (state: ConnectionState) => void): () => void {
    this.connectionStateCallbacks.push(callback);
    
    // Gọi ngay lập tức với state hiện tại
    callback(this.currentState);
    
    // Return unsubscribe function
    return () => {
      this.connectionStateCallbacks = this.connectionStateCallbacks.filter(c => c !== callback);
    };
  }

  /**
   * Update connection state và notify callbacks
   */
  private updateConnectionState(newState: ConnectionState): void {
    const oldState = this.currentState;
    this.currentState = newState;
    
    if (oldState !== newState) {
      console.log('[SignalR] 🔄 State changed:', {
        from: oldState,
        to: newState,
        callbackCount: this.connectionStateCallbacks.length,
        timestamp: new Date().toISOString()
      });
    }
    
    this.connectionStateCallbacks.forEach(callback => {
      try {
        callback(newState);
      } catch (err) {
        console.error("[SignalR] ❌ Error in connection state callback:", err);
      }
    });
  }

  /**
   * Đánh dấu notification đã đọc (gọi method trên server)
   */
  async markAsRead(notificationId: number): Promise<void> {
    if (!this.connection || !this.isConnected) {
      throw new Error("Not connected to SignalR");
    }

    try {
      await this.connection.invoke("MarkNotificationAsRead", notificationId);
      console.log("[SignalR] ✅ Marked notification as read:", notificationId);
    } catch (err) {
      console.error("[SignalR] ❌ Error marking as read:", err);
      throw err;
    }
  }

  /**
   * Test connection (ping server)
   */
  async ping(): Promise<string> {
    if (!this.connection || !this.isConnected) {
      throw new Error("Not connected to SignalR");
    }

    try {
      const result = await this.connection.invoke<string>("Ping");
      console.log("[SignalR] 🏓 Ping result:", result);
      return result;
    } catch (err) {
      console.error("[SignalR] ❌ Ping error:", err);
      throw err;
    }
  }

  /**
   * Update JWT token (dùng khi refresh token)
   */
  updateToken(newToken: string): void {
    const oldTokenLength = this.token.length;
    this.token = newToken;
    console.log("[SignalR] 🔑 Token updated", {
      oldTokenLength,
      newTokenLength: newToken.length,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  get isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  /**
   * Lấy connection state hiện tại
   */
  get connectionState(): ConnectionState {
    return this.currentState;
  }

  /**
   * Lấy số lượng listeners hiện có
   */
  get listenerCount(): number {
    return this.listeners.length;
  }
}

export default NotificationService;

