import { apiClient } from './apiClient';

// Kiểu dữ liệu tham khảo từ API /api/Weather/daily/{farmId}
// Chỉ quan tâm các trường cần dùng: time (ngày), nhiệt độ, độ ẩm
export interface DailyWeatherApiResponse {
  latitude?: number | string;
  longitude?: number | string;
  timezone?: string;
  daily?: Record<string, any> & {
    time?: string[];
  };
  daily_Units?: Record<string, string>;
}

export interface DailyForecastItem {
  date: string; // ISO date string
  temperatureMax?: number;
  temperatureMin?: number;
  humidity?: number; // % nếu có
  apparentTemperatureMax?: number;
  apparentTemperatureMin?: number;
  precipitationSum?: number; // mm
  precipitationPercent?: number; // % ước lượng hoặc từ API nếu có
  precipitationHours?: number; // h
  windSpeedMax?: number; // km/h nếu API trả theo km/h
  windGustsMax?: number; // km/h
  sunshineDurationSeconds?: number; // s
  uvIndexMax?: number;
  et0FaoEvapotranspiration?: number; // mm
  sunrise?: string; // ISO
  sunset?: string; // ISO
}

export const getDailyWeather = async (farmId: number): Promise<DailyForecastItem[]> => {
  const res = (await apiClient.get(`/api/Weather/daily/${farmId}`)) as unknown as DailyWeatherApiResponse | { data: DailyWeatherApiResponse };

  const payload: DailyWeatherApiResponse = (res as any)?.data ?? (res as any);
  const daily = (payload as any)?.daily ?? {};

  // Trường hợp 1: daily là mảng object như ví dụ bạn gửi
  if (Array.isArray(daily)) {
    return (daily as any[]).map((d: any) => {
      const precipSum = d?.precipitation_sum !== undefined
        ? Number(d.precipitation_sum)
        : d?.precipitation_Sum !== undefined
          ? Number(d.precipitation_Sum)
          : undefined;
      const precipProb = d?.precipitation_probability_max !== undefined
        ? Number(d.precipitation_probability_max)
        : d?.precipitation_Probability_Max !== undefined
          ? Number(d.precipitation_Probability_Max)
          : undefined;
      const windMax = d?.wind_speed_max !== undefined
        ? Number(d.wind_speed_max)
        : d?.wind_Speed_10m_Max !== undefined
          ? Number(d.wind_Speed_10m_Max)
          : undefined;
      const windGusts = d?.wind_gusts_max !== undefined
        ? Number(d.wind_gusts_max)
        : d?.wind_Gusts_10m_Max !== undefined
          ? Number(d.wind_Gusts_10m_Max)
          : undefined;
      const precipHours = d?.precipitation_hours !== undefined
        ? Number(d.precipitation_hours)
        : d?.precipitation_Hours !== undefined
          ? Number(d.precipitation_Hours)
          : undefined;
      const sunshineSec = d?.sunshine_duration !== undefined
        ? Number(d.sunshine_duration)
        : d?.sunshine_Duration !== undefined
          ? Number(d.sunshine_Duration)
          : undefined;
      const uvMax = d?.uv_index_max !== undefined
        ? Number(d.uv_index_max)
        : d?.uv_Index_Max !== undefined
          ? Number(d.uv_Index_Max)
          : undefined;
      const et0 = d?.et0_fao_evapotranspiration !== undefined
        ? Number(d.et0_fao_evapotranspiration)
        : d?.et0_Fao_Evapotranspiration !== undefined
          ? Number(d.et0_Fao_Evapotranspiration)
          : undefined;
      const precipitationPercent =
        precipProb !== undefined
          ? precipProb
          : precipSum !== undefined
            ? Math.min(100, Math.round(precipSum * 10))
            : undefined;
      return ({
      date: d?.time,
      temperatureMax: d?.temperature_2m_max !== undefined
        ? Number(d.temperature_2m_max)
        : d?.temperature_2m_Max !== undefined
          ? Number(d.temperature_2m_Max)
          : undefined,
      temperatureMin: d?.temperature_2m_min !== undefined
        ? Number(d.temperature_2m_min)
        : d?.temperature_2m_Min !== undefined
          ? Number(d.temperature_2m_Min)
          : undefined,
      humidity: d?.relative_humidity_2m_max !== undefined
        ? Number(d.relative_humidity_2m_max)
        : d?.relative_Humidity_2m_Max !== undefined
          ? Number(d.relative_Humidity_2m_Max)
          : undefined,
      apparentTemperatureMax: d?.apparent_temperature_max !== undefined
        ? Number(d.apparent_temperature_max)
        : d?.apparent_Temperature_Max !== undefined
          ? Number(d.apparent_Temperature_Max)
          : undefined,
      apparentTemperatureMin: d?.apparent_temperature_min !== undefined
        ? Number(d.apparent_temperature_min)
        : d?.apparent_Temperature_Min !== undefined
          ? Number(d.apparent_Temperature_Min)
          : undefined,
      precipitationSum: precipSum,
      precipitationPercent,
      windSpeedMax: windMax,
      windGustsMax: windGusts,
      precipitationHours: precipHours,
      sunshineDurationSeconds: sunshineSec,
      uvIndexMax: uvMax,
      et0FaoEvapotranspiration: et0,
      sunrise: d?.sunrise,
      sunset: d?.sunset,
    });
    });
  }

  // Trường hợp 2: daily là object chứa các mảng song song
  const time: string[] = daily?.time ?? [];

  const tempMaxArr: any[] =
    daily?.temperature_2m_max ??
    daily?.temperature_2m_Max ??
    daily?.temperature2mMax ??
    daily?.temperature_max ??
    [];

  const tempMinArr: any[] =
    daily?.temperature_2m_min ??
    daily?.temperature_2m_Min ??
    daily?.temperature2mMin ??
    daily?.temperature_min ??
    [];

  const humidityArr: any[] =
    daily?.relative_humidity_2m_max ??
    daily?.relative_Humidity_2m_Max ??
    daily?.relativeHumidity2mMax ??
    daily?.humidity_Max ??
    daily?.humidity ??
    [];

  const apparentMaxArr: any[] =
    daily?.apparent_temperature_max ??
    daily?.apparent_Temperature_Max ??
    [];
  const apparentMinArr: any[] =
    daily?.apparent_temperature_min ??
    daily?.apparent_Temperature_Min ??
    [];

  const precipitationSumArr: any[] =
    daily?.precipitation_sum ??
    daily?.precipitation_Sum ??
    [];

  const precipitationProbArr: any[] =
    daily?.precipitation_probability_max ??
    daily?.precipitation_Probability_Max ??
    [];

  const windSpeedMaxArr: any[] =
    daily?.wind_speed_max ??
    daily?.wind_Speed_10m_Max ??
    [];
  const windGustsMaxArr: any[] =
    daily?.wind_gusts_max ??
    daily?.wind_Gusts_10m_Max ??
    [];
  const precipitationHoursArr: any[] =
    daily?.precipitation_hours ??
    daily?.precipitation_Hours ??
    [];
  const sunshineDurationArr: any[] =
    daily?.sunshine_duration ??
    daily?.sunshine_Duration ??
    [];
  const uvIndexMaxArr: any[] =
    daily?.uv_index_max ??
    daily?.uv_Index_Max ??
    [];
  const et0Arr: any[] =
    daily?.et0_fao_evapotranspiration ??
    daily?.et0_Fao_Evapotranspiration ??
    [];
  const sunriseArr: any[] = daily?.sunrise ?? [];
  const sunsetArr: any[] = daily?.sunset ?? [];

  const length = time.length;
  const items: DailyForecastItem[] = [];
  for (let i = 0; i < length; i++) {
    const maxVal = tempMaxArr[i];
    const minVal = tempMinArr[i];
    const humVal = humidityArr[i];
    const appMaxVal = apparentMaxArr[i];
    const appMinVal = apparentMinArr[i];
    const precipSumVal = precipitationSumArr[i];
    const precipProbVal = precipitationProbArr[i];
    const windMaxVal = windSpeedMaxArr[i];
    const windGustsVal = windGustsMaxArr[i];
    const precipHoursVal = precipitationHoursArr[i];
    const sunshineVal = sunshineDurationArr[i];
    const uvMaxVal = uvIndexMaxArr[i];
    const et0Val = et0Arr[i];
    const sunriseVal = sunriseArr[i];
    const sunsetVal = sunsetArr[i];
    items.push({
      date: time[i],
      temperatureMax: maxVal !== undefined ? Number(maxVal) : undefined,
      temperatureMin: minVal !== undefined ? Number(minVal) : undefined,
      humidity: humVal !== undefined ? Number(humVal) : undefined,
      apparentTemperatureMax: appMaxVal !== undefined ? Number(appMaxVal) : undefined,
      apparentTemperatureMin: appMinVal !== undefined ? Number(appMinVal) : undefined,
      precipitationSum: precipSumVal !== undefined ? Number(precipSumVal) : undefined,
      precipitationPercent: precipProbVal !== undefined
        ? Number(precipProbVal)
        : precipSumVal !== undefined
          ? Math.min(100, Math.round(Number(precipSumVal) * 10))
          : undefined,
      windSpeedMax: windMaxVal !== undefined ? Number(windMaxVal) : undefined,
      windGustsMax: windGustsVal !== undefined ? Number(windGustsVal) : undefined,
      precipitationHours: precipHoursVal !== undefined ? Number(precipHoursVal) : undefined,
      sunshineDurationSeconds: sunshineVal !== undefined ? Number(sunshineVal) : undefined,
      uvIndexMax: uvMaxVal !== undefined ? Number(uvMaxVal) : undefined,
      et0FaoEvapotranspiration: et0Val !== undefined ? Number(et0Val) : undefined,
      sunrise: sunriseVal,
      sunset: sunsetVal,
    });
  }
  return items;
};


