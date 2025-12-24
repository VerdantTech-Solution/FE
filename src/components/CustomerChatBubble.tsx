import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Search,
  Loader2,
  Wifi,
  WifiOff,
  Image as ImageIcon,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getMyConversations,
  getConversationMessages,
  sendMessage as sendMessageApi,
  type Conversation as ApiConversation,
  type ConversationMessage as ApiMessage,
} from "@/api/customerVendorConversation";
import { useConversation } from "@/contexts/useConversation";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import type {
  ChatMessage,
  CustomerConversation as Conversation,
  NormalizedMessage as Message,
  ApiError,
} from "@/types/chat";
import { CONNECTION_STATES } from "@/types/chat";
import { normalizeSenderType } from "@/services/chatHub";

export const CustomerChatBubble = () => {
  const [isListOpen, setIsListOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pendingRequest, clearPendingRequest } = useConversation();
  const { user } = useAuth();
  const { connectionState, onMessage, joinConversation, leaveConversation, markAsRead } =
    useChat();

  // Use ref to always have latest activeChatId value in callbacks
  const activeChatIdRef = useRef<number | null>(null);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<number, Message[]>>({});
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingProductId, setPendingProductId] = useState<number | undefined>(
    undefined
  );

  // Handle incoming SignalR message
  const handleNewMessage = useCallback(
    (chatMessage: ChatMessage) => {
      console.log("[CustomerChatBubble] Received message from SignalR:", chatMessage);

      // Normalize senderType (can be enum number or string)
      const senderType = normalizeSenderType(chatMessage.senderType);

      if (!senderType) {
        console.warn("[CustomerChatBubble] Invalid senderType:", chatMessage.senderType);
        return;
      }

      const newMessage: Message = {
        id: chatMessage.id,
        text: chatMessage.messageText,
        sender: senderType,
        timestamp: new Date(chatMessage.createdAt),
        isRead: chatMessage.isRead,
        images: chatMessage.images,
      };

      setMessages((prev) => {
        const conversationMessages = prev[chatMessage.conversationId] || [];
        // Check if message already exists
        if (conversationMessages.some((m) => m.id === newMessage.id)) {
          return prev;
        }
        return {
          ...prev,
          [chatMessage.conversationId]: [...conversationMessages, newMessage],
        };
      });

      // If user is viewing this conversation, mark as read
      if (activeChatIdRef.current === chatMessage.conversationId) {
        markAsRead(chatMessage.conversationId).catch((err) =>
          console.warn("[CustomerChatBubble] markAsRead failed:", err)
        );
      }

      // Update conversation's last message and unread count
      setConversations((prev) => {
        // Check if conversation exists
        const conversationExists = prev.some((c) => c.id === chatMessage.conversationId);
        
        if (!conversationExists) {
          // Conversation doesn't exist yet - refetch
          console.log("[CustomerChatBubble] New conversation detected, refreshing list...");
          getMyConversations(1, 50).then((response) => {
            if (response.status && response.data) {
              const transformedConversations: Conversation[] = response.data.data.map(
                (conv: ApiConversation) => ({
                  id: conv.id,
                  vendorId: conv.vendor!.id,
                  vendorName: conv.vendor!.fullName,
                  vendorShopName: conv.vendor!.fullName,
                  vendorAvatar: conv.vendor!.avatarUrl,
                  lastMessage:
                    conv.id === chatMessage.conversationId
                      ? chatMessage.messageText
                      : "Nhấn để xem tin nhắn",
                  lastMessageTime: new Date(conv.lastMessageAt),
                  unreadCount: conv.id === chatMessage.conversationId ? 1 : 0,
                  isOnline: false,
                })
              );
              setConversations(transformedConversations);
            }
          });
          return prev;
        }
        
        const updated = prev.map((conv) => {
          if (conv.id === chatMessage.conversationId) {
            // Only increment unread if message is from vendor and conversation is not active
            // Use ref for latest value to avoid stale closure
            const shouldIncrementUnread =
              senderType === "vendor" &&
              activeChatIdRef.current !== chatMessage.conversationId;

            const newUnreadCount = shouldIncrementUnread
              ? conv.unreadCount + 1
              : conv.unreadCount;

            return {
              ...conv,
              lastMessage: chatMessage.messageText,
              lastMessageTime: new Date(chatMessage.createdAt),
              unreadCount: newUnreadCount,
            };
          }
          return conv;
        });
        return updated;
      });
    },
    [markAsRead] // markAsRead stable from context
  );

  // Subscribe to messages from ChatContext
  useEffect(() => {
    console.log("[CustomerChatBubble] Subscribing to messages, connection:", connectionState);
    const unsubscribe = onMessage(handleNewMessage);
    return () => {
      console.log("[CustomerChatBubble] Unsubscribing from messages");
      unsubscribe();
    };
  }, [onMessage, handleNewMessage, connectionState]);

  // Fetch conversations on mount to receive messages immediately
  useEffect(() => {
    if (user && connectionState === CONNECTION_STATES.Connected) {
      console.log('[CustomerChatBubble] Fetching conversations on mount/connect...');
      fetchConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, connectionState]);

  // Mark as read when chat is active
  useEffect(() => {
    if (connectionState !== CONNECTION_STATES.Connected || !activeChatId) return;
    // Messages are received automatically via SignalR broadcast
  }, [activeChatId, connectionState]);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      setIsLoadingConversations(true);
      setError(null);
      const response = await getMyConversations(1, 50);

      if (response.status && response.data) {
        console.log('[CustomerChatBubble] Loaded', response.data.data.length, 'conversations');
        const transformedConversations: Conversation[] = response.data.data.map(
          (conv: ApiConversation) => ({
            id: conv.id,
            vendorId: conv.vendor!.id,
            vendorName: conv.vendor!.fullName,
            vendorShopName: conv.vendor!.fullName,
            vendorAvatar: conv.vendor!.avatarUrl,
            lastMessage: "Nhấn để xem tin nhắn",
            lastMessageTime: new Date(conv.lastMessageAt),
            unreadCount: 0, // Will be calculated from messages
            isOnline: false, // Can be enhanced with real-time status
          })
        );
        setConversations(transformedConversations);
      }
    } catch (err: unknown) {
      console.error("Error fetching conversations:", err);
      setError(
        (err as ApiError)?.response?.data?.errors?.[0] ||
          "Không thể tải tin nhắn"
      );
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: number) => {
    try {
      setIsLoadingMessages(true);
      const response = await getConversationMessages(conversationId, 1, 50);

      if (response.status && response.data) {
        const transformedMessages: Message[] = response.data.data
          .map((msg: ApiMessage) => ({
            id: msg.id,
            text: msg.messageText,
            sender: msg.senderType.toLowerCase() as "customer" | "vendor",
            timestamp: new Date(msg.createdAt),
            isRead: msg.isRead,
            images: msg.images,
          }))
          .reverse(); // Reverse to show oldest first

        setMessages((prev) => ({
          ...prev,
          [conversationId]: transformedMessages,
        }));

        // Update last message in conversation
        if (transformedMessages.length > 0) {
          const lastMsg = transformedMessages[transformedMessages.length - 1];
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === conversationId
                ? { ...conv, lastMessage: lastMsg.text }
                : conv
            )
          );
        }
      }
    } catch (err: unknown) {
      console.error("Error fetching messages:", err);
      setError(
        (err as ApiError)?.response?.data?.errors?.[0] ||
          "Không thể tải tin nhắn"
      );
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Load conversations when component mounts or list opens
  useEffect(() => {
    if (isListOpen && conversations.length === 0) {
      fetchConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListOpen]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current && activeChatId) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, activeChatId]);

  // Handle pending conversation requests from ProductVendorChat
  useEffect(() => {
    if (pendingRequest) {
      handleOpenConversationByVendor(
        pendingRequest.vendorId,
        pendingRequest.productInfo
      );
      clearPendingRequest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRequest]);

  // Rời nhóm khi unmount để backend dọn dẹp
  useEffect(() => {
    return () => {
      const current = activeChatIdRef.current;
      if (current) {
        leaveConversation(current).catch(() =>
          console.warn("[CustomerChatBubble] leaveConversation cleanup failed")
        );
      }
    };
  }, [leaveConversation]);

  const handleOpenChat = async (
    conversationId: number,
    forceRefresh = false
  ) => {
    setActiveChatId(conversationId);
    setSearchQuery("");
    setIsListOpen(true);

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      )
    );

    // Fetch messages if not already loaded or force refresh
    if (!messages[conversationId] || forceRefresh) {
      await fetchMessages(conversationId);
    }

    // Join hub group if available
    joinConversation(conversationId).catch((err) =>
      console.warn("[CustomerChatBubble] joinConversation failed:", err)
    );

    // Mark as read immediately
    markAsRead(conversationId).catch((err) =>
      console.warn("[CustomerChatBubble] markAsRead failed:", err)
    );
  };

  // Open conversation by vendorId (for ProductVendorChat integration)
  const handleOpenConversationByVendor = async (
    vendorId: number,
    productInfo?: { productId: number; productName: string }
  ) => {
    // Open chat list first
    setIsListOpen(true);
    setSearchQuery("");

    // Check if conversation already exists
    let existingConv = conversations.find((c) => c.vendorId === vendorId);

    // If not found in current list, refresh to get latest
    if (!existingConv && conversations.length > 0) {
      await fetchConversations();
      existingConv = conversations.find((c) => c.vendorId === vendorId);
    }

    if (existingConv) {
      // Already have conversation, just open it
      await handleOpenChat(existingConv.id);

      // Pre-fill message if product info provided
      if (productInfo) {
        setInputValue(
          `Xin chào, tôi muốn hỏi về sản phẩm "${productInfo.productName}"`
        );
        setPendingProductId(productInfo.productId);
      }
    } else {
      // Create temporary conversation for immediate chat
      const tempConversation: Conversation = {
        id: -vendorId, // Use negative ID for temporary conversation
        vendorId: vendorId,
        vendorName: "Nhà cung cấp",
        vendorShopName: "Đang tải...",
        vendorAvatar: null,
        lastMessage: "Bắt đầu cuộc trò chuyện",
        lastMessageTime: new Date(),
        unreadCount: 0,
        isOnline: false,
      };

      // Add temporary conversation and open it
      setConversations((prev) => [tempConversation, ...prev]);
      setActiveChatId(tempConversation.id);
      setMessages((prev) => ({ ...prev, [tempConversation.id]: [] }));

      // Pre-fill message if product info provided
      if (productInfo) {
        setInputValue(
          `Xin chào, tôi muốn hỏi về sản phẩm "${productInfo.productName}"`
        );
        setPendingProductId(productInfo.productId);
      }
    }
  };

  const handleBackToList = () => {
    if (activeChatId) {
      leaveConversation(activeChatId).catch((err) =>
        console.warn("[CustomerChatBubble] leaveConversation failed:", err)
      );
    }
    setActiveChatId(null);
    setInputValue("");
    setSelectedImages([]);
    setPendingProductId(undefined);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 3) {
      setError("Chỉ có thể gửi tối đa 3 ảnh");
      return;
    }
    setSelectedImages((prev) => [...prev, ...files].slice(0, 3));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (text: string) => {
    if (!activeChatId || !user?.id) return;

    const trimmed = text.trim();
    if (!trimmed && selectedImages.length === 0) return;

    // Find the conversation to get vendorId
    const activeConv = conversations.find((c) => c.id === activeChatId);
    if (!activeConv) return;

    const isTemporaryConv = activeChatId < 0; // Negative ID means temporary

    try {
      setIsSendingMessage(true);
      setError(null);

      // Send message with productId if available
      const response = await sendMessageApi(
        Number(user.id),
        activeConv.vendorId,
        trimmed || "📷",
        pendingProductId, // Send productId for first message
        selectedImages.length > 0 ? selectedImages : undefined
      );

      if (response.status && response.data) {
        const newMessage: Message = {
          id: response.data.id,
          text: response.data.messageText,
          sender: "customer",
          timestamp: new Date(response.data.createdAt),
          isRead: response.data.isRead,
          images: response.data.images,
        };

        // If this was a temporary conversation, replace it with real one
        if (isTemporaryConv && response.data.conversationId) {
          const realConversationId = response.data.conversationId;

          // Remove temporary conversation and add real one
          setConversations((prev) => {
            const filtered = prev.filter((c) => c.id !== activeChatId);
            const realConv: Conversation = {
              id: realConversationId,
              vendorId: activeConv.vendorId,
              vendorName: activeConv.vendorName,
              vendorShopName: activeConv.vendorShopName,
              vendorAvatar: activeConv.vendorAvatar,
              lastMessage: trimmed || "📷",
              lastMessageTime: new Date(),
              unreadCount: 0,
              isOnline: false,
            };
            return [realConv, ...filtered];
          });

          // Move messages from temp to real conversation
          setMessages((prev) => {
            const tempMessages = prev[activeChatId] || [];
            const updated = { ...prev };
            delete updated[activeChatId];
            updated[realConversationId] = [...tempMessages, newMessage];
            return updated;
          });

          // Switch to real conversation
          setActiveChatId(realConversationId);

          // Join real conversation group after creation
          joinConversation(realConversationId).catch((err) =>
            console.warn("[CustomerChatBubble] joinConversation failed:", err)
          );

          // Messages will be received automatically via SignalR broadcast
        } else {
          // Normal case - existing conversation
          setMessages((prev) => ({
            ...prev,
            [activeChatId]: [...(prev[activeChatId] || []), newMessage],
          }));

          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === activeChatId
                ? {
                    ...conv,
                    lastMessage: trimmed || "📷",
                    lastMessageTime: new Date(),
                  }
                : conv
            )
          );
        }

        // Clear input and productId after successful send
        setInputValue("");
        setSelectedImages([]);
        setPendingProductId(undefined);
      }
    } catch (err: unknown) {
      console.error("Error sending message:", err);
      setError(
        (err as ApiError)?.response?.data?.errors?.[0] ||
          "Không thể gửi tin nhắn"
      );
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.vendorShopName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce(
    (sum, conv) => sum + conv.unreadCount,
    0
  );

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút`;
    if (hours < 24) return `${hours} giờ`;
    if (days < 7) return `${days} ngày`;
    return date.toLocaleDateString("vi-VN");
  };

  // Detect and parse product inquiry message
  const parseProductInquiry = (
    text: string
  ): { isProductInquiry: boolean; productName?: string; greeting?: string } => {
    const productInquiryPattern =
      /^(.*?)muốn hỏi về sản phẩm\s*[""](.*?)[""](.*)$/i;
    const match = text.match(productInquiryPattern);

    if (match) {
      return {
        isProductInquiry: true,
        greeting: match[1].trim(),
        productName: match[2].trim(),
      };
    }

    return { isProductInquiry: false };
  };

  return (
    <div className="relative">
      {/* Chat Toggle Button */}
      <Button
        variant="ghost"
        className="relative text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200"
        onClick={() => {
          console.log("Chat button clicked, current state:", isListOpen);
          setIsListOpen(!isListOpen);
        }}
        aria-label="Tin nhắn với người bán"
      >
        <MessageCircle className="h-6 w-6" />
        {/* Connection indicator */}
        {connectionState === CONNECTION_STATES.Connected && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />
        )}
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </Button>

      {/* Conversations List Popup - Dropdown style */}
      <AnimatePresence>
        {isListOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsListOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 z-50"
            >
              <Card className="w-[360px] h-[500px] flex flex-col shadow-2xl border border-gray-200 rounded-lg overflow-hidden">
                {!activeChatId ? (
                  <>
                    {/* Header - List View */}
                    <div className="px-4 py-3 border-b border-gray-200 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-xl text-gray-900">
                            Tin nhắn
                          </h3>
                          {/* Connection status indicator */}
                          {connectionState === CONNECTION_STATES.Connected ? (
                            <Wifi className="w-4 h-4 text-green-500" />
                          ) : connectionState ===
                              CONNECTION_STATES.Connecting ||
                            connectionState ===
                              CONNECTION_STATES.Reconnecting ? (
                            <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
                          ) : (
                            <WifiOff className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsListOpen(false)}
                          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full h-8 w-8 p-0"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Tìm kiếm tin nhắn..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto">
                      {isLoadingConversations ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
                          <Loader2 className="w-8 h-8 mb-2 animate-spin" />
                          <p className="text-sm">Đang tải...</p>
                        </div>
                      ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-red-500 px-4">
                          <MessageCircle className="w-12 h-12 mb-2" />
                          <p className="text-sm text-center">{error}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchConversations}
                            className="mt-2"
                          >
                            Thử lại
                          </Button>
                        </div>
                      ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
                          <MessageCircle className="w-12 h-12 mb-2" />
                          <p className="text-sm text-center">
                            {searchQuery
                              ? "Không tìm thấy cuộc trò chuyện"
                              : "Chưa có tin nhắn nào"}
                          </p>
                        </div>
                      ) : (
                        filteredConversations.map((conv) => (
                          <button
                            key={conv.id}
                            onClick={() => handleOpenChat(conv.id)}
                            className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-100 transition-colors"
                          >
                            <div className="relative flex-shrink-0">
                              {conv.vendorAvatar ? (
                                <img
                                  src={conv.vendorAvatar}
                                  alt={conv.vendorShopName}
                                  className="w-14 h-14 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                  {conv.vendorShopName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              {conv.isOnline && (
                                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className={`text-sm truncate ${
                                    conv.unreadCount > 0
                                      ? "font-bold text-gray-900"
                                      : "font-medium text-gray-900"
                                  }`}
                                >
                                  {conv.vendorShopName}
                                </span>
                                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                  {formatTime(conv.lastMessageTime)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <p
                                  className={`text-xs truncate flex-1 ${
                                    conv.unreadCount > 0
                                      ? "font-semibold text-gray-900"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {conv.lastMessage}
                                </p>
                                {conv.unreadCount > 0 && (
                                  <span className="min-w-5 h-5 px-1.5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                    {conv.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Header - Chat View */}
                    {(() => {
                      const activeConv = conversations.find(
                        (c) => c.id === activeChatId
                      );
                      if (!activeConv) return null;

                      return (
                        <>
                          <div className="px-3 py-2.5 bg-green-600 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-white/20 rounded-full h-7 w-7 p-0"
                                onClick={handleBackToList}
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                  />
                                </svg>
                              </Button>
                              <div className="relative flex-shrink-0">
                                {activeConv.vendorAvatar ? (
                                  <img
                                    src={activeConv.vendorAvatar}
                                    alt={activeConv.vendorShopName}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                    {activeConv.vendorShopName
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                )}
                                {activeConv.isOnline && (
                                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border border-green-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm truncate">
                                  {activeConv.vendorShopName}
                                </h4>
                                <p className="text-xs text-green-100">
                                  {activeConv.isOnline
                                    ? "Đang hoạt động"
                                    : "Không hoạt động"}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white hover:bg-white/20 rounded-full h-7 w-7 p-0"
                              onClick={() => setIsListOpen(false)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Messages */}
                          <div
                            ref={messagesContainerRef}
                            className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-gray-50"
                          >
                            <input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept="image/*"
                              multiple
                              onChange={handleImageSelect}
                            />
                            {isLoadingMessages ? (
                              <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                              </div>
                            ) : (
                              (messages[activeChatId] || []).map((message) => {
                                const productInquiry = parseProductInquiry(
                                  message.text
                                );

                                return (
                                  <div
                                    key={message.id}
                                    className={`flex gap-2 ${
                                      message.sender === "customer"
                                        ? "flex-row-reverse"
                                        : ""
                                    }`}
                                  >
                                    {/* Product Inquiry Message - Special UI */}
                                    {productInquiry.isProductInquiry &&
                                    message.sender === "customer" ? (
                                      <div className="max-w-[80%] bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-3 shadow-sm">
                                        <div className="flex items-start gap-2.5 mb-2">
                                          <div className="bg-green-600 rounded-full p-1.5 mt-0.5">
                                            <Package className="w-4 h-4 text-white" />
                                          </div>
                                          <div className="flex-1">
                                            <p className="text-sm text-gray-700 mb-1">
                                              {productInquiry.greeting}
                                            </p>
                                            <div className="bg-white rounded-lg px-3 py-2 border border-green-300">
                                              <p className="text-xs text-green-700 font-medium mb-1">
                                                SẢN PHẨM QUAN TÂM
                                              </p>
                                              <p className="text-sm font-semibold text-gray-900">
                                                {productInquiry.productName}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                        <p className="text-xs text-gray-500 text-right mt-1">
                                          {formatTime(message.timestamp)}
                                        </p>
                                      </div>
                                    ) : (
                                      /* Normal Message */
                                      <div
                                        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                                          message.sender === "customer"
                                            ? "bg-green-600 text-white rounded-br-sm"
                                            : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                                        }`}
                                      >
                                        {message.images &&
                                          message.images.length > 0 && (
                                            <div className="mb-2 space-y-1">
                                              {message.images.map((img) => (
                                                <img
                                                  key={img.id}
                                                  src={img.imageUrl}
                                                  alt="Attachment"
                                                  className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90"
                                                  onClick={() =>
                                                    window.open(
                                                      img.imageUrl,
                                                      "_blank"
                                                    )
                                                  }
                                                />
                                              ))}
                                            </div>
                                          )}
                                        <p className="whitespace-pre-wrap break-words">
                                          {message.text}
                                        </p>
                                        <p
                                          className={`text-xs mt-1 ${
                                            message.sender === "customer"
                                              ? "text-green-100"
                                              : "text-gray-500"
                                          }`}
                                        >
                                          {formatTime(message.timestamp)}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Input */}
                          <div className="px-3 py-2.5 bg-white border-t border-gray-200">
                            {/* Image Preview */}
                            {selectedImages.length > 0 && (
                              <div className="mb-2 flex gap-2 overflow-x-auto pb-2">
                                {selectedImages.map((file, index) => (
                                  <div
                                    key={index}
                                    className="relative flex-shrink-0"
                                  >
                                    <img
                                      src={URL.createObjectURL(file)}
                                      alt={`Preview ${index + 1}`}
                                      className="h-20 w-20 object-cover rounded-lg border border-gray-300"
                                    />
                                    <button
                                      onClick={() => handleRemoveImage(index)}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2 items-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="flex-shrink-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full h-8 w-8 p-0"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={selectedImages.length >= 3}
                              >
                                <ImageIcon className="w-5 h-5" />
                              </Button>
                              <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Aa"
                                disabled={isSendingMessage}
                                className="flex-1 text-sm border-gray-300 rounded-full focus:ring-green-500 h-9"
                              />
                              <Button
                                onClick={() => handleSendMessage(inputValue)}
                                disabled={
                                  (!inputValue.trim() &&
                                    selectedImages.length === 0) ||
                                  isSendingMessage
                                }
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white rounded-full h-8 w-8 p-0 flex items-center justify-center flex-shrink-0"
                              >
                                {isSendingMessage ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </>
                )}
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
