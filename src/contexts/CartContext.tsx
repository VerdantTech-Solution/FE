import { useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '@/state/hooks';
import { fetchCart, selectCartCount, selectCartStatus } from '@/state/slices/cartSlice';

interface UseCartReturn {
  cartCount: number;
  refreshCart: () => Promise<void>;
  isLoading: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = (): UseCartReturn => {
  const dispatch = useAppDispatch();
  const cartCount = useAppSelector(selectCartCount);
  const status = useAppSelector(selectCartStatus);

  const refreshCart = useCallback(async () => {
    await dispatch(fetchCart()).unwrap();
  }, [dispatch]);

  return {
    cartCount,
    refreshCart,
    isLoading: status === 'loading',
  };
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const dispatch = useAppDispatch();
  const lastRefreshRef = useRef(0);
  const isRefreshingRef = useRef(false);

  const debouncedRefresh = useCallback(() => {
    const now = Date.now();

    if (isRefreshingRef.current) {
      return;
    }

    const timeSinceLastRefresh = now - lastRefreshRef.current;
    if (timeSinceLastRefresh < 1000) {
      return;
    }

    isRefreshingRef.current = true;
    dispatch(fetchCart())
      .finally(() => {
        lastRefreshRef.current = Date.now();
        isRefreshingRef.current = false;
      })
      .catch((error) => {
        console.error('[CartProvider] Failed to refresh cart', error);
      });
  }, [dispatch]);

  useEffect(() => {
    debouncedRefresh();
  }, [debouncedRefresh]);

  useEffect(() => {
    const handleCartUpdate = () => {
      debouncedRefresh();
    };

    window.addEventListener('cart:updated', handleCartUpdate);
    return () => {
      window.removeEventListener('cart:updated', handleCartUpdate);
    };
  }, [debouncedRefresh]);

  return <>{children}</>;
};
