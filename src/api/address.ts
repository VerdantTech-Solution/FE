// Address API functions for Vietnamese administrative divisions using GoShip API
export interface City {
  id: string;
  name: string;
}

export interface District {
  id: string;
  name: string;
}

export interface Ward {
  id: string;
  name: string;
}

import { apiClient } from './apiClient';

const BASE_URL = '/api/Courier';

// Get all cities from GoShip API
export const getCities = async (): Promise<City[]> => {
  try {
    const res = await apiClient.get(`${BASE_URL}/cities`, { headers: { accept: 'text/plain' } });
    // Our apiClient returns response.data already; server wraps as { status, statusCode, data }
    const payload = (res as any) || {};
    return payload.data || [];
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw error;
  }
};

// Legacy function for backward compatibility - now uses cities
export const getProvinces = async (): Promise<City[]> => {
  return getCities();
};

// Get districts by city ID from GoShip API
export const getDistricts = async (cityId: string): Promise<District[]> => {
  try {
    const res = await apiClient.get(`${BASE_URL}/districts/${cityId}`, { headers: { accept: 'text/plain' } });
    const payload = (res as any) || {};
    return payload.data || [];
  } catch (error) {
    console.error('Error fetching districts:', error);
    throw error;
  }
};

// Get wards by district ID from GoShip API
export const getWards = async (districtId: string): Promise<Ward[]> => {
  try {
    const res = await apiClient.get(`${BASE_URL}/wards/${districtId}`, { headers: { accept: 'text/plain' } });
    const payload = (res as any) || {};
    return payload.data || [];
  } catch (error) {
    console.error('Error fetching wards:', error);
    throw error;
  }
};