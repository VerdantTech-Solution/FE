import { apiClient } from './apiClient';

// Interface for product registration response
export interface ProductRegistration {
  id: number;
  vendorId: number;
  categoryId: number;
  proposedProductCode: string;
  proposedProductName: string;
  description: string;
  unitPrice: number;
  energyEfficiencyRating?: string;
  specifications?: {
    [key: string]: string;
  };
  manualUrls?: string;
  images?: string;
  warrantyMonths: number;
  weightKg: number;
  dimensionsCm: {
    Width: number;
    Height: number;
    Length: number;
  };
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  approvedBy?: number;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
}

export interface CreateProductCategoryRequest {
  name: string;
  parentId: number | null;
  description: string;
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
    const response = await apiClient.patch(`/api/ProductCategory/${id}`, data);
    console.log('Update product category response:', response.data);
    
    // Ensure we return the proper response structure
    if (response.data && typeof response.data === 'object') {
      return response.data;
    }
    
    // Fallback if response structure is different
    return {
      status: true,
      statusCode: 200,
      data: response.data
    };
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

// Product Image Interface
export interface ProductImage {
  id: number;
  imagePublicId: string;
  imageUrl: string;
  purpose: string;
  sortOrder: number;
}

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
  specifications?: {
    [key: string]: string;
  };
  manualUrls?: string;
  publicUrl?: string;
  images: ProductImage[] | string; // Có thể là array of objects hoặc string
  warrantyMonths: number;
  stockQuantity: number;
  weightKg?: number;
  dimensionsCm?: {
    [key: string]: number;
  };
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
  // Xử lý images - có thể là string, array of objects, array of strings, hoặc null
  let imageUrl = 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300&h=200&fit=crop';
  
  // Ưu tiên publicUrl nếu có
  if (apiProduct.publicUrl && typeof apiProduct.publicUrl === 'string') {
    imageUrl = apiProduct.publicUrl;
  } else if (apiProduct.images) {
    if (typeof apiProduct.images === 'string' && apiProduct.images.length > 0) {
      // Trường hợp 1: images là string (CSV)
      imageUrl = apiProduct.images.split(',')[0].trim();
    } else if (Array.isArray(apiProduct.images) && apiProduct.images.length > 0) {
      const firstImage = apiProduct.images[0];
      
      if (typeof firstImage === 'string') {
        // Trường hợp 2: images là array of strings
        imageUrl = firstImage;
      } else if (firstImage && typeof firstImage === 'object' && firstImage.imageUrl) {
        // Trường hợp 3: images là array of objects
        imageUrl = firstImage.imageUrl;
      }
    }
  }

  return {
    ...apiProduct,
    // Map API fields to component expected fields
    name: apiProduct.productName,
    price: apiProduct.unitPrice,
    originalPrice: apiProduct.discountPercentage > 0 
      ? Math.round(apiProduct.unitPrice / (1 - apiProduct.discountPercentage / 100))
      : apiProduct.unitPrice,
    discount: apiProduct.discountPercentage,
    unit: 'chiếc',
    category: 'machines',
    rating: apiProduct.ratingAverage || 4.5,
    reviews: apiProduct.soldCount || Math.floor(Math.random() * 100) + 10,
    location: 'TP. HCM',
    delivery: '3-5 ngày',
    image: imageUrl
  };
};

// Định nghĩa tham số đầu vào cho API phân trang
export interface PaginationParams {
  page?: number; // Trang hiện tại (optional, mặc định 1)
  pageSize?: number; // Số sản phẩm mỗi trang (optional, mặc định 100)
}

// Định nghĩa cấu trúc phản hồi API có phân trang
export interface PaginatedResponse<T> {
  data: T[]; // API trả về 'data' chứa mảng items
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

// API lấy tất cả sản phẩm (có phân trang)
export const getAllProducts = async (
  params: PaginationParams = { page: 1, pageSize: 100 }
): Promise<Product[]> => {
  try {
    const { page = 1, pageSize = 100 } = params;
    
    const response = await apiClient.get('/api/Product', {
      params: { page, pageSize },
    });
    
    const responseData = response.data;
    let productsArray: any[] = [];
    
    if (Array.isArray(responseData)) {
      productsArray = responseData;
    } else if (responseData && Array.isArray(responseData.data)) {
      productsArray = responseData.data;
    } else if (responseData && responseData.data && typeof responseData.data === 'object') {
      productsArray = Object.values(responseData.data);
    } else {
      console.warn('Unknown response structure:', responseData);
      return [];
    }
    
    return productsArray.map(transformProductData);
  } catch (error) {
    console.error('Get all products error:', error);
    throw error;
  }
};

// API lấy sản phẩm theo ID
export const getProductById = async (id: number): Promise<Product> => {
  try {
    const response = await apiClient.get(`/api/Product/${id}`);
    
    let productData = null;
    
    if (response.data) {
      productData = response.data;
    } else if (response && typeof response === 'object' && 'id' in response) {
      productData = response;
    }
    
    if (!productData) {
      throw new Error('Product not found');
    }
    
    return transformProductData(productData);
  } catch (error) {
    console.error('Get product by ID error:', error);
    throw error;
  }
};

// Interface for product registration
export interface RegisterProductRequest {
  categoryId: number;
  proposedProductCode: string;
  proposedProductName: string;
  description: string;
  unitPrice: number;
  energyEfficiencyRating?: string;
  specifications?: {
    [key: string]: string;
  };
  manualUrls?: string;
  images?: string;
  warrantyMonths: number;
  weightKg: number;
  dimensionsCm: {
    width: number;
    height: number;
    length: number;
  };
}

// API đăng ký sản phẩm mới
export const registerProduct = async (data: RegisterProductRequest): Promise<any> => {
  try {
    const response = await apiClient.post('/api/Product/register-product', data);
    console.log('Register product response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Register product error:', error);
    throw error;
  }
};

// API lấy tất cả sản phẩm đã đăng ký theo VendorID
export const getProductRegistrations = async (): Promise<ProductRegistration[]> => {
  try {
    const response = await apiClient.get('/api/ProductRegistrations');
    console.log('Get product registrations response:', response);
    
    // apiClient đã unwrap response.data do interceptor
    if (response && Array.isArray(response)) {
      return response;
    }
    
    // Fallback nếu response có cấu trúc khác
    if (response && response.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Get product registrations error:', error);
    throw error;
  }
};