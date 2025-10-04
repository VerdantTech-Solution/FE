import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { getCartCount } from '@/api/cart';

interface CartContextType {
  cartCount: number;
  refreshCart: () => Promise<void>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartCount, setCartCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);

  const refreshCart = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    
    // Prevent multiple simultaneous calls
    if (isLoading) {
      console.log('Cart refresh already in progress, skipping...');
      return;
    }

    // Debounce: only refresh if at least 1 second has passed since last refresh
    if (timeSinceLastRefresh < 1000) {
      console.log('Cart refresh too soon, skipping...');
      return;
    }

    try {
      setIsLoading(true);
      setLastRefreshTime(now);
      const count = await getCartCount();
      setCartCount(count);
      console.log('Cart count updated:', count);
    } catch (error: any) {
      console.error('Error fetching cart count:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        statusCode: error?.statusCode,
        data: error?.data,
        response: error?.response
      });
      setCartCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, lastRefreshTime]);

  // Load cart count on mount
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      try {
        refreshCart();
      } catch (error) {
        console.error('Error in cart update handler:', error);
      }
    };

    window.addEventListener('cart:updated', handleCartUpdate);
    return () => {
      window.removeEventListener('cart:updated', handleCartUpdate);
    };
  }, [refreshCart]);

  const value: CartContextType = {
    cartCount,
    refreshCart,
    isLoading,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
