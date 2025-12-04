import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Bot, User, Trash2, History, Send, Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router';
import { sendChatbotMessage } from '@/api/chatbot';
import { parseProductsFromMessage } from '@/utils/parseChatProducts';
import { ChatProductCarousel } from '@/components/ChatProductCarousel';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const SUGGESTED_QUESTIONS = [
  'Verdant Tech là gì ',
  'Tôi muốn tư vấn canh tác bền vững',
  'Tôi có thể liên hệ hỗ trợ như thế nào',
  'Chính sách mua hàng là gì ? ',
  'Phương thức thanh toán nào được hỗ trợ?',
 
];

const getWelcomeMessage = (): Message => ({
  id: '1',
  text: 'Xin chào! Tôi là trợ lý AI của VerdantTech. Tôi có thể giúp gì cho bạn hôm nay?',
  sender: 'ai',
  timestamp: new Date(),
});

// Helper tạo key localStorage theo từng user
const getStorageKeys = (userId?: number | string) => {
  const key = userId ?? 'guest';
  return {
    conversationsKey: `chatAI_conversations_${key}`,
    currentConversationIdKey: `chatAI_currentConversationId_${key}`,
  };
};

// Load conversations từ localStorage (theo từng user)
const loadConversations = (userId?: number | string): Conversation[] => {
  const { conversationsKey } = getStorageKeys(userId);
  try {
    const saved = localStorage.getItem(conversationsKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((conv: any) => ({
        ...conv,
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
      }));
    }
  } catch (error) {
    console.error('Error loading conversations:', error);
  }
  return [];
};

// Save conversations to localStorage (theo từng user)
const saveConversations = (conversations: Conversation[], userId?: number | string) => {
  try {
    const { conversationsKey } = getStorageKeys(userId);
    localStorage.setItem(conversationsKey, JSON.stringify(conversations));
  } catch (error) {
    console.error('Error saving conversations:', error);
  }
};

// Get current conversation ID
const getCurrentConversationId = (): string | null => {
  return localStorage.getItem('chatAI_currentConversationId');
};

// Set current conversation ID
const setCurrentConversationId = (id: string | null) => {
  if (id) {
    localStorage.setItem('chatAI_currentConversationId', id);
  } else {
    localStorage.removeItem('chatAI_currentConversationId');
  }
};

