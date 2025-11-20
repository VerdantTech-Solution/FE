import { apiClient } from './apiClient';

export interface CreateCO2FootprintRequest {
  measurementStartDate: string; // YYYY-MM-DD
  measurementEndDate: string;   // YYYY-MM-DD
  notes?: string;
  electricityKwh?: number;
  gasolineLiters?: number;
  dieselLiters?: number;
  organicFertilizer?: number;
  npkFertilizer?: number;
  ureaFertilizer?: number;
  phosphateFertilizer?: number;
}

export interface ApiResponseWrapper<T> {
  status: boolean;
  statusCode: number;
  data: T;
  errors?: string[];
}
// ====== GET All Environmental Data by Farm ID ======
export interface EnergyUsage {
  id: number;
  electricityKwh: number;
  gasolineLiters: number;
  dieselLiters: number;
  createdAt: string;
  updatedAt: string;
}

export interface FertilizerUsage {
  id: number;
  organicFertilizer: number;
  npkFertilizer: number;
  ureaFertilizer: number;
  phosphateFertilizer: number;
  createdAt: string;
  updatedAt: string;
}

export interface CO2Record {
  id: number;
  farmProfileId: number;
  customerId: number;
  measurementStartDate: string; // YYYY-MM-DD
  measurementEndDate: string;   // YYYY-MM-DD
  sandPct?: number;
  siltPct?: number;
  clayPct?: number;
  phh2o?: number;
  precipitationSum?: number;
  et0FaoEvapotranspiration?: number;
  co2Footprint?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  energyUsage?: EnergyUsage;
  fertilizer?: FertilizerUsage;
}

export const createCO2FootprintForFarm = async (
  farmId: number,
  payload: CreateCO2FootprintRequest
): Promise<ApiResponseWrapper<string>> => {
  try {
    const { data } = await apiClient.post<ApiResponseWrapper<string>>(`/api/CO2/farm/${farmId}`, payload);
    return data;
  } catch (error) {
    console.error('Create CO2 footprint error:', error);
    throw error;
  }
};



export const getCO2DataByFarmId = async (
  farmId: number
): Promise<ApiResponseWrapper<CO2Record[]>> => {
  try {
    const { data } = await apiClient.get<ApiResponseWrapper<CO2Record[]>>(`/api/CO2/farm/${farmId}`);
    return data;
  } catch (error) {
    console.error('Get CO2 data error:', error);
    throw error;
  }
};

// ====== HARD DELETE Environmental Data by ID ======
export const deleteCO2RecordById = async (
  id: number
): Promise<ApiResponseWrapper<string>> => {
  try {
    const { data } = await apiClient.delete<ApiResponseWrapper<string>>(`/api/CO2/${id}`);
    return data;
  } catch (error) {
    console.error('Delete CO2 record error:', error);
    throw error;
  }
};


