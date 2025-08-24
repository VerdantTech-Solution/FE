import { apiClient } from './apiClient';

// Interface cho request đăng nhập
export interface LoginRequest {
  email: string;
  password: string;
}

// Interface cho request đăng ký
export interface SignUpRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

// Interface cho response authentication
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
  };
  message: string;
}

// API đăng nhập - sử dụng endpoint đúng từ Swagger
export const loginUser = async (credentials: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post('/api/Auth/login', credentials) as AuthResponse;
  
  // Lưu token vào localStorage
  if (response.token) {
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  }
  
  return response;
};

// API đăng ký - sử dụng endpoint User từ Swagger
export const signUpUser = async (userData: SignUpRequest): Promise<AuthResponse> => {
  const response = await apiClient.post('/api/User', userData) as AuthResponse;
  
  // Lưu token vào localStorage nếu đăng ký thành công
  if (response.token) {
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  }
  
  return response;
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
