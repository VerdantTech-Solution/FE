/**
 * ChatHub Service - SignalR cho chat realtime giữa customer & vendor
 * Thiết kế lại gọn: chỉ một singleton, expose connect/disconnect/join/send/listen.
 */

import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from '@/api/apiClient';
import type {
  ChatHubConfig,
  ChatMessage,
  ChatMessageCallback,
  ConnectionState,
  ConnectionStateCallback,
  ConversationUpdate,
  ConversationUpdateCallback,
  TypingIndicator,
  TypingIndicatorCallback,
} from '@/types/chat';
import { CONNECTION_STATES } from '@/types/chat';

// ==================== Constants & helpers ====================

const DEFAULT_HUB_PATH = '/hubs/chat';
const DEFAULT_RECONNECT_DELAYS = [0, 2000, 10_000, 30_000];

/**
 * Build hub url: explicit param > env VITE_CHAT_SIGNALR_HUB_URL > API_BASE_URL/hubs/chat
 */
const buildHubUrl = (explicitUrl?: string): string => {
  const envHubUrl = import.meta.env.VITE_CHAT_SIGNALR_HUB_URL?.trim();
  const candidate = explicitUrl?.trim() || envHubUrl;
  if (candidate) return candidate.replace(/\/+$/, '');

  const baseUrl = API_BASE_URL.replace(/\/+$/, '');
  return `${baseUrl}${DEFAULT_HUB_PATH}`;
};

/**
 * Chuẩn hóa senderType từ server (enum number hoặc string)
 */
export const normalizeSenderType = (
  senderType: string | number | undefined | null
): 'customer' | 'vendor' | null => {
  if (senderType === undefined || senderType === null) return null;
  if (typeof senderType === 'number') {
    if (senderType === 0) return 'customer';
    if (senderType === 1) return 'vendor';
    return null;
  }
  const normalized = String(senderType).toLowerCase();
  if (normalized === 'customer') return 'customer';
  if (normalized === 'vendor') return 'vendor';
  return null;
};

const getLogLevel = (level?: ChatHubConfig['logLevel']): signalR.LogLevel => {
  const levels: Record<string, signalR.LogLevel> = {
    None: signalR.LogLevel.None,
    Error: signalR.LogLevel.Error,
    Warning: signalR.LogLevel.Warning,
    Information: signalR.LogLevel.Information,
    Debug: signalR.LogLevel.Debug,
    Trace: signalR.LogLevel.Trace,
  };
  return levels[level || 'Information'] ?? signalR.LogLevel.Information;
};

// ==================== ChatHubService ====================

class ChatHubService {
  private connection: signalR.HubConnection | null = null;
  private hubUrl: string;
  private config: ChatHubConfig;

  private messageListeners: ChatMessageCallback[] = [];
  private conversationUpdateListeners: ConversationUpdateCallback[] = [];
  private typingIndicatorListeners: TypingIndicatorCallback[] = [];
  private connectionStateListeners: ConnectionStateCallback[] = [];

  private currentState: ConnectionState = CONNECTION_STATES.Disconnected;
  private isConnecting = false;
  private isDisconnecting = false;

  constructor(config: ChatHubConfig = {}) {
    this.config = config;
    this.hubUrl = buildHubUrl(config.hubUrl);
  }

  // ===== Connection =====
  async connect(accessToken: string): Promise<void> {
    if (this.isConnecting) {
      console.log('[ChatHub] ⏳ Already connecting...');
      return;
    }
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log('[ChatHub] ✅ Already connected');
      return;
    }
    if (this.isDisconnecting) {
      await new Promise((r) => setTimeout(r, 100));
    }

