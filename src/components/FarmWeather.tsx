import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudRain, ThermometerSun, Sun, Cloud, Wind, Gauge, GaugeCircle, Sunrise, CloudSun } from "lucide-react";
import { type DailyForecastItem } from "@/api";
import { HourlyFarmWeather } from "./HourlyFarmWeather";
import { formatVietnamTime } from "@/lib/utils";
import { getCachedDailyWeather } from "@/services/weatherCache";


type DailyWeather = {
  day: string;
  date: string;
  temp: string;
  icon: React.ReactNode;
  humidity: string;
  rain: string;
  minTemp?: string;
  rainPercent?: string;
  windMax?: string;
};

const StatItem = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg border bg-white">
    <div className="w-9 h-9 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
      {icon}
    </div>
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-base font-semibold text-gray-900">{value}</div>
    </div>
  </div>
);

export const FarmWeather = ({ farmId }: { farmId: number }) => {
  const [dailyFromApi, setDailyFromApi] = useState<DailyForecastItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchDaily = async () => {
      if (!farmId) return;
      try {
        setLoading(true);
        const data = await getCachedDailyWeather(farmId, setDailyFromApi);
        setDailyFromApi(data);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load daily weather", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDaily();
  }, [farmId]);

  const daily: DailyWeather[] = useMemo(() => {
    if (!dailyFromApi || dailyFromApi.length === 0) return [];
    const dayNameVi = (dateStr: string) => {
      const d = new Date(dateStr);
      const today = new Date();
      const isToday = d.toDateString() === today.toDateString();
      if (isToday) return "Hôm nay";
      const day = d.getDay();
      const map = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"] as const;
      return map[day];
    };
    return dailyFromApi.slice(0, 7).map((it) => {
      const tempDisplay =
        it.temperatureMax !== undefined
          ? `${Math.round(it.temperatureMax)}°`
          : "-";
      const minTempDisplay =
        it.temperatureMin !== undefined
          ? `${Math.round(it.temperatureMin)}°`
          : undefined;
      const date = new Date(it.date);
      const dateStr = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
      const humidity = it.humidity !== undefined ? `${Math.round(it.humidity)}%` : "-";
      const rainPercent = it.precipitationPercent !== undefined ? `${Math.round(it.precipitationPercent)}%` : "-";
      const windMax = it.windSpeedMax !== undefined ? `${Math.round(it.windSpeedMax)} km/h` : "-";
      const rainPctNum = it.precipitationPercent ?? (it.precipitationSum !== undefined ? Math.min(100, Math.round(it.precipitationSum * 10)) : 0);
      const sunHours = (it.sunshineDurationSeconds ?? 0) / 3600;
      let icon: React.ReactNode = <Sun className="h-6 w-6 text-yellow-500" />;
      if (rainPctNum >= 50) {
        icon = <CloudRain className="h-6 w-6 text-blue-500" />;
      } else if (sunHours >= 6) {
        icon = <Sun className="h-6 w-6 text-yellow-500" />;
      } else if (sunHours >= 2) {
        icon = <CloudSun className="h-6 w-6 text-amber-400" />;
      } else {
        icon = <Cloud className="h-6 w-6 text-gray-500" />;
      }
      return { day: dayNameVi(it.date), date: dateStr, temp: tempDisplay , minTemp: minTempDisplay ? `Thấp nhất ${minTempDisplay}` : undefined, rainPercent, windMax, humidity, rain: "", icon };
    });
  }, [dailyFromApi]);


  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Dự báo thời tiết theo ngày</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
      

        {/* Daily weather */}
         <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
           {(loading ? new Array<DailyWeather>(7).fill({ day: "", date: "", temp: "", humidity: "", rain: "", icon: <span /> }) : daily).map((day, i) => (
             <button type="button" onClick={() => setSelectedIndex(i)} key={i} className={`text-left w-full p-4 rounded-xl border transition ${i===selectedIndex?"bg-emerald-50 border-emerald-200 shadow-sm":"bg-white hover:bg-slate-50"}`}>
              {loading ? (
                <div className="h-20 animate-pulse" />
              ) : (
                <>
                  <div className="text-xs text-gray-500">{day.day}</div>
                  <div className="text-xs text-gray-400">{day.date}</div>
                  <div className="mt-2 flex justify-center">{day.icon}</div>
                  <div className="mt-2 text-lg font-semibold text-gray-900 text-center">{day.temp}</div>
                  {day.minTemp && (
                    <div className="text-[11px] text-gray-500 text-center mt-0.5">{day.minTemp}</div>
                  )}
                  <div className="mt-2 text-xs text-gray-600 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <span className="inline-flex items-center gap-1"><CloudRain className="h-3 w-3"/>{day.rainPercent}</span>
                      <span className="inline-flex items-center gap-1"><Wind className="h-3 w-3"/>{day.windMax}</span>
                    </div>
                  </div>
                </>
              )}
             </button>
          ))}
        </div>
          {/* Hourly weather – using API component */}
          <div className="space-y-3">
            <div className="text-xl font-semibold text-gray-900">Dự báo theo giờ</div>
            <div className="rounded-2xl border bg-white p-4">
              <HourlyFarmWeather farmId={farmId} />
            </div>
          </div>

        <div className="rounded-xl border p-4 bg-white">
          <div className="text-sm font-medium text-gray-900">
            {daily[selectedIndex] ? `Thời tiết - ${daily[selectedIndex].day} (${daily[selectedIndex].date})` : 'Thời tiết - Chi tiết'}
          </div>
          <div className="text-sm text-gray-600 mt-1">Tổng hợp số liệu dự báo theo ngày cho khu vực trang trại.</div>
          {dailyFromApi && dailyFromApi.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              <StatItem label="Nhiệt độ cao nhất" value={`${dailyFromApi[selectedIndex]?.temperatureMax ?? '-'}°`} icon={<ThermometerSun className="h-4 w-4"/>} />
              <StatItem label="Nhiệt độ thấp nhất" value={`${dailyFromApi[selectedIndex]?.temperatureMin ?? '-'}°`} icon={<ThermometerSun className="h-4 w-4"/>} />
              <StatItem label="Cảm nhận cao nhất" value={`${dailyFromApi[selectedIndex]?.apparentTemperatureMax ?? '-'}°`} icon={<Gauge className="h-4 w-4"/>} />
              <StatItem label="Cảm nhận thấp nhất" value={`${dailyFromApi[selectedIndex]?.apparentTemperatureMin ?? '-'}°`} icon={<GaugeCircle className="h-4 w-4"/>} />
              <StatItem label="Tổng lượng mưa" value={`${dailyFromApi[selectedIndex]?.precipitationSum ?? '-'} mm`} icon={<CloudRain className="h-4 w-4"/>} />
              <StatItem label="Giờ có mưa" value={`${dailyFromApi[selectedIndex]?.precipitationHours ?? '-'} h`} icon={<CloudRain className="h-4 w-4"/>} />
              <StatItem label="Thời gian nắng" value={`${Math.round((dailyFromApi[selectedIndex]?.sunshineDurationSeconds || 0) / 3600)} h`} icon={<Sun className="h-4 w-4"/>} />
              <StatItem label="UV cao nhất" value={`${dailyFromApi[selectedIndex]?.uvIndexMax ?? '-'}`} icon={<Gauge className="h-4 w-4"/>} />
              <StatItem label="Gió cao nhất" value={`${dailyFromApi[selectedIndex]?.windSpeedMax ?? '-'} km/h`} icon={<Wind className="h-4 w-4"/>} />
              <StatItem label="Gió giật mạnh nhất" value={`${dailyFromApi[selectedIndex]?.windGustsMax ?? '-'} km/h`} icon={<Wind className="h-4 w-4"/>} />
              <StatItem label="FAO ET0 (khả năng thoát hơi nước)" value={`${dailyFromApi[selectedIndex]?.et0FaoEvapotranspiration ?? '-'} mm`} icon={<GaugeCircle className="h-4 w-4"/>} />
              <StatItem label="Mọc / Lặn" value={`${dailyFromApi[selectedIndex]?.sunrise ? formatVietnamTime(dailyFromApi[selectedIndex].sunrise) : '-'} / ${dailyFromApi[selectedIndex]?.sunset ? formatVietnamTime(dailyFromApi[selectedIndex].sunset) : '-'}`} icon={<Sunrise className="h-4 w-4"/>} />
            </div>
          )}
        </div>

     
      </CardContent>
    </Card>
  );
};

export default FarmWeather;


