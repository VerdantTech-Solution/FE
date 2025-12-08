import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, History, Bot, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { 
  sendChatbotMessage, 
  getChatbotConversations, 
  getChatbotMessages, 
  createChatbotConversation, 
  type ChatbotConversation as BackendConversation,
  type ChatbotMessage as BackendMessage,
} from '@/api/chatbot';
import { parseProductsFromMessage } from '@/utils/parseChatProducts';
import { ChatProductCarousel } from '@/components/ChatProductCarousel';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  'Giới thiệu về nền tảng VerdantTech',
  'Tôi muốn tư vấn canh tác bền vững',
  'Tôi có thể liên hệ hỗ trợ như thế nào',
  'Tôi muốn biết thêm về các chính sách của cửa hàng ? ',
  'Phương thức thanh toán nào hiện đang được hỗ trợ?',
];

export const ChatAIBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Tạo key localStorage theo từng user để tránh user này thấy lịch sử chat của user khác
  const getStorageKeys = () => {
    const userId = user?.id ?? 'guest';
    return {
      conversationsKey: `chatAI_conversations_${userId}`,
      currentConversationIdKey: `chatAI_currentConversationId_${userId}`,
      legacyHistoryKey: `chatAI_history_${userId}`,
    };
  };
  
  // Ẩn chat button ở trang Login, SignUp, Vendor, Staff và Admin
  // Hoặc khi user có role Staff, Admin, Vendor (kể cả ở trang loading)
  const shouldHideChat = 
    location.pathname === '/login' || 
    location.pathname === '/signup' ||
    location.pathname.startsWith('/vendor') ||
    location.pathname.startsWith('/staff') ||
    location.pathname.startsWith('/admin') ||
    user?.role === 'Staff' ||
    user?.role === 'Admin' ||
    user?.role === 'Vendor';
  
  // Helper function to validate Date objects
  const isValidDate = (date: any): date is Date => {
    return date instanceof Date && !isNaN(date.getTime());
  };

  // Load current conversation from localStorage (theo từng user)
  const loadCurrentConversation = (): Message[] => {
    const { conversationsKey, currentConversationIdKey, legacyHistoryKey } = getStorageKeys();
    try {
      const conversations = localStorage.getItem(conversationsKey);
      const currentId = localStorage.getItem(currentConversationIdKey);
      
      if (conversations && currentId) {
        const parsed = JSON.parse(conversations);
        const currentConv = parsed.find((c: any) => c.id === currentId);
        if (currentConv && currentConv.messages && Array.isArray(currentConv.messages)) {
          return currentConv.messages.map((msg: any) => {
            const timestamp = new Date(msg.timestamp);
            return {
              id: msg.id || Date.now().toString(),
              text: msg.text || '',
              sender: msg.sender || 'ai',
              timestamp: isValidDate(timestamp) ? timestamp : new Date(),
            };
          });
        }
      }
      
      // Fallback to old format cho từng user để backward compatibility
      const saved = localStorage.getItem(legacyHistoryKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((msg: any) => {
            const timestamp = new Date(msg.timestamp);
            return {
              id: msg.id || Date.now().toString(),
              text: msg.text || '',
              sender: msg.sender || 'ai',
              timestamp: isValidDate(timestamp) ? timestamp : new Date(),
            };
          });
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
    return [
      {
        id: '1',
        text: 'Xin chào! Tôi là Verdant AI. Tôi có thể giúp gì cho bạn hôm nay?',
        sender: 'ai',
        timestamp: new Date(),
      },
    ];
  };

  const [messages, setMessages] = useState<Message[]>(loadCurrentConversation);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [_isLoadingConversation, setIsLoadingConversation] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversation from backend when user changes or component mounts
  useEffect(() => {
    const loadConversationFromBackend = async () => {
      if (!user?.id) {
        // Fallback to localStorage for guest users
        const loadedMessages = loadCurrentConversation();
        setMessages(loadedMessages);
        return;
      }

      // First, load from localStorage for immediate display
      const cachedMessages = loadCurrentConversation();
      if (cachedMessages.length > 0) {
        setMessages(cachedMessages);
      }

      try {
        setIsLoadingConversation(true);
        // Get the most recent conversation
        const conversationsResponse = await getChatbotConversations(1, 1);
        
        if (conversationsResponse.items.length > 0) {
          const latestConv = conversationsResponse.items[0];
          setCurrentConversationId(latestConv.id);
          
          // Update localStorage cache with conversation ID
          const { currentConversationIdKey } = getStorageKeys();
          localStorage.setItem(currentConversationIdKey, latestConv.id.toString());
          
          // Try to load messages from backend (but don't overwrite if we have cached messages)
          try {
            const messagesResponse = await getChatbotMessages(latestConv.id, 1, 100);
            const backendMessages = messagesResponse.items;
            
            // Convert backend messages to local format
            const localMessages: Message[] = backendMessages.map((msg: BackendMessage) => {
              const timestamp = new Date(msg.createdAt);
              return {
                id: msg.id.toString(),
                text: msg.content || '',
                sender: msg.sender || 'ai',
                timestamp: isValidDate(timestamp) ? timestamp : new Date(),
              };
            });
            
            // Only update if we have messages from backend
            if (localMessages.length > 0) {
              setMessages(localMessages);
              // Save to localStorage
              const { conversationsKey } = getStorageKeys();
              try {
                const saved = localStorage.getItem(conversationsKey);
                const conversations = saved ? JSON.parse(saved) : [];
                const existingConv = conversations.find((c: any) => c.id === latestConv.id.toString());
                
                if (existingConv) {
                  existingConv.messages = localMessages;
                  existingConv.updatedAt = new Date();
                } else {
                  conversations.push({
                    id: latestConv.id.toString(),
                    title: latestConv.title || 'Cuộc trò chuyện mới',
                    messages: localMessages,
                    createdAt: new Date(latestConv.createdAt),
                    updatedAt: new Date(latestConv.updatedAt),
                  });
                }
                localStorage.setItem(conversationsKey, JSON.stringify(conversations));
              } catch (error) {
                console.error('Error saving to localStorage:', error);
              }
            } else if (cachedMessages.length === 0 || (cachedMessages.length === 1 && cachedMessages[0].id === '1')) {
              // No messages from backend and no cached messages (or only welcome), show welcome
              setMessages([getWelcomeMessage()]);
            }
          } catch (messagesError) {
            console.error('Error loading messages from backend:', messagesError);
            // Keep cached messages if available
            if (cachedMessages.length === 0 || (cachedMessages.length === 1 && cachedMessages[0].id === '1')) {
              setMessages([getWelcomeMessage()]);
            }
          }
        } else {
          // No conversations, show welcome message only if no cached messages
          if (cachedMessages.length === 0 || (cachedMessages.length === 1 && cachedMessages[0].id === '1')) {
            setMessages([getWelcomeMessage()]);
          }
        }
      } catch (error) {
        console.error('Error loading conversation from backend:', error);
        // Keep cached messages if available
        if (cachedMessages.length === 0 || (cachedMessages.length === 1 && cachedMessages[0].id === '1')) {
          const loadedMessages = loadCurrentConversation();
          setMessages(loadedMessages);
        }
      } finally {
        setIsLoadingConversation(false);
      }
    };

    loadConversationFromBackend();
  }, [user?.id]);

  // Save chat history to current conversation
  useEffect(() => {
    if (messages.length > 1) {
      try {
        const { conversationsKey, currentConversationIdKey, legacyHistoryKey } = getStorageKeys();
        const conversations = localStorage.getItem(conversationsKey);
        const currentId = localStorage.getItem(currentConversationIdKey);
        
        if (conversations && currentId) {
          const parsed = JSON.parse(conversations);
          const updated = parsed.map((conv: any) => {
            if (conv.id === currentId) {
              return {
                ...conv,
                messages: messages,
                updatedAt: new Date(),
              };
            }
            return conv;
          });
          localStorage.setItem(conversationsKey, JSON.stringify(updated));
        } else {
          // Fallback: save to old format for backward compatibility
          localStorage.setItem(legacyHistoryKey, JSON.stringify(messages));
        }
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
    }
  }, [messages]);

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
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const getWelcomeMessage = (): Message => ({
    id: '1',
    text: 'Xin chào! Tôi là Verdant AI. Tôi có thể giúp gì cho bạn hôm nay?',
    sender: 'ai',
    timestamp: new Date(),
  });

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    let conversationId = currentConversationId;
    const { currentConversationIdKey } = getStorageKeys();

    try {
      // Create conversation if it doesn't exist
      if (!conversationId && user?.id) {
        const title = userMessage.text.length > 30 
          ? userMessage.text.substring(0, 30) + '...' 
          : userMessage.text;
        const newConversation = await createChatbotConversation(title);
        conversationId = newConversation.id;
        setCurrentConversationId(conversationId);
        localStorage.setItem(currentConversationIdKey, conversationId.toString());
      }

      // Get AI response
      const sessionId = conversationId?.toString() || undefined;
      const aiText = await sendChatbotMessage(userMessage.text, sessionId);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);

      // Update localStorage cache
      if (conversationId) {
        const { conversationsKey } = getStorageKeys();
        try {
          const saved = localStorage.getItem(conversationsKey);
          const conversations = saved ? JSON.parse(saved) : [];
          const existingConv = conversations.find((c: any) => c.id === conversationId?.toString());
          
          if (existingConv) {
            existingConv.messages = [...messages, userMessage, aiResponse];
            existingConv.updatedAt = new Date();
            localStorage.setItem(conversationsKey, JSON.stringify(conversations));
          }
        } catch (error) {
          console.error('Error updating localStorage cache:', error);
        }
      }
    } catch (error: any) {
      console.error('Error sending chat message:', error);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: error?.message || 'Xin lỗi, tôi chưa thể phản hồi ngay lúc này. Vui lòng thử lại sau.',
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
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

  const handleClearHistory = () => {
    const welcomeMessage: Message = {
      id: '1',
      text: 'Xin chào! Tôi là Verdant AI. Tôi có thể giúp gì cho bạn hôm nay?',
      sender: 'ai',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    
    // Clear from conversations (theo từng user)
    try {
      const { conversationsKey, currentConversationIdKey, legacyHistoryKey } = getStorageKeys();
      const conversations = localStorage.getItem(conversationsKey);
      const currentId = localStorage.getItem(currentConversationIdKey);
      
      if (conversations && currentId) {
        const parsed = JSON.parse(conversations);
        const updated = parsed.map((conv: any) => {
          if (conv.id === currentId) {
            return {
              ...conv,
              messages: [welcomeMessage],
              updatedAt: new Date(),
            };
          }
          return conv;
        });
        localStorage.setItem(conversationsKey, JSON.stringify(updated));
      } else {
        localStorage.removeItem(legacyHistoryKey);
      }
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const formatTime = (date: Date) => {
    if (!isValidDate(date)) {
      return '';
    }
    try {
      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  // Ẩn chat button ở trang Login và SignUp
  if (shouldHideChat) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50 md:bottom-6 md:right-6 sm:bottom-4 sm:right-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg hover:shadow-xl flex items-center justify-center text-white relative group"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="message"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Pulse animation */}
          {!isOpen && (
            <motion.div
              className="absolute inset-0 rounded-full bg-green-400"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-40 w-96 h-[600px] flex flex-col md:w-96 md:h-[600px] sm:w-full sm:h-screen sm:bottom-0 sm:right-0 sm:rounded-none"
          >
            <Card className="flex flex-col h-full shadow-2xl border-2 border-green-100">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Trợ lý Verdant AI</h3>
                    <p className="text-xs text-green-100">Tư vấn nông nghiệp bền vững</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/chat');
                    }}
                    className="text-white hover:bg-white/20"
                    title="Xem lịch sử chat"
                  >
                    <History className="w-4 h-4" />
                  </Button>
                  {messages.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearHistory}
                      className="text-white hover:bg-white/20"
                      title="Xóa lịch sử chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4"
              >
                {messages.map((message) => {
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
                          <div className="bg-white rounded-2xl px-4 py-4 shadow-md border border-green-100 w-full overflow-hidden">
                            {/* Text content if any */}
                            {textWithoutProducts && (
                              <div className="mb-4 pb-4 border-b border-gray-100">
                                <p className="text-sm whitespace-pre-line text-gray-800 leading-relaxed">
                                  {textWithoutProducts}
                                </p>
                              </div>
                            )}
                            
                            {/* Products Section Header */}
                            <div className="mb-3 flex items-center gap-2">
                              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-green-200 to-transparent"></div>
                              <span className="text-xs font-semibold text-green-600 px-2">
                                {products.length} {products.length === 1 ? 'sản phẩm' : 'sản phẩm'}
                              </span>
                              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-green-200 to-transparent"></div>
                            </div>
                            
                            {/* Products Carousel */}
                            <div className="w-full overflow-visible">
                              <ChatProductCarousel products={products} />
                            </div>
                            
                            <p className="text-xs mt-4 pt-3 text-gray-400 text-right border-t border-gray-50">
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
                            <p className="text-sm whitespace-pre-line">{message.text || ''}</p>
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
                    disabled={isTyping}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