    this.isConnecting = true;
    this.updateConnectionState(CONNECTION_STATES.Connecting);

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        accessTokenFactory: () => accessToken,
        skipNegotiation: false,
        transport:
          signalR.HttpTransportType.WebSockets |
          signalR.HttpTransportType.ServerSentEvents,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (context) => {
          const delays = this.config.reconnectDelays || DEFAULT_RECONNECT_DELAYS;
          return delays[context.previousRetryCount] ?? delays[delays.length - 1];
        },
      })
      .configureLogging(getLogLevel(this.config.logLevel))
      .build();

    this.setupEventHandlers();

    try {
      await this.connection.start();
      this.updateConnectionState(CONNECTION_STATES.Connected);
      console.log('[ChatHub] ✅ Connected:', this.connection.connectionId);
      // Optional ping for debug
      try {
        const pong = await this.connection.invoke<string>('Ping');
        console.log('[ChatHub] 🏓', pong);
      } catch (err) {
        console.log('[ChatHub] Ping not supported:', err);
      }
    } catch (error) {
      console.error('[ChatHub] ❌ Connection failed:', error);
      this.connection = null;
      this.updateConnectionState(CONNECTION_STATES.Disconnected);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connection || this.isDisconnecting) return;
    this.isDisconnecting = true;
    try {
      await this.connection.stop();
      console.log('[ChatHub] 🔌 Disconnected');
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        console.error('[ChatHub] ❌ Disconnect error:', error);
      }
    } finally {
      this.connection = null;
      this.updateConnectionState(CONNECTION_STATES.Disconnected);
      this.isDisconnecting = false;
    }
  }

  // ===== Event handlers =====
  private setupEventHandlers(): void {
    if (!this.connection) return;

    const handleMessage = (eventName: string, message: ChatMessage) => {
      console.log(`[ChatHub] 📨 ${eventName}`, message);
      this.messageListeners.forEach((listener) => {
        try {
          listener(message);
        } catch (error) {
          console.error('[ChatHub] Listener error:', error);
        }
      });
    };

    const messageEvents = ['ReceiveMessage', 'NewMessage', 'MessageReceived', 'SendMessage'];
    messageEvents.forEach((evt) => this.connection!.on(evt, (msg: ChatMessage) => handleMessage(evt, msg)));

    this.connection.on('ConversationUpdated', (update: ConversationUpdate) => {
      this.conversationUpdateListeners.forEach((listener) => {
        try {
          listener(update);
        } catch (error) {
          console.error('[ChatHub] Conversation listener error:', error);
        }
      });
    });

    this.connection.on('ReceiveTypingIndicator', (indicator: TypingIndicator) => {
      this.typingIndicatorListeners.forEach((listener) => {
        try {
          listener(indicator);
        } catch (error) {
          console.error('[ChatHub] Typing listener error:', error);
        }
      });
    });

    this.connection.on('MessagesRead', (conversationId: number) => {
      console.log('[ChatHub] 👁️ Messages read:', conversationId);
    });

    this.connection.on('Error', (err: string) => {
      console.error('[ChatHub] ⚠️ Server error:', err);
    });

    this.connection.onreconnecting((error) => {
      console.warn('[ChatHub] 🔄 Reconnecting...', error?.message);
      this.updateConnectionState(CONNECTION_STATES.Reconnecting);
    });
    this.connection.onreconnected((connectionId) => {
      console.log('[ChatHub] ✅ Reconnected:', connectionId);
      this.updateConnectionState(CONNECTION_STATES.Connected);
    });
    this.connection.onclose((error) => {
      console.warn('[ChatHub] 🔌 Closed:', error?.message);
      this.updateConnectionState(CONNECTION_STATES.Disconnected);
    });
  }

  // ===== Subscriptions =====
  onMessage(callback: ChatMessageCallback): () => void {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== callback);
    };
  }

  onConversationUpdate(callback: ConversationUpdateCallback): () => void {
    this.conversationUpdateListeners.push(callback);
    return () => {
      this.conversationUpdateListeners = this.conversationUpdateListeners.filter((l) => l !== callback);
    };
  }

  onTypingIndicator(callback: TypingIndicatorCallback): () => void {
    this.typingIndicatorListeners.push(callback);
    return () => {
      this.typingIndicatorListeners = this.typingIndicatorListeners.filter((l) => l !== callback);
    };
  }

  onConnectionStateChange(callback: ConnectionStateCallback): () => void {
    this.connectionStateListeners.push(callback);
    callback(this.currentState);
    return () => {
      this.connectionStateListeners = this.connectionStateListeners.filter((l) => l !== callback);
    };
  }

  // ===== Hub methods =====
  async sendTypingIndicator(conversationId: number, recipientUserId: string): Promise<void> {
    if (!this.isConnected()) return;
    try {
      await this.connection!.invoke('SendTypingIndicator', conversationId, recipientUserId);
    } catch (error) {
      console.error('[ChatHub] Error sending typing indicator:', error);
    }
  }

  async markAsRead(conversationId: number): Promise<void> {
    // Backend hiện không có method MarkAsRead trên hub (HubException: Method does not exist)
    // => Không invoke nữa để tránh lỗi, chỉ log cho dev.
    console.log('[ChatHub] markAsRead called for conversation', conversationId, '- no-op (method not available on hub)');
  }

  async sendMessage(conversationId: number, messageText: string, recipientUserId?: string): Promise<void> {
    if (!this.isConnected()) {
      console.error('[ChatHub] Cannot send message - not connected');
      return;
    }
    try {
      await this.connection!.invoke('SendMessage', conversationId, messageText, recipientUserId);
      console.log('[ChatHub] ✅ Message sent via SignalR');
    } catch (error) {
      console.error('[ChatHub] Error sending message via SignalR:', error);
      throw error;
    }
  }

  async joinConversation(conversationId: number): Promise<void> {
    if (!this.isConnected()) return;
    try {
      await this.connection!.invoke('JoinConversation', conversationId);
      console.log('[ChatHub] ✅ Joined conversation', conversationId);
    } catch (error) {
      console.warn('[ChatHub] JoinConversation not supported:', error);
    }
  }

  async leaveConversation(conversationId: number): Promise<void> {
    if (!this.isConnected()) return;
    try {
      await this.connection!.invoke('LeaveConversation', conversationId);
      console.log('[ChatHub] ✅ Left conversation', conversationId);
    } catch (error) {
      console.warn('[ChatHub] LeaveConversation not supported:', error);
    }
  }

  // ===== State helpers =====
  private updateConnectionState(state: ConnectionState): void {
    this.currentState = state;
    this.connectionStateListeners.forEach((callback) => {
      try {
        callback(state);
      } catch (error) {
        console.error('[ChatHub] State callback error:', error);
      }
    });
  }

  getConnectionState(): ConnectionState {
    return this.currentState;
  }

  isConnected(): boolean {
    return (
      this.currentState === CONNECTION_STATES.Connected &&
      this.connection?.state === signalR.HubConnectionState.Connected
    );
  }

  getConnectionId(): string | null {
    return this.connection?.connectionId || null;
  }

  getHubUrl(): string {
    return this.hubUrl;
  }

  debug(): void {
    console.log('[ChatHub] 🧪 DEBUG', {
      hubUrl: this.hubUrl,
      state: this.currentState,
      connected: this.isConnected(),
      connectionId: this.getConnectionId(),
      listeners: {
        message: this.messageListeners.length,
        conversation: this.conversationUpdateListeners.length,
        typing: this.typingIndicatorListeners.length,
        state: this.connectionStateListeners.length,
      },
    });
  }
}

// ===== Singleton exports =====
const chatHubService = new ChatHubService();
export const getChatHubService = (): ChatHubService => chatHubService;
export const destroyChatHubService = async (): Promise<void> => {
  await chatHubService.disconnect();
};
export { chatHubService };
export default ChatHubService;
