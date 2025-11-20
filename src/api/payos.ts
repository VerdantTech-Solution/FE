import { apiClient } from './apiClient';

export interface CreatePayOSLinkRequest {
  description?: string;
}

export interface CreatePayOSLinkResponse {
  status: boolean;
  statusCode: string;
  data: string; // PayOS payment link
  errors: string[];
}

/**
 * Redirect to PayOS payment page by calling API
 * @param orderId The order ID to create payment for
 * @param description Optional description for the payment
 */
export const redirectToPayOS = async (orderId: number, description?: string): Promise<void> => {
  try {
    console.log('[PayOS] Creating payment link for order:', orderId);
    console.log('[PayOS] Description:', description);
    
    // Call PayOS API to get payment link using apiClient like other APIs
    const url = `/api/PayOS/create/${orderId}`;
    console.log('[PayOS] Calling API:', url);
    
    const response = await apiClient.post<any>(
      url,
      { description }
    );
    
    console.log('[PayOS] Raw API response:', response);
    console.log('[PayOS] Response type:', typeof response);
    console.log('[PayOS] Full response:', JSON.stringify(response, null, 2));
    
    // Extract payment link or payment info from response
    // Backend might return different structures
    let paymentLink: string = '';
    
    if (typeof response === 'string') {
      // Response is already a string (the payment URL)
      paymentLink = response;
    } else if (response && typeof response === 'object') {
      // Check if response has a 'data' property
      if ('data' in response) {
        const data = (response as any).data;
        
        if (typeof data === 'string') {
          // Data is a string URL
          paymentLink = data;
        } else if (typeof data === 'object' && data !== null) {
          // Data is an object - could be payment info or payment link
          // Try to find payment URL in various possible properties
          if (typeof data.url === 'string') {
            paymentLink = data.url;
          } else if (typeof data.checkoutUrl === 'string') {
            paymentLink = data.checkoutUrl;
          } else if (typeof data.paymentLink === 'string') {
            paymentLink = data.paymentLink;
          } else if (typeof data.link === 'string') {
            paymentLink = data.link;
          } else {
            // No URL found in the object, this might be payment info to display
            console.log('[PayOS] Payment info received:', data);
            console.log('[PayOS] This appears to be bank transfer info, not a payment link');
            console.log('[PayOS] Account:', data.accountNumber, 'Amount:', data.amount);
            
            // Backend might have returned bank transfer details instead of a payment link
            throw new Error(`Backend trả về thông tin chuyển khoản, không phải payment link. Vui lòng kiểm tra backend xử lý PayOS`);
          }
        }
      } else {
        console.error('[PayOS] Response does not have data property:', response);
        throw new Error('Phản hồi từ API không có trường data');
      }
    }
    
    console.log('[PayOS] Extracted payment link:', paymentLink);
    console.log('[PayOS] Payment link type:', typeof paymentLink);
    
    if (!paymentLink || typeof paymentLink !== 'string') {
      console.error('[PayOS] No valid payment link in response:', response);
      throw new Error('Không nhận được link thanh toán từ API. Backend có thể cần cấu hình để trả về payment URL.');
    }
    
    // Validate that we got a proper PayOS URL, not a localhost URL
    if (paymentLink.includes('localhost') || paymentLink.includes('[object')) {
      console.error('[PayOS] Invalid payment link received:', paymentLink);
      throw new Error(`Backend trả về link không hợp lệ: ${paymentLink}`);
    }
    
    // Redirect to PayOS payment page
    console.log('[PayOS] Redirecting to PayOS payment page:', paymentLink);
    window.location.href = paymentLink;
    
  } catch (error) {
    console.error('[PayOS] Error creating payment link:', error);
    throw error;
  }
};

/**
 * Create a PayOS payment link for an order and redirect to payment page
 * @param orderId The order ID to create payment for
 * @param description Optional description for the payment
 */
export const createPayOSLink = async (
  orderId: number,
  description?: string
): Promise<CreatePayOSLinkResponse> => {
  console.log('[PayOS] Calling PayOS API with:', { orderId, description });
  console.log('[PayOS] Endpoint:', `/api/PayOS/create/${orderId}`);
  
  try {
    const response = await apiClient.post<CreatePayOSLinkResponse>(
      `/api/PayOS/create/${orderId}`,
      { description }
    );
    
    console.log('[PayOS] API response:', response);
    console.log('[PayOS] Response status:', response.status);
    console.log('[PayOS] Response data:', response.data);
    
    return response as unknown as CreatePayOSLinkResponse;
  } catch (error) {
    console.error('[PayOS] API error:', error);
    throw error;
  }
};

