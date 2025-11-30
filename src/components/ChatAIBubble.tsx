import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, History, Bot, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { sendChatbotMessage } from '@/api/chatbot';
import { parseProductsFromMessage } from '@/utils/parseChatProducts';
import { ChatProductCarousel } from '@/components/ChatProductCarousel';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  'Làm thế nào để đăng ký tài khoản?',
  'Cách mua sản phẩm trên nền tảng?',
  'Phương thức thanh toán nào được hỗ trợ?',
  'Làm sao để trở thành nhà cung cấp?',
  'Chính sách đổi trả như thế nào?',
  'Cách theo dõi đơn hàng của tôi?',
  'Phí vận chuyển được tính như thế nào?',
  'Làm thế nào để liên hệ hỗ trợ?',
];

export const ChatAIBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
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
  
  // Load current conversation from localStorage
  const loadCurrentConversation = (): Message[] => {
    try {
      const conversations = localStorage.getItem('chatAI_conversations');
      const currentId = localStorage.getItem('chatAI_currentConversationId');
      
      if (conversations && currentId) {
        const parsed = JSON.parse(conversations);
        const currentConv = parsed.find((c: any) => c.id === currentId);
        if (currentConv && currentConv.messages) {
          return currentConv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
        }
      }
      
      // Fallback to old format for backward compatibility
      const saved = localStorage.getItem('chatAI_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
    return [
      {
        id: '1',
        text: 'Xin chào! Tôi là trợ lý AI của VerdantTech. Tôi có thể giúp gì cho bạn hôm nay?',
        sender: 'ai',
        timestamp: new Date(),
      },
    ];
  };

  const [messages, setMessages] = useState<Message[]>(loadCurrentConversation);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save chat history to current conversation
  useEffect(() => {
    if (messages.length > 1) {
      try {
        const conversations = localStorage.getItem('chatAI_conversations');
        const currentId = localStorage.getItem('chatAI_currentConversationId');
        
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
          localStorage.setItem('chatAI_conversations', JSON.stringify(updated));
        } else {
          // Fallback: save to old format for backward compatibility
          localStorage.setItem('chatAI_history', JSON.stringify(messages));
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
    text: 'Xin chào! Tôi là trợ lý AI của VerdantTech. Tôi có thể giúp gì cho bạn hôm nay?',
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

    // Get or create current conversation
    let conversations = [];
    let currentId = localStorage.getItem('chatAI_currentConversationId');
    
    try {
      const saved = localStorage.getItem('chatAI_conversations');
      if (saved) {
        conversations = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
    
    // Create new conversation if none exists
    if (!currentId || !conversations.find((c: any) => c.id === currentId)) {
      const newConversation = {
        id: Date.now().toString(),
        title: userMessage.text.length > 30 
          ? userMessage.text.substring(0, 30) + '...' 
          : userMessage.text,
        messages: [getWelcomeMessage()],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      conversations = [newConversation, ...conversations];
      currentId = newConversation.id;
      localStorage.setItem('chatAI_conversations', JSON.stringify(conversations));
      localStorage.setItem('chatAI_currentConversationId', currentId);
    }

    // Update conversation with new messages
    const updatedConversations = conversations.map((conv: any) => {
      if (conv.id === currentId) {
        const newMessages = [...conv.messages, userMessage];
        // Update title from first user message if it's still default
        let title = conv.title;
        if (conv.title === 'Cuộc trò chuyện mới' && conv.messages.length === 1) {
          title = userMessage.text.length > 30 
            ? userMessage.text.substring(0, 30) + '...' 
            : userMessage.text;
        }
        return {
          ...conv,
          messages: newMessages,
          title: title,
          updatedAt: new Date(),
        };
      }
      return conv;
    });

    localStorage.setItem('chatAI_conversations', JSON.stringify(updatedConversations));

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const aiText = await sendChatbotMessage(userMessage.text, currentId || undefined);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      const finalConversations = updatedConversations.map((conv: any) => {
        if (conv.id === currentId) {
          return {
            ...conv,
            messages: [...conv.messages, aiResponse],
            updatedAt: new Date(),
          };
        }
        return conv;
      });
      
      localStorage.setItem('chatAI_conversations', JSON.stringify(finalConversations));
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error: any) {
      console.error('Error sending chat message:', error);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: error?.message || 'Xin lỗi, tôi chưa thể phản hồi ngay lúc này. Vui lòng thử lại sau.',
        sender: 'ai',
        timestamp: new Date(),
      };

      const finalConversations = updatedConversations.map((conv: any) => {
        if (conv.id === currentId) {
          return {
            ...conv,
            messages: [...conv.messages, aiResponse],
            updatedAt: new Date(),
          };
        }
        return conv;
      });

      localStorage.setItem('chatAI_conversations', JSON.stringify(finalConversations));
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
      text: 'Xin chào! Tôi là trợ lý AI của VerdantTech. Tôi có thể giúp gì cho bạn hôm nay?',
      sender: 'ai',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    
    // Clear from conversations
    try {
      const conversations = localStorage.getItem('chatAI_conversations');
      const currentId = localStorage.getItem('chatAI_currentConversationId');
      
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
        localStorage.setItem('chatAI_conversations', JSON.stringify(updated));
      } else {
        localStorage.removeItem('chatAI_history');
      }
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
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
                    <h3 className="font-semibold">Trợ lý AI VerdantTech</h3>
                    <p className="text-xs text-green-100">Thường phản hồi trong vài giây</p>
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
                        className={`max-w-[75%] ${
                          message.sender === 'user'
                            ? 'rounded-2xl px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                            : 'w-full'
                        }`}
                      >
                        {message.sender === 'ai' && products.length > 0 ? (
                          <div className="bg-white rounded-2xl px-3 py-3 shadow-sm border border-gray-200 w-full">
                            {/* Text content if any */}
                            {textWithoutProducts && (
                              <p className="text-sm whitespace-pre-line text-gray-800 mb-3 leading-relaxed">
                                {textWithoutProducts}
                              </p>
                            )}
                            {/* Products Carousel */}
                            <div className="w-full">
                              <ChatProductCarousel products={products} />
                            </div>
                            <p className="text-xs mt-3 text-gray-500 text-right">
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

