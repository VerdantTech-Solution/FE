import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Search,
  Minus,
  Loader2,
  Wifi,
  WifiOff,
  ImageIcon,
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
  type ProductInfo,
} from "@/api/customerVendorConversation";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import {
  type ChatMessage,
  CONNECTION_STATES,
  normalizeSenderType,
} from "@/services/chatSignalR";

interface ApiError {
  response?: {
    data?: {
      errors?: string[];
    };
  };
}

interface Message {
  id: number;
  text: string;
  sender: "vendor" | "customer";
  timestamp: Date;
  isRead: boolean;
  images?: Array<{ id: number; imageUrl: string }>;
  product?: ProductInfo | null;
}

interface Conversation {
  id: number;
  customerId: number;
  customerName: string;
  customerAvatar: string | null;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
}

interface OpenChatWindow {
  conversationId: number;
  isMinimized: boolean;
}

export const VendorChatBubble = () => {
  const [isListOpen, setIsListOpen] = useState(false);
  const [openChats, setOpenChats] = useState<OpenChatWindow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { connectionState, onMessage, joinConversation, leaveConversation } =
    useChat();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<number, Message[]>>({});
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<
    Record<number, boolean>
  >({});
  const [isSendingMessage, setIsSendingMessage] = useState<
    Record<number, boolean>
  >({});
  const [error, setError] = useState<string | null>(null);

  // Handle incoming SignalR message
  const handleNewMessage = useCallback(
    (chatMessage: ChatMessage) => {
      // Normalize senderType (can be enum number or string)
      const senderType = normalizeSenderType(chatMessage.senderType);

      if (!senderType) {
        return;
      }

      const newMessage: Message = {
        id: chatMessage.id,
        text: chatMessage.messageText,
        sender: senderType,
        timestamp: new Date(chatMessage.createdAt),
        isRead: chatMessage.isRead,
        images: chatMessage.images,
        product:
          (chatMessage as ChatMessage & { product?: ProductInfo | null })
            .product || null,
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

      // Update conversation's last message and unread count
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id === chatMessage.conversationId) {
            // Check if this chat window is currently open
            const isWindowOpen = openChats.some(
              (chat) =>
                chat.conversationId === chatMessage.conversationId &&
                !chat.isMinimized
            );

            // Only increment unread if message is from customer and window is not open
            const shouldIncrementUnread =
              senderType === "customer" && !isWindowOpen;

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
    [openChats]
  );

  // Subscribe to messages from ChatContext
  useEffect(() => {
    const unsubscribe = onMessage(handleNewMessage);
    return () => {
      unsubscribe();
    };
  }, [onMessage, handleNewMessage]);

  // Join conversations when they are opened
  useEffect(() => {
    if (connectionState !== CONNECTION_STATES.Connected) return;

    openChats.forEach((chat) => {
      joinConversation(chat.conversationId);
    });

    return () => {
      openChats.forEach((chat) => {
        leaveConversation(chat.conversationId);
      });
    };
  }, [openChats, connectionState, joinConversation, leaveConversation]);

  // Fetch conversations from API
  const fetchConversations = async () => {
    try {
      setIsLoadingConversations(true);
      setError(null);
      const response = await getMyConversations(1, 50);

      if (response.status && response.data) {
        const transformedConversations: Conversation[] = response.data.data.map(
          (conv: ApiConversation) => ({
            id: conv.id,
            customerId: conv.customer?.id || 0,
            customerName: conv.customer?.fullName || "Khách hàng",
            customerAvatar: conv.customer?.avatarUrl || null,
            lastMessage: "Nhấn để xem tin nhắn",
            lastMessageTime: new Date(conv.lastMessageAt),
            unreadCount: 0,
            isOnline: false,
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
      setIsLoadingMessages((prev) => ({ ...prev, [conversationId]: true }));
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
            product: msg.product,
          }))
          .reverse();

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
    } finally {
      setIsLoadingMessages((prev) => ({ ...prev, [conversationId]: false }));
    }
  };

  // Load conversations when list opens
  useEffect(() => {
    if (isListOpen && conversations.length === 0) {
      fetchConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListOpen]);

  const handleOpenChat = async (conversationId: number) => {
    setIsListOpen(false);

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      )
    );

    if (openChats.some((chat) => chat.conversationId === conversationId)) {
      setOpenChats((prev) =>
        prev.map((chat) =>
          chat.conversationId === conversationId
            ? { ...chat, isMinimized: false }
            : chat
        )
      );
      return;
    }

    // Fetch messages if not already loaded
    if (!messages[conversationId]) {
      await fetchMessages(conversationId);
    }

    setOpenChats((prev) => {
      const newChat = { conversationId, isMinimized: false };
      if (prev.length >= 3) {
        return [...prev.slice(1), newChat];
      }
      return [...prev, newChat];
    });
  };

  const handleCloseChat = (conversationId: number) => {
    setOpenChats((prev) =>
      prev.filter((chat) => chat.conversationId !== conversationId)
    );
  };

  const handleToggleMinimize = (conversationId: number) => {
    setOpenChats((prev) =>
      prev.map((chat) =>
        chat.conversationId === conversationId
          ? { ...chat, isMinimized: !chat.isMinimized }
          : chat
      )
    );
  };

  const handleSendMessage = async (
    conversationId: number,
    text: string,
    images?: File[]
  ) => {
    const trimmed = text.trim();
    if (!trimmed && (!images || images.length === 0)) return;
    if (!user?.id) return;

    // Find the conversation to get customerId
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) return;

    try {
      setIsSendingMessage((prev) => ({ ...prev, [conversationId]: true }));
      const response = await sendMessageApi(
        conversation.customerId,
        Number(user.id),
        trimmed || "📷",
        undefined, // productId
        images
      );

      if (response.status && response.data) {
        const newMessage: Message = {
          id: response.data.id,
          text: response.data.messageText,
          sender: "vendor",
          timestamp: new Date(response.data.createdAt),
          isRead: response.data.isRead,
          images: response.data.images,
          product: response.data.product,
        };

        setMessages((prev) => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []), newMessage],
        }));

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  lastMessage: trimmed,
                  lastMessageTime: new Date(),
                }
              : conv
          )
        );
      }
    } catch (err: unknown) {
      console.error("Error sending message:", err);
    } finally {
      setIsSendingMessage((prev) => ({ ...prev, [conversationId]: false }));
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        variant="ghost"
        className="relative text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200"
        onClick={() => setIsListOpen(!isListOpen)}
        aria-label="Tin nhắn khách hàng"
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

      {/* Conversations List Popup - Facebook style */}
      <AnimatePresence>
        {isListOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-20 right-6 z-50"
          >
            <Card className="w-[360px] h-[480px] flex flex-col shadow-2xl border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xl text-gray-900">
                      Tin nhắn
                    </h3>
                    {/* Connection status indicator */}
                    {connectionState === CONNECTION_STATES.Connected ? (
                      <Wifi className="w-4 h-4 text-green-500" />
                    ) : connectionState === CONNECTION_STATES.Connecting ||
                      connectionState === CONNECTION_STATES.Reconnecting ? (
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
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {conv.customerName.charAt(0).toUpperCase()}
                        </div>
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
                            {conv.customerName}
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
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Windows - Facebook style at bottom right */}
      <div className="fixed bottom-0 right-6 z-40 flex gap-2 items-end">
        {openChats.map((chat) => (
          <ChatWindow
            key={chat.conversationId}
            conversation={
              conversations.find((c) => c.id === chat.conversationId)!
            }
            messages={messages[chat.conversationId] || []}
            isMinimized={chat.isMinimized}
            isLoading={isLoadingMessages[chat.conversationId] || false}
            isSending={isSendingMessage[chat.conversationId] || false}
            onClose={() => handleCloseChat(chat.conversationId)}
            onToggleMinimize={() => handleToggleMinimize(chat.conversationId)}
            onSendMessage={(text, images) =>
              handleSendMessage(chat.conversationId, text, images)
            }
          />
        ))}
      </div>
    </>
  );
};

// Individual Chat Window Component
interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  isMinimized: boolean;
  isLoading: boolean;
  isSending: boolean;
  onClose: () => void;
  onToggleMinimize: () => void;
  onSendMessage: (text: string, images?: File[]) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  isMinimized,
  isLoading,
  isSending,
  onClose,
  onToggleMinimize,
  onSendMessage,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current && !isMinimized) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isMinimized]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed && selectedImages.length === 0) return;
    onSendMessage(
      trimmed || "📷",
      selectedImages.length > 0 ? selectedImages : undefined
    );
    setInputValue("");
    setSelectedImages([]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 3) {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="w-[330px] shadow-xl border border-gray-300 overflow-hidden rounded-t-lg">
        {/* Header */}
        <div
          className="px-3 py-2.5 bg-blue-600 text-white flex items-center justify-between cursor-pointer hover:bg-blue-700 transition-colors"
          onClick={onToggleMinimize}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {conversation.customerName.charAt(0).toUpperCase()}
              </div>
              {conversation.isOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border border-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">
                {conversation.customerName}
              </h4>
              <p className="text-xs text-blue-100">
                {conversation.isOnline ? "Đang hoạt động" : "Không hoạt động"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 rounded-full h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMinimize();
              }}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 rounded-full h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Chat Content */}
        {!isMinimized && (
          <>
            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="h-[350px] overflow-y-auto px-3 py-3 space-y-2 bg-gray-50"
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
              />
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p className="text-sm">Chưa có tin nhắn</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${
                      message.sender === "vendor" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                        message.sender === "vendor"
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                      }`}
                    >
                      {message.product && (
                        <div className="mb-2 bg-white rounded-lg overflow-hidden border border-gray-200">
                          <div className="p-2 space-y-1.5">
                            <div className="flex items-start gap-2">
                              {message.product.images &&
                                message.product.images.length > 0 && (
                                  <img
                                    src={
                                      (
                                        message.product.images[0] as {
                                          imageUrl?: string;
                                        }
                                      )?.imageUrl || ""
                                    }
                                    alt={message.product.productName}
                                    className="w-16 h-16 object-cover rounded flex-shrink-0"
                                  />
                                )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">
                                  {message.product.productName}
                                </h4>
                                <p className="text-lg font-bold text-green-600 mt-1">
                                  {message.product.unitPrice.toLocaleString(
                                    "vi-VN"
                                  )}
                                  ₫
                                </p>
                              </div>
                            </div>
                            {message.product.description && (
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {message.product.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-xs pt-1">
                              <span className="text-gray-500">
                                Kho: {message.product.stockQuantity}
                              </span>
                              <span className="text-yellow-600">
                                ⭐ {message.product.ratingAverage.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      {message.images && message.images.length > 0 && (
                        <div className="mb-2 space-y-1">
                          {message.images.map((img) => (
                            <img
                              key={img.id}
                              src={img.imageUrl}
                              alt="Attachment"
                              className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90"
                              onClick={() =>
                                window.open(img.imageUrl, "_blank")
                              }
                            />
                          ))}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap break-words">
                        {message.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="px-3 py-2.5 bg-white border-t border-gray-200">
              {/* Image Preview */}
              {selectedImages.length > 0 && (
                <div className="mb-2 flex gap-2 overflow-x-auto pb-2">
                  {selectedImages.map((file, index) => (
                    <div key={index} className="relative flex-shrink-0">
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
                  disabled={isSending}
                  className="flex-1 text-sm border-gray-300 rounded-full focus:ring-blue-500 h-9"
                />
                <Button
                  onClick={handleSend}
                  disabled={
                    (!inputValue.trim() && selectedImages.length === 0) ||
                    isSending
                  }
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-8 w-8 p-0 flex items-center justify-center flex-shrink-0"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
};
