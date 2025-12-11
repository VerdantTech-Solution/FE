import { getDailyWeather, getCurrentWeather, getHourlyWeather, type DailyForecastItem, type CurrentWeatherData, type HourlyWeatherItem } from "@/api/weather";

// Cache duration: 15 minutes in milliseconds
const CACHE_DURATION = 15 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  farmId: number;
}

// In-memory cache storage
const cache: {
  daily: Map<string, CacheEntry<DailyForecastItem[]>>;
  current: Map<string, CacheEntry<CurrentWeatherData>>;
  hourly: Map<string, CacheEntry<HourlyWeatherItem[]>>;
} = {
  daily: new Map(),
  current: new Map(),
  hourly: new Map(),
};

// Track scheduled refreshes to avoid duplicate timeouts
const scheduledRefreshes: Map<string, NodeJS.Timeout> = new Map();

// Helper to generate cache key
const getCacheKey = (farmId: number, type: 'daily' | 'current' | 'hourly') => {
  return `${type}_${farmId}`;
};

// Helper to check if cache is valid
const isCacheValid = <T>(entry: CacheEntry<T> | undefined): boolean => {
  if (!entry) return false;
  const now = Date.now();
  const age = now - entry.timestamp;
  return age < CACHE_DURATION;
};

// Helper to get cached data or null
const getCachedData = <T>(
  cacheMap: Map<string, CacheEntry<T>>,
  key: string
): T | null => {
  const entry = cacheMap.get(key);
  if (entry && isCacheValid(entry)) {
    return entry.data;
  }
  // Remove expired cache
  if (entry) {
    cacheMap.delete(key);
  }
  return null;
};

// Helper to set cache
const setCache = <T>(
  cacheMap: Map<string, CacheEntry<T>>,
  key: string,
  data: T,
  farmId: number
): void => {
  cacheMap.set(key, {
    data,
    timestamp: Date.now(),
    farmId,
  });
};

// Helper to schedule refresh when cache expires
const scheduleRefresh = <T>(
  cacheMap: Map<string, CacheEntry<T>>,
  key: string,
  fetchFn: () => Promise<T>,
  farmId: number,
  onUpdate?: (data: T) => void
): void => {
  const entry = cacheMap.get(key);
  if (!entry) return;

  // Clear existing timeout if any
  const existingTimeout = scheduledRefreshes.get(key);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  const now = Date.now();
  const age = now - entry.timestamp;
  const timeUntilExpiry = CACHE_DURATION - age;

  if (timeUntilExpiry > 0) {
    // Schedule refresh when cache expires
    const timeout = setTimeout(async () => {
      scheduledRefreshes.delete(key);
      try {
        const freshData = await fetchFn();
        setCache(cacheMap, key, freshData, farmId);
        if (onUpdate) {
          onUpdate(freshData);
        }
        // Schedule next refresh
        scheduleRefresh(cacheMap, key, fetchFn, farmId, onUpdate);
      } catch (error) {
        console.error('Error refreshing weather cache:', error);
        // Retry after 1 minute if refresh fails
        const retryTimeout = setTimeout(() => {
          scheduleRefresh(cacheMap, key, fetchFn, farmId, onUpdate);
        }, 60 * 1000);
        scheduledRefreshes.set(key, retryTimeout);
      }
    }, timeUntilExpiry);
    scheduledRefreshes.set(key, timeout);
  }
};

/**
 * Get daily weather with caching
 */
export const getCachedDailyWeather = async (
  farmId: number,
  onUpdate?: (data: DailyForecastItem[]) => void
): Promise<DailyForecastItem[]> => {
  const key = getCacheKey(farmId, 'daily');
  
  // Check cache first
  const cached = getCachedData(cache.daily, key);
  if (cached) {
    // Schedule background refresh if not already scheduled
    scheduleRefresh(
      cache.daily,
      key,
      () => getDailyWeather(farmId),
      farmId,
      onUpdate
    );
    return cached;
  }

  // Fetch fresh data
  const data = await getDailyWeather(farmId);
  setCache(cache.daily, key, data, farmId);
  
  // Schedule refresh
  scheduleRefresh(
    cache.daily,
    key,
    () => getDailyWeather(farmId),
    farmId,
    onUpdate
  );

  return data;
};

/**
 * Get current weather with caching
 */
export const getCachedCurrentWeather = async (
  farmId: number,
  onUpdate?: (data: CurrentWeatherData) => void
): Promise<CurrentWeatherData> => {
  const key = getCacheKey(farmId, 'current');
  
  // Check cache first
  const cached = getCachedData(cache.current, key);
  if (cached) {
    // Schedule background refresh if not already scheduled
    scheduleRefresh(
      cache.current,
      key,
      () => getCurrentWeather(farmId),
      farmId,
      onUpdate
    );
    return cached;
  }

  // Fetch fresh data
  const data = await getCurrentWeather(farmId);
  setCache(cache.current, key, data, farmId);
  
  // Schedule refresh
  scheduleRefresh(
    cache.current,
    key,
    () => getCurrentWeather(farmId),
    farmId,
    onUpdate
  );

  return data;
};

/**
 * Get hourly weather with caching
 */
export const getCachedHourlyWeather = async (
  farmId: number,
  onUpdate?: (data: HourlyWeatherItem[]) => void
): Promise<HourlyWeatherItem[]> => {
  const key = getCacheKey(farmId, 'hourly');
  
  // Check cache first
  const cached = getCachedData(cache.hourly, key);
  if (cached) {
    // Schedule background refresh if not already scheduled
    scheduleRefresh(
      cache.hourly,
      key,
      () => getHourlyWeather(farmId),
      farmId,
      onUpdate
    );
    return cached;
  }

  // Fetch fresh data
  const data = await getHourlyWeather(farmId);
  setCache(cache.hourly, key, data, farmId);
  
  // Schedule refresh
  scheduleRefresh(
    cache.hourly,
    key,
    () => getHourlyWeather(farmId),
    farmId,
    onUpdate
  );

  return data;
};

/**
 * Clear cache for a specific farm
 */
export const clearWeatherCache = (farmId: number): void => {
  const dailyKey = getCacheKey(farmId, 'daily');
  const currentKey = getCacheKey(farmId, 'current');
  const hourlyKey = getCacheKey(farmId, 'hourly');
  
  cache.daily.delete(dailyKey);
  cache.current.delete(currentKey);
  cache.hourly.delete(hourlyKey);
};

/**
 * Clear all weather cache
 */
export const clearAllWeatherCache = (): void => {
  cache.daily.clear();
  cache.current.clear();
  cache.hourly.clear();
};

