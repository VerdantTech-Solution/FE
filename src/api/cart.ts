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
    const response = await apiClient.post<CartResponse>('/api/Cart/add', data);
    return response.data;
  } catch (error: any) {
    console.error('Error adding product to cart:', error);
    throw error;
  }
};

export const getCart = async (): Promise<any> => {
  try {
    const response = await apiClient.get('/api/Cart');
    console.log('Raw API response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching cart:', error);
    throw error;
  }
};
