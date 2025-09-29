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
