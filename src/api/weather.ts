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

// Type definitions cho Current Weather API response
export interface CurrentWeatherApiResponse {
  status: boolean;
  statusCode: number;
  data: {
    latitude: string;
    longitude: string;
    generationTimeMs: string;
    utcOffsetSeconds: string;
    timezone: string;
    timezoneAbbreviation: string;
    elevation: string;
    current_Units: {
      time: string;
      interval: string;
      temperature_2m: string;
      apparent_Temperature: string;
      relative_Humidity_2m: string;
      precipitation: string;
      wind_Speed_10m: string;
      wind_Gusts_10m: string;
      uv_Index: string;
      soil_Moisture_0_to_1cm: string;
      soil_Moisture_3_to_9cm: string;
      soil_Temperature_0cm: string;
    };
    current: {
      time: string;
      interval: string;
      temperature_2m: string;
      apparent_Temperature: string;
      relative_Humidity_2m: string;
      precipitation: string;
      wind_Speed_10m: string;
      wind_Gusts_10m: string;
      uv_Index: string;
      soil_Moisture_0_to_1cm: string;
      soil_Moisture_3_to_9cm: string;
      soil_Temperature_0cm: string;
    };
  };
  errors: any[];
}

export interface CurrentWeatherData {
  time: string;
  interval: number;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windGusts: number;
  uvIndex: number;
  soilMoistureTop: number; // 0-1cm
  soilMoistureDeep: number; // 3-9cm
  soilTemperature: number;
}

// Type definitions cho Hourly Weather API response
export interface HourlyWeatherApiResponse {
  status: boolean;
  statusCode: number;
  data: {
    latitude: string;
    longitude: string;
    generationTimeMs: string;
    utcOffsetSeconds: string;
    timezone: string;
    timezoneAbbreviation: string;
    elevation: string;
    hourly_Units: {
      time: string;
      temperature_2m: string;
      apparent_Temperature: string;
      relative_Humidity_2m: string;
      precipitation: string;
      wind_Speed_10m: string;
      wind_Gusts_10m: string;
      uv_Index: string;
      soil_Moisture_0_to_1cm: string;
      soil_Moisture_3_to_9cm: string;
      soil_Temperature_0cm: string;
    };
    hourly: Array<{
      time: string;
      temperature_2m: string;
      apparent_Temperature: string;
      relative_Humidity_2m: string;
      precipitation: string;
      wind_Speed_10m: string;
      wind_Gusts_10m: string;
      uv_Index: string;
      soil_Moisture_0_to_1cm: string;
      soil_Moisture_3_to_9cm: string;
      soil_Temperature_0cm: string;
    }>;
  };
  errors: any[];
}

export interface HourlyWeatherItem {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windGusts: number;
  uvIndex: number;
  soilMoistureTop: number; // 0-1cm
  soilMoistureDeep: number; // 3-9cm
  soilTemperature: number;
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

// Function để lấy thông tin thời tiết hiện tại
export const getCurrentWeather = async (farmId: number): Promise<CurrentWeatherData> => {
  try {
    const res = await apiClient.get(`/api/Weather/current/${farmId}`);
    // Kiểm tra cấu trúc response
    const payload = res.data || res;

    // Kiểm tra các cấu trúc response có thể có
    let currentData;
    
    if (payload && payload.data && payload.data.current) {
      // Cấu trúc: { data: { current: {...} } }
      currentData = payload.data.current;
    } else if (payload && payload.current) {
      // Cấu trúc: { current: {...} }
      currentData = payload.current;
    } else if (payload && payload.data && typeof payload.data === 'object' && payload.data.time) {
      // Cấu trúc: { data: { time: ..., temperature_2m: ... } }
      currentData = payload.data;
    } else if (payload && payload.time) {
      // Cấu trúc: { time: ..., temperature_2m: ... }
      currentData = payload;
    } else {
      throw new Error('Invalid response structure');
    }

    // Chuyển đổi từ string sang number và format dữ liệu với fallback
    const result = {
      time: currentData.time || '',
      interval: Number(currentData.interval) || 0,
      temperature: Number(currentData.temperature_2m) || 0,
      apparentTemperature: Number(currentData.apparent_Temperature) || 0,
      humidity: Number(currentData.relative_Humidity_2m) || 0,
      precipitation: Number(currentData.precipitation) || 0,
      windSpeed: Number(currentData.wind_Speed_10m) || 0,
      windGusts: Number(currentData.wind_Gusts_10m) || 0,
      uvIndex: Number(currentData.uv_Index) || 0,
      soilMoistureTop: Number(currentData.soil_Moisture_0_to_1cm) || 0,
      soilMoistureDeep: Number(currentData.soil_Moisture_3_to_9cm) || 0,
      soilTemperature: Number(currentData.soil_Temperature_0cm) || 0,
    };

    return result;
  } catch (error) {
    throw error;
  }
};

// Function để lấy thông tin thời tiết theo giờ
export const getHourlyWeather = async (farmId: number): Promise<HourlyWeatherItem[]> => {
  try {
    const res = await apiClient.get(`/api/Weather/hourly/${farmId}`);

    // Kiểm tra cấu trúc response
    const payload = res.data || res;

    // Kiểm tra các cấu trúc response có thể có
    let hourlyData;
    
    
    if (payload && payload.data && payload.data.hourly && Array.isArray(payload.data.hourly)) {
      // Cấu trúc: { data: { hourly: [...] } }
      hourlyData = payload.data.hourly;
    } else if (payload && payload.hourly && Array.isArray(payload.hourly)) {
      // Cấu trúc: { hourly: [...] }
      hourlyData = payload.hourly;
    } else if (payload && payload.data && Array.isArray(payload.data)) {
      // Cấu trúc: { data: [...] }
  
      hourlyData = payload.data;
    } else if (Array.isArray(payload)) {
      // Cấu trúc: [...] (trực tiếp là array)
    
      hourlyData = payload;
    } else {

      throw new Error('Invalid hourly response structure');
    }


    // Chuyển đổi từ string sang number và format dữ liệu
    const result = hourlyData.map((item: any) => ({
      time: item.time || '',
      temperature: Number(item.temperature_2m) || 0,
      apparentTemperature: Number(item.apparent_Temperature) || 0,
      humidity: Number(item.relative_Humidity_2m) || 0,
      precipitation: Number(item.precipitation) || 0,
      windSpeed: Number(item.wind_Speed_10m) || 0,
      windGusts: Number(item.wind_Gusts_10m) || 0,
      uvIndex: Number(item.uv_Index) || 0,
      soilMoistureTop: Number(item.soil_Moisture_0_to_1cm) || 0,
      soilMoistureDeep: Number(item.soil_Moisture_3_to_9cm) || 0,
      soilTemperature: Number(item.soil_Temperature_0cm) || 0,
    }));

    return result;
  } catch (error) {
    throw error;
  }
};


