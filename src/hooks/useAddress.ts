import { useState, useEffect, useCallback } from 'react';
import { getProvinces, getDistricts, getWards, type Province, type District, type Ward } from '@/api/address';

export interface AddressData {
  provinces: Province[];
  districts: District[];
  wards: Ward[];
  selectedProvince: Province | null;
  selectedDistrict: District | null;
  selectedWard: Ward | null;
  loading: {
    provinces: boolean;
    districts: boolean;
    wards: boolean;
  };
}

export const useAddress = () => {
  const [addressData, setAddressData] = useState<AddressData>({
    provinces: [],
    districts: [],
    wards: [],
    selectedProvince: null,
    selectedDistrict: null,
    selectedWard: null,
    loading: {
      provinces: false,
      districts: false,
      wards: false,
    },
  });

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      setAddressData(prev => ({
        ...prev,
        loading: { ...prev.loading, provinces: true },
      }));

      try {
        const provinces = await getProvinces();
        setAddressData(prev => ({
          ...prev,
          provinces,
          loading: { ...prev.loading, provinces: false },
        }));
      } catch (error) {
        console.error('Error loading provinces:', error);
        setAddressData(prev => ({
          ...prev,
          loading: { ...prev.loading, provinces: false },
        }));
      }
    };

    loadProvinces();
  }, []);

  // Load districts when province is selected
  const selectProvince = useCallback(async (province: Province | null) => {
    setAddressData(prev => ({
      ...prev,
      selectedProvince: province,
      selectedDistrict: null,
      selectedWard: null,
      districts: [],
      wards: [],
      loading: { ...prev.loading, districts: true, wards: false },
    }));

    if (!province) return;

    try {
      const districts = await getDistricts(province.province_id);
      setAddressData(prev => ({
        ...prev,
        districts,
        loading: { ...prev.loading, districts: false },
      }));
    } catch (error) {
      console.error('Error loading districts:', error);
      setAddressData(prev => ({
        ...prev,
        loading: { ...prev.loading, districts: false },
      }));
    }
  }, []);

  // Load wards when district is selected
  const selectDistrict = useCallback(async (district: District | null) => {
    setAddressData(prev => ({
      ...prev,
      selectedDistrict: district,
      selectedWard: null,
      wards: [],
      loading: { ...prev.loading, wards: true },
    }));

    if (!district) return;

    try {
      const wards = await getWards(district.district_id);
      setAddressData(prev => ({
        ...prev,
        wards,
        loading: { ...prev.loading, wards: false },
      }));
    } catch (error) {
      console.error('Error loading wards:', error);
      setAddressData(prev => ({
        ...prev,
        loading: { ...prev.loading, wards: false },
      }));
    }
  }, []);

  // Select ward
  const selectWard = useCallback((ward: Ward | null) => {
    setAddressData(prev => ({
      ...prev,
      selectedWard: ward,
    }));
  }, []);

  // Reset all selections
  const resetAddress = useCallback(() => {
    setAddressData(prev => ({
      ...prev,
      selectedProvince: null,
      selectedDistrict: null,
      selectedWard: null,
      districts: [],
      wards: [],
    }));
  }, []);

  // Set initial values (for editing existing data)
  const setInitialAddress = useCallback(async (provinceName: string, districtName: string, wardName: string) => {
    if (!addressData.provinces.length) return;

    // Find province
    const province = addressData.provinces.find(p => 
      p.province_name === provinceName || 
      p.province_name.includes(provinceName) ||
      provinceName.includes(p.province_name)
    );

    if (province) {
      await selectProvince(province);
      
      // Wait for districts to load, then find district
      setTimeout(async () => {
        const districts = await getDistricts(province.province_id);
        const district = districts.find(d => 
          d.district_name === districtName || 
          d.district_name.includes(districtName) ||
          districtName.includes(d.district_name)
        );

        if (district) {
          await selectDistrict(district);
          
          // Wait for wards to load, then find ward
          setTimeout(async () => {
            const wards = await getWards(district.district_id);
            const ward = wards.find(w => 
              w.ward_name === wardName || 
              w.ward_name.includes(wardName) ||
              wardName.includes(w.ward_name)
            );

            if (ward) {
              selectWard(ward);
            }
          }, 500);
        }
      }, 500);
    }
  }, [addressData.provinces, selectProvince, selectDistrict, selectWard]);

  return {
    ...addressData,
    selectProvince,
    selectDistrict,
    selectWard,
    resetAddress,
    setInitialAddress,
  };
};