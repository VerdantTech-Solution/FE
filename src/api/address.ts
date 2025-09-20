// API service for Vietnam administrative divisions
const BASE_URL = 'https://vapi.vnappmob.com/api/v2/province';

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

// Get all provinces
export const getProvinces = async (): Promise<Province[]> => {
  try {
    console.log('Đang tải danh sách tỉnh/thành...');
    const response = await fetch(`${BASE_URL}/`);
    console.log('Provinces API response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Lỗi tải danh sách tỉnh/thành: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Provinces API data:', data);
    
    if (!data.results) {
      console.warn('Không có dữ liệu tỉnh/thành');
      return [];
    }
    
    return data.results || [];
  } catch (error) {
    console.error('Lỗi khi tải danh sách tỉnh/thành:', error);
    return [];
  }
};

// Get districts by province ID
export const getDistricts = async (provinceId: string): Promise<District[]> => {
  try {
    console.log('Đang tải danh sách quận/huyện cho tỉnh:', provinceId);
    const response = await fetch(`${BASE_URL}/district/${provinceId}`);
    console.log('Districts API response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Lỗi tải danh sách quận/huyện: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Districts API data:', data);
    
    if (!data.results) {
      console.warn('Không có dữ liệu quận/huyện');
      return [];
    }
    
    return data.results || [];
  } catch (error) {
    console.error('Lỗi khi tải danh sách quận/huyện:', error);
    return [];
  }
};

// Get wards by district ID
export const getWards = async (districtId: string): Promise<Ward[]> => {
  try {
    console.log('API - Fetching wards for district:', districtId);
    const url = `${BASE_URL}/ward/${districtId}`;
    console.log('API - Wards URL:', url);
    
    const response = await fetch(url);
    console.log('API - Wards response status:', response.status);
    console.log('API - Wards response headers:', response.headers);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API - Wards error response:', errorText);
      throw new Error(`Lỗi tải danh sách phường/xã: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('API - Wards response data:', data);
    
    if (!data.results) {
      console.warn('API - No results in wards response');
      return [];
    }
    
    console.log('API - Wards results count:', data.results.length);
    return data.results || [];
  } catch (error) {
    console.error('API - Lỗi khi tải danh sách phường/xã:', error);
    return [];
  }
};
