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
  userAddresses?: UserAddress[];
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
  provinceCode?: string;
  districtCode?: string;
  communeCode?: string;
  latitude: number;
  longitude: number;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

// Interface cho request tạo địa chỉ mới
export interface CreateAddressRequest {
  locationAddress: string;
  province: string;
  district: string;
  commune: string;
  provinceCode?: string;
  districtCode?: string;
  communeCode?: string;
  latitude: number;
  longitude: number;
}

// Interface cho request update address
export interface UpdateAddressRequest {
  locationAddress: string;
  province: string;
  district: string;
  commune: string;
  provinceCode?: string;
  districtCode?: string;
  communeCode?: string;
  latitude: number;
  longitude: number;
  isDeleted: boolean;
}

// API lấy thông tin user theo ID
export const getUserById = async (userId: string): Promise<UserResponse> => {
  try {
    const response = await apiClient.get(`/api/User/${userId}`);
    console.log('Get user by ID response:', response);
    return response as unknown as UserResponse;
  } catch (error) {
    console.error('Get user by ID error:', error);
    throw error;
  }
};

// API lấy profile user hiện tại (từ Auth context)
export const getUserProfile = async (): Promise<UserResponse> => {
  try {
    const response = await apiClient.get('/api/Auth/profile');
    console.log('Get user profile response:', response);
    const raw: any = response;
    // Backend wraps payload: { status, statusCode, data: { ...user } }
    const profile = (raw && typeof raw === 'object' && 'data' in raw) ? raw.data : raw;
    return profile as UserResponse;
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

// API cập nhật thông tin user
export const updateUser = async (userId: string, userData: UpdateUserRequest): Promise<UserResponse> => {
  try {
    const response = await apiClient.patch(`/api/User/${userId}`, userData);
    console.log('Update user response:', response);
    return response as unknown as UserResponse;
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
};

// API lấy danh sách tất cả users (cho admin) - fetch 1 lần, lọc client
export const getAllUsers = async (): Promise<UserResponse[]> => {
  const response = await apiClient.get('/api/User', { params: { page: 1, pageSize: 100 } });
  const raw: any = response;
  if (raw?.data?.data && Array.isArray(raw.data.data)) return raw.data.data as UserResponse[];
  if (Array.isArray(raw)) return raw as UserResponse[];
  if (Array.isArray(raw?.data)) return raw.data as UserResponse[];
  return [];
};


// API cập nhật địa chỉ của user
export const updateUserAddress = async (addressId: number, addressData: UpdateAddressRequest): Promise<UserAddress> => {
  try {
    const response = await apiClient.patch(`/api/User/address/${addressId}`, addressData);
    console.log('Update user address response:', response);
    return response as unknown as UserAddress;
  } catch (error) {
    console.error('Update user address error:', error);
    throw error;
  }
};

// API xóa địa chỉ của user (soft delete)
export const deleteUserAddress = async (addressId: number): Promise<void> => {
  try {
    const response = await apiClient.delete(`/api/User/address/${addressId}`);
    console.log('Delete user address response:', response);
  } catch (error) {
    console.error('Delete user address error:', error);
    throw error;
  }
};


// Interface cho response tạo địa chỉ
export interface CreateAddressResponse {
  status: boolean;
  statusCode: string;
  data: UserResponse;
  errors: string[];
}

// API tạo địa chỉ mới cho user
export const createUserAddress = async (userId: string, addressData: CreateAddressRequest): Promise<CreateAddressResponse> => {
  try {
    const response = await apiClient.post(`/api/User/${userId}/address`, addressData);
    console.log('Create user address response:', response);
    return response as unknown as CreateAddressResponse;
  } catch (error) {
    console.error('Create user address error:', error);
    throw error;
  }
};

// Interface cho request tạo staff
export interface CreateStaffRequest {
  email: string;
  fullName: string;
  phoneNumber: string;
}

// API tạo tài khoản staff mới
export const createStaff = async (staffData: CreateStaffRequest): Promise<{ status: boolean; statusCode: number; data: string; errors: string[] }> => {
  try {
    const response = await apiClient.post('/api/User/staff', staffData);
    console.log('Create staff response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Create staff error:', error);
    throw error;
  }
};


