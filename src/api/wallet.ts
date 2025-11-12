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
  updatedAt?: string;
  processedAt?: string | null;
  processedBy?: number | null;
  vendorId?: number;
  vendor?: Vendor | null;
  user?: Vendor | null; // Alternative field name from API
}

export interface GetCashoutRequestResponse {
  status: boolean;
  statusCode: string;
  data: CashoutRequestData | null;
  errors: string[];
}

export interface CashoutRequestsPage {
  data: CashoutRequestData[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GetCashoutRequestsResponse {
  status: boolean;
  statusCode: string;
  data: CashoutRequestsPage | null;
  errors: string[];
}

export const getAllCashoutRequest = async (
  page = 1,
  pageSize = 10
): Promise<GetCashoutRequestsResponse> => {
  try {
    const response = await apiClient.get<GetCashoutRequestsResponse>(
      '/api/Wallet/cashout-requests',
      {
        params: {
          page,
          pageSize,
        },
      }
    ) as unknown as GetCashoutRequestsResponse;

    return response;
  } catch (error: any) {
    if (error && typeof error === 'object') {
      if ('status' in error && 'statusCode' in error) {
        return error as GetCashoutRequestsResponse;
      }

      if ('errors' in error || 'message' in error) {
        return {
          status: false,
          statusCode: (error as any).statusCode || 'Error',
          data: null,
          errors: Array.isArray((error as any).errors)
            ? (error as any).errors
            : [(error as any).message || 'Không thể tải danh sách yêu cầu rút tiền'],
        };
      }
    }

    return {
      status: false,
      statusCode: 'Error',
      data: null,
      errors: ['Không thể tải danh sách yêu cầu rút tiền'],
    };
  }
};

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

export const getVendorCashoutHistory = async (
  userId: number,
  page = 1,
  pageSize = 10
): Promise<GetCashoutRequestsResponse> => {
  try {
    const response = await apiClient.get<GetCashoutRequestsResponse>(
      `/api/Wallet/${userId}/cashout-requests`,
      {
        params: {
          page,
          pageSize,
        },
      }
    ) as unknown as GetCashoutRequestsResponse;

    return response;
  } catch (error: any) {
    if (error && typeof error === 'object') {
      if ('status' in error && 'statusCode' in error) {
        return error as GetCashoutRequestsResponse;
      }

      if ('errors' in error || 'message' in error) {
        return {
          status: false,
          statusCode: (error as any).statusCode || 'Error',
          data: null,
          errors: Array.isArray((error as any).errors)
            ? (error as any).errors
            : [(error as any).message || 'Không thể tải lịch sử yêu cầu rút tiền'],
        };
      }
    }

    return {
      status: false,
      statusCode: 'Error',
      data: null,
      errors: ['Không thể tải lịch sử yêu cầu rút tiền'],
    };
  }
};

export interface ProcessCashoutManualRequest {
  status: 'Completed' | 'Failed' | 'Cancelled';
  gatewayPaymentId?: string;
  cancelReason?: string;
}

export interface ProcessCashoutManualResponse {
  status: boolean;
  statusCode: string;
  data: string;
  errors: string[];
}

export const processCashoutManual = async (
  userId: number,
  request: ProcessCashoutManualRequest
): Promise<ProcessCashoutManualResponse> => {
  try {
    const response = await apiClient.post<ProcessCashoutManualResponse>(
      `/api/Wallet/${userId}/process-cashout-manual`,
      request
    ) as unknown as ProcessCashoutManualResponse;

    return response;
  } catch (error: any) {
    if (error && typeof error === 'object' && 'status' in error) {
      return error as ProcessCashoutManualResponse;
    }

    if (error?.response?.data && typeof error.response.data === 'object' && 'status' in error.response.data) {
      return error.response.data as ProcessCashoutManualResponse;
    }

    if (error && typeof error === 'object' && 'errors' in error) {
      const errorResponse: ProcessCashoutManualResponse = {
        status: false,
        statusCode: error.statusCode || 'Error',
        data: '',
        errors: Array.isArray(error.errors) ? error.errors : [error.message || 'Không thể xử lý yêu cầu rút tiền']
      };
      return errorResponse;
    }

    const errorResponse: ProcessCashoutManualResponse = {
      status: false,
      statusCode: 'Error',
      data: '',
      errors: [error?.message || error?.toString() || 'Không thể xử lý yêu cầu rút tiền']
    };

    return errorResponse;
  }
};

