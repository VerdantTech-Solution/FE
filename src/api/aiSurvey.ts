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

    const response = await axios.post(webhookUrl, data, {
      headers: {
        "Content-Type": "application/json",
      },
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
      if (typeof errorData === "object" && "status" in errorData) {
        return errorData as FarmOverviewResponse;
      }
      return {
        status: false,
        errors: Array.isArray(errorData.errors)
          ? errorData.errors
          : [errorData.message || "Lỗi từ server"],
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

