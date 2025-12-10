import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ThermometerSun, CloudRain } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { getDailyWeather, getCurrentWeather, type DailyForecastItem, type CurrentWeatherData } from "@/api/weather";

interface WeatherDashboardProps {
  farmId: number;
}

export const WeatherDashboard = ({ farmId }: WeatherDashboardProps) => {
  const [dailyWeather, setDailyWeather] = useState<DailyForecastItem[]>([]);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!farmId) return;
      try {
        setLoading(true);
        setError(null);
        
        const [dailyData, currentData] = await Promise.all([
          getDailyWeather(farmId),
          getCurrentWeather(farmId),
        ]);
        
        setDailyWeather(dailyData);
        setCurrentWeather(currentData);
      } catch (err) {
        console.error("Error fetching weather data:", err);
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu thời tiết");
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [farmId]);

  // Format data for charts
  const chartData = dailyWeather
    .slice(0, 7) // Lấy 7 ngày gần nhất
    .map((item) => {
      const date = item.date ? new Date(item.date) : null;
      return {
        date: date ? date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) : "",
        fullDate: date ? date.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "short" }) : "",
        temperatureMax: item.temperatureMax ?? 0,
        temperatureMin: item.temperatureMin ?? 0,
        precipitation: item.precipitationSum ?? 0,
        humidity: item.humidity ?? 0,
      };
    });

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Đang tải dữ liệu thời tiết...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Weather Summary */}
      {currentWeather && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Nhiệt độ hiện tại</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currentWeather.temperature.toFixed(1)}°C
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Cảm nhận: {currentWeather.apparentTemperature.toFixed(1)}°C
                  </p>
                </div>
                <ThermometerSun className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Lượng mưa hiện tại</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currentWeather.precipitation.toFixed(1)} mm
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Trong giờ qua</p>
                </div>
                <CloudRain className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Độ ẩm không khí</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currentWeather.humidity.toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Độ ẩm tương đối</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-semibold">%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Temperature and Precipitation Charts - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Temperature Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThermometerSun className="h-5 w-5 text-orange-500" />
              Biểu đồ nhiệt độ 7 ngày tới
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTempMax" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorTempMin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    label={{ value: "Nhiệt độ (°C)", angle: -90, position: "insideLeft", style: { fill: "#6b7280", fontSize: 11 } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}°C`, ""]}
                    labelFormatter={(label) => `Ngày ${label}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="temperatureMax"
                    stroke="#f97316"
                    fillOpacity={1}
                    fill="url(#colorTempMax)"
                    name="Nhiệt độ cao nhất"
                  />
                  <Area
                    type="monotone"
                    dataKey="temperatureMin"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorTempMin)"
                    name="Nhiệt độ thấp nhất"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                Chưa có dữ liệu nhiệt độ
              </div>
            )}
          </CardContent>
        </Card>

        {/* Precipitation Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudRain className="h-5 w-5 text-blue-500" />
              Biểu đồ lượng mưa 7 ngày tới
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    label={{ value: "Lượng mưa (mm)", angle: -90, position: "insideLeft", style: { fill: "#6b7280", fontSize: 11 } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)} mm`, "Lượng mưa"]}
                    labelFormatter={(label) => `Ngày ${label}`}
                  />
                  <Bar 
                    dataKey="precipitation" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                    name="Lượng mưa"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                Chưa có dữ liệu lượng mưa
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Combined Temperature and Precipitation Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Nhiệt độ và Lượng mưa tổng hợp</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#6b7280"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  label={{ value: "Nhiệt độ (°C)", angle: -90, position: "insideLeft", style: { fill: "#6b7280" } }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#6b7280"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  label={{ value: "Lượng mưa (mm)", angle: 90, position: "insideRight", style: { fill: "#6b7280" } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "temperatureMax" || name === "temperatureMin") {
                      return [`${value.toFixed(1)}°C`, name === "temperatureMax" ? "Nhiệt độ cao nhất" : "Nhiệt độ thấp nhất"];
                    }
                    return [`${value.toFixed(1)} mm`, "Lượng mưa"];
                  }}
                  labelFormatter={(label) => `Ngày ${label}`}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="temperatureMax"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ fill: "#f97316", r: 4 }}
                  name="Nhiệt độ cao nhất"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="temperatureMin"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 4 }}
                  name="Nhiệt độ thấp nhất"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="precipitation"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                  name="Lượng mưa"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              Chưa có dữ liệu
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

