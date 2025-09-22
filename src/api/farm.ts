import { apiClient } from './apiClient';

// Interface cho Address theo API schema
export interface Address {
  id: number;
  locationAddress: string;
  province: string;
  district: string;
  commune: string;
  latitude: number;
  longitude: number;
}

// Interface cho Farm Profile theo API schema
export interface FarmProfile {
  id?: number;
  farmName: string;
  farmSizeHectares: number;
  address?: Address;
  primaryCrops?: string;
  status?: 'Active' | 'Maintenance' | 'Deleted';
  createdAt?: string;
  updatedAt?: string;
}

// Interface cho request tạo farm profile
export interface CreateFarmProfileRequest {
  farmName: string;
  farmSizeHectares: number;
  locationAddress?: string;
  province?: string;
  district?: string;
  commune?: string;
  latitude?: number;
  longitude?: number;
  primaryCrops?: string;
  status?: 'Active' | 'Maintenance' | 'Deleted';
}

// Interface cho response tạo farm profile
export interface CreateFarmProfileResponse {
  id: number;
  message?: string;
}

// Interface cho response lấy danh sách farm profiles
export interface GetFarmProfilesResponse {
  data: FarmProfile[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Tạo farm profile mới cho user hiện tại
 * API endpoint: POST /api/FarmProfile
 */
export const createFarmProfile = async (data: CreateFarmProfileRequest): Promise<CreateFarmProfileResponse> => {
  try {
    const response = await apiClient.post('/api/FarmProfile', data);
    return response as unknown as CreateFarmProfileResponse;
  } catch (error) {
    console.error('Error creating farm profile:', error);
    throw error;
  }
};

/**
 * Lấy danh sách farm profiles của user hiện tại
 * API endpoint: GET /api/FarmProfile
 */
export const getFarmProfiles = async (): Promise<FarmProfile[]> => {
  try {
    const response = await apiClient.get('/api/FarmProfile');
    return response as unknown as FarmProfile[];
  } catch (error) {
    console.error('Error fetching farm profiles:', error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết farm profile theo ID
 * API endpoint: GET /api/FarmProfile/{id}
 */
export const getFarmProfileById = async (id: number): Promise<FarmProfile> => {
  try {
    const response = await apiClient.get(`/api/FarmProfile/${id}`);
    const farmData = (response as any).data ?? response;
    return farmData as FarmProfile;
  } catch (error) {
    console.error('Error fetching farm profile by ID:', error);
    throw error;
  }
};

/**
 * Cập nhật farm profile
 * API endpoint: PUT /api/FarmProfile/{id}
 */
export const updateFarmProfile = async (id: number, data: Partial<CreateFarmProfileRequest>): Promise<FarmProfile> => {
  try {
    const response = await apiClient.put(`/api/FarmProfile/${id}`, data);
    return response as unknown as FarmProfile;
  } catch (error) {
    console.error('Error updating farm profile:', error);
    throw error;
  }
};

/**
 * Xóa farm profile (soft delete)
 * API endpoint: DELETE /api/FarmProfile/{id}
 */
export const deleteFarmProfile = async (id: number): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete(`/api/FarmProfile/${id}`);
    return response as unknown as { message: string };
  } catch (error) {
    console.error('Error deleting farm profile:', error);
    throw error;
  }
};

/**
 * Cập nhật trạng thái farm profile
 * API endpoint: PATCH /api/FarmProfile/{id}/status
 */
export const updateFarmProfileStatus = async (id: number, status: 'Active' | 'Maintenance' | 'Deleted'): Promise<FarmProfile> => {
  try {
    const response = await apiClient.patch(`/api/FarmProfile/${id}/status`, { status });
    return response as unknown as FarmProfile;
  } catch (error) {
    console.error('Error updating farm profile status:', error);
    throw error;
  }
};

/**
 * Lấy danh sách farm profiles của user theo userId
 * API endpoint: GET /api/FarmProfile/User/{userId}
 */
export const getFarmProfilesByUserId = async (userId: number): Promise<FarmProfile[]> => {
  try {
    const response = await apiClient.get(`/api/FarmProfile/User/${userId}`);
    return response as unknown as FarmProfile[];
  } catch (error) {
    console.error('Error fetching farm profiles by userId:', error);
    throw error;
  }
};
