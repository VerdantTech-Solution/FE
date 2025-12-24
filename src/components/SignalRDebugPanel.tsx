import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ConnectionState } from "@/types/chat";
import { CONNECTION_STATES } from "@/types/chat";
import { chatHubService } from "@/services/chatHub";

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
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [hubUrl] = useState(() => chatHubService.getHubUrl());

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    // Connect to chat hub
    chatHubService.connect(token);

    // Subscribe to connection state changes
    const unsubscribeState = chatHubService.onConnectionStateChange((state) => {
      setConnectionState(state);
      setConnectionId(chatHubService.getConnectionId());
      console.log("[SignalRDebugPanel] 🔄 Connection state:", state);
    });

    // Subscribe to messages for counting
    const unsubscribeMessage = chatHubService.onMessage((message) => {
      setMessageCount((prev) => prev + 1);
      setLastMessage(
        `${message.senderType}: ${message.messageText.substring(0, 50)}...`
      );
      console.log("[SignalRDebugPanel] 📨 Message received:", message);
    });

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
    console.log("[SignalRDebugPanel] 🧪 Testing connection...");
    chatHubService.debug();
  };

  const handleDisconnect = async () => {
    await chatHubService.disconnect();
    setConnectionId(null);
  };

  const handleConnect = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    await chatHubService.connect(token);
    setConnectionId(chatHubService.getConnectionId());
  };

  const handleForceReconnect = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    console.log("[SignalRDebugPanel] 🔄 Force reconnecting...");
    await chatHubService.disconnect();

    setTimeout(() => {
      chatHubService.connect(token);
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
            <span className="text-gray-600">Hub URL:</span>
            <span className="font-semibold truncate max-w-[160px]" title={hubUrl}>
              {hubUrl}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Conn ID:</span>
            <span className="font-semibold truncate max-w-[160px]" title={connectionId ?? ""}>
              {connectionId ?? "—"}
            </span>
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
            onClick={handleConnect}
            size="sm"
            className="w-full"
            variant="outline"
          >
            Connect
          </Button>

          <Button
            onClick={handleDisconnect}
            size="sm"
            className="w-full"
            variant="outline"
          >
            Disconnect
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
