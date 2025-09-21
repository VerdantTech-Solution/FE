import { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAddress } from '@/hooks/useAddress';

interface AddressSelectorProps {
  selectedProvince: string;
  selectedDistrict: string;
  selectedWard: string;
  onProvinceChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onWardChange: (value: string) => void;
  initialProvince?: string;
  initialDistrict?: string;
  initialWard?: string;
}

const AddressSelector = ({
  selectedProvince,
  selectedDistrict,
  selectedWard,
  onProvinceChange,
  onDistrictChange,
  onWardChange,
  initialProvince,
  initialDistrict,
  initialWard,
}: AddressSelectorProps) => {
  const {
    provinces,
    districts,
    wards,
    selectedProvince: currentProvince,
    selectedDistrict: currentDistrict,
    selectedWard: currentWard,
    loading,
    selectProvince,
    selectDistrict,
    selectWard,
    setInitialAddress,
  } = useAddress();

  // Set initial values when component mounts or when initial values change
  useEffect(() => {
    if (initialProvince && initialDistrict && initialWard && provinces.length > 0) {
      setInitialAddress(initialProvince, initialDistrict, initialWard);
    }
  }, [initialProvince, initialDistrict, initialWard, provinces.length, setInitialAddress]);

  const handleProvinceChange = (provinceId: string) => {
    const province = provinces.find(p => p.province_id === provinceId);
    if (province) {
      selectProvince(province);
      onProvinceChange(province.province_name);
      onDistrictChange('');
      onWardChange('');
    }
  };

  const handleDistrictChange = (districtId: string) => {
    const district = districts.find(d => d.district_id === districtId);
    if (district) {
      selectDistrict(district);
      onDistrictChange(district.district_name);
      onWardChange('');
    }
  };

  const handleWardChange = (wardId: string) => {
    const ward = wards.find(w => w.ward_id === wardId);
    if (ward) {
      selectWard(ward);
      onWardChange(ward.ward_name);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Province Selector */}
      <div className="space-y-2">
        <Label htmlFor="province" className="text-sm font-medium text-gray-700">
          Tỉnh/Thành <span className="text-red-500">*</span>
        </Label>
        <Select
          value={currentProvince?.province_id || ''}
          onValueChange={handleProvinceChange}
          disabled={loading.provinces}
        >
          <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue placeholder={loading.provinces ? "Đang tải..." : "Chọn tỉnh/thành"} />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((province) => (
              <SelectItem key={province.province_id} value={province.province_id}>
                {province.province_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loading.provinces && (
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
          value={currentDistrict?.district_id || ''}
          onValueChange={handleDistrictChange}
          disabled={!currentProvince || loading.districts}
        >
          <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue 
              placeholder={
                !currentProvince 
                  ? "Chọn tỉnh/thành trước" 
                  : loading.districts 
                    ? "Đang tải..." 
                    : "Chọn quận/huyện"
              } 
            />
          </SelectTrigger>
          <SelectContent>
            {districts.map((district) => (
              <SelectItem key={district.district_id} value={district.district_id}>
                {district.district_name}
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
          value={currentWard?.ward_id || ''}
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
              <SelectItem key={ward.ward_id} value={ward.ward_id}>
                {ward.ward_name}
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