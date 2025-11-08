import { apiClient } from './apiClient';

export interface Vendor {
  id: number;
  email: string;
  role: string;
  fullName: string;
  phoneNumber: string;
  isVerified: boolean;
  avatarUrl: string | null;
  status: string;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  userAddresses: any[];
}

export interface WalletData {
  id: number;
  vendor: Vendor;
  balance: number;
  lastUpdatedBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletResponse {
  status: boolean;
  statusCode: string;
  data: WalletData;
  errors: string[];
}

/**
 * Process wallet credits - Trả về số dư trong wallet của vendor
 * @param userId - ID của vendor
 * @returns Wallet data với balance
 */
export const processWalletCredits = async (userId: number): Promise<WalletData> => {
  try {
    const response = await apiClient.post<WalletResponse>(
      `/api/Wallet/${userId}/process-credits`,
      {}
    ) as unknown as WalletResponse;
    
    if (response?.data) {
      return response.data;
    }
    
    throw new Error('Invalid response format from wallet API');
  } catch (error) {
    console.error('Process wallet credits error:', error);
    throw error;
  }
};

