import { apiClient } from './apiClient';
// import { AuthResponse } from "./auth"; // nếu đã có

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
      const errorMsg = responseData.errors?.[0] || responseData.message || 'Đăng ký thất bại';
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
    
    // Xử lý các loại lỗi khác nhau
    if (error && typeof error === 'object') {
      // Lỗi từ Axios (network error, server error)
      if ('response' in error && error.response) {
        const response = error.response as { status: number; data?: { errors?: string[]; message?: string } };
        
        if (response.status === 500) {
          throw new Error('Lỗi máy chủ. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.');
        } else if (response.status === 400) {
          const errorMsg = response.data?.errors?.[0] || response.data?.message || 'Dữ liệu đăng ký không hợp lệ';
          throw new Error(errorMsg);
        } else if (response.status === 409) {
          throw new Error('Email đã tồn tại trong hệ thống. Vui lòng sử dụng email khác.');
        } else if (response.status >= 500) {
          throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
        } else {
          const errorMsg = response.data?.errors?.[0] || response.data?.message || 'Đăng ký thất bại';
          throw new Error(errorMsg);
        }
      }
      
      // Lỗi từ server response
      if ('status' in error && (error as { status: boolean }).status === false) {
        const errorData = error as { errors?: string[]; message?: string };
        const errorMsg = errorData.errors?.[0] || errorData.message || 'Đăng ký thất bại';
        throw new Error(errorMsg);
      }
      
      // Lỗi network
      if ('message' in error && error.message === 'Network Error') {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại.');
      }
      
      // Lỗi timeout
      if ('code' in error && (error as { code: string }).code === 'ECONNABORTED') {
        throw new Error('Kết nối bị timeout. Vui lòng thử lại.');
      }
    }
    
    // Lỗi mặc định
    const errorMessage = error && typeof error === 'object' && 'message' in error 
      ? String(error.message) 
      : "Đăng ký thất bại. Vui lòng thử lại.";
    throw new Error(errorMessage);
  }
};

// API đăng xuất - chỉ gọi endpoint logout, không xóa localStorage
export const logoutUser = async (): Promise<void> => {
  try {
    // Gọi đến endpoint này để logout
    await apiClient.post('/api/Auth/logout');
    console.log('Logout API called successfully');
  } catch (error) {
    console.error('Logout API error:', error);
    // Không cần xử lý gì thêm, AuthContext sẽ xử lý
  }
};

// API refresh token
export const refreshToken = async () => {
  const response = await apiClient.post('/api/Auth/refresh-token');
  return response;
};

// API gửi email verification
export const sendVerificationEmail = async (email: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post('/api/Auth/send-verification', { email });
    return response.data;
  } catch (error: unknown) {
    console.error('Send verification email error:', error);
    throw error;
  }
};

// API verify email
export const verifyEmail = async (email: string, code: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post('/api/Auth/verify-email', { email, code });
    return response.data;
  } catch (error: unknown) {
    console.error('Verify email error:', error);
    throw error;
  }
};

// API forgot password
export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post('/api/Auth/forgot-password', { email });
    return response.data;
  } catch (error: unknown) {
    console.error('Forgot password error:', error);
    throw error;
  }
};

// API reset password
export const resetPassword = async (email: string, code: string, newPassword: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post('/api/Auth/reset-password', { 
      email, 
      code, 
      newPassword 
    });
    return response.data;
  } catch (error: unknown) {
    console.error('Reset password error:', error);
    throw error;
  }
};

// API change password
export const changePassword = async (email: string, oldPassword: string, newPassword: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post('/api/Auth/change-password', { 
      email, 
      oldPassword, 
      newPassword 
    });
    return response.data;
  } catch (error: unknown) {
    console.error('Change password error:', error);
    throw error;
  }
};

export const googleLogin = async (idToken: string): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/api/Auth/google-login', { 
      IdToken: idToken  // Fix: Use capital I to match backend DTO
    });
    console.log('Google login API response:', response);
    
    const responseData = response.data;
    console.log('Google login response data:', responseData);
    
    // Validate response structure
    if (!responseData || typeof responseData !== 'object') {
      throw new Error('Invalid response format from Google login API');
    }
    
    if (!responseData.token || !responseData.user) {
      console.error('Missing token or user in Google login response:', responseData);
      throw new Error('Response missing required fields: token or user');
    }
    
    if (!responseData.user.id || !responseData.user.fullName || !responseData.user.email) {
      console.error('Invalid user data structure in Google login:', responseData.user);
      throw new Error('Invalid user data structure in response');
    }
    
    console.log('Validated Google login response:', responseData);
    return responseData as AuthResponse;
  } catch (error: unknown) {
    console.error('Google login API error:', error);
    throw error;
  }
};
