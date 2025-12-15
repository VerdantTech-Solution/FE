import React, { useEffect, useState } from "react";
import { ThermometerSun, Droplets, Wind, Gauge, CloudRain, Sun, Sunrise, GaugeCircle } from "lucide-react";
import { type CurrentWeatherData } from "@/api";
import { formatVietnamDateTime, formatVietnamTime } from "@/lib/utils";
import { getCachedCurrentWeather } from "@/services/weatherCache";

type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
};

const StatCard = ({ title, value, subtitle, icon }: StatCardProps) => {
  // Debug: Log StatCard props
  console.log(`StatCard ${title}:`, { value, subtitle });
  
  return (
    <div className="rounded-xl border border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_60%)] text-black p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">{title}</div>
        <div className="text-emerald-400">{icon}</div>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">{value}</div>
      {subtitle && <div className="mt-1 text-xs text-gray-600">{subtitle}</div>}
    </div>
  );
};

export const CurrentFarmWeather = ({ farmId }: { farmId: number }) => {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!farmId) return;
      try {
        setLoading(true);
        setError(null);
        console.log(`CurrentFarmWeather: Fetching data for farm ID: ${farmId}`);
        const res = await getCachedCurrentWeather(farmId, setCurrentWeather);
        console.log('CurrentFarmWeather: Received data:', res);
        setCurrentWeather(res);
      } catch (err) {
        console.error('CurrentFarmWeather: Error:', err);
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu thời tiết');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [farmId]);

  const uvLevel = (uv?: number) => {
    if (uv === undefined) return "-";
    if (uv < 3) return "Thấp";
    if (uv < 6) return "Trung bình";
    if (uv < 8) return "Cao";
    if (uv < 11) return "Rất cao";
    return "Nguy hiểm";
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_60%)] p-4 h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500 bg-red-900/20 text-red-100 p-4">
        <div className="text-lg font-semibold mb-2">Lỗi tải dữ liệu thời tiết</div>
        <div className="text-sm">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  // Debug: Log current weather data
  console.log('CurrentFarmWeather render - currentWeather:', currentWeather);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-gray-700">
        {currentWeather?.time && (
          <div className="text-xs">{formatVietnamDateTime(currentWeather.time)}</div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Nhiệt Độ"
          value={`${currentWeather?.temperature ?? '-'}°C`}
          subtitle={currentWeather?.apparentTemperature !== undefined ? `Cảm nhận: ${currentWeather.apparentTemperature}°C` : undefined}
          icon={<ThermometerSun className="h-4 w-4" />}
        />
        <StatCard
          title="Độ Ẩm Không Khí"
          value={`${currentWeather?.humidity ?? '-'}%`}
          subtitle="Độ ẩm tương đối"
          icon={<Droplets className="h-4 w-4" />}
        />
        <StatCard
          title="Tốc Độ Gió"
          value={`${currentWeather?.windSpeed ?? '-'} km/h`}
          subtitle={currentWeather?.windGusts !== undefined ? `Gió giật: ${currentWeather.windGusts} km/h` : undefined}
          icon={<Wind className="h-4 w-4" />}
        />
        <StatCard
          title="Chỉ Số UV"
          value={`${currentWeather?.uvIndex ?? '-'}`}
          subtitle={`Mức độ: ${uvLevel(currentWeather?.uvIndex)}`}
          icon={<Gauge className="h-4 w-4" />}
        />

        <StatCard
          title="Lượng Mưa"
          value={`${currentWeather?.precipitation ?? 0} mm`}
          subtitle="Lượng mưa hiện tại"
          icon={<CloudRain className="h-4 w-4" />}
        />
        <StatCard
          title="Nhiệt Độ Đất"
          value={`${currentWeather?.soilTemperature ?? '-'}°C`}
          subtitle="Nhiệt độ bề mặt đất"
          icon={<GaugeCircle className="h-4 w-4" />}
        />
        <StatCard
          title="Khoảng Thời Gian"
          value={`${currentWeather?.interval ?? '-'} phút`}
          subtitle="Cập nhật dữ liệu"
          icon={<Sun className="h-4 w-4" />}
        />
        <StatCard
          title="Thời Gian"
          value={currentWeather?.time ? formatVietnamTime(currentWeather.time) : '-'}
          subtitle="Thời điểm đo"
          icon={<Sunrise className="h-4 w-4" />}
        />
      </div>

      {/* Soil moisture info */}
      <div className="rounded-xl border border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_60%)] text-black p-5">
        <div className="text-lg font-semibold mb-4 text-gray-900">Thông Tin Độ Ẩm Đất</div>
        {(() => {
          // Sử dụng dữ liệu thực từ API (đã được chuyển đổi từ 0-1 thành %)
          const topSoil = currentWeather?.soilMoistureTop ? Math.round(currentWeather.soilMoistureTop * 100) : 0;
          const deepSoil = currentWeather?.soilMoistureDeep ? Math.round(currentWeather.soilMoistureDeep * 100) : 0;

          const tip = topSoil < 25
            ? 'Độ ẩm đất thấp, nên tưới bổ sung để tránh khô hạn.'
            : topSoil < 60
            ? 'Độ ẩm đất hiện tại ở mức tốt cho hầu hết cây trồng.'
            : 'Độ ẩm cao, theo dõi ngập úng và tối ưu thoát nước.';

          return (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-gray-700 text-sm">
                <span>Độ ẩm đất (0-1cm)</span>
                <span className="font-semibold text-gray-900">{topSoil}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${topSoil}%` }} />
              </div>

              <div className="flex items-center justify-between text-gray-700 text-sm mt-3">
                <span>Độ ẩm đất (3-9cm)</span>
                <span className="font-semibold text-gray-900">{deepSoil}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-teal-500" style={{ width: `${deepSoil}%` }} />
              </div>

              <div className="mt-4 rounded-lg bg-slate-900/70 border border-slate-800 p-3 text-sm text-gray-300">
                <span className="mr-2">💡</span>{tip}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default CurrentFarmWeather;


