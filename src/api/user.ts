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
  addresses?: UserAddress[];
  [key: string]: unknown;
}

// Interface cho request update user
export interface UpdateUserRequest {
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string | null;
  status?: string;
}

// Interface cho địa chỉ người dùng
export interface UserAddress {
  id?: number;
  locationAddress: string;
  province: string;
  district: string;
  commune: string;
  latitude: number;
  longitude: number;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Interface cho request update address
export interface UpdateAddressRequest {
  locationAddress: string;
  province: string;
  district: string;
  commune: string;
  latitude: number;
  longitude: number;
  isDeleted: boolean;
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
    
    // Các key có thể chứa array users
    const possibleKeys = ['data', 'users', 'items'];
    
    // Kiểm tra response.data có phải array không
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // Tìm array users trong các key có thể
    for (const key of possibleKeys) {
      if (response.data?.[key] && Array.isArray(response.data[key])) {
        return response.data[key];
      }
    }
    
    // Nếu không tìm thấy, log warning và trả về array rỗng
    console.warn('Unexpected response structure:', response.data);
    return [];
  } catch (error) {
    console.error('Get all users error:', error);
    throw error;
  }
};


// API cập nhật địa chỉ của user
export const updateUserAddress = async (addressId: number, addressData: UpdateAddressRequest): Promise<UserAddress> => {
  try {
    const response = await apiClient.put(`/api/User/address/${addressId}`, addressData);
    console.log('Update user address response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Update user address error:', error);
    throw error;
  }
};

// API tạo địa chỉ mới cho user
export const createUserAddress = async (userId: string, addressData: UpdateAddressRequest): Promise<UserAddress> => {
  try {
    const response = await apiClient.post(`/api/User/${userId}/address`, addressData);
    console.log('Create user address response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Create user address error:', error);
    throw error;
  }
};


