// Address API functions for Vietnamese administrative divisions
export interface Province {
  province_id: string;
  province_name: string;
  province_type: string;
}

export interface District {
  district_id: string;
  district_name: string;
  district_type: string;
  province_id: string;
}

export interface Ward {
  ward_id: string;
  ward_name: string;
  ward_type: string;
  district_id: string;
}

const BASE_URL = 'https://vapi.vnappmob.com/api/v2/province';

// Get all provinces
export const getProvinces = async (): Promise<Province[]> => {
  try {
    const response = await fetch(`${BASE_URL}/`);
    if (!response.ok) {
      throw new Error('Failed to fetch provinces');
    }
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching provinces:', error);
    throw error;
  }
};

// Get districts by province ID
export const getDistricts = async (provinceId: string): Promise<District[]> => {
  try {
    const response = await fetch(`${BASE_URL}/district/${provinceId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch districts');
    }
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching districts:', error);
    throw error;
  }
};

// Get wards by district ID
export const getWards = async (districtId: string): Promise<Ward[]> => {
  try {
    const response = await fetch(`${BASE_URL}/ward/${districtId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch wards');
    }
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching wards:', error);
    throw error;
  }
};