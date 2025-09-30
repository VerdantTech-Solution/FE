import { apiClient } from './apiClient';

export interface CreateProductCategoryRequest {
  name: string;
  parentId: number | null;
  description: string;
  iconUrl: string | null;
}

export interface UpdateProductCategoryRequest extends CreateProductCategoryRequest {
  isActive: boolean;
}

export interface ResponseWrapper<T> {
  status: boolean;
  statusCode: number;
  data: T;
  errors?: string[];
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  iconUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: ProductCategory | null;
}

// API tạo danh mục sản phẩm mới
export const createProductCategory = async (data: CreateProductCategoryRequest): Promise<ProductCategory> => {
  try {
    const response = await apiClient.post('/api/ProductCategory', data);
    return response.data;
  } catch (error) {
    console.error('Create product category error:', error);
    throw error;
  }
};

// API lấy danh sách danh mục sản phẩm
export const getProductCategories = async (): Promise<ProductCategory[]> => {
  try {
    const response = await apiClient.get('/api/ProductCategory');
    console.log('Get product categories response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get product categories error:', error);
    throw error;
  }
};

// API lấy danh mục sản phẩm theo ID
export const getProductCategoryById = async (id: number): Promise<ProductCategory> => {
  try {
    const response = await apiClient.get(`/api/ProductCategory/${id}`);
    console.log('Get product category by ID response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get product category by ID error:', error);
    throw error;
  }
};

// API cập nhật danh mục sản phẩm
export const updateProductCategory = async (
  id: number,
  data: Partial<UpdateProductCategoryRequest>
): Promise<ResponseWrapper<ProductCategory>> => {
  try {
    const response = await apiClient.put(`/api/ProductCategory/${id}`, data);
    console.log('Update product category response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Update product category error:', error);
    throw error;
  }
};

// API xóa danh mục sản phẩm
export const deleteProductCategory = async (id: number): Promise<void> => {
  try {
    const response = await apiClient.delete(`/api/ProductCategory/${id}`);
    console.log('Delete product category response:', response);
  } catch (error) {
    console.error('Delete product category error:', error);
    throw error;
  }
};

// Product interfaces
export interface Product {
  id: number;
  categoryId: number;
  vendorId: number;
  productCode: string;
  productName: string;
  description: string;
  unitPrice: number;
  commissionRate: number;
  discountPercentage: number;
  energyEfficiencyRating?: string;
  specifications?: any;
  manualUrls?: string;
  images: string;
  warrantyMonths: number;
  stockQuantity: number;
  weightkg?: number;
  dimensionsCm?: any;
  isActive: boolean;
  viewCount?: number;
  soldCount?: number;
  ratingAverage?: number;
  createdAt: string;
  updatedAt: string;
  // Thêm các field để tương thích với component
  name?: string;
  price?: number;
  originalPrice?: number;
  discount?: number;
  unit?: string;
  category?: string;
  rating?: number;
  reviews?: number;
  location?: string;
  delivery?: string;
  image?: string;
}

export interface ProductResponse {
  status: boolean;
  statusCode: number;
  data: Product[];
  errors?: string[];
}

// Transform API data to component format
const transformProductData = (apiProduct: any): Product => {
  return {
    ...apiProduct,
    // Map API fields to component expected fields
    name: apiProduct.productName,
    price: apiProduct.unitPrice,
    originalPrice: apiProduct.discountPercentage > 0 
      ? Math.round(apiProduct.unitPrice / (1 - apiProduct.discountPercentage / 100))
      : apiProduct.unitPrice,
    discount: apiProduct.discountPercentage,
    unit: 'chiếc', // Default unit
    category: 'machines', // Default category, có thể map từ categoryId
    rating: apiProduct.ratingAverage || 4.5, // Sử dụng rating từ API hoặc default
    reviews: apiProduct.soldCount || Math.floor(Math.random() * 100) + 10, // Sử dụng soldCount hoặc random
    location: 'TP. HCM', // Default location
    delivery: '3-5 ngày', // Default delivery
    image: apiProduct.images ? apiProduct.images.split(',')[0] : 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop'
  };
};

// API lấy tất cả sản phẩm
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const response = await apiClient.get('/api/Product');
    console.log('Get all products response:', response.data);
    
    // API trả về { status, statusCode, data } nên cần lấy response.data.data
    if (response.data && response.data.data) {
      return response.data.data.map(transformProductData);
    }
    
    // Fallback nếu cấu trúc khác
    return (response.data || []).map(transformProductData);
  } catch (error) {
    console.error('Get all products error:', error);
    throw error;
  }
};

// API lấy sản phẩm theo ID
export const getProductById = async (id: number): Promise<Product> => {
  try {
    const response = await apiClient.get(`/api/Product/${id}`);
    console.log('Get product by ID response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get product by ID error:', error);
    throw error;
  }
};