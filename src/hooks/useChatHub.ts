import { useEffect, useState, useCallback } from 'react';
import { useChat } from '@/contexts/ChatContext';
import type { ChatMessage } from '@/services/chatSignalR';

/**
 * Hook để sử dụng ChatHub trong components
 * Wrapper tiện lợi cho ChatContext
 */
export function useChatHub() {
  const { 
    connectionState, 
    isConnected, 
    onMessage, 
    onTypingIndicator,
    sendTypingIndicator,
    joinConversation,
    leaveConversation,
    markAsRead
  } = useChat();

  return {
    connectionState,
    isConnected,
    onMessage,
    onTypingIndicator,
    sendTypingIndicator,
    joinConversation,
    leaveConversation,
    markAsRead,
  };
}

/**
 * Hook để quản lý messages cho một conversation cụ thể
 */
export function useChatMessages(conversationId: number) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { onMessage, onTypingIndicator } = useChat();

  // Subscribe to new messages
  useEffect(() => {
    const unsubscribe = onMessage((message) => {
      // Only add message if it belongs to this conversation
      if (message.conversationId === conversationId) {
        setMessages((prev) => {
          // Check if message already exists
          if (prev.some((m) => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
      }
    });

    return unsubscribe;
  }, [onMessage, conversationId]);

  // Subscribe to typing indicator
  useEffect(() => {
    const unsubscribe = onTypingIndicator((indicator) => {
      if (indicator.conversationId === conversationId) {
        setIsTyping(true);
        
        // Clear typing indicator after 3s
        const timer = setTimeout(() => setIsTyping(false), 3000);
        return () => clearTimeout(timer);
      }
    });

    return unsubscribe;
  }, [onTypingIndicator, conversationId]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    setMessages,
    addMessage,
    clearMessages,
    isTyping,
  };
}

/**
 * Hook để quản lý unread count
 */
export function useUnreadCount() {
  const [totalUnread, setTotalUnread] = useState(0);
  const { onMessage } = useChat();

  useEffect(() => {
    const unsubscribe = onMessage((message) => {
      // Increment unread count for new messages from others
      if (!message.isRead) {
        setTotalUnread((prev) => prev + 1);
      }
    });

    return unsubscribe;
  }, [onMessage]);

  const resetUnread = useCallback(() => {
    setTotalUnread(0);
  }, []);

  return {
    totalUnread,
    setTotalUnread,
    resetUnread,
  };
}

export default useChatHub;
