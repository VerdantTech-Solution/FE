import { apiClient } from './apiClient';

export interface TicketImage {
  imageUrl: string;
  imagePublicId: string;
}

export interface TicketUser {
  id: number;
  email: string;
  role: string;
  fullName: string;
  phoneNumber: string;
  isVerified: boolean;
  avatarUrl: string | null;
  status: string;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTicketRequest {
  requestType: "SupportRequest" | "RefundRequest";
  title: string;
  description: string;
  images?: TicketImage[];
}

export interface CreateTicketResponse {
  status: boolean;
  statusCode: string;
  data: string;
  errors: string[];
}

export interface TicketItem {
  id: number;
  user?: TicketUser | null;
  requestType: "SupportRequest" | "RefundRequest";
  title: string;
  description: string;
  status: string;
  replyNotes?: string | null;
  processedBy?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  images?: TicketImage[];
}

export interface TicketPaginationData {
  data: TicketItem[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GetTicketsResponse {
  status: boolean;
  statusCode: string | number;
  data: TicketPaginationData | null;
  errors: string[];
}

export interface GetTicketsByUserResponse {
  status: boolean;
  statusCode: string | number;
  data: TicketItem[] | null;
  errors: string[];
}

export interface GetTicketsParams {
  page?: number;
  pageSize?: number;
  requestType?: string;
  requestStatus?: string;
}

export interface ProcessTicketRequest {
  status: "InReview" | "Approved" | "Rejected" | "Cancelled";
  replyNotes?: string | null;
}

export interface ProcessTicketResponse {
  status: boolean;
  statusCode: string | number;
  data: string | null;
  errors: string[];
}

export const createTicket = async (
  data: CreateTicketRequest
): Promise<CreateTicketResponse> => {
  try {
    const response = await apiClient.post<CreateTicketResponse>(
      '/api/RequestTicket',
      data
    ) as unknown as CreateTicketResponse;
    return response;
  } catch (error) {
    console.error('Create ticket error:', error);
    throw error;
  }
};

export const getTickets = async (params: GetTicketsParams = {}): Promise<GetTicketsResponse> => {
  try {
    const response = await apiClient.get<GetTicketsResponse>(
      '/api/RequestTicket',
      {
        params: {
          page: params.page,
          pageSize: params.pageSize,
          requestType: params.requestType,
          requestStatus: params.requestStatus,
        },
      }
    ) as unknown as GetTicketsResponse;

    return response;
  } catch (error: any) {
    if (error?.response?.data) {
      const errorData = error.response.data;
      return {
        status: false,
        statusCode: errorData.statusCode || 'Error',
        data: null,
        errors: Array.isArray(errorData.errors)
          ? errorData.errors
          : [errorData.message || 'Không thể tải danh sách yêu cầu hỗ trợ'],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      data: null,
      errors: ['Không thể tải danh sách yêu cầu hỗ trợ'],
    };
  }
};

export const getTicketsByUser = async (userId: number): Promise<GetTicketsByUserResponse> => {
  try {
    const response = await apiClient.get<GetTicketsByUserResponse>(
      `/api/RequestTicket/user/${userId}`
    ) as unknown as GetTicketsByUserResponse;

    return response;
  } catch (error: any) {
    if (error?.response?.data) {
      const errorData = error.response.data;
      return {
        status: false,
        statusCode: errorData.statusCode || 'Error',
        data: null,
        errors: Array.isArray(errorData.errors)
          ? errorData.errors
          : [errorData.message || 'Không thể tải danh sách yêu cầu hỗ trợ'],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      data: null,
      errors: ['Không thể tải danh sách yêu cầu hỗ trợ'],
    };
  }
};

export const processTicket = async (
  requestId: number,
  payload: ProcessTicketRequest
): Promise<ProcessTicketResponse> => {
  try {
    const response = await apiClient.put<ProcessTicketResponse>(
      `/api/RequestTicket/${requestId}/process`,
      payload
    ) as unknown as ProcessTicketResponse;

    return response;
  } catch (error: any) {
    if (error?.response?.data) {
      const errorData = error.response.data;
      return {
        status: false,
        statusCode: errorData.statusCode || "Error",
        data: null,
        errors: Array.isArray(errorData.errors)
          ? errorData.errors
          : [errorData.message || "Không thể cập nhật trạng thái yêu cầu hỗ trợ"],
      };
    }

    return {
      status: false,
      statusCode: "Error",
      data: null,
      errors: ["Không thể cập nhật trạng thái yêu cầu hỗ trợ"],
    };
  }
};

