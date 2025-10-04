import { apiClient } from './apiClient';

// Types cho Cart API
export interface AddToCartRequest {
  productId: number;
  quantity: number;
}

export interface CartResponse {
  status: boolean;
  statusCode: number;
  data: CartData;
  errors: string[];
}

export interface CartItem {
  productId: number;
  productName: string;
  slug: string;
  description: string;
  unitPrice: number;
  quantity: number;
  images: string;
  isActive: boolean;
  soldCount: number;
  ratingAverage: number;
}

export interface UserInfoDTO {
  id: number;
  email: string;
  role: string;
  fullName: string;
  phoneNumber: string;
  isVerified: boolean;
  avatarUrl: string | null;
  status: string;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  addresses: any[];
}

export interface CartData {
  userInfoDTO: UserInfoDTO;
  cartItems: CartItem[];
}

export interface CartResponse {
  status: boolean;
  statusCode: number;
  data: CartData;
  errors: string[];
}

// API functions
export const addToCart = async (data: AddToCartRequest): Promise<CartResponse> => {
  try {
    const response = await apiClient.post('/api/Cart/add', data);
    return response as unknown as CartResponse;
  } catch (error: any) {
    console.error('Error adding product to cart:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.status,
      statusCode: error?.statusCode,
      data: error?.data,
      response: error?.response
    });
    throw error;
  }
};

export const updateCartItem = async (productId: number, quantity: number): Promise<CartResponse> => {
  try {
    console.log('Updating cart item:', { productId, quantity });
    const response = await apiClient.put('/api/Cart/update', { productId, quantity });
    console.log('Update cart response:', response);
    return response as unknown as CartResponse;
  } catch (error: any) {
    console.error('Error updating cart item:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.status,
      statusCode: error?.statusCode,
      data: error?.data,
      response: error?.response
    });
    throw error;
  }
};

export const getCart = async (): Promise<any> => {
  try {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('No auth token found, returning empty cart');
      return { cartItems: [] };
    }

    const response = await apiClient.get('/api/Cart');
    console.log('Raw API response from getCart:', response);
    
    // Log the structure to help debug
    if (response) {
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response));
      
      if (response.data) {
        console.log('Response.data keys:', Object.keys(response.data));
        if (response.data.cartItems) {
          console.log('Found cartItems in data:', response.data.cartItems.length, 'items');
        }
      }
      
      if ((response as any).cartItems) {
        console.log('Found cartItems directly:', (response as any).cartItems.length, 'items');
      }
    }
    
    return response;
  } catch (error: any) {
    console.error('Error fetching cart:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.status,
      statusCode: error?.statusCode,
      data: error?.data,
      response: error?.response
    });
    throw error;
  }
};

export const getCartCount = async (): Promise<number> => {
  try {
    const cartData = await getCart();
    console.log('getCartCount - cartData:', cartData);
    
    if (cartData && cartData.data && cartData.data.cartItems) {
      const count = cartData.data.cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
      console.log('getCartCount - count from data.cartItems:', count);
      return count;
    } else if (cartData && cartData.cartItems) {
      const count = cartData.cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
      console.log('getCartCount - count from cartItems:', count);
      return count;
    }
    console.log('getCartCount - no cart items found, returning 0');
    return 0;
  } catch (error: any) {
    console.error('Error fetching cart count:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.status,
      statusCode: error?.statusCode,
      data: error?.data,
      response: error?.response
    });
    return 0;
  }
};

