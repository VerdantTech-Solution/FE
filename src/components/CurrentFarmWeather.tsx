import React, { useEffect, useMemo, useState } from "react";
import { ThermometerSun, Droplets, Wind, Gauge, CloudRain, Sun, Sunrise, GaugeCircle } from "lucide-react";
import { getDailyWeather, type DailyForecastItem } from "@/api";

type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
};

const StatCard = ({ title, value, subtitle, icon }: StatCardProps) => (
  <div className="rounded-xl border border-slate-800 bg-[#0c0f14] text-slate-100 p-4">
    <div className="flex items-center justify-between">
      <div className="text-sm text-slate-300">{title}</div>
      <div className="text-emerald-400">{icon}</div>
    </div>
    <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
    {subtitle && <div className="mt-1 text-xs text-slate-400">{subtitle}</div>}
  </div>
);

export const CurrentFarmWeather = ({ farmId }: { farmId: number }) => {
  const [daily, setDaily] = useState<DailyForecastItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const run = async () => {
      if (!farmId) return;
      try {
        setLoading(true);
        const res = await getDailyWeather(farmId);
        setDaily(res);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [farmId]);

  const today = useMemo(() => daily?.[0], [daily]);

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
          <div key={i} className="rounded-xl border border-slate-800 bg-[#0c0f14] p-4 h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-slate-300">
        {today?.date && (
          <div className="text-xs">{new Date(today.date).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Nhiệt Độ"
          value={`${today?.temperatureMax ?? '-'}°C`}
          subtitle={today?.apparentTemperatureMax !== undefined ? `Cảm nhận: ${today.apparentTemperatureMax}°C` : undefined}
          icon={<ThermometerSun className="h-4 w-4" />}
        />
        <StatCard
          title="Độ Ẩm Không Khí"
          value={`${today?.humidity ?? '-'}%`}
          subtitle="Độ ẩm tương đối"
          icon={<Droplets className="h-4 w-4" />}
        />
        <StatCard
          title="Tốc Độ Gió"
          value={`${today?.windSpeedMax ?? '-'} km/h`}
          subtitle={today?.windGustsMax !== undefined ? `Gió giật: ${today.windGustsMax} km/h` : undefined}
          icon={<Wind className="h-4 w-4" />}
        />
        <StatCard
          title="Chỉ Số UV"
          value={`${today?.uvIndexMax ?? '-'}`}
          subtitle={`Mức độ: ${uvLevel(today?.uvIndexMax)}`}
          icon={<Gauge className="h-4 w-4" />}
        />

        <StatCard
          title="Lượng Mưa"
          value={`${today?.precipitationSum ?? 0} mm`}
          subtitle="Tổng mưa trong ngày"
          icon={<CloudRain className="h-4 w-4" />}
        />
        <StatCard
          title="Nhiệt Độ Đất"
          value={`${today?.temperatureMin ?? '-'}°C`}
          subtitle="Ước lượng bề mặt đất"
          icon={<GaugeCircle className="h-4 w-4" />}
        />
        <StatCard
          title="Thời Gian Nắng"
          value={`${Math.round(((today?.sunshineDurationSeconds ?? 0) / 3600))} h`}
          subtitle="Trong ngày"
          icon={<Sun className="h-4 w-4" />}
        />
        <StatCard
          title="Mọc / Lặn"
          value={`${today?.sunrise ? new Date(today.sunrise).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'} / ${today?.sunset ? new Date(today.sunset).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}`}
          icon={<Sunrise className="h-4 w-4" />}
        />
      </div>

      {/* Soil moisture info */}
      <div className="rounded-xl border border-slate-800 bg-[#0c0f14] text-slate-100 p-5">
        <div className="text-lg font-semibold mb-4">Thông Tin Độ Ẩm Đất</div>
        {(() => {
          const humidity = today?.humidity ?? 0; // %
          const rainPct = today?.precipitationPercent ?? (today?.precipitationSum ? Math.min(100, Math.round(today.precipitationSum * 10)) : 0);
          // Ước lượng đơn giản: 0-1cm chịu ảnh hưởng mưa nhiều hơn; 3-9cm chậm hơn
          const topSoil = Math.max(0, Math.min(100, Math.round(humidity * 0.5 + rainPct * 0.5)));
          const deepSoil = Math.max(0, Math.min(100, Math.round(humidity * 0.6 + rainPct * 0.3)));

          const tip = topSoil < 25
            ? 'Độ ẩm đất thấp, nên tưới bổ sung để tránh khô hạn.'
            : topSoil < 60
            ? 'Độ ẩm đất hiện tại ở mức tốt cho hầu hết cây trồng.'
            : 'Độ ẩm cao, theo dõi ngập úng và tối ưu thoát nước.';

          return (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-slate-300 text-sm">
                <span>Độ ẩm đất (0-1cm)</span>
                <span className="font-semibold text-slate-100">{topSoil}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${topSoil}%` }} />
              </div>

              <div className="flex items-center justify-between text-slate-300 text-sm mt-3">
                <span>Độ ẩm đất (3-9cm)</span>
                <span className="font-semibold text-slate-100">{deepSoil}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-teal-500" style={{ width: `${deepSoil}%` }} />
              </div>

              <div className="mt-4 rounded-lg bg-slate-900/70 border border-slate-800 p-3 text-sm text-slate-300">
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


