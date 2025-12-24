import { StrictMode } from "react";
import { BrowserRouter } from "react-router";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "./index.css";
import App from "./App.tsx";
import AuthProvider from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ChatProvider } from "./contexts/ChatContext";
import { ConversationProvider } from "./contexts/ConversationContext";
import { Toaster } from "sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { store } from "./state/store";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <ChatProvider>
              <ConversationProvider>
                <CartProvider>
                  <GoogleOAuthProvider
                    clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
                  >
                    <App />
                  </GoogleOAuthProvider>
                </CartProvider>
              </ConversationProvider>
            </ChatProvider>
          </NotificationProvider>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
