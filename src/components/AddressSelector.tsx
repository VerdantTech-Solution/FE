import { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAddress } from '@/hooks/useAddress';

interface AddressSelectorProps {
  selectedCity: string;
  selectedDistrict: string;
  selectedWard: string;
  onCityChange: (value: string, code?: string) => void;
  onDistrictChange: (value: string, code?: string) => void;
  onWardChange: (value: string, code?: string) => void;
  initialCity?: string;
  initialDistrict?: string;
  initialWard?: string;
  className?: string;
}

const AddressSelector = ({
  selectedCity,
  selectedDistrict,
  selectedWard,
  onCityChange,
  onDistrictChange,
  onWardChange,
  initialCity,
  initialDistrict,
  initialWard,
  className = "",
}: AddressSelectorProps) => {
  const {
    cities,
    districts,
    wards,
    selectedCity: currentCity,
    selectedDistrict: currentDistrict,
    selectedWard: currentWard,
    loading,
    selectCity,
    selectDistrict,
    selectWard,
    setInitialAddress,
  } = useAddress();

  // Set initial values when component mounts or when initial values change
  useEffect(() => {
    if (initialCity && initialDistrict && initialWard && cities.length > 0) {
      setInitialAddress(initialCity, initialDistrict, initialWard);
    }
  }, [initialCity, initialDistrict, initialWard, cities.length, setInitialAddress]);

  // Sync with external props when they change
  useEffect(() => {
    if (selectedCity && selectedCity !== currentCity?.name) {
      const city = cities.find(c => c.name === selectedCity);
      if (city && city.id !== currentCity?.id) {
        selectCity(city);
      }
    }
  }, [selectedCity, cities, currentCity, selectCity]);

  useEffect(() => {
    if (selectedDistrict && selectedDistrict !== currentDistrict?.name) {
      const district = districts.find(d => d.name === selectedDistrict);
      if (district && district.districtCode !== currentDistrict?.districtCode) {
        selectDistrict(district);
      }
    }
  }, [selectedDistrict, districts, currentDistrict, selectDistrict]);

  useEffect(() => {
    if (selectedWard && selectedWard !== currentWard?.name) {
      const ward = wards.find(w => w.name === selectedWard);
      if (ward && ward.communeCode !== currentWard?.communeCode) {
        selectWard(ward);
      }
    }
  }, [selectedWard, wards, currentWard, selectWard]);

  const handleCityChange = (cityId: string) => {
    const city = cities.find(c => c.id === cityId);
    if (city) {
      selectCity(city);
      onCityChange(city.name, city.provinceId.toString());
      onDistrictChange('', '');
      onWardChange('', '');
    }
  };

  const handleDistrictChange = (districtId: string) => {
    const district = districts.find(d => d.districtCode === districtId);
    if (district) {
      selectDistrict(district);
      onDistrictChange(district.name, district.districtCode);
      onWardChange('', '');
    }
  };

  const handleWardChange = (wardId: string) => {
    const ward = wards.find(w => w.communeCode === wardId);
    if (ward) {
      selectWard(ward);
      onWardChange(ward.name, ward.communeCode);
    }
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {/* City Selector */}
      <div className="space-y-2">
        <Label htmlFor="city" className="text-sm font-medium text-gray-700">
          Tỉnh/Thành <span className="text-red-500">*</span>
        </Label>
        <Select
          value={currentCity?.id || ''}
          onValueChange={handleCityChange}
          disabled={loading.cities}
        >
          <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue placeholder={loading.cities ? "Đang tải..." : "Chọn tỉnh/thành"} />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loading.cities && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Đang tải danh sách tỉnh/thành...
          </div>
        )}
      </div>

      {/* District Selector */}
      <div className="space-y-2">
        <Label htmlFor="district" className="text-sm font-medium text-gray-700">
          Quận/Huyện <span className="text-red-500">*</span>
        </Label>
        <Select
          value={currentDistrict?.districtCode || ''}
          onValueChange={handleDistrictChange}
          disabled={!currentCity || loading.districts}
        >
          <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue 
              placeholder={
                !currentCity 
                  ? "Chọn tỉnh/thành trước" 
                  : loading.districts 
                    ? "Đang tải..." 
                    : "Chọn quận/huyện"
              } 
            />
          </SelectTrigger>
          <SelectContent>
            {districts.map((district) => (
              <SelectItem key={district.districtCode} value={district.districtCode}>
                {district.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loading.districts && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Đang tải danh sách quận/huyện...
          </div>
        )}
      </div>

      {/* Ward Selector */}
      <div className="space-y-2">
        <Label htmlFor="ward" className="text-sm font-medium text-gray-700">
          Xã/Phường <span className="text-red-500">*</span>
        </Label>
        <Select
          value={currentWard?.communeCode || ''}
          onValueChange={handleWardChange}
          disabled={!currentDistrict || loading.wards}
        >
          <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue 
              placeholder={
                !currentDistrict 
                  ? "Chọn quận/huyện trước" 
                  : loading.wards 
                    ? "Đang tải..." 
                    : "Chọn xã/phường"
              } 
            />
          </SelectTrigger>
          <SelectContent>
            {wards.map((ward) => (
              <SelectItem key={ward.communeCode} value={ward.communeCode}>
                {ward.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loading.wards && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Đang tải danh sách xã/phường...
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressSelector;