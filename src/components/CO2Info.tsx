import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Leaf, Factory, Car, TreePine } from 'lucide-react';

interface CO2Data {
  totalEmission: number;
  carbonSequestration: number;
  netCO2: number;
  emissionBySource: {
    fertilizer: number;
    machinery: number;
    transportation: number;
    irrigation: number;
    other: number;
  };
  sequestrationByMethod: {
    soilCarbon: number;
    treePlanting: number;
    coverCrops: number;
    organicMatter: number;
  };
  recommendations: string[];
}

const CO2Info: React.FC = () => {
  // Mock data - trong thực tế sẽ lấy từ API
  const co2Data: CO2Data = {
    totalEmission: 2.4, // tấn CO2/ha/năm
    carbonSequestration: 1.8, // tấn CO2/ha/năm
    netCO2: -0.6, // tấn CO2/ha/năm (âm nghĩa là hấp thụ nhiều hơn phát thải)
    emissionBySource: {
      fertilizer: 35,
      machinery: 25,
      transportation: 20,
      irrigation: 15,
      other: 5
    },
    sequestrationByMethod: {
      soilCarbon: 40,
      treePlanting: 30,
      coverCrops: 20,
      organicMatter: 10
    },
    recommendations: [
      "Sử dụng phân hữu cơ thay vì phân hóa học",
      "Trồng cây che phủ để tăng carbon trong đất",
      "Sử dụng máy móc tiết kiệm nhiên liệu",
      "Tối ưu hóa lịch tưới tiêu",
      "Trồng cây xanh xung quanh trang trại"
    ]
  };

  const getEmissionColor = (value: number) => {
    if (value >= 30) return 'text-red-600';
    if (value >= 20) return 'text-orange-600';
    return 'text-green-600';
  };

  const getSequestrationColor = (value: number) => {
    if (value >= 30) return 'text-green-600';
    if (value >= 20) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Tổng quan CO2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Factory className="h-4 w-4 text-red-500" />
              Phát thải CO2
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{co2Data.totalEmission}</div>
            <p className="text-xs text-gray-500">tấn CO2/ha/năm</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Leaf className="h-4 w-4 text-green-500" />
              Hấp thụ CO2
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{co2Data.carbonSequestration}</div>
            <p className="text-xs text-gray-500">tấn CO2/ha/năm</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {co2Data.netCO2 < 0 ? (
                <TrendingDown className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-red-500" />
              )}
              Cân bằng CO2
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${co2Data.netCO2 < 0 ? 'text-green-600' : 'text-red-600'}`}>
              {co2Data.netCO2 > 0 ? '+' : ''}{co2Data.netCO2}
            </div>
            <p className="text-xs text-gray-500">tấn CO2/ha/năm</p>
          </CardContent>
        </Card>
      </div>

      {/* Nguồn phát thải */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nguồn phát thải CO2</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(co2Data.emissionBySource).map(([source, percentage]) => (
            <div key={source} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium capitalize">
                  {source === 'fertilizer' && 'Phân bón'}
                  {source === 'machinery' && 'Máy móc'}
                  {source === 'transportation' && 'Vận chuyển'}
                  {source === 'irrigation' && 'Tưới tiêu'}
                  {source === 'other' && 'Khác'}
                </span>
                <span className={`text-sm font-bold ${getEmissionColor(percentage)}`}>
                  {percentage}%
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Phương pháp hấp thụ CO2 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Phương pháp hấp thụ CO2</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(co2Data.sequestrationByMethod).map(([method, percentage]) => (
            <div key={method} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium capitalize">
                  {method === 'soilCarbon' && 'Carbon trong đất'}
                  {method === 'treePlanting' && 'Trồng cây'}
                  {method === 'coverCrops' && 'Cây che phủ'}
                  {method === 'organicMatter' && 'Vật chất hữu cơ'}
                </span>
                <span className={`text-sm font-bold ${getSequestrationColor(percentage)}`}>
                  {percentage}%
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Khuyến nghị */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TreePine className="h-5 w-5 text-green-600" />
            Khuyến nghị giảm phát thải CO2
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {co2Data.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Thông tin bổ sung */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tác động môi trường</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Lợi ích tích cực</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Cải thiện chất lượng đất</li>
                <li>• Tăng đa dạng sinh học</li>
                <li>• Giảm xói mòn đất</li>
                <li>• Tăng năng suất cây trồng</li>
              </ul>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">Thách thức</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Chi phí đầu tư ban đầu</li>
                <li>• Thời gian để thấy kết quả</li>
                <li>• Cần kiến thức chuyên môn</li>
                <li>• Thay đổi thói quen canh tác</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CO2Info;
