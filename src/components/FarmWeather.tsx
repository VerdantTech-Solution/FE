import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudRain, ThermometerSun, Sun, Cloud, CloudRain as Rain, Wind, Gauge, GaugeCircle, Sunrise, CloudSun } from "lucide-react";
import { getDailyWeather, type DailyForecastItem } from "@/api";

type HourlyWeather = {
  hour: string;
  temp: string;
  icon: React.ReactNode;
  rain: string;
  wind: string;
};

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
        const data = await getDailyWeather(farmId);
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

  const hourly: HourlyWeather[] = [
    { hour: "Bây giờ", temp: "32°", icon: <Sun className="h-6 w-6 text-yellow-500" />, rain: "10%", wind: "8km/h" },
    { hour: "14:00", temp: "33°", icon: <Sun className="h-6 w-6 text-yellow-500" />, rain: "5%", wind: "10km/h" },
    { hour: "15:00", temp: "34°", icon: <Cloud className="h-6 w-6 text-indigo-400" />, rain: "8%", wind: "12km/h" },
    { hour: "16:00", temp: "33°", icon: <Cloud className="h-6 w-6 text-indigo-400" />, rain: "20%", wind: "15km/h" },
    { hour: "17:00", temp: "31°", icon: <Cloud className="h-6 w-6 text-indigo-400" />, rain: "25%", wind: "18km/h" },
    { hour: "18:00", temp: "29°", icon: <Cloud className="h-6 w-6 text-indigo-400" />, rain: "30%", wind: "16km/h" },
    { hour: "19:00", temp: "28°", icon: <Rain className="h-6 w-6 text-blue-500" />, rain: "60%", wind: "20km/h" },
    { hour: "20:00", temp: "27°", icon: <Rain className="h-6 w-6 text-blue-500" />, rain: "70%", wind: "22km/h" },
    { hour: "21:00", temp: "26°", icon: <Rain className="h-6 w-6 text-blue-500" />, rain: "65%", wind: "18km/h" },
    { hour: "22:00", temp: "25°", icon: <Cloud className="h-6 w-6 text-indigo-400" />, rain: "40%", wind: "14km/h" },
    { hour: "23:00", temp: "24°", icon: <Cloud className="h-6 w-6 text-indigo-400" />, rain: "25%", wind: "10km/h" },
  ];
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
  const itemBaseClasses = "flex flex-col items-center px-5 py-4 rounded-xl border bg-white min-w-[88px]";
  const selectedClasses = "bg-blue-50 border-blue-200 shadow-sm";

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
          {/* Hourly weather – matches provided design */}
          <div className="space-y-3">
          <div className="text-xl font-semibold text-gray-900">Dự báo theo giờ</div>
          <div className="rounded-2xl border bg-white p-4 overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              {hourly.map((h, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedIndex(i)}
                  className={`${itemBaseClasses} ${i === selectedIndex ? selectedClasses : ""}`}
                >
                  <div className="text-sm text-gray-600">{h.hour}</div>
                  <div className="mt-2">{h.icon}</div>
                  <div className="mt-2 text-2xl font-bold text-gray-900">{h.temp}</div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1"><CloudRain className="h-3.5 w-3.5 text-indigo-500" />{h.rain}</span>
                    <span className="inline-flex items-center gap-1"><Wind className="h-3.5 w-3.5 text-slate-500" />{h.wind}</span>
                  </div>
                </button>
              ))}
            </div>
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
              <StatItem label="FAO ET0" value={`${dailyFromApi[selectedIndex]?.et0FaoEvapotranspiration ?? '-'} mm`} icon={<GaugeCircle className="h-4 w-4"/>} />
              <StatItem label="Mọc / Lặn" value={`${dailyFromApi[selectedIndex]?.sunrise ? new Date(dailyFromApi[selectedIndex].sunrise).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}) : '-'} / ${dailyFromApi[selectedIndex]?.sunset ? new Date(dailyFromApi[selectedIndex].sunset).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}) : '-'}`} icon={<Sunrise className="h-4 w-4"/>} />
            </div>
          )}
        </div>

        <div className="rounded-xl border p-4 bg-amber-50 text-amber-800 border-amber-200 text-sm">
          <div className="font-medium mb-1">Cảnh báo thời tiết</div>
          Dự báo mưa vào thứ 6 và thứ 2. Nên chuẩn bị biện pháp che chắn cho cây trồng và kiểm tra hệ thống thoát nước.
        </div>
      </CardContent>
    </Card>
  );
};

export default FarmWeather;


