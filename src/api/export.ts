import { apiClient } from './apiClient';

/**
 * Interface for identity number response
 * For products without serial numbers: returns lot numbers with remaining quantities
 * For products with serial numbers: returns serial numbers with their lot numbers
 */
export interface IdentityNumberItem {
  lotNumber?: string;
  serialNumber?: string;
  remainingQuantity?: number;
}

export interface GetIdentityNumbersResponse {
  status: boolean;
  statusCode: string;
  data: IdentityNumberItem[] | string | {
    lotNumberInfo?: Array<{ lotNumber: string; quantity: number }>;
    serialNumberInfo?: Array<{ serialNumber: string; lotNumber: string }> | null;
  }; // Can be array, string (JSON string), or object with lotNumberInfo/serialNumberInfo
  errors: string[];
}

/**
 * Get Identity Numbers By ProductId
 * Lấy danh sách số lô (kèm số lượng còn lại) hoặc số sê-ri (kèm số lô) có sẵn trong kho theo ProductId
 * 
 * @param productId - Product ID
 * @returns Array of identity numbers (lot numbers or serial numbers)
 */
export const getIdentityNumbersByProductId = async (
  productId: number
): Promise<IdentityNumberItem[]> => {
  try {
    const response = await apiClient.get<GetIdentityNumbersResponse>(
      `/api/ExportInventory/identity-numbers/${productId}`,
      {
        headers: {
          Accept: 'text/plain',
        },
      }
    );

    // Handle different response structures
    let data: IdentityNumberItem[] = [];
    const normalizeData = (payload: any): IdentityNumberItem[] => {
      if (!payload) return [];

      // If payload is stringified JSON
      if (typeof payload === 'string') {
        try {
          const parsed = JSON.parse(payload);
          return normalizeData(parsed);
        } catch (error) {
          console.error('Failed to parse identity numbers JSON string:', error);
          return [];
        }
      }

      // If payload is already an array
      if (Array.isArray(payload)) {
        return payload;
      }

      if (typeof payload === 'object') {
        // Case: payload has lotNumberInfo/serialNumberInfo fields
        if ('lotNumberInfo' in payload || 'serialNumberInfo' in payload) {
          const lotNumberInfo = (payload as any).lotNumberInfo;
          const serialNumberInfo = (payload as any).serialNumberInfo;
          
          const lotItems: IdentityNumberItem[] = Array.isArray(lotNumberInfo)
            ? lotNumberInfo.map((item: any) => ({
                lotNumber: item.lotNumber,
                remainingQuantity: item.quantity ?? item.remainingQuantity,
              }))
            : [];
          
          const serialItems: IdentityNumberItem[] = Array.isArray(serialNumberInfo)
            ? serialNumberInfo.map((item: any) => ({
                serialNumber: item.serialNumber,
                lotNumber: item.lotNumber,
              }))
            : [];

          return [...lotItems, ...serialItems];
        }

        // Case: payload wraps the result with status/data (top-level)
        if ('status' in payload && 'data' in payload) {
          return normalizeData((payload as any).data);
        }

        // Case: payload has nested data inside data property
        if ('data' in payload) {
          return normalizeData((payload as any).data);
        }

        // Case: payload has items array
        if ('items' in payload && Array.isArray((payload as any).items)) {
          return (payload as any).items;
        }

        return [payload as IdentityNumberItem];
      }

      return [];
    };

    // Case 1: Response is wrapped in standard format
    if (response && typeof response === 'object') {
      // Many of our API helpers already unwrap response.data, so handle both cases
      if ('data' in response && !Array.isArray(response)) {
        // axios-style response -> response.data
        const axiosData = (response as any).data;
        if (axiosData) {
          data = normalizeData(axiosData);
        }
      }

      if (data.length === 0) {
        data = normalizeData(response);
      }
    }

    // Ensure we return an array
    if (!Array.isArray(data)) {
      console.warn('Identity numbers response is not an array:', data);
      return [];
    }

    // Filter out invalid items and ensure proper structure
    return data
      .filter((item) => item !== null && typeof item === 'object')
      .map((item) => ({
        lotNumber: item.lotNumber || undefined,
        serialNumber: item.serialNumber || undefined,
        remainingQuantity: item.remainingQuantity || undefined,
      }));
  } catch (error: any) {
    console.error('Error fetching identity numbers by product ID:', error);
    
    // Try to extract error message
    const errorMessage = 
      error?.response?.data?.errors?.join(', ') ||
      error?.response?.data?.message ||
      error?.message ||
      'Không thể lấy danh sách số lô/số seri';
    
    console.error('Error details:', errorMessage);
    
    // Return empty array on error
    return [];
  }
};

