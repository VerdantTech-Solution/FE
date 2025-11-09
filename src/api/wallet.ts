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
    throw error;
  }
};

export interface CashoutRequest {
  bankAccountId: number;
  amount: number;
  reason?: string;
  notes?: string;
}

export interface CashoutRequestResponse {
  status: boolean;
  statusCode: string;
  data: string;
  errors: string[];
}

/**
 * Create cashout request - Tạo yêu cầu rút tiền từ ví
 * Vendor chỉ được tạo 1 yêu cầu pending tại một thời điểm
 * @param request - Cashout request data
 * @returns Response với status và message
 */
export const createCashoutRequest = async (request: CashoutRequest): Promise<CashoutRequestResponse> => {
  try {
    const response = await apiClient.post<CashoutRequestResponse>(
      '/api/Wallet/cashout-request',
      request
    ) as unknown as CashoutRequestResponse;
    
    // If response has status false, return it so component can handle
    if (response && typeof response === 'object' && 'status' in response) {
      return response;
    }
    
    return response;
  } catch (error: any) {
    // Note: apiClient interceptor rejects with error.response?.data
    // So error here is already the response data, not the full axios error
    // But we need to handle both cases
    
    // Case 1: Error is already the response data (from interceptor)
    if (error && typeof error === 'object' && 'status' in error) {
      // This is already a CashoutRequestResponse
      return error as CashoutRequestResponse;
    }
    
    // Case 2: Error has response.data (direct axios error, not through interceptor)
    if (error?.response?.data && typeof error.response.data === 'object' && 'status' in error.response.data) {
      return error.response.data as CashoutRequestResponse;
    }
    
    // Case 3: Error is a simple object with errors array
    if (error && typeof error === 'object' && 'errors' in error) {
      const errorResponse: CashoutRequestResponse = {
        status: false,
        statusCode: error.statusCode || 'BadRequest',
        data: '',
        errors: Array.isArray(error.errors) ? error.errors : [error.message || 'Không thể tạo yêu cầu rút tiền']
      };
      return errorResponse;
    }
    
    // Case 4: Create error response from any error
    const errorResponse: CashoutRequestResponse = {
      status: false,
      statusCode: 'Error',
      data: '',
      errors: [error?.message || error?.toString() || 'Không thể tạo yêu cầu rút tiền']
    };
    
    return errorResponse;
  }
};

export interface BankAccount {
  id: number;
  userId: number;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  createdAt: string;
  updatedAt: string;
}

export interface CashoutRequestData {
  id: number;
  bankAccount: BankAccount;
  amount: number;
  status: string;
  reason?: string;
  notes?: string;
  createdAt: string;
}

export interface GetCashoutRequestResponse {
  status: boolean;
  statusCode: string;
  data: CashoutRequestData | null;
  errors: string[];
}



export const getPendingCashoutRequest = async (userId: number): Promise<GetCashoutRequestResponse> => {
  try {
    const response = await apiClient.get<GetCashoutRequestResponse>(
      `/api/Wallet/${userId}/cashout-request`
    ) as unknown as GetCashoutRequestResponse;
    
   
    return response;
  } catch (error: any) {
 
    if (error && typeof error === 'object') {
    
      if ('status' in error) {
        return error as GetCashoutRequestResponse;
      }
      
      // Check if error has statusCode (might be a different format)
      if ('statusCode' in error) {
        return {
          status: false,
          statusCode: error.statusCode || 'Error',
          data: null,
          errors: Array.isArray(error.errors) ? error.errors : [error.message || 'Không thể lấy thông tin yêu cầu rút tiền']
        };
      }
    }
    
    // If no cashout request exists, API might return 404 or similar
    // Return a response with status=false and data=null (not an error)
    const errorResponse: GetCashoutRequestResponse = {
      status: false,
      statusCode: 'NotFound',
      data: null,
      errors: []
    };
    
    return errorResponse;
  }
};

export interface DeleteCashoutRequestResponse {
  status: boolean;
  statusCode: string;
  data: string;
  errors: string[];
}

/**
 * Delete pending cashout request - Xóa yêu cầu rút tiền đang pending
 * Chỉ vendor sở hữu yêu cầu mới có thể xóa
 * @returns Response với status và message
 */
export const deletePendingCashoutRequest = async (): Promise<DeleteCashoutRequestResponse> => {
  try {
    const response = await apiClient.delete<DeleteCashoutRequestResponse>(
      '/api/Wallet/cashout-request'
    ) as unknown as DeleteCashoutRequestResponse;
    
    return response;
  } catch (error: any) {
    // apiClient interceptor rejects with error.response?.data
    if (error && typeof error === 'object' && 'status' in error) {
      return error as DeleteCashoutRequestResponse;
    }
    
    if (error?.response?.data && typeof error.response.data === 'object' && 'status' in error.response.data) {
      return error.response.data as DeleteCashoutRequestResponse;
    }
    
    if (error && typeof error === 'object' && 'errors' in error) {
      const errorResponse: DeleteCashoutRequestResponse = {
        status: false,
        statusCode: error.statusCode || 'Error',
        data: '',
        errors: Array.isArray(error.errors) ? error.errors : [error.message || 'Không thể xóa yêu cầu rút tiền']
      };
      return errorResponse;
    }
    
    const errorResponse: DeleteCashoutRequestResponse = {
      status: false,
      statusCode: 'Error',
      data: '',
      errors: [error?.message || error?.toString() || 'Không thể xóa yêu cầu rút tiền']
    };
    
    return errorResponse;
  }
};

