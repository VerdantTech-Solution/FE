import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useAddress } from '@/hooks/useAddress';

interface AddressSelectorProps {
  onAddressChange: (address: {
    province: string;
    district: string;
    ward: string;
  }) => void;
  className?: string;
}

export const AddressSelector = ({
  onAddressChange,
  className = ''
}: AddressSelectorProps) => {
  const {
    provinces,
    districts,
    wards,
    loading,
    selectedAddress,
    handleProvinceChange,
    handleDistrictChange,
    handleWardChange,
  } = useAddress();

  // Notify parent component when address changes
  React.useEffect(() => {
    if (selectedAddress.province && selectedAddress.district && selectedAddress.ward) {
      onAddressChange({
        province: selectedAddress.province.province_name,
        district: selectedAddress.district.district_name,
        ward: selectedAddress.ward.ward_name,
      });
    }
  }, [selectedAddress.province?.province_id, selectedAddress.district?.district_id, selectedAddress.ward?.ward_id, onAddressChange]);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {/* Province Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Tỉnh/Thành <span className="text-red-500">*</span>
        </label>
        <Select
          value={selectedAddress.province?.province_id || ''}
          onValueChange={handleProvinceChange}
          disabled={loading.provinces}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn tỉnh/thành" />
          </SelectTrigger>
          <SelectContent>
            {loading.provinces ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-gray-500">Đang tải...</span>
              </div>
            ) : (
              provinces.map((province) => (
                <SelectItem key={province.province_id} value={province.province_id}>
                  {province.province_name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* District Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Quận/Huyện <span className="text-red-500">*</span>
        </label>
        <Select
          value={selectedAddress.district?.district_id || ''}
          onValueChange={handleDistrictChange}
          disabled={!selectedAddress.province || loading.districts}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn quận/huyện" />
          </SelectTrigger>
          <SelectContent>
            {loading.districts ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-gray-500">Đang tải...</span>
              </div>
            ) : (
              districts.map((district) => (
                <SelectItem key={district.district_id} value={district.district_id}>
                  {district.district_name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Ward Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Xã/Phường <span className="text-red-500">*</span>
        </label>
        <Select
          value={selectedAddress.ward?.ward_id || ''}
          onValueChange={handleWardChange}
          disabled={!selectedAddress.district || loading.wards}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={
              !selectedAddress.district 
                ? "Chọn quận/huyện trước" 
                : loading.wards 
                  ? "Đang tải..." 
                  : "Chọn xã/phường"
            } />
          </SelectTrigger>
          <SelectContent>
            {loading.wards ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-gray-500">Đang tải danh sách phường/xã...</span>
              </div>
            ) : wards.length === 0 ? (
              <div className="flex items-center justify-center p-4">
                <span className="text-sm text-gray-500">Không có phường/xã nào</span>
              </div>
            ) : (
              wards.map((ward) => (
                <SelectItem key={ward.ward_id} value={ward.ward_id}>
                  {ward.ward_name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {!selectedAddress.district && (
          <p className="text-xs text-amber-600">
            ⚠️ Vui lòng chọn quận/huyện trước
          </p>
        )}
        {selectedAddress.district && wards.length === 0 && !loading.wards && (
          <p className="text-xs text-red-600">
            ❌ Không tìm thấy phường/xã nào cho quận/huyện này
          </p>
        )}
      </div>
    </div>
  );
};

export default AddressSelector;
