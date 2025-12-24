import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getChatSignalRService,
  initChatSignalRService,
  CONNECTION_STATES,
  type ConnectionState,
} from "@/services/chatSignalR";

/**
 * Debug panel để kiểm tra SignalR connection status
 * Chỉ hiển thị trong development mode
 */
export const SignalRDebugPanel = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    CONNECTION_STATES.Disconnected
  );
  const [messageCount, setMessageCount] = useState(0);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const chatService = initChatSignalRService(token);

    // Subscribe to connection state changes
    const unsubscribeState = chatService.onConnectionStateChange((state) => {
      setConnectionState(state);
      console.log("[SignalRDebugPanel] 🔄 Connection state:", state);
    });

    // Subscribe to messages for counting
    const unsubscribeMessage = chatService.onMessage((message) => {
      setMessageCount((prev) => prev + 1);
      setLastMessage(
        `${message.senderType}: ${message.messageText.substring(0, 50)}...`
      );
      console.log("[SignalRDebugPanel] 📨 Message received:", message);
    });

    chatService.start();

    return () => {
      unsubscribeState();
      unsubscribeMessage();
    };
  }, []);

  const getStatusColor = () => {
    switch (connectionState) {
      case CONNECTION_STATES.Connected:
        return "bg-green-500";
      case CONNECTION_STATES.Connecting:
        return "bg-yellow-500";
      case CONNECTION_STATES.Reconnecting:
        return "bg-orange-500";
      default:
        return "bg-red-500";
    }
  };

  const handleTestConnection = () => {
    const service = getChatSignalRService();
    if (service) {
      console.log("[SignalRDebugPanel] 🧪 Testing connection...");
      service.testConnection();
    } else {
      console.error("[SignalRDebugPanel] ❌ No service instance found!");
    }
  };

  const handleForceReconnect = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    console.log("[SignalRDebugPanel] 🔄 Force reconnecting...");
    const service = getChatSignalRService();
    if (service) {
      await service.stop();
    }

    setTimeout(() => {
      const newService = initChatSignalRService(token);
      newService.start();
    }, 1000);
  };

  // Only show in development
  if (import.meta.env.MODE !== "development") {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 z-50 p-4 w-80 shadow-xl bg-white/95 backdrop-blur">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm">SignalR Debug Panel</h3>
          <div
            className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}
          />
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className="font-semibold">{connectionState}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Messages:</span>
            <span className="font-semibold">{messageCount}</span>
          </div>

          {lastMessage && (
            <div className="border-t pt-2">
              <span className="text-gray-600">Last message:</span>
              <p className="text-xs mt-1 text-gray-800 truncate">
                {lastMessage}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleTestConnection}
            size="sm"
            className="w-full"
            variant="outline"
          >
            Test Connection
          </Button>

          <Button
            onClick={handleForceReconnect}
            size="sm"
            className="w-full"
            variant="outline"
          >
            Force Reconnect
          </Button>
        </div>

        <div className="text-xs text-gray-500 border-t pt-2">
          💡 Check browser console for detailed logs
        </div>
      </div>
    </Card>
  );
};
