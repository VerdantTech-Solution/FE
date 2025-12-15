import axios from "axios";

export interface FarmOverviewRequest {
  farmId: number;
  farmName?: string;
  farmSizeHectares?: number;
  address?: string;
  crops?: Array<{
    cropName: string;
    plantingDate?: string;
    plantingMethod?: string;
    cropType?: string;
    farmingType?: string;
  }>;
  surveyResponses?: Array<{
    questionId: number;
    textAnswer: string;
  }>;
  soilData?: {
    sandLayers?: number[];
    siltLayers?: number[];
    clayLayers?: number[];
    phLayers?: number[];
  };
}

export interface FarmOverviewResponse {
  status: boolean;
  data?: string;
  message?: string;
  errors?: string[];
}

/**
 * Lấy user ID từ localStorage hoặc token
 */
const getUserId = (): number | null => {
  try {
    // Thử lấy từ localStorage user object
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.id) {
        return Number(user.id);
      }
    }

    // Nếu không có, thử decode từ token
    const token = localStorage.getItem('authToken');
    if (token) {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const userId = payload?.nameid || payload?.sub || payload?.userId;
        if (userId) {
          return Number(userId);
        }
      }
    }
  } catch (error) {
    console.warn('Error getting user ID:', error);
  }
  return null;
};

/**
 * Gọi API AI để tư vấn tổng quan về trang trại
 * API endpoint: VITE_API_AI_SURVEY (webhook n8n)
 */
export const getFarmOverviewAI = async (
  data: FarmOverviewRequest
): Promise<FarmOverviewResponse> => {
  try {
    const webhookUrl = import.meta.env.VITE_API_AI_SURVEY;

    if (!webhookUrl) {
      throw new Error("Biến môi trường VITE_API_AI_SURVEY chưa được cấu hình.");
    }

    console.log("Calling AI survey webhook:", webhookUrl);
    console.log("Request data:", data);

    // Lấy token và user ID
    const token = localStorage.getItem('authToken');
    const userId = getUserId();

    // Chuẩn bị headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Thêm Authorization header nếu có token (chỉ truyền token, không có Bearer prefix)
    if (token) {
      headers.Authorization = token;
    }

    // Thêm user ID vào header nếu có
    if (userId) {
      headers["X-User-Id"] = userId.toString();
    }

    // Thêm farm ID vào header
    if (data.farmId) {
      headers["X-Farm-Id"] = data.farmId.toString();
    }

    const response = await axios.post(webhookUrl, data, {
      headers,
      timeout: 60000, // 60 seconds timeout
    });

    const raw: any = response.data;

    // Xử lý response từ webhook
    if (raw && typeof raw === "object") {
      // Nếu response có cấu trúc { status, data, message, errors }
      if ("status" in raw) {
        return raw as FarmOverviewResponse;
      }
      // Nếu response chỉ là string hoặc object khác, wrap vào data
      return {
        status: true,
        data: typeof raw === "string" ? raw : JSON.stringify(raw),
      };
    }

    return {
      status: true,
      data: typeof raw === "string" ? raw : JSON.stringify(raw),
    };
  } catch (error: any) {
    console.error("Error calling AI survey webhook:", error);

    // Xử lý lỗi từ axios
    if (error?.response?.data) {
      const errorData = error.response.data;
      
      // Kiểm tra nếu response là array chứa lỗi unauthorized
      if (Array.isArray(errorData) && errorData.length > 0) {
        const firstError = errorData[0];
        if (firstError?.unauthorized === true || firstError?.error === "UNAUTHORIZED") {
          // Token hết hạn hoặc không hợp lệ
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          
          return {
            status: false,
            errors: [
              firstError?.message || "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục sử dụng tính năng này.",
            ],
          };
        }
      }
      
      // Xử lý lỗi dạng object
      if (typeof errorData === "object") {
        // Nếu có unauthorized trong object
        if (errorData.unauthorized === true || errorData.error === "UNAUTHORIZED") {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          
          return {
            status: false,
            errors: [
              errorData.message || "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục sử dụng tính năng này.",
            ],
          };
        }
        
        // Nếu có status field
        if ("status" in errorData) {
          return errorData as FarmOverviewResponse;
        }
        
        // Xử lý errors array hoặc message
        return {
          status: false,
          errors: Array.isArray(errorData.errors)
            ? errorData.errors
            : [errorData.message || "Lỗi từ server"],
        };
      }
      
      // Nếu errorData là string
      if (typeof errorData === "string") {
        return {
          status: false,
          errors: [errorData],
        };
      }
    }

    // Xử lý lỗi 401 Unauthorized từ HTTP status
    if (error?.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      return {
        status: false,
        errors: [
          "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục sử dụng tính năng này.",
        ],
      };
    }

    return {
      status: false,
      errors: [
        error?.message || "Không thể kết nối đến dịch vụ AI. Vui lòng thử lại sau.",
      ],
    };
  }
};

