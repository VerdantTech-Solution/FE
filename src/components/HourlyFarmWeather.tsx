import React, { useEffect, useState } from "react";
import { ThermometerSun, Droplets, Wind, Gauge, CloudRain, GaugeCircle } from "lucide-react";
import { getHourlyWeather, type HourlyWeatherItem } from "@/api";

type HourlyCardProps = {
  time: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  uvIndex: number;
  soilTemperature: number;
  onHoverStart?: (e: React.MouseEvent) => void;
  onHoverEnd?: () => void;
};

const HourlyCard = ({ time, temperature, humidity, windSpeed, precipitation, uvIndex, soilTemperature, onHoverStart, onHoverEnd }: HourlyCardProps) => {
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const getUVLevel = (uv: number) => {
    if (uv < 3) return "Thấp";
    if (uv < 6) return "Trung bình";
    if (uv < 8) return "Cao";
    if (uv < 11) return "Rất cao";
    return "Nguy hiểm";
  };

  const getUVColor = (uv: number) => {
    if (uv < 3) return "text-green-400";
    if (uv < 6) return "text-yellow-400";
    if (uv < 8) return "text-orange-400";
    if (uv < 11) return "text-red-400";
    return "text-red-600";
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('HourlyCard clicked:', time, 'Event stopped from bubbling');
  };

  return (
    <div 
      className="rounded-lg border border-slate-700 bg-[#0c0f14] text-slate-100 p-3 min-w-[140px] cursor-pointer hover:bg-slate-800 transition-colors"
      onClick={handleClick}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      <div className="text-center">
        <div className="text-sm font-medium text-slate-300 mb-2">
          {formatTime(time)}
        </div>
        
        <div className="flex items-center justify-center mb-2">
          <ThermometerSun className="h-4 w-4 text-orange-400 mr-1" />
          <span className="text-lg font-semibold">{Math.round(temperature)}°C</span>
        </div>
        
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <Droplets className="h-3 w-3 text-blue-400" />
            <span>{Math.round(humidity)}%</span>
          </div>
          
          <div className="flex items-center justify-between">
            <Wind className="h-3 w-3 text-cyan-400" />
            <span>{Math.round(windSpeed)} km/h</span>
          </div>
          
          {precipitation > 0 && (
            <div className="flex items-center justify-between">
              <CloudRain className="h-3 w-3 text-blue-500" />
              <span>{precipitation.toFixed(1)} mm</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <Gauge className="h-3 w-3 text-purple-400" />
            <span className={getUVColor(uvIndex)}>{uvIndex.toFixed(1)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <GaugeCircle className="h-3 w-3 text-amber-400" />
            <span>{Math.round(soilTemperature)}°C</span>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-slate-400">
          UV: {getUVLevel(uvIndex)}
        </div>
      </div>
    </div>
  );
};

export const HourlyFarmWeather = ({ farmId }: { farmId: number }) => {
  const [hourlyData, setHourlyData] = useState<HourlyWeatherItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!farmId) {
        console.log('HourlyFarmWeather: No farmId provided');
        return;
      }
      try {
        setLoading(true);
        setError(null);
        console.log(`HourlyFarmWeather: Fetching data for farm ID: ${farmId}`);
        console.log('HourlyFarmWeather: About to call getHourlyWeather API...');
        
        const res = await getHourlyWeather(farmId);
        console.log('HourlyFarmWeather: API call completed');
        console.log('HourlyFarmWeather: Received data:', res);
        console.log('HourlyFarmWeather: Data type:', typeof res);
        console.log('HourlyFarmWeather: Is array:', Array.isArray(res));
        console.log('HourlyFarmWeather: Data length:', res?.length);
        console.log('HourlyFarmWeather: First item:', res?.[0]);
        
        if (Array.isArray(res) && res.length > 0) {
          console.log('HourlyFarmWeather: Setting hourly data successfully');
          setHourlyData(res);
        } else {
          console.warn('HourlyFarmWeather: No valid data received');
          setHourlyData([]);
        }
      } catch (err) {
        console.error('HourlyFarmWeather: API Error:', err);
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu thời tiết theo giờ');
        setHourlyData([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [farmId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-lg font-semibold text-slate-100">Dự Báo Theo Giờ</div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-slate-700 bg-[#0c0f14] p-3 min-w-[140px] h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-lg font-semibold text-slate-100">Dự Báo Theo Giờ</div>
        <div className="rounded-lg border border-red-500 bg-red-900/20 text-red-100 p-4">
          <div className="text-sm font-medium mb-2">Lỗi tải dữ liệu thời tiết theo giờ</div>
          <div className="text-xs mb-3">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Debug: Log hourly data
  console.log('HourlyFarmWeather render - hourlyData:', hourlyData);
  console.log('HourlyFarmWeather render - loading:', loading);
  console.log('HourlyFarmWeather render - error:', error);
  console.log('HourlyFarmWeather render - farmId:', farmId);
  console.log('HourlyFarmWeather render - hourlyData length:', hourlyData?.length);
  console.log('HourlyFarmWeather render - first item:', hourlyData?.[0]);

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCardHoverStart = (index: number) => (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let x = rect.left + rect.width / 2;
    let y = rect.top;
    // Giữ trong viewport
    const padding = 8;
    const vw = window.innerWidth;
    x = Math.max(padding, Math.min(vw - padding, x));
    setHoverIndex(index);
    setHoverPos({ x, y });
  };

  const handleCardHoverEnd = () => {
    setHoverIndex(null);
    setHoverPos(null);
  };

  // Lọc chỉ giữ các mốc giờ sắp tới (ẩn các thời điểm đã qua)
  const now = new Date();
  const currentHour = new Date(now);
  currentHour.setMinutes(0, 0, 0);
  const upcomingHourlyData = hourlyData.filter((item) => {
    const itemTime = new Date(item.time);
    return itemTime.getTime() >= currentHour.getTime();
  });

  return (
    <div className="space-y-4 relative z-10" onClick={handleContainerClick}>
      
      {upcomingHourlyData.length > 0 && (
        <div className="text-2xl font-bold text-black mb-3">
          Dữ liệu từ {new Date(upcomingHourlyData[0].time).toLocaleDateString('vi-VN')} - {upcomingHourlyData.length} giờ sắp tới
        </div>
      )}
      
      <div className="flex gap-3 overflow-x-auto overflow-y-visible pb-2">
        {upcomingHourlyData.map((item, index) => (
          <HourlyCard
            key={index}
            time={item.time}
            temperature={item.temperature}
            humidity={item.humidity}
            windSpeed={item.windSpeed}
            precipitation={item.precipitation}
            uvIndex={item.uvIndex}
            soilTemperature={item.soilTemperature}
            onHoverStart={handleCardHoverStart(index)}
            onHoverEnd={handleCardHoverEnd}
          />
        ))}
      </div>

      {hoverIndex !== null && hoverPos && (
        <div className="fixed z-50 pointer-events-none" style={{ left: hoverPos.x, top: hoverPos.y }}>
          <div className="-translate-x-1/2 -translate-y-2 rounded-lg border border-slate-700 bg-[#0c0f14] text-slate-100 shadow-xl w-72 transition-opacity duration-150 ease-out opacity-100">
            <div className="p-3">
              <div className="text-sm font-semibold mb-2">{new Date(upcomingHourlyData[hoverIndex].time).toLocaleString('vi-VN')}</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div className="flex items-center justify-between"><span>Nhiệt độ</span><span className="font-medium">{Math.round(upcomingHourlyData[hoverIndex].temperature)}°C</span></div>
                <div className="flex items-center justify-between"><span>Độ ẩm</span><span className="font-medium">{Math.round(upcomingHourlyData[hoverIndex].humidity)}%</span></div>
                <div className="flex items-center justify-between"><span>Gió</span><span className="font-medium">{Math.round(upcomingHourlyData[hoverIndex].windSpeed)} km/h</span></div>
                <div className="flex items-center justify-between"><span>Lượng mưa</span><span className="font-medium">{upcomingHourlyData[hoverIndex].precipitation.toFixed(1)} mm</span></div>
                <div className="flex items-center justify-between"><span>UV</span><span className="font-medium">{upcomingHourlyData[hoverIndex].uvIndex.toFixed(1)}</span></div>
                <div className="flex items-center justify-between col-span-2"><span>Nhiệt độ đất</span><span className="font-medium">{Math.round(upcomingHourlyData[hoverIndex].soilTemperature)}°C</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {upcomingHourlyData.length === 0 && !loading && !error && (
        <div className="text-center text-slate-400 py-8">
          Không có dữ liệu thời tiết theo giờ
        </div>
      )}
    </div>
  );
};

export default HourlyFarmWeather;
