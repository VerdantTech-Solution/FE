import { apiClient } from './apiClient';

// Enum/string-union tương ứng backend
export type FarmProfileStatus = 'Active' | 'Maintenance' | 'Deleted';

export type PlantingMethod =
  | 'DirectSeeding'
  | 'TrayNursery'
  | 'Transplanting'
  | 'VegetativePropagation'
  | 'Cutting';

export type CropType =
  | 'LeafyGreen'
  | 'Fruiting'
  | 'RootVegetable'
  | 'Herb';

export type FarmingType =
  | 'Intensive'
  | 'CropRotation'
  | 'Intercropping'
  | 'Greenhouse'
  | 'Hydroponics';

export type CropStatus =
  | 'Planning'
  | 'Seedling'
  | 'Growing'
  | 'Harvesting'
  | 'Completed'
  | 'Failed'
  | 'Deleted';

export interface Address {
  id: number;
  locationAddress: string;
  province: string;
  district: string;
  commune: string;
  latitude: number;
  longitude: number;
}

export interface CropInfo {
  id?: number;
  cropName: string;
  plantingDate: string;
  // Các trường mới theo schema API /api/FarmProfile
  plantingMethod?: PlantingMethod;
  cropType?: CropType;
  farmingType?: FarmingType;
  status?: CropStatus;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FarmProfile {
  id?: number;
  farmName: string;
  farmSizeHectares: number;
  address?: Address;
  /**
   * @deprecated Thuộc tính cũ, giữ lại để tương thích ngược.
   * Vui lòng sử dụng `crops` để hiển thị chi tiết cây trồng.
   */
  primaryCrops?: string;
  crops?: CropInfo[];
  status?: FarmProfileStatus;
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
  provinceCode?: string;
  districtCode?: string;
  communeCode?: string;
  latitude?: number;
  longitude?: number;
  crops?: CropInfo[];
  /**
   * @deprecated Thuộc tính cũ, giữ lại để tương thích ngược.
   */
  primaryCrops?: string;
  status?: FarmProfileStatus;
}

// Interface cho request cập nhật farm profile (PATCH)
export interface UpdateFarmProfileRequest {
  farmName?: string;
  farmSizeHectares?: number;
  locationAddress?: string;
  province?: string;
  district?: string;
  commune?: string;
  provinceCode?: string;
  districtCode?: string;
  communeCode?: string;
  latitude?: number;
  longitude?: number;
  status?: 'Active' | 'Maintenance' | 'Deleted';
  cropsUpdate?: Array<{
    id: number;
    cropName: string;
    plantingDate: string;
    isActive?: boolean;
  }>;
  cropsCreate?: Array<{
    cropName: string;
    plantingDate: string;
  }>;
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
      userAddresses: any[];
    };
    farmName: string;
    farmSizeHectares: number;
    address: {
      id: number;
      locationAddress: string;
      province: string;
      district: string;
      commune: string;
      provinceCode: string;
      districtCode: string;
      communeCode: string;
      latitude: number;
      longitude: number;
      isDeleted: boolean;
      createdAt: string;
      updatedAt: string;
      deletedAt: string | null;
    };
    status: string;
    /**
     * @deprecated Thuộc tính cũ.
     */
    primaryCrops?: string;
    crops?: CropInfo[];
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
 * Request body cho API thêm cây trồng vào trang trại
 * Endpoint: POST /api/farm/{farmId}/Crop
 */
export interface AddFarmCropRequest {
  cropName: string;
  plantingDate: string;
  plantingMethod: PlantingMethod;
  cropType: CropType;
  farmingType: FarmingType;
  status: CropStatus;
}

export interface AddFarmCropsResponse {
  status: boolean;
  statusCode: string | number;
  data: string;
  errors: string[];
}

/**
 * Request body cho API cập nhật cây trồng của trang trại
 * Endpoint: PATCH /api/farm/{farmId}/Crop
 */
export interface UpdateFarmCropRequest {
  id: number;
  cropName: string;
  plantingDate: string;
  plantingMethod: PlantingMethod;
  cropType: CropType;
  farmingType: FarmingType;
  status: CropStatus;
}

export interface UpdateFarmCropsResponse {
  status: boolean;
  statusCode: string | number;
  data: string;
  errors: string[];
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
    
