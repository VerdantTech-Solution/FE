import { useState, useEffect, useCallback } from 'react';
import { getCities, getDistricts, getWards, type City, type District, type Ward } from '@/api/address';

export interface AddressData {
  cities: City[];
  districts: District[];
  wards: Ward[];
  selectedCity: City | null;
  selectedDistrict: District | null;
  selectedWard: Ward | null;
  loading: {
    cities: boolean;
    districts: boolean;
    wards: boolean;
  };
}

export const useAddress = () => {
  const [addressData, setAddressData] = useState<AddressData>({
    cities: [],
    districts: [],
    wards: [],
    selectedCity: null,
    selectedDistrict: null,
    selectedWard: null,
    loading: {
      cities: false,
      districts: false,
      wards: false,
    },
  });

  // Load cities on mount
  useEffect(() => {
    const loadCities = async () => {
      setAddressData(prev => ({
        ...prev,
        loading: { ...prev.loading, cities: true },
      }));

      try {
        const cities = await getCities();
        setAddressData(prev => ({
          ...prev,
          cities,
          loading: { ...prev.loading, cities: false },
        }));
      } catch (error) {
        console.error('Error loading cities:', error);
        setAddressData(prev => ({
          ...prev,
          loading: { ...prev.loading, cities: false },
        }));
      }
    };

    loadCities();
  }, []);

  // Load districts when city is selected
  const selectCity = useCallback(async (city: City | null) => {
    setAddressData(prev => ({
      ...prev,
      selectedCity: city,
      selectedDistrict: null,
      selectedWard: null,
      districts: [],
      wards: [],
      loading: { ...prev.loading, districts: true, wards: false },
    }));

    if (!city) return;

    try {
      const districts = await getDistricts(city.id);
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
      const wards = await getWards(district.id);
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
      selectedCity: null,
      selectedDistrict: null,
      selectedWard: null,
      districts: [],
      wards: [],
    }));
  }, []);

  // Set initial values (for editing existing data)
  const setInitialAddress = useCallback(async (cityName: string, districtName: string, wardName: string) => {
    if (!addressData.cities.length) return;

    // Find city
    const city = addressData.cities.find(c => 
      c.name === cityName || 
      c.name.includes(cityName) ||
      cityName.includes(c.name)
    );

    if (city) {
      await selectCity(city);
      
      // Wait for districts to load, then find district
      setTimeout(async () => {
        const districts = await getDistricts(city.id);
        const district = districts.find(d => 
          d.name === districtName || 
          d.name.includes(districtName) ||
          districtName.includes(d.name)
        );

        if (district) {
          await selectDistrict(district);
          
          // Wait for wards to load, then find ward
          setTimeout(async () => {
            const wards = await getWards(district.id);
            const ward = wards.find(w => 
              w.name === wardName || 
              w.name.includes(wardName) ||
              wardName.includes(w.name)
            );

            if (ward) {
              selectWard(ward);
            }
          }, 500);
        }
      }, 500);
    }
  }, [addressData.cities, selectCity, selectDistrict, selectWard]);

  return {
    ...addressData,
    selectCity,
    selectDistrict,
    selectWard,
    resetAddress,
    setInitialAddress,
  };
};