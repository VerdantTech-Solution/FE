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
  provinceCode?: number;
  districtCode?: number;
  communeCode?: string; // Must be string according to API spec
  latitude?: number;
  longitude?: number;
  primaryCrops?: string;
  status?: 'Active' | 'Maintenance' | 'Deleted';
}

// Interface cho response tạo farm profile
export interface CreateFarmProfileResponse {
  status: boolean;
  statusCode: string;
  data: {
    id: number;
    user: {
      id: number;
      email: string;
      role: string;
      fullName: string;
      phoneNumber: string;
      isVerified: boolean;
      avatarUrl: string | null;
      status: string;
      lastLoginAt: string;
      createdAt: string;
      updatedAt: string;
      deletedAt: string | null;
      addresses: any[];
    };
    farmName: string;
    farmSizeHectares: number;
    address: {
      id: number;
      locationAddress: string;
      province: string;
      district: string;
      commune: string;
      provinceCode: number;
      districtCode: number;
      communeCode: string;
      latitude: number;
      longitude: number;
      isDeleted: boolean;
      createdAt: string;
      updatedAt: string;
      deletedAt: string | null;
    };
    status: string;
    primaryCrops: string;
    createdAt: string;
    updatedAt: string;
  };
  errors: string[];
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
export interface CreateFarmProfileApiResponse {
  status: boolean;
  statusCode: string | number;
  data: string;
  errors: string[];
}

export const createFarmProfile = async (data: CreateFarmProfileRequest): Promise<CreateFarmProfileResponse> => {
  try {
    console.log('Creating farm profile with data:', data);
    
    // Clean up the data - ensure communeCode is string
    const cleanData = {
      farmName: data.farmName.trim(),
      farmSizeHectares: data.farmSizeHectares,
      ...(data.locationAddress && { locationAddress: data.locationAddress.trim() }),
      ...(data.province && { province: data.province }),
      ...(data.district && { district: data.district }),
      ...(data.commune && { commune: data.commune }),
      ...(data.provinceCode && data.provinceCode > 0 && { provinceCode: data.provinceCode }),
      ...(data.districtCode && data.districtCode > 0 && { districtCode: data.districtCode }),
      ...(data.communeCode && { communeCode: String(data.communeCode) }), // Ensure communeCode is string
      ...(data.latitude && data.latitude !== 0 && { latitude: data.latitude }),
      ...(data.longitude && data.longitude !== 0 && { longitude: data.longitude }),
      ...(data.primaryCrops && { primaryCrops: data.primaryCrops.trim() }),
    };
    
    console.log('Cleaned farm profile data:', cleanData);
    
    const response = await apiClient.post('/api/FarmProfile', cleanData);
    console.log('Farm profile creation response:', response);
    
    // apiClient returns response.data already
    const raw: any = response;
    if (raw && typeof raw === 'object' && 'status' in raw && 'data' in raw) {
      return raw as CreateFarmProfileResponse;
    }
    
    // Fallback response structure
    return {
      status: true,
      statusCode: "Created",
      data: raw as any,
      errors: [],
    } as CreateFarmProfileResponse;
  } catch (error: any) {
    console.error('Error creating farm profile:', error);
    
    // Log detailed error information
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request error:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
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
    const raw: any = response;
    if (Array.isArray(raw)) return raw as FarmProfile[];
    if (raw?.data && Array.isArray(raw.data)) return raw.data as FarmProfile[];
    if (raw?.items && Array.isArray(raw.items)) return raw.items as FarmProfile[];
    return [];
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
    const farmData = (response as any)?.data ?? response;
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
    const response = await apiClient.patch(`/api/FarmProfile/${id}`, data);
    return ((response as any)?.data ?? response) as FarmProfile;
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
    return ((response as any)?.data ?? response) as { message: string };
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
    return ((response as any)?.data ?? response) as FarmProfile;
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
    const raw: any = response;
    if (Array.isArray(raw)) return raw as FarmProfile[];
    if (raw?.data && Array.isArray(raw.data)) return raw.data as FarmProfile[];
    if (raw?.items && Array.isArray(raw.items)) return raw.items as FarmProfile[];
    return [];
  } catch (error) {
    console.error('Error fetching farm profiles by userId:', error);
    throw error;
  }
};
