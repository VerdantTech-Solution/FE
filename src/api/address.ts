// Address API functions for Vietnamese administrative divisions using GHN API
export interface Province {
  provinceId: number;
  name: string;
}

export interface District {
  districtId: number;
  provinceId: number;
  name: string;
}

export interface Commune {
  communeCode: string;
  districtId: number;
  name: string;
}

// Legacy interface for backward compatibility
export interface Ward extends Commune {
  wardId: number;
}

// Legacy interfaces for backward compatibility
export interface City extends Province {
  id: string;
}

import { apiClient } from './apiClient';

const BASE_URL = '/api/Address';

// Get all provinces from GHN API
export const getProvinces = async (): Promise<Province[]> => {
  try {
    const res = await apiClient.get(`${BASE_URL}/provinces`, { headers: { accept: 'text/plain' } });
    // Our apiClient returns response.data already; server wraps as { status, statusCode, data }
    const payload = (res as any) || {};
    return payload.data || [];
  } catch (error) {
    console.error('Error fetching provinces:', error);
    throw error;
  }
};

// Legacy function for backward compatibility - now uses provinces
export const getCities = async (): Promise<City[]> => {
  const provinces = await getProvinces();
  return provinces.map(province => ({
    id: province.provinceId.toString(),
    name: province.name,
    provinceId: province.provinceId
  }));
};

// Get districts by province ID from GHN API
export const getDistricts = async (provinceId: number): Promise<District[]> => {
  try {
    const res = await apiClient.get(`${BASE_URL}/districts?provinceId=${provinceId}`, { headers: { accept: 'text/plain' } });
    const payload = (res as any) || {};
    return payload.data || [];
  } catch (error) {
    console.error('Error fetching districts:', error);
    throw error;
  }
};

// Get all districts (without province filter)
export const getAllDistricts = async (): Promise<District[]> => {
  try {
    const res = await apiClient.get(`${BASE_URL}/districts`, { headers: { accept: 'text/plain' } });
    const payload = (res as any) || {};
    return payload.data || [];
  } catch (error) {
    console.error('Error fetching all districts:', error);
    throw error;
  }
};

// Get communes by district ID from GHN API
export const getCommunes = async (districtId: number): Promise<Commune[]> => {
  try {
    const res = await apiClient.get(`${BASE_URL}/communes?districtId=${districtId}`, { headers: { accept: 'text/plain' } });
    const payload = (res as any) || {};
    return payload.data || [];
  } catch (error) {
    console.error('Error fetching communes:', error);
    throw error;
  }
};

// Get all communes (without district filter)
export const getAllCommunes = async (): Promise<Commune[]> => {
  try {
    const res = await apiClient.get(`${BASE_URL}/communes`, { headers: { accept: 'text/plain' } });
    const payload = (res as any) || {};
    return payload.data || [];
  } catch (error) {
    console.error('Error fetching all communes:', error);
    throw error;
  }
};

// Legacy function for backward compatibility - now uses communes
export const getWards = async (districtId: number): Promise<Ward[]> => {
  const communes = await getCommunes(districtId);
  return communes.map(commune => ({
    ...commune,
    wardId: parseInt(commune.communeCode) || 0
  }));
};