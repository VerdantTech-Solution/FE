import { useState, useEffect, useCallback } from 'react';
import { getProvinces, getDistricts, getWards, type Province, type District, type Ward } from '@/api/address';

export interface AddressData {
  province: Province | null;
  district: District | null;
  ward: Ward | null;
}

export const useAddress = () => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState({
    provinces: false,
    districts: false,
    wards: false,
  });
  const [selectedAddress, setSelectedAddress] = useState<AddressData>({
    province: null,
    district: null,
    ward: null,
  });

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      setLoading(prev => ({ ...prev, provinces: true }));
      try {
        console.log('Đang tải danh sách tỉnh/thành...');
        const data = await getProvinces();
        console.log('Danh sách tỉnh/thành đã tải:', data);
        
        if (data.length === 0) {
          console.warn('Không tìm thấy tỉnh/thành nào');
          alert('Không thể tải danh sách tỉnh/thành. Vui lòng kiểm tra kết nối mạng.');
        }
        
        setProvinces(data);
      } catch (error) {
        console.error('Lỗi khi tải danh sách tỉnh/thành:', error);
        alert('Lỗi khi tải danh sách tỉnh/thành. Vui lòng thử lại sau.');
      } finally {
        setLoading(prev => ({ ...prev, provinces: false }));
      }
    };

    loadProvinces();
  }, []);

  // Handle province selection
  const handleProvinceChange = useCallback(async (provinceId: string) => {
    const selectedProvince = provinces.find(p => p.province_id === provinceId);
    
    setSelectedAddress({
      province: selectedProvince || null,
      district: null,
      ward: null,
    });
    
    setDistricts([]);
    setWards([]);

    if (provinceId) {
      setLoading(prev => ({ ...prev, districts: true }));
      try {
        console.log('Đang tải danh sách quận/huyện cho tỉnh:', provinceId);
        const data = await getDistricts(provinceId);
        console.log('Danh sách quận/huyện đã tải:', data);
        
        if (data.length === 0) {
          console.warn('Không tìm thấy quận/huyện nào cho tỉnh này');
        }
        
        setDistricts(data);
      } catch (error) {
        console.error('Lỗi khi tải danh sách quận/huyện:', error);
        alert('Không thể tải danh sách quận/huyện. Vui lòng thử lại sau.');
      } finally {
        setLoading(prev => ({ ...prev, districts: false }));
      }
    }
  }, [provinces]);

  // Handle district selection
  const handleDistrictChange = useCallback(async (districtId: string) => {
    const selectedDistrict = districts.find(d => d.district_id === districtId);
    
    setSelectedAddress(prev => ({
      ...prev,
      district: selectedDistrict || null,
      ward: null,
    }));
    
    setWards([]);

    if (districtId) {
      setLoading(prev => ({ ...prev, wards: true }));
      try {
        console.log('Đang tải danh sách phường/xã cho quận/huyện:', districtId);
        const data = await getWards(districtId);
        console.log('Danh sách phường/xã đã tải:', data);
        
        if (data.length === 0) {
          console.warn('Không tìm thấy phường/xã nào cho quận/huyện này');
        }
        
        setWards(data);
      } catch (error) {
        console.error('Lỗi khi tải danh sách phường/xã:', error);
        // Hiển thị thông báo lỗi cho người dùng
        alert('Không thể tải danh sách phường/xã. Vui lòng thử lại sau.');
      } finally {
        setLoading(prev => ({ ...prev, wards: false }));
      }
    }
  }, [districts]);

  // Handle ward selection
  const handleWardChange = useCallback((wardId: string) => {
    const selectedWard = wards.find(w => w.ward_id === wardId);
    
    setSelectedAddress(prev => ({
      ...prev,
      ward: selectedWard || null,
    }));
  }, [wards]);

  // Reset all selections
  const resetAddress = useCallback(() => {
    setSelectedAddress({
      province: null,
      district: null,
      ward: null,
    });
    setDistricts([]);
    setWards([]);
  }, []);

  return {
    provinces,
    districts,
    wards,
    loading,
    selectedAddress,
    handleProvinceChange,
    handleDistrictChange,
    handleWardChange,
    resetAddress,
  };
};
