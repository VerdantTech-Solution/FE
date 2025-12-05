import axios from 'axios';

// Interface cho gợi ý từ API (format thực tế từ webhook)
interface APIAdviceItem {
  title: string;
  description: string;
  priority: string; // "Ưu tiên cao" | "Ưu tiên vừa" | "Ưu tiên thấp"
}

// Interface cho weather risk
export interface WeatherRisk {
  time_range: string;
  risk: string;
  impact: string;
  mitigation: string;
}

// Interface cho soil information
export interface SoilInfo {
  type: string;
  description: string;
  ph: number | string; // Có thể là number hoặc "N/A"
  ph_status: string;
  ph_recommendation: string;
}

// Interface cho CO2 information
export interface CO2Info {
  total: number | string; // Có thể là number hoặc "N/A kg CO2e"
  fertilizer: number | string;
  fuel: number | string;
  irrigation_energy: number | string;
  other: number | string;
  recommendation: string;
}

// Interface cho detailed advice
export interface DetailedAdvice {
  crop: string;
  advice: string;
}

// Interface cho sâu bệnh và dịch hại
export interface PestDiseaseRisk {
  risk: string;
  why: string;
  organic_solution: string;
}

// Interface cho gợi ý từ AI (format sau khi xử lý)
export interface AISuggestion {
  title: string;
  subtitle: string;
  priority?: "high" | "medium" | "low";
  done?: boolean;
}

// Interface cho response đã xử lý
export interface AISuggestionsResponse {
  suggestions?: AISuggestion[];
  weatherRisks?: WeatherRisk[];
  soil?: SoilInfo;
  co2?: CO2Info;
  detailedAdvice?: DetailedAdvice[];
  pestDiseaseRisks?: PestDiseaseRisk[];
  tip?: string;
  message?: string;
  error?: string;
}

/**
 * Chuyển đổi priority từ tiếng Việt sang tiếng Anh
 */
const convertPriority = (priority: string): "high" | "medium" | "low" | undefined => {
  if (priority.includes("cao") || priority.toLowerCase().includes("high")) {
    return "high";
  }
  if (priority.includes("thấp") || priority.toLowerCase().includes("low")) {
    return "low";
  }
  if (priority.includes("vừa") || priority.toLowerCase().includes("medium")) {
    return "medium";
  }
  return "medium"; // Default
};

/**
 * Lấy gợi ý từ AI dựa trên thời tiết của trang trại
 * @param farmId - ID của trang trại
 * @param signal - AbortSignal để cancel request (optional)
 * @returns Danh sách gợi ý từ AI
 */