/**
 * Get Exported Identity Numbers By OrderDetailId
 * Lấy danh sách số lô (kèm số lượng) hoặc số sê-ri (kèm số lô) đã được xuất kho theo OrderDetailId
 * 
 * @param orderDetailId - Order Detail ID
 * @returns Array of identity numbers (lot numbers or serial numbers)
 */
export const getExportedIdentityNumbersByOrderDetailId = async (
  orderDetailId: number
): Promise<IdentityNumberItem[]> => {
  try {
    const response = await apiClient.get<GetIdentityNumbersResponse>(
      `/api/ExportInventory/exported-identity-numbers/${orderDetailId}`,
      {
        headers: {
          Accept: 'text/plain',
        },
      }
    );

    // Handle different response structures (same normalization as getIdentityNumbersByProductId)
    let data: IdentityNumberItem[] = [];
    const normalizeData = (payload: any): IdentityNumberItem[] => {
      if (!payload) return [];

      // If payload is stringified JSON
      if (typeof payload === 'string') {
        try {
          const parsed = JSON.parse(payload);
          return normalizeData(parsed);
        } catch (error) {
          console.error('Failed to parse exported identity numbers JSON string:', error);
          return [];
        }
      }

      // If payload is already an array
      if (Array.isArray(payload)) {
        return payload;
      }

      if (typeof payload === 'object') {
        // Case: payload has lotNumberInfo/serialNumberInfo fields
        if ('lotNumberInfo' in payload || 'serialNumberInfo' in payload) {
          const lotNumberInfo = (payload as any).lotNumberInfo;
          const serialNumberInfo = (payload as any).serialNumberInfo;
          
          const lotItems: IdentityNumberItem[] = Array.isArray(lotNumberInfo)
            ? lotNumberInfo.map((item: any) => ({
                lotNumber: item.lotNumber,
                remainingQuantity: item.quantity ?? item.remainingQuantity,
              }))
            : [];
          
          const serialItems: IdentityNumberItem[] = Array.isArray(serialNumberInfo)
            ? serialNumberInfo.map((item: any) => ({
                serialNumber: item.serialNumber,
                lotNumber: item.lotNumber,
              }))
            : [];

          return [...lotItems, ...serialItems];
        }

        // Case: payload wraps the result with status/data (top-level)
        if ('status' in payload && 'data' in payload) {
          return normalizeData((payload as any).data);
        }

        // Case: payload has nested data inside data property
        if ('data' in payload) {
          return normalizeData((payload as any).data);
        }

        // Case: payload has items array
        if ('items' in payload && Array.isArray((payload as any).items)) {
          return (payload as any).items;
        }

        return [payload as IdentityNumberItem];
      }

      return [];
    };

    // Case 1: Response is wrapped in standard format
    if (response && typeof response === 'object') {
      // Many of our API helpers already unwrap response.data, so handle both cases
      if ('data' in response && !Array.isArray(response)) {
        // axios-style response -> response.data
        const axiosData = (response as any).data;
        if (axiosData) {
          data = normalizeData(axiosData);
        }
      }

      if (data.length === 0) {
        data = normalizeData(response);
      }
    }

    // Ensure we return an array
    if (!Array.isArray(data)) {
      console.warn('Exported identity numbers response is not an array:', data);
      return [];
    }

    // Filter out invalid items and ensure proper structure
    return data
      .filter((item) => item !== null && typeof item === 'object')
      .map((item) => ({
        lotNumber: item.lotNumber || undefined,
        serialNumber: item.serialNumber || undefined,
        remainingQuantity: item.remainingQuantity || undefined,
      }));
  } catch (error: any) {
    console.error('Error fetching exported identity numbers by order detail ID:', error);
    
    // Try to extract error message
    const errorMessage = 
      error?.response?.data?.errors?.join(', ') ||
      error?.response?.data?.message ||
      error?.message ||
      'Không thể lấy danh sách số lô/số seri đã xuất kho';
    
    console.error('Error details:', errorMessage);
    
    // Return empty array on error
    return [];
  }
};

