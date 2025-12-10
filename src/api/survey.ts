import { apiClient } from './apiClient';

export interface SurveyAnswer {
  questionId: number;
  textAnswer: string;
}

export interface SurveyResponseRequest {
  farmProfileId: number;
  answers: SurveyAnswer[];
}

export interface SurveyResponseResponse {
  status: boolean;
  statusCode: string;
  data: string;
  errors: string[];
}

export interface SurveyResponseItem {
  questionId: number;
  textAnswer: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetSurveyResponsesResponse {
  status: boolean;
  statusCode: string;
  data: SurveyResponseItem[];
  errors: string[];
}

/**
 * Tạo hoặc cập nhật khảo sát cho trang trại
 * API endpoint: POST /api/SurveyResponse
 * Nếu đã có khảo sát cũ, sẽ tự động xóa và thay thế bằng khảo sát mới
 */
export const submitSurveyResponse = async (
  data: SurveyResponseRequest
): Promise<SurveyResponseResponse> => {
  try {
    console.log('Submitting survey response:', data);

    const response = await apiClient.post('/api/SurveyResponse', data);
    const raw: any = response;

    if (raw && typeof raw === 'object' && 'status' in raw) {
      return raw as SurveyResponseResponse;
    }

    return {
      status: true,
      statusCode: 'OK',
      data: typeof raw === 'string' ? raw : JSON.stringify(raw),
      errors: [],
    } as SurveyResponseResponse;
  } catch (error: any) {
    console.error('Error submitting survey response:', error);

    if (error && typeof error === 'object' && 'status' in error) {
      return error as SurveyResponseResponse;
    }

    if (error?.response?.data && typeof error.response.data === 'object' && 'status' in error.response.data) {
      return error.response.data as SurveyResponseResponse;
    }

    return {
      status: false,
      statusCode: error?.response?.status || 'Error',
      data: '',
      errors: error?.response?.data?.errors || 
              (error?.message ? [error.message] : ['Không thể gửi khảo sát']),
    };
  }
};

/**
 * Lấy tất cả câu trả lời khảo sát của trang trại
 * API endpoint: GET /api/SurveyResponse/farm/{farmId}
 * Chỉ chủ trang trại mới có quyền xem
 */
export const getSurveyResponsesByFarmId = async (
  farmId: number
): Promise<GetSurveyResponsesResponse> => {
  try {
    const response = await apiClient.get(`/api/SurveyResponse/farm/${farmId}`);
    const raw: any = response;

    if (raw && typeof raw === 'object' && 'status' in raw) {
      return raw as GetSurveyResponsesResponse;
    }

    return {
      status: true,
      statusCode: 'OK',
      data: Array.isArray(raw) ? raw : [],
      errors: [],
    } as GetSurveyResponsesResponse;
  } catch (error: any) {
    console.error('Error fetching survey responses:', error);

    if (error?.response?.data && typeof error.response.data === 'object' && 'status' in error.response.data) {
      return error.response.data as GetSurveyResponsesResponse;
    }

    return {
      status: false,
      statusCode: error?.response?.status || 'Error',
      data: [],
      errors: error?.response?.data?.errors || 
              (error?.message ? [error.message] : ['Không thể lấy khảo sát']),
    };
  }
};