    // Clean up the data - ensure all codes are strings
    const cleanData = {
      farmName: data.farmName.trim(),
      farmSizeHectares: data.farmSizeHectares,
      ...(data.locationAddress && { locationAddress: data.locationAddress.trim() }),
      ...(data.province && { province: data.province }),
      ...(data.district && { district: data.district }),
      ...(data.commune && { commune: data.commune }),
      ...(data.provinceCode && { provinceCode: String(data.provinceCode) }),
      ...(data.districtCode && { districtCode: String(data.districtCode) }),
      ...(data.communeCode && { communeCode: String(data.communeCode) }),
      ...(data.latitude && data.latitude !== 0 && { latitude: data.latitude }),
      ...(data.longitude && data.longitude !== 0 && { longitude: data.longitude }),
      ...(data.crops && data.crops.length > 0 && {
        crops: data.crops
          .filter((crop) => crop.cropName.trim() && crop.plantingDate)
          .map((crop) => ({
            cropName: crop.cropName.trim(),
            plantingDate: crop.plantingDate,
            // Bổ sung các trường mới, dùng default nếu FE chưa cung cấp
            plantingMethod: crop.plantingMethod || 'DirectSeeding',
            cropType: crop.cropType || 'LeafyGreen',
            farmingType: crop.farmingType || 'Intensive',
            status: crop.status || 'Planning',
          })),
      }),
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
 * Thêm một hoặc nhiều cây trồng vào trang trại
 * API endpoint: POST /api/farm/{farmId}/Crop
 */
export const addFarmCrops = async (
  farmId: number,
  crops: AddFarmCropRequest[]
): Promise<AddFarmCropsResponse> => {
  try {
    console.log('Adding crops to farm:', { farmId, crops });

    const payload = crops.map((crop) => ({
      cropName: crop.cropName.trim(),
      plantingDate: crop.plantingDate,
      plantingMethod: crop.plantingMethod,
      cropType: crop.cropType,
      farmingType: crop.farmingType,
      status: crop.status,
    }));

    const response = await apiClient.post(`/api/farm/${farmId}/Crop`, payload);
    const raw: any = response;

    if (raw && typeof raw === 'object' && 'status' in raw) {
      return raw as AddFarmCropsResponse;
    }

    return {
      status: true,
      statusCode: 'OK',
      data: typeof raw === 'string' ? raw : JSON.stringify(raw),
      errors: [],
    };
  } catch (error: any) {
    console.error('Error adding crops to farm:', error);

    if (error && typeof error === 'object' && 'status' in error) {
      return error as AddFarmCropsResponse;
    }

    if (error?.response?.data && typeof error.response.data === 'object' && 'status' in error.response.data) {
      return error.response.data as AddFarmCropsResponse;
    }

    return {
      status: false,
      statusCode: error?.response?.status || 'Error',
      data: '',
      errors: error?.response?.data?.errors ||
        (error?.message ? [error.message] : ['Không thể thêm cây trồng vào trang trại']),
    };
  }
};

/**
 * Cập nhật thông tin các cây trồng của trang trại
 * API endpoint: PATCH /api/farm/{farmId}/Crop
 * Backend expect body là danh sách CropsUpdateDTO (array)
 */
export const updateFarmCrops = async (
  farmId: number,
  crops: UpdateFarmCropRequest[]
): Promise<UpdateFarmCropsResponse> => {
  try {
    console.log('Updating farm crops:', { farmId, crops });

    // Body phải là array, không bọc trong { dtos: ... }
    const payload = crops.map((crop) => ({
      id: crop.id,
      cropName: crop.cropName.trim(),
      plantingDate: crop.plantingDate,
      plantingMethod: crop.plantingMethod,
      cropType: crop.cropType,
      farmingType: crop.farmingType,
      status: crop.status,
    }));

    const response = await apiClient.patch(`/api/farm/${farmId}/Crop`, payload);
    const raw: any = response;

    if (raw && typeof raw === 'object' && 'status' in raw) {
      return raw as UpdateFarmCropsResponse;
    }

    return {
      status: true,
      statusCode: 'OK',
      data: typeof raw === 'string' ? raw : JSON.stringify(raw),
      errors: [],
    };
  } catch (error: any) {
    console.error('Error updating farm crops:', error);

    if (error && typeof error === 'object' && 'status' in error) {
      return error as UpdateFarmCropsResponse;
    }

    if (error?.response?.data && typeof error.response.data === 'object' && 'status' in error.response.data) {
      return error.response.data as UpdateFarmCropsResponse;
    }

    return {
      status: false,
      statusCode: error?.response?.status || 'Error',
      data: '',
      errors: error?.response?.data?.errors ||
        (error?.message ? [error.message] : ['Không thể cập nhật cây trồng của trang trại']),
    };
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
 * Interface cho response cập nhật farm profile
 */
export interface UpdateFarmProfileResponse {
  status: boolean;
  statusCode: string | number;
  data: string;
  errors: string[];
}

/**
 * Cập nhật farm profile
 * API endpoint: PATCH /api/FarmProfile/{id}
 */
export const updateFarmProfile = async (id: number, data: UpdateFarmProfileRequest | Partial<CreateFarmProfileRequest>): Promise<UpdateFarmProfileResponse> => {
  try {
    console.log('Updating farm profile with data:', { id, data });
    
    // Check if data has cropsUpdate/cropsCreate (new format) or crops (old format)
    const hasNewCropFormat = 'cropsUpdate' in data || 'cropsCreate' in data;
    const hasOldCropFormat = 'crops' in data && data.crops !== undefined;
    
    // Clean up the data - ensure all codes are strings
    const cleanData: any = {
      ...(data.farmName && { farmName: data.farmName.trim() }),
      ...(data.farmSizeHectares !== undefined && { farmSizeHectares: data.farmSizeHectares }),
      ...(data.locationAddress && { locationAddress: data.locationAddress.trim() }),
      ...(data.province && { province: data.province.trim() }),
      ...(data.district && { district: data.district.trim() }),
      ...(data.commune && { commune: data.commune.trim() }),
      ...(data.provinceCode && { provinceCode: String(data.provinceCode) }),
      ...(data.districtCode && { districtCode: String(data.districtCode) }),
      ...(data.communeCode && { communeCode: String(data.communeCode) }),
      ...(data.latitude !== undefined && data.latitude !== 0 && { latitude: data.latitude }),
      ...(data.longitude !== undefined && data.longitude !== 0 && { longitude: data.longitude }),
      ...(data.status && { status: data.status }),
    };
    
    // Handle crops in new format (cropsUpdate and cropsCreate)
    if (hasNewCropFormat) {
      const updateRequest = data as UpdateFarmProfileRequest;
      if (updateRequest.cropsUpdate && updateRequest.cropsUpdate.length > 0) {
        cleanData.cropsUpdate = updateRequest.cropsUpdate
          .filter((crop) => crop.cropName.trim() && crop.plantingDate)
          .map((crop) => ({
            id: crop.id,
            cropName: crop.cropName.trim(),
            plantingDate: crop.plantingDate,
            isActive: crop.isActive ?? true,
          }));
      }
      if (updateRequest.cropsCreate && updateRequest.cropsCreate.length > 0) {
        cleanData.cropsCreate = updateRequest.cropsCreate
          .filter((crop) => crop.cropName.trim() && crop.plantingDate)
          .map((crop) => ({
            cropName: crop.cropName.trim(),
            plantingDate: crop.plantingDate,
          }));
      }
    } 
    // Handle crops in old format (backward compatibility)
    else if (hasOldCropFormat) {
      const oldData = data as Partial<CreateFarmProfileRequest>;
      if (oldData.crops && oldData.crops.length > 0) {
        // Separate into cropsUpdate and cropsCreate
        const cropsUpdate = oldData.crops
          .filter((crop) => crop.id && crop.id > 0)
          .map((crop) => ({
            id: crop.id!,
            cropName: crop.cropName.trim(),
            plantingDate: crop.plantingDate,
            isActive: crop.isActive ?? true,
          }));
        
        const cropsCreate = oldData.crops
          .filter((crop) => !crop.id || crop.id === 0)
          .map((crop) => ({
            cropName: crop.cropName.trim(),
            plantingDate: crop.plantingDate,
          }));
        
        if (cropsUpdate.length > 0) {
          cleanData.cropsUpdate = cropsUpdate;
        }
        if (cropsCreate.length > 0) {
          cleanData.cropsCreate = cropsCreate;
        }
      }
    }
    
    console.log('Cleaned update data:', cleanData);
    
    const response = await apiClient.patch(`/api/FarmProfile/${id}`, cleanData);
    console.log('Update farm profile response:', response);
    
    // apiClient interceptor returns response.data, so response is already the data
    const raw: any = response;
    
    // Check if response matches expected format
    if (raw && typeof raw === 'object' && 'status' in raw) {
      return raw as UpdateFarmProfileResponse;
    }
    
    // Fallback: wrap response in expected format
    return {
      status: true,
      statusCode: "OK",
      data: typeof raw === 'string' ? raw : JSON.stringify(raw),
      errors: [],
    } as UpdateFarmProfileResponse;
  } catch (error: any) {
    console.error('Error updating farm profile:', error);
    
    // Handle error response from interceptor
    if (error && typeof error === 'object' && 'status' in error) {
      return error as UpdateFarmProfileResponse;
    }
    
    // Handle axios error response
    if (error?.response?.data && typeof error.response.data === 'object' && 'status' in error.response.data) {
      return error.response.data as UpdateFarmProfileResponse;
    }
    
    // Create error response
    const errorResponse: UpdateFarmProfileResponse = {
      status: false,
      statusCode: error?.response?.status || 'Error',
      data: '',
      errors: error?.response?.data?.errors || 
              (error?.message ? [error.message] : ['Không thể cập nhật trang trại']),
    };
    
    throw errorResponse;
  }
};

/**
 * Xóa farm profile (soft delete)
 * API endpoint: DELETE /api/FarmProfile/{id}
 */
export const deleteFarmProfile = async (id: number): Promise<{ message: string }> => {
  try {
    const response = await apiClient.patch(`/api/FarmProfile/${id}`);
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
