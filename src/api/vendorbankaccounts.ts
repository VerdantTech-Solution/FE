import { apiClient } from './apiClient';

export interface SupportedBank {
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
}

export interface SupportedBanksResponse {
  status: boolean;
  statusCode: string;
  data: SupportedBank[];
  errors: string[];
}

export interface CreateBankAccountRequest {
  bankCode: string;
  accountNumber: string;
}

export interface CreateBankAccountResponse {
  status: boolean;
  statusCode: string;
  data: string;
  errors: string[];
}

export interface VendorBankAccount {
  id: number;
  vendorId: number;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorBankAccountsResponse {
  status: boolean;
  statusCode: string;
  data: VendorBankAccount[];
  errors: string[];
}

// Lấy danh sách ngân hàng được hỗ trợ
export const getSupportedBanks = async (): Promise<SupportedBank[]> => {
  try {
    const response = await apiClient.get<SupportedBanksResponse>('/api/UserBankAccounts/supported-banks') as unknown as SupportedBanksResponse;
    return response?.data || [];
  } catch (error) {
    console.error('Get supported banks error:', error);
    throw error;
  }
};

// Tạo tài khoản ngân hàng cho vendor
export const createVendorBankAccount = async (
  userId: number,
  data: CreateBankAccountRequest
): Promise<CreateBankAccountResponse> => {
  try {
    const response = await apiClient.post<CreateBankAccountResponse>(
      `/api/UserBankAccounts/user/${userId}`,
      data
    ) as unknown as CreateBankAccountResponse;
    return response;
  } catch (error) {
    console.error('Create vendor bank account error:', error);
    throw error;
  }
};

// Lấy danh sách tài khoản ngân hàng của vendor
export const getVendorBankAccounts = async (userId: number): Promise<VendorBankAccount[]> => {
  try {
    const response = await apiClient.get<VendorBankAccountsResponse>(
      `/api/UserBankAccounts/user/${userId}`
    ) as unknown as VendorBankAccountsResponse;
    return response?.data || [];
  } catch (error) {
    console.error('Get vendor bank accounts error:', error);
    throw error;
  }
};

export interface DeactivateBankAccountResponse {
  status: boolean;
  statusCode: string;
  data: string;
  errors: string[];
}

// Vô hiệu hóa tài khoản ngân hàng của vendor (soft delete)
export const deleteVendorBankAccount = async (accountId: number): Promise<DeactivateBankAccountResponse> => {
  try {
    const response = await apiClient.patch<DeactivateBankAccountResponse>(
      `/api/UserBankAccounts/${accountId}/deactivate`
    ) as unknown as DeactivateBankAccountResponse;
    return response;
  } catch (error) {
    console.error('Deactivate vendor bank account error:', error);
    throw error;
  }
};

