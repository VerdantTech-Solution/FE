import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCart } from '@/api/cart';

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

  const refreshCart = async () => {
    try {
      setIsLoading(true);
      const cartData = await getCart();
      const items = cartData?.cartItems || [];
      const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalCount);
      console.log('Cart count updated:', totalCount);
    } catch (error) {
      console.error('Error fetching cart count:', error);
      setCartCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Load cart count on mount
  useEffect(() => {
    refreshCart();
  }, []);

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      refreshCart();
    };

    window.addEventListener('cart:updated', handleCartUpdate);
    return () => {
      window.removeEventListener('cart:updated', handleCartUpdate);
    };
  }, []);

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
