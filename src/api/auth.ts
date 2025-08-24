import { apiClient } from './apiClient';

// Interface cho request đăng nhập
export interface LoginRequest {
  email: string;
  password: string;
}

// Interface cho request đăng ký - cập nhật theo Swagger /api/User
export interface SignUpRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role?: string;
}

// Interface cho response authentication - cập nhật để linh hoạt hơn
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    role: string;
  };
  message?: string;
}

// Interface cho response từ /api/User (có thể khác với AuthResponse)
export interface UserCreateResponse {
  id?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  message?: string;
  status?: boolean;
  // Thêm các field khác có thể có
  [key: string]: unknown;
}

// Interface cho error response
export interface ErrorResponse {
  status: boolean;
  statusCode: number;
  data: unknown;
  errors: string[];
  message?: string;
}

// API đăng nhập - sử dụng endpoint đúng từ Swagger
export const loginUser = async (credentials: LoginRequest): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/api/Auth/login', credentials);
    console.log('Raw API response:', response);
    
    // Extract data from AxiosResponse
    const responseData = response.data;
    console.log('Response data:', responseData);
    
    // Validate response structure
    if (!responseData || typeof responseData !== 'object') {
      throw new Error('Invalid response format from API');
    }
    
    if (!responseData.token || !responseData.user) {
      console.error('Missing token or user in response:', responseData);
      throw new Error('Response missing required fields: token or user');
    }
    
    if (!responseData.user.id || !responseData.user.fullName || !responseData.user.email) {
      console.error('Invalid user data structure:', responseData.user);
      throw new Error('Invalid user data structure in response');
    }
    
    console.log('Validated response:', responseData);
    return responseData as AuthResponse;
  } catch (error: unknown) {
    console.error('Login API error:', error);
    throw error;
  }
};

// API đăng ký - làm lại với cách tiếp cận mới
export const signUpUser = async (userData: SignUpRequest): Promise<AuthResponse> => {
  try {
    console.log('🚀 Starting signup process...');
    
    // Gọi API đăng ký
    const response = await apiClient.post('/api/User', userData);
    const responseData = response.data;
    
    console.log('📥 API response:', responseData);
    
    // Kiểm tra lỗi từ server
    if (responseData?.status === false) {
      const errorMsg = responseData.errors?.[0] || responseData.message || 'Signup failed';
      throw new Error(errorMsg);
    }
    
    // Nếu có token và user - trả về luôn
    if (responseData?.token && responseData?.user) {
      return responseData as AuthResponse;
    }
    
    // Nếu chỉ có thông tin user (không có token) - tạo mock response
    if (responseData?.id || responseData?.email) {
      return {
        token: 'temp_token_' + Date.now(),
        user: {
          id: responseData.id || 'temp_id',
          fullName: responseData.fullName || userData.fullName,
          email: responseData.email || userData.email,
          phoneNumber: responseData.phoneNumber || userData.phoneNumber,
          role: responseData.role || 'customer'
        },
        message: 'User created successfully. Please login to continue.'
      };
    }
    
    throw new Error('Unexpected response format from signup API');
    
  } catch (error: unknown) {
    console.error('💥 Signup API error:', error);
    throw error;
  }
};

// API đăng xuất
export const logoutUser = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

// API lấy profile user
export const getUserProfile = async () => {
  const response = await apiClient.get('/api/Auth/profile');
  return response;
};

// API refresh token
export const refreshToken = async () => {
  const response = await apiClient.post('/api/Auth/refresh-token');
  return response;
};

// Kiểm tra xem user đã đăng nhập chưa
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('authToken');
};

// Lấy thông tin user hiện tại
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Lấy token hiện tại
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};
