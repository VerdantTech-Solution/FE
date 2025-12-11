/**
 * Service để quản lý lịch sử các gợi ý AI đã được tạo ra
 * Lưu trữ trong localStorage để tránh spam AI nhiều lần
 */

export interface AIAdvisoryHistoryItem {
  id: string; // UUID hoặc timestamp-based ID
  farmId: number;
  farmName: string;
  advisoryText: string;
  createdAt: string; // ISO date string
  surveyResponsesCount?: number;
  hasSoilData?: boolean;
}

const STORAGE_KEY = "ai_advisory_history";
const MAX_HISTORY_ITEMS = 50; // Giới hạn số lượng lịch sử

/**
 * Lấy toàn bộ lịch sử từ localStorage
 */
export const getAdvisoryHistory = (): AIAdvisoryHistoryItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const history = JSON.parse(stored) as AIAdvisoryHistoryItem[];
    // Sắp xếp theo thời gian mới nhất trước
    return history.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("Error reading advisory history:", error);
    return [];
  }
};

/**
 * Lấy lịch sử theo farmId
 */
export const getAdvisoryHistoryByFarmId = (farmId: number): AIAdvisoryHistoryItem[] => {
  const allHistory = getAdvisoryHistory();
  return allHistory.filter(item => item.farmId === farmId);
};

/**
 * Lấy gợi ý mới nhất cho một farm
 */
export const getLatestAdvisoryForFarm = (farmId: number): AIAdvisoryHistoryItem | null => {
  const farmHistory = getAdvisoryHistoryByFarmId(farmId);
  return farmHistory.length > 0 ? farmHistory[0] : null;
};

/**
 * Lưu một gợi ý mới vào lịch sử
 */
export const saveAdvisoryToHistory = (
  farmId: number,
  farmName: string,
  advisoryText: string,
  surveyResponsesCount?: number,
  hasSoilData?: boolean
): AIAdvisoryHistoryItem => {
  const history = getAdvisoryHistory();
  
  const newItem: AIAdvisoryHistoryItem = {
    id: `${farmId}_${Date.now()}`,
    farmId,
    farmName,
    advisoryText,
    createdAt: new Date().toISOString(),
    surveyResponsesCount,
    hasSoilData,
  };

  // Thêm vào đầu danh sách
  history.unshift(newItem);

  // Giới hạn số lượng lịch sử
  const limitedHistory = history.slice(0, MAX_HISTORY_ITEMS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error("Error saving advisory history:", error);
    // Nếu localStorage đầy, xóa các item cũ nhất
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      const reducedHistory = limitedHistory.slice(0, Math.floor(MAX_HISTORY_ITEMS / 2));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedHistory));
    }
  }

  return newItem;
};

/**
 * Xóa một item khỏi lịch sử
 */
export const deleteAdvisoryFromHistory = (id: string): boolean => {
  try {
    const history = getAdvisoryHistory();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Error deleting advisory from history:", error);
    return false;
  }
};

/**
 * Xóa toàn bộ lịch sử của một farm
 */
export const clearAdvisoryHistoryForFarm = (farmId: number): boolean => {
  try {
    const history = getAdvisoryHistory();
    const filtered = history.filter(item => item.farmId !== farmId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Error clearing farm advisory history:", error);
    return false;
  }
};

/**
 * Xóa toàn bộ lịch sử
 */
export const clearAllAdvisoryHistory = (): boolean => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing all advisory history:", error);
    return false;
  }
};

