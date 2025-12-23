import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Search, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  text: string;
  sender: "vendor" | "customer";
  timestamp: Date;
}

interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
}

interface OpenChatWindow {
  conversationId: string;
  isMinimized: boolean;
}

export const VendorChatBubble = () => {
  const [isListOpen, setIsListOpen] = useState(false);
  const [openChats, setOpenChats] = useState<OpenChatWindow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      customerId: "c1",
      customerName: "Nguyễn Văn An",
      lastMessage: "Sản phẩm của bạn có còn hàng không?",
      lastMessageTime: new Date(Date.now() - 5 * 60000),
      unreadCount: 2,
      isOnline: true,
    },
    {
      id: "2",
      customerId: "c2",
      customerName: "Trần Thị Bình",
      lastMessage: "Cảm ơn bạn, tôi sẽ đặt hàng ngay!",
      lastMessageTime: new Date(Date.now() - 30 * 60000),
      unreadCount: 0,
      isOnline: false,
    },
    {
      id: "3",
      customerId: "c3",
      customerName: "Lê Hoàng Nam",
      lastMessage: "Khi nào thì giao hàng?",
      lastMessageTime: new Date(Date.now() - 2 * 60 * 60000),
      unreadCount: 1,
      isOnline: true,
    },
    {
      id: "4",
      customerId: "c4",
      customerName: "Phạm Minh Châu",
      lastMessage: "Shop có giao hàng nhanh không?",
      lastMessageTime: new Date(Date.now() - 5 * 60 * 60000),
      unreadCount: 0,
      isOnline: false,
    },
  ]);

  const [messages, setMessages] = useState<Record<string, Message[]>>({
    "1": [
      {
        id: "m1",
        text: "Xin chào, tôi muốn hỏi về sản phẩm phân bón hữu cơ",
        sender: "customer",
        timestamp: new Date(Date.now() - 10 * 60000),
      },
      {
        id: "m2",
        text: "Xin chào! Vâng, chúng tôi có nhiều loại phân bón hữu cơ chất lượng cao. Bạn cần loại nào?",
        sender: "vendor",
        timestamp: new Date(Date.now() - 8 * 60000),
      },
      {
        id: "m3",
        text: "Sản phẩm của bạn có còn hàng không?",
        sender: "customer",
        timestamp: new Date(Date.now() - 5 * 60000),
      },
    ],
    "2": [
      {
        id: "m4",
        text: "Giá sản phẩm này bao nhiêu vậy shop?",
        sender: "customer",
        timestamp: new Date(Date.now() - 60 * 60000),
      },
      {
        id: "m5",
        text: "Giá là 250.000đ cho 5kg ạ. Hiện đang có khuyến mãi giảm 10% nếu mua từ 3 gói trở lên!",
        sender: "vendor",
        timestamp: new Date(Date.now() - 45 * 60000),
      },
      {
        id: "m6",
        text: "Cảm ơn bạn, tôi sẽ đặt hàng ngay!",
        sender: "customer",
        timestamp: new Date(Date.now() - 30 * 60000),
      },
    ],
    "3": [
      {
        id: "m7",
        text: "Khi nào thì giao hàng?",
        sender: "customer",
        timestamp: new Date(Date.now() - 2 * 60 * 60000),
      },
    ],
    "4": [
      {
        id: "m8",
        text: "Shop có giao hàng nhanh không?",
        sender: "customer",
        timestamp: new Date(Date.now() - 5 * 60 * 60000),
      },
    ],
  });

  const handleOpenChat = (conversationId: string) => {
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

    setOpenChats((prev) => {
      const newChat = { conversationId, isMinimized: false };
      if (prev.length >= 3) {
        return [...prev.slice(1), newChat];
      }
      return [...prev, newChat];
    });
  };

  const handleCloseChat = (conversationId: string) => {
    setOpenChats((prev) =>
      prev.filter((chat) => chat.conversationId !== conversationId)
    );
  };

  const handleToggleMinimize = (conversationId: string) => {
    setOpenChats((prev) =>
      prev.map((chat) =>
        chat.conversationId === conversationId
          ? { ...chat, isMinimized: !chat.isMinimized }
          : chat
      )
    );
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
                  <h3 className="font-bold text-xl text-gray-900">Tin nhắn</h3>
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
                {filteredConversations.length === 0 ? (
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
            onClose={() => handleCloseChat(chat.conversationId)}
            onToggleMinimize={() => handleToggleMinimize(chat.conversationId)}
            onSendMessage={(text) => {
              const newMessage: Message = {
                id: `m-${Date.now()}`,
                text,
                sender: "vendor",
                timestamp: new Date(),
              };
              setMessages((prev) => ({
                ...prev,
                [chat.conversationId]: [
                  ...(prev[chat.conversationId] || []),
                  newMessage,
                ],
              }));
              setConversations((prev) =>
                prev.map((conv) =>
                  conv.id === chat.conversationId
                    ? {
                        ...conv,
                        lastMessage: text,
                        lastMessageTime: new Date(),
                      }
                    : conv
                )
              );
            }}
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
  onClose: () => void;
  onToggleMinimize: () => void;
  onSendMessage: (text: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  isMinimized,
  onClose,
  onToggleMinimize,
  onSendMessage,
}) => {
  const [inputValue, setInputValue] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current && !isMinimized) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isMinimized]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputValue("");
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
              {messages.map((message) => (
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
                    <p className="whitespace-pre-wrap break-words">
                      {message.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="px-3 py-2.5 bg-white border-t border-gray-200">
              <div className="flex gap-2 items-center">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Aa"
                  className="flex-1 text-sm border-gray-300 rounded-full focus:ring-blue-500 h-9"
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-8 w-8 p-0 flex items-center justify-center flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
};
