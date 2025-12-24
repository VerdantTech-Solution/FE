import React, { createContext, useState, useCallback } from "react";

interface ProductInfo {
  productId: number;
  productName: string;
  productImage?: string;
  productPrice?: number;
}

interface ConversationContextType {
  // Request to open a conversation with a vendor
  requestOpenConversation: (
    vendorId: number,
    productInfo?: ProductInfo
  ) => void;

  // Get the pending conversation request
  pendingRequest: ConversationRequest | null;

  // Clear the pending request after handled
  clearPendingRequest: () => void;
}

interface ConversationRequest {
  vendorId: number;
  productInfo?: ProductInfo;
  timestamp: number;
}

export const ConversationContext = createContext<
  ConversationContextType | undefined
>(undefined);

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pendingRequest, setPendingRequest] =
    useState<ConversationRequest | null>(null);

  const requestOpenConversation = useCallback(
    (vendorId: number, productInfo?: ProductInfo) => {
      setPendingRequest({
        vendorId,
        productInfo,
        timestamp: Date.now(),
      });
    },
    []
  );

  const clearPendingRequest = useCallback(() => {
    setPendingRequest(null);
  }, []);

  return (
    <ConversationContext.Provider
      value={{
        requestOpenConversation,
        pendingRequest,
        clearPendingRequest,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};