export const getAISuggestions = async (farmId: number, signal?: AbortSignal): Promise<AISuggestionsResponse> => {
  try {
    // Lấy URL từ biến môi trường (ưu tiên VITE_API_AI_WEATHER_ADVISE, fallback về VITE_AI_WEBHOOK_URL)
    const webhookUrl = import.meta.env.VITE_API_AI_WEATHER_ADVISE || import.meta.env.VITE_AI_WEBHOOK_URL;
    
    if (!webhookUrl) {
      throw new Error('URL webhook AI chưa được cấu hình trong biến môi trường');
    }

    // Lấy token từ localStorage (token của user hiện tại)
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Người dùng chưa đăng nhập. Vui lòng đăng nhập để sử dụng tính năng này.');
    }

    // Validate farmId
    if (!farmId || farmId <= 0) {
      throw new Error('farmId không hợp lệ. Vui lòng kiểm tra lại.');
    }

    console.log('🔍 [AI Suggestions] Gọi API với:', {
      url: webhookUrl,
      farmId,
      hasToken: !!token,
      tokenLength: token?.length || 0,
    });

    const response = await axios.post(
      webhookUrl,
      {
        farmId: farmId,
      },
      {
        signal, // Thêm signal để có thể cancel request
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // Để axios tự động detect response type (có thể là json hoặc text)
        // Không set responseType để axios tự động parse
        // Timeout 60 giây (API AI có thể mất thời gian để xử lý)
        timeout: 60000,
        // Transform response để xử lý các trường hợp đặc biệt
        transformResponse: [
          function (data) {
            // Nếu data là string rỗng, trả về null để xử lý sau
            if (typeof data === 'string' && data.trim() === '') {
              console.warn('⚠️ [AI Suggestions] TransformResponse: Data là string rỗng');
              return null;
            }
            // Nếu data là string, thử parse JSON
            if (typeof data === 'string') {
              try {
                return JSON.parse(data);
              } catch (e) {
                // Nếu không parse được, trả về string gốc
                return data;
              }
            }
            // Nếu đã là object, trả về nguyên
            return data;
          }
        ],
      }
    );

    console.log('✅ [AI Suggestions] Response nhận được:', response);
    console.log('📦 [AI Suggestions] Response.data:', response.data);
    console.log('📦 [AI Suggestions] Response.data type:', typeof response.data);
    console.log('📦 [AI Suggestions] Response.status:', response.status);
    console.log('📦 [AI Suggestions] Response.statusText:', response.statusText);
    console.log('📦 [AI Suggestions] Response.headers:', response.headers);
    console.log('📦 [AI Suggestions] Response.headers content-type:', response.headers['content-type']);

    // Xử lý response từ API
    let data = response.data;
    
    // Kiểm tra nếu data là null hoặc undefined (từ transformResponse)
    if (data === null || data === undefined) {
      console.error('❌ [AI Suggestions] Response.data là null/undefined!');
      console.error('❌ [AI Suggestions] Full response object:', JSON.stringify(response, null, 2));
      console.error('❌ [AI Suggestions] Response details:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
      
      if (response.status !== 200) {
        throw new Error(`API trả về status ${response.status}: ${response.statusText || 'Unknown error'}`);
      }
      
      throw new Error('API trả về dữ liệu rỗng. Có thể farmId không tồn tại hoặc API đang xử lý. Vui lòng kiểm tra lại farmId hoặc thử lại sau.');
    }
    
    // Nếu data là string rỗng, kiểm tra kỹ hơn
    if (typeof data === 'string' && data.trim() === '') {
      console.error('❌ [AI Suggestions] Response.data là chuỗi rỗng!');
      console.error('❌ [AI Suggestions] Full response object:', JSON.stringify(response, null, 2));
      console.error('❌ [AI Suggestions] Response có thể có dữ liệu ở:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: response.config,
      });
      
      // Kiểm tra nếu status không phải 200, có thể là lỗi
      if (response.status !== 200) {
        throw new Error(`API trả về status ${response.status}: ${response.statusText || 'Unknown error'}`);
      }
      
      // Nếu status là 200 nhưng data rỗng, có thể API đang xử lý hoặc farmId không hợp lệ
      throw new Error('API trả về dữ liệu rỗng. Có thể farmId không tồn tại hoặc API đang xử lý. Vui lòng kiểm tra lại farmId hoặc thử lại sau.');
    }
    
    // Nếu data là string (có thể là JSON string), thử parse
    if (typeof data === 'string' && data.trim() !== '') {
      try {
        console.log('🔄 [AI Suggestions] Đang parse JSON từ string...');
        data = JSON.parse(data);
        console.log('✅ [AI Suggestions] Parse thành công:', data);
      } catch (parseError) {
        console.error('❌ [AI Suggestions] Lỗi khi parse JSON:', parseError);
        throw new Error('Không thể parse dữ liệu từ API. Format không hợp lệ.');
      }
    }
    
    // Kiểm tra nếu data không phải object sau khi parse
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      console.error('❌ [AI Suggestions] Data không phải object sau khi xử lý:', data);
      console.error('❌ [AI Suggestions] Data type:', typeof data);
      console.error('❌ [AI Suggestions] Is array:', Array.isArray(data));
      throw new Error('Dữ liệu từ API không đúng định dạng. Vui lòng thử lại sau.');
    }
    
    console.log('📦 [AI Suggestions] Data sau khi xử lý:', data);
    console.log('📦 [AI Suggestions] Data keys:', Object.keys(data));
    
    // Xử lý response đầy đủ từ API
    const result: AISuggestionsResponse = {};
    
    // Xử lý advice
    if (data.advice && Array.isArray(data.advice)) {
      console.log('✅ [AI Suggestions] Tìm thấy advice array với', data.advice.length, 'items');
      
      result.suggestions = data.advice.map((item: APIAdviceItem) => ({
        title: item.title,
        subtitle: item.description,
        priority: convertPriority(item.priority),
        done: false,
      }));

      console.log('✅ [AI Suggestions] Đã chuyển đổi thành', result.suggestions?.length || 0, 'suggestions');
    }
    
    // Xử lý weather_risks
    if (data.weather_risks && Array.isArray(data.weather_risks)) {
      console.log('✅ [AI Suggestions] Tìm thấy weather_risks với', data.weather_risks.length, 'items');
      result.weatherRisks = data.weather_risks;
    }
    
    // Xử lý soil
    if (data.soil && typeof data.soil === 'object') {
      console.log('✅ [AI Suggestions] Tìm thấy soil information');
      result.soil = data.soil as SoilInfo;
    }
    
    // Xử lý co2
    if (data.co2 && typeof data.co2 === 'object') {
      console.log('✅ [AI Suggestions] Tìm thấy CO2 information');
      result.co2 = data.co2 as CO2Info;
    }
    
    // Xử lý detailed_advice
    if (data.detailed_advice && Array.isArray(data.detailed_advice)) {
      console.log('✅ [AI Suggestions] Tìm thấy detailed_advice với', data.detailed_advice.length, 'items');
      result.detailedAdvice = data.detailed_advice;
    }
    
    // Xử lý pest_disease_risks
    if (data.pest_disease_risks && Array.isArray(data.pest_disease_risks)) {
      console.log('✅ [AI Suggestions] Tìm thấy pest_disease_risks với', data.pest_disease_risks.length, 'items');
      result.pestDiseaseRisks = data.pest_disease_risks as PestDiseaseRisk[];
    }
    
    // Nếu có ít nhất một phần dữ liệu, trả về
    if (result.suggestions || result.weatherRisks || result.soil || result.co2 || result.detailedAdvice || result.pestDiseaseRisks) {
      result.tip = 'Thực hiện các gợi ý hành động để tối ưu hoá năng suất và giảm thiểu rủi ro cho trang trại của bạn.';
      return result;
    }

    // Fallback: Thử tìm advice ở các vị trí khác
    if (data && typeof data === 'object') {
      console.warn('⚠️ [AI Suggestions] Response không có cấu trúc chuẩn. Cấu trúc:', data);
      
      const adviceArray = (data as any).advice || (data as any).data || (data as any).suggestions;
      
      if (Array.isArray(adviceArray) && adviceArray.length > 0) {
        console.log('✅ [AI Suggestions] Tìm thấy advice ở vị trí khác:', adviceArray);
        const suggestions: AISuggestion[] = adviceArray.map((item: APIAdviceItem | any) => ({
          title: item.title || item.name || '',
          subtitle: item.description || item.subtitle || item.message || '',
          priority: convertPriority(item.priority || ''),
          done: false,
        }));
        
        return {
          suggestions,
          tip: 'Thực hiện các gợi ý hành động để tối ưu hoá năng suất và giảm thiểu rủi ro cho trang trại của bạn.',
        };
      }
    }

    // Fallback nếu cấu trúc khác
    console.warn('⚠️ [AI Suggestions] Không tìm thấy advice trong response. Trả về mảng rỗng.');
    return {
      suggestions: [],
      tip: 'Thực hiện các gợi ý hành động để tối ưu hoá năng suất và giảm thiểu rủi ro cho trang trại của bạn.',
    };
  } catch (error: any) {
    // Kiểm tra nếu lỗi do abort (request bị hủy)
    if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED' || error?.message?.includes('aborted')) {
      console.log('⚠️ [AI Suggestions] Request đã bị hủy');
      // Trả về empty response thay vì throw error
      return {
        suggestions: [],
        tip: 'Request đã bị hủy.',
      };
    }
    
    console.error('❌ [AI Suggestions] Lỗi khi lấy gợi ý từ AI:', error);
    console.error('❌ [AI Suggestions] Error details:', {
      message: error?.message,
      response: error?.response,
      status: error?.response?.status,
      data: error?.response?.data,
      config: error?.config,
    });
    
    // Xử lý các loại lỗi khác nhau
    let errorMessage = 'Không thể kết nối với AI. Vui lòng thử lại sau.';
    
    if (error?.response) {
      // Lỗi từ server (4xx, 5xx)
      const status = error.response.status;
      if (status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (status === 403) {
        errorMessage = 'Bạn không có quyền truy cập tính năng này.';
      } else if (status === 404) {
        errorMessage = 'Không tìm thấy endpoint. Vui lòng kiểm tra cấu hình.';
      } else if (status >= 500) {
        errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data?.error) {
        errorMessage = error.response.data.error;
      }
    } else if (error?.message) {
      // Lỗi từ code (validation, etc.)
      errorMessage = error.message;
    } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      errorMessage = 'API mất quá nhiều thời gian để xử lý. Vui lòng thử lại sau. (Timeout sau 60 giây)';
    } else if (error?.code === 'ERR_NETWORK') {
      errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet.';
    }
    
    // Trả về dữ liệu mẫu nếu có lỗi
    return {
      suggestions: [],
      tip: errorMessage,
      error: errorMessage,
    };
  }
};