export const ChatPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    loadConversations(user?.id),
  );
  const [currentConversationId, setCurrentConversationIdState] = useState<string | null>(getCurrentConversationId());
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Get current conversation
  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const messages = currentConversation?.messages || [getWelcomeMessage()];

  // Initialize with first conversation or create new one
  useEffect(() => {
    if (conversations.length === 0) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: 'Cuộc trò chuyện mới',
        messages: [getWelcomeMessage()],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setConversations([newConversation]);
      setCurrentConversationIdState(newConversation.id);
      setCurrentConversationId(newConversation.id);
    } else if (!currentConversationId) {
      // If no current conversation, use the most recent one
      const mostRecent = [...conversations].sort((a, b) => 
        b.updatedAt.getTime() - a.updatedAt.getTime()
      )[0];
      setCurrentConversationIdState(mostRecent.id);
      setCurrentConversationId(mostRecent.id);
    }
  }, []);

  // Save conversations when they change
  useEffect(() => {
    if (conversations.length > 0) {
      saveConversations(conversations, user?.id);
    }
  }, [conversations, user?.id]);

  // Update current conversation ID in localStorage
  useEffect(() => {
    setCurrentConversationId(currentConversationId);
  }, [currentConversationId]);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentConversationId]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentConversationId]);

  const createConversation = (): Conversation => ({
    id: Date.now().toString(),
    title: 'Cuộc trò chuyện mới',
    messages: [getWelcomeMessage()],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const handleCreateNewConversation = () => {
    const newConversation = createConversation();
    setConversations([newConversation, ...conversations]);
    setCurrentConversationIdState(newConversation.id);
    setCurrentConversationId(newConversation.id);
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationIdState(id);
    setCurrentConversationId(id);
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    
    if (currentConversationId === id) {
      if (updated.length > 0) {
        const mostRecent = [...updated].sort((a, b) => 
          b.updatedAt.getTime() - a.updatedAt.getTime()
        )[0];
        setCurrentConversationIdState(mostRecent.id);
        setCurrentConversationId(mostRecent.id);
      } else {
        const newConversation = createConversation();
        setConversations([newConversation]);
        setCurrentConversationIdState(newConversation.id);
        setCurrentConversationId(newConversation.id);
        return;
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentConversationId) return;

    const conversationId = currentConversationId;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    // Update conversation title from first user message if it's still default
    const conversation = conversations.find(c => c.id === currentConversationId);
    let newTitle = conversation?.title || 'Cuộc trò chuyện mới';
    if (conversation && conversation.title === 'Cuộc trò chuyện mới' && conversation.messages.length === 1) {
      newTitle = userMessage.text.length > 30 
        ? userMessage.text.substring(0, 30) + '...' 
        : userMessage.text;
    }

    setConversations(prev =>
      prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: [...conv.messages, userMessage],
            title: newTitle,
            updatedAt: new Date(),
          };
        }
        return conv;
      }),
    );

    setInputValue('');
    setIsTyping(true);

    try {
      const aiText = await sendChatbotMessage(userMessage.text, conversationId);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        sender: 'ai',
        timestamp: new Date(),
      };

      setConversations(prev =>
        prev.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: [...conv.messages, aiResponse],
              updatedAt: new Date(),
            };
          }
          return conv;
        }),
      );
    } catch (error: any) {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text:
          error?.message ||
          'Xin lỗi, tôi chưa thể phản hồi ngay lúc này. Vui lòng thử lại sau.',
        sender: 'ai',
        timestamp: new Date(),
      };

      setConversations(prev =>
        prev.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: [...conv.messages, aiResponse],
              updatedAt: new Date(),
            };
          }
          return conv;
        }),
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartEditTitle = () => {
    if (currentConversation) {
      setEditingTitle(currentConversation.title);
      setIsEditingTitle(true);
      setTimeout(() => {
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
      }, 0);
    }
  };

  const handleSaveTitle = () => {
    if (currentConversationId && editingTitle.trim()) {
      setConversations(conversations.map(conv => {
        if (conv.id === currentConversationId) {
          return { ...conv, title: editingTitle.trim() };
        }
        return conv;
      }));
    }
    setIsEditingTitle(false);
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditingTitle('');
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    } else {
      return new Intl.DateTimeFormat('vi-VN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
    }
  };

  const formatConversationDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    } else {
      return new Intl.DateTimeFormat('vi-VN', {
        day: 'numeric',
        month: 'short',
      }).format(date);
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="my-[100px] h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 flex flex-col overflow-hidden"
    >
      <div className="flex-1 flex gap-2 md:gap-4 p-2 md:p-4 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Sidebar - Conversations List */}
        <Card className="w-64 md:w-80 flex-shrink-0 flex flex-col shadow-lg border-2 border-green-100 overflow-hidden min-w-0 hidden md:flex">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-lg">Lịch sử chat</h2>
            </div>
            <Button
              onClick={handleCreateNewConversation}
              className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tạo cuộc trò chuyện mới
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Chưa có cuộc trò chuyện nào</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations
                  .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
                  .map((conversation) => (
                    <motion.div
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors relative group ${
                        currentConversationId === conversation.id
                          ? 'bg-green-100 border-2 border-green-500'
                          : 'bg-white hover:bg-gray-50 border-2 border-transparent'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {conversation.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatConversationDate(conversation.updatedAt)}
                          </p>
                          {conversation.messages.length > 1 && (
                            <p className="text-xs text-gray-400 mt-1 truncate">
                              {conversation.messages[conversation.messages.length - 1]?.text || ''}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => handleDeleteConversation(conversation.id, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                          title="Xóa cuộc trò chuyện"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </div>
        </Card>

        {/* Main Chat Area */}
        <Card className="flex-1 flex flex-col shadow-lg border-2 border-green-100 overflow-hidden min-w-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div className="flex-1">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <Input
                      ref={titleInputRef}
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSaveTitle();
                        if (e.key === 'Escape') handleCancelEditTitle();
                      }}
                      onBlur={handleSaveTitle}
                      className="bg-white/20 text-white border-white/30 focus:bg-white/30"
                      placeholder="Nhập tiêu đề..."
                    />
                  </div>
                ) : (
                  <div>
                    <h3 
                      className="font-semibold cursor-pointer hover:underline"
                      onClick={handleStartEditTitle}
                      title="Click để đổi tên"
                    >
                      {currentConversation?.title || 'Trợ lý AI VerdantTech'}
                    </h3>
                    <p className="text-xs text-green-100">Thường phản hồi trong vài giây</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-white hover:bg-white/20"
                title="Quay lại"
              >
                ← Quay lại
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4 min-h-0"
          >
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                {/* Date Separator */}
                <div className="flex items-center justify-center my-4">
                  <div className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm border border-gray-200">
                    <History className="w-3 h-3 inline mr-1" />
                    {date}
                  </div>
                </div>

                {/* Messages for this date */}
                {dateMessages.map((message) => {
                  // Parse products from AI messages
                  const { products, textWithoutProducts } = 
                    message.sender === 'ai' 
                      ? parseProductsFromMessage(message.text)
                      : { products: [], textWithoutProducts: message.text };

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.sender === 'ai' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div
                        className={`${
                          message.sender === 'user'
                            ? 'max-w-[75%] rounded-2xl px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                            : 'w-full max-w-full'
                        }`}
                      >
                        {message.sender === 'ai' && products.length > 0 ? (
                          <div className="bg-white rounded-2xl px-3 py-3 shadow-sm border border-gray-200 w-full max-w-full overflow-hidden">
                            {/* Text content if any */}
                            {textWithoutProducts && (
                              <p className="text-sm whitespace-pre-line text-gray-800 mb-3 break-words">
                                {textWithoutProducts}
                              </p>
                            )}
                            {/* Products Carousel */}
                            <div className="w-full max-w-full overflow-hidden">
                              <ChatProductCarousel products={products} />
                            </div>
                            <p className="text-xs mt-2 text-gray-500 text-right">
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        ) : (
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              message.sender === 'user'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                                : 'bg-white text-gray-800 shadow-sm border border-gray-200'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-line">{message.text}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                              }`}
                            >
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        )}
                      </div>
                      {message.sender === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2 justify-start"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
                  <div className="flex gap-1">
                    <motion.div
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Suggested Questions */}
            {messages.length === 1 && !isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2 mt-4"
              >
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <History className="w-4 h-4" />
                  <span>Câu hỏi thường gặp:</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {SUGGESTED_QUESTIONS.slice(0, 4).map((question, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="text-left text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-green-50 hover:border-green-300 transition-colors text-gray-700"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {question}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1"
                disabled={isTyping || !currentConversationId}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping || !currentConversationId}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {messages.length > 1 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.slice(0, 3).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="text-xs bg-gray-100 hover:bg-green-100 text-gray-600 px-2 py-1 rounded-full transition-colors"
                  >
                    {question.length > 30 ? `${question.substring(0, 30)}...` : question}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  );
};
