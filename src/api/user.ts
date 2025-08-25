import { apiClient } from './apiClient';

// Interface cho response từ API User
export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  avatarUrl?: string;
  status?: string;
  [key: string]: unknown;
}

// Interface cho request update user
export interface UpdateUserRequest {
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  status?: string;
}

// API lấy thông tin user theo ID
export const getUserById = async (userId: string): Promise<UserResponse> => {
  try {
    const response = await apiClient.get(`/api/User/${userId}`);
    console.log('Get user by ID response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get user by ID error:', error);
    throw error;
  }
};

// API lấy profile user hiện tại (từ Auth context)
export const getUserProfile = async (): Promise<UserResponse> => {
  try {
    const response = await apiClient.get('/api/Auth/profile');
    console.log('Get user profile response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

// API cập nhật thông tin user
export const updateUser = async (userId: string, userData: UpdateUserRequest): Promise<UserResponse> => {
  try {
    const response = await apiClient.put(`/api/User/${userId}`, userData);
    console.log('Update user response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
};

// API xóa user (nếu cần)
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/User/${userId}`);
    console.log('User deleted successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    throw error;
  }
};

// API lấy danh sách tất cả users (cho admin)
export const getAllUsers = async (): Promise<UserResponse[]> => {
  try {
    const response = await apiClient.get('/api/User');
    console.log('Get all users response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get all users error:', error);
    throw error;
  }
};
