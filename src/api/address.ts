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

const BASE_URL = 'https://sep490.onrender.com/api/Courier';

// Get all cities from GoShip API
export const getCities = async (): Promise<City[]> => {
  try {
    const response = await fetch(`${BASE_URL}/cities`, {
      headers: {
        'accept': 'text/plain',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxIiwicm9sZSI6IkFkbWluIiwibmJmIjoxNzU5NjQ1MDc1LCJleHAiOjE3NTk3MzE0NzUsImlhdCI6MTc1OTY0NTA3NSwiaXNzIjoiVmVyZGFudFRlY2giLCJhdWQiOiJWZXJkYW50VGVjaFVzZXJzIn0.5PCpBGKgWEmvYCweoLNHVBW1nh3GfPFhngK4VcuMtrs'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch cities');
    }
    
    const data = await response.json();
    return data.data || [];
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
    const response = await fetch(`${BASE_URL}/districts/${cityId}`, {
      headers: {
        'accept': 'text/plain',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxIiwicm9sZSI6IkFkbWluIiwibmJmIjoxNzU5NjQ1MDc1LCJleHAiOjE3NTk3MzE0NzUsImlhdCI6MTc1OTY0NTA3NSwiaXNzIjoiVmVyZGFudFRlY2giLCJhdWQiOiJWZXJkYW50VGVjaFVzZXJzIn0.5PCpBGKgWEmvYCweoLNHVBW1nh3GfPFhngK4VcuMtrs'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch districts');
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching districts:', error);
    throw error;
  }
};

// Get wards by district ID from GoShip API
export const getWards = async (districtId: string): Promise<Ward[]> => {
  try {
    const response = await fetch(`${BASE_URL}/wards/${districtId}`, {
      headers: {
        'accept': 'text/plain',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxIiwicm9sZSI6IkFkbWluIiwibmJmIjoxNzU5NjQ1MDc1LCJleHAiOjE3NTk3MzE0NzUsImlhdCI6MTc1OTY0NTA3NSwiaXNzIjoiVmVyZGFudFRlY2giLCJhdWQiOiJWZXJkYW50VGVjaFVzZXJzIn0.5PCpBGKgWEmvYCweoLNHVBW1nh3GfPFhngK4VcuMtrs'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch wards');
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching wards:', error);
    throw error;
  }
};