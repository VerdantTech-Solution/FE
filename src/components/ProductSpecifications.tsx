import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Settings, 
  Zap, 
  Weight, 
  Ruler, 
  Shield, 
  Fuel, 
  Gauge, 
  Wrench,
  Star,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ProductSpecificationsProps {
  specifications?: { [key: string]: string };
  dimensionsCm?: {
    width: number;
    height: number;
    length: number;
  };
  weightkg?: number;
  warrantyMonths?: number;
  energyEfficiencyRating?: string;
  categoryName?: string;
}

interface SpecificationItem {
  key: string;
  value: string;
  icon: React.ReactNode;
  importance: 'critical' | 'important' | 'standard';
  category: 'performance' | 'physical' | 'safety' | 'operational';
}

const ProductSpecifications: React.FC<ProductSpecificationsProps> = ({
  specifications = {},
  dimensionsCm,
  weightkg,
  warrantyMonths,
  energyEfficiencyRating
}) => {
  // Phân loại thông số theo mức độ quan trọng và loại
  const categorizeSpecifications = (): SpecificationItem[] => {
    const items: SpecificationItem[] = [];
    
    // Thông số hiệu suất (Performance) - Quan trọng nhất
    const performanceSpecs = [
      { key: 'Công suất động cơ', icon: <Zap className="w-4 h-4" />, importance: 'critical' as const },
      { key: 'Loại động cơ', icon: <Settings className="w-4 h-4" />, importance: 'critical' as const },
      { key: 'Hệ truyền động', icon: <Gauge className="w-4 h-4" />, importance: 'critical' as const },
      { key: 'Độ rộng xới', icon: <Ruler className="w-4 h-4" />, importance: 'critical' as const },
      { key: 'Độ sâu xới', icon: <Ruler className="w-4 h-4" />, importance: 'critical' as const },
      { key: 'Tốc độ làm việc', icon: <Gauge className="w-4 h-4" />, importance: 'important' as const },
      { key: 'Dung tích thùng chứa', icon: <Settings className="w-4 h-4" />, importance: 'important' as const },
      { key: 'Thời gian bay', icon: <Zap className="w-4 h-4" />, importance: 'critical' as const },
      { key: 'Tầm bay', icon: <Gauge className="w-4 h-4" />, importance: 'important' as const },
      { key: 'Tải trọng', icon: <Weight className="w-4 h-4" />, importance: 'critical' as const },
      { key: 'Tỷ lệ nảy mầm', icon: <CheckCircle className="w-4 h-4" />, importance: 'critical' as const },
      { key: 'Hàm lượng dinh dưỡng', icon: <Info className="w-4 h-4" />, importance: 'critical' as const }
    ];

    // Thông số vật lý (Physical) - Quan trọng
    const physicalSpecs = [
      { key: 'Trọng lượng', icon: <Weight className="w-4 h-4" />, importance: 'important' as const },
      { key: 'Kích thước', icon: <Ruler className="w-4 h-4" />, importance: 'important' as const },
      { key: 'Khung sườn', icon: <Wrench className="w-4 h-4" />, importance: 'standard' as const },
      { key: 'Dạng sản phẩm', icon: <Info className="w-4 h-4" />, importance: 'standard' as const }
    ];

    // Thông số vận hành (Operational) - Quan trọng
    const operationalSpecs = [
      { key: 'Loại nhiên liệu', icon: <Fuel className="w-4 h-4" />, importance: 'important' as const },
      { key: 'Khả năng điều chỉnh', icon: <Settings className="w-4 h-4" />, importance: 'standard' as const },
      { key: 'Hệ thống điều khiển', icon: <Gauge className="w-4 h-4" />, importance: 'important' as const },
      { key: 'Số cấp số', icon: <Settings className="w-4 h-4" />, importance: 'standard' as const },
      { key: 'Pin', icon: <Zap className="w-4 h-4" />, importance: 'important' as const },
      { key: 'Camera', icon: <Info className="w-4 h-4" />, importance: 'standard' as const },
      { key: 'GPS', icon: <Info className="w-4 h-4" />, importance: 'standard' as const }
    ];

    // Thông số an toàn (Safety) - Quan trọng
    const safetySpecs = [
      { key: 'Bảo hành', icon: <Shield className="w-4 h-4" />, importance: 'important' as const },
      { key: 'Xếp hạng hiệu suất', icon: <Star className="w-4 h-4" />, importance: 'standard' as const },
      { key: 'Độ tan', icon: <Info className="w-4 h-4" />, importance: 'standard' as const },
      { key: 'pH', icon: <Info className="w-4 h-4" />, importance: 'standard' as const },
      { key: 'Độ ẩm', icon: <Info className="w-4 h-4" />, importance: 'standard' as const }
    ];

    // Tìm thông số trong specifications
    Object.entries(specifications).forEach(([key, value]) => {
      const foundSpec = [...performanceSpecs, ...physicalSpecs, ...operationalSpecs, ...safetySpecs]
        .find(spec => spec.key === key);
      
      if (foundSpec) {
        // Determine category by checking which array contains this spec's key
        const isPerformance = performanceSpecs.some(spec => spec.key === key);
        const isPhysical = physicalSpecs.some(spec => spec.key === key);
        const isOperational = operationalSpecs.some(spec => spec.key === key);
        
        items.push({
          key,
          value,
          icon: foundSpec.icon,
          importance: foundSpec.importance,
          category: isPerformance ? 'performance' :
                   isPhysical ? 'physical' :
                   isOperational ? 'operational' : 'safety'
        });
      } else {
        // Thông số không được phân loại
        items.push({
          key,
          value,
          icon: <Info className="w-4 h-4" />,
          importance: 'standard',
          category: 'operational'
        });
      }
    });

    // Thêm thông số từ props
    if (dimensionsCm && (dimensionsCm.width > 0 || dimensionsCm.height > 0 || dimensionsCm.length > 0)) {
      items.push({
        key: 'Kích thước',
        value: `${dimensionsCm.width}cm × ${dimensionsCm.height}cm × ${dimensionsCm.length}cm`,
        icon: <Ruler className="w-4 h-4" />,
        importance: 'important',
        category: 'physical'
      });
    }

    if (weightkg && weightkg > 0) {
      items.push({
        key: 'Trọng lượng',
        value: `${weightkg}kg`,
        icon: <Weight className="w-4 h-4" />,
        importance: 'important',
        category: 'physical'
      });
    }

    if (warrantyMonths && warrantyMonths > 0) {
      items.push({
        key: 'Bảo hành',
        value: `${warrantyMonths} tháng`,
        icon: <Shield className="w-4 h-4" />,
        importance: 'important',
        category: 'safety'
      });
    }

    if (energyEfficiencyRating) {
      items.push({
        key: 'Xếp hạng hiệu suất',
        value: energyEfficiencyRating,
        icon: <Star className="w-4 h-4" />,
        importance: 'standard',
        category: 'safety'
      });
    }

    return items;
  };

  const specificationsList = categorizeSpecifications();

  if (specificationsList.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Thông số kỹ thuật
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-gray-500">
            <AlertCircle className="w-8 h-8 mr-2" />
            <span>Chưa có thông số kỹ thuật</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Thông số kỹ thuật
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {specificationsList.map((spec, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="text-gray-600">
                  {spec.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">
                    {spec.key}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {spec.value}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductSpecifications;
