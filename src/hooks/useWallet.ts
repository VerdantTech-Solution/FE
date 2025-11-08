import { useState, useEffect, useCallback } from 'react';
import { processWalletCredits, type WalletData } from '@/api/wallet';

interface UseWalletReturn {
  wallet: WalletData | null;
  balance: number;
  loading: boolean;
  error: string | null;
  refreshWallet: () => Promise<void>;
}

/**
 * @param userId 
 * @returns 
 */
export const useWallet = (userId: number | undefined): UseWalletReturn => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    if (!userId) {
      setWallet(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const walletData = await processWalletCredits(userId);
      setWallet(walletData);
    } catch (err: any) {
      console.error('Load wallet error:', err);
      setError(err?.message || 'Không thể tải thông tin ví');
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  return {
    wallet,
    balance: wallet?.balance || 0,
    loading,
    error,
    refreshWallet: loadWallet,
  };
};

