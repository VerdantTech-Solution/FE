import * as signalR from "@microsoft/signalr";
import type { 
  Notification, 
  NotificationCallback
} from "@/types/notification.types";
import { 
  ConnectionState 
} from "@/types/notification.types";

/**
 * Service quản lý kết nối SignalR và nhận thông báo real-time
 */
class NotificationService {
  private connection: signalR.HubConnection | null = null;
  private token: string;
  private hubUrl: string;
  private listeners: NotificationCallback[] = [];
  private connectionStateCallbacks: ((state: ConnectionState) => void)[] = [];
  private currentState: ConnectionState = ConnectionState.Disconnected;

  constructor(token: string, hubUrl?: string) {
    this.token = token;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://sep490.onrender.com";
    this.hubUrl = hubUrl || `${baseUrl}/hubs/notification`;
  }

  /**
   * Khởi tạo và kết nối tới SignalR Hub
   */
  async start(): Promise<void> {
    if (this.connection) {
      console.log("[SignalR] Already connected");
      return;
    }

    this.updateConnectionState(ConnectionState.Connecting);

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
      await this.connection.start();
      this.updateConnectionState(ConnectionState.Connected);
      console.log("[SignalR] ✅ Connected successfully");
      
      // Note: Ping method removed - server doesn't implement it
      // If needed, can be called manually via ping() method
    } catch (err) {
      this.updateConnectionState(ConnectionState.Disconnected);
      console.error("[SignalR] ❌ Connection failed:", err);
      throw err;
    }
  }

  /**
   * Ngắt kết nối
   */
  async stop(): Promise<void> {
    if (!this.connection) return;

    try {
      await this.connection.stop();
      this.updateConnectionState(ConnectionState.Disconnected);
      console.log("[SignalR] Disconnected");
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
    if (!this.connection) return;

    // ✅ Lắng nghe thông báo mới từ server
    this.connection.on("ReceiveNotification", (notification: Notification) => {
      console.log("[SignalR] 🔔 Received notification:", notification);
      
      // Gọi tất cả listeners đã đăng ký
      this.listeners.forEach(listener => {
        try {
          listener(notification);
        } catch (err) {
          console.error("[SignalR] Error in listener:", err);
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
      this.updateConnectionState(ConnectionState.Reconnecting);
      console.warn("[SignalR] 🔄 Reconnecting...", error?.message);
    });

    // Khi reconnected
    this.connection.onreconnected((connectionId) => {
      this.updateConnectionState(ConnectionState.Connected);
      console.log("[SignalR] ✅ Reconnected:", connectionId);
    });

    // Khi connection bị đóng
    this.connection.onclose((error) => {
      this.updateConnectionState(ConnectionState.Disconnected);
      console.error("[SignalR] ❌ Connection closed:", error?.message);
    });
  }

  /**
   * Đăng ký listener để nhận thông báo mới
   * Returns unsubscribe function
   */
  onNotification(callback: NotificationCallback): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
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
    this.currentState = newState;
    this.connectionStateCallbacks.forEach(callback => {
      try {
        callback(newState);
      } catch (err) {
        console.error("[SignalR] Error in connection state callback:", err);
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
    this.token = newToken;
    console.log("[SignalR] Token updated");
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

