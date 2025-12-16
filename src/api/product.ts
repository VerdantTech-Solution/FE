import { apiClient, API_BASE_URL } from './apiClient';
import axios from 'axios';

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
  manualUrl?: string;
  manualPublicUrl?: string;
  images?: string | ProductImage[] | string[]; // Có thể là string, array of objects, hoặc array of strings
  productImages?: MediaLinkItemDTO[]; // ✅ Backend trả về trong field này (từ HydrateMediaAsync)
  certificates?: Certificate[]; // Certificates từ backend (cấu trúc mới)
  certificateFiles?: MediaLinkItemDTO[]; // Deprecated - giữ lại để backward compatibility
  certificationCode?: string[];
  certificationName?: string[];
  warrantyMonths: number;
  weightKg: number;
  dimensionsCm?: {
    Width?: number;
    Height?: number;
    Length?: number;
    width?: number;  // Hỗ trợ cả camelCase từ backend
    height?: number;
    length?: number;
  };
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  approvedBy?: number;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
}

// MediaLinkItemDTO từ backend (từ HydrateMediaAsync)
export interface MediaLinkItemDTO {
  id: number;
  imagePublicId: string;
  imageUrl: string;
  purpose: string;
  sortOrder: number;
}

// Certificate interface từ backend
export interface Certificate {
  id: number;
  productId: number;
  registrationId: number;
  certificationCode: string;
  certificationName: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: number;
  createdAt: string;
  updatedAt: string;
  files: MediaLinkItemDTO[];
}

export interface CreateProductCategoryRequest {
  name: string;
  parentId: number | null;
  serialRequired: boolean;
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
  serialRequired?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: ProductCategory | null;
  parentId?: number | null; // ID of parent category (null for top-level categories)
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


// API lấy danh sách danh mục sản phẩm (có phân trang)
export const getProductCategories = async (
  params: PaginationParams = { page: 1, pageSize: 20 }
): Promise<PaginatedResponse<ProductCategory> | ProductCategory[]> => {
  try {
    const { page = 1, pageSize = 20 } = params;
    const response = await apiClient.get('/api/ProductCategory', {
      params: { page, pageSize },
    });
    console.log('Get product categories response:', response);
    
    // apiClient interceptor đã unwrap response.data từ AxiosResponse
    // Vậy response ở đây là APIResponse { status, statusCode, data: PagedResponse, errors }
    
    // Kiểm tra nếu response có cấu trúc APIResponse
    if (response && typeof response === 'object' && 'status' in response) {
      const apiResponse = response as unknown as { status: boolean; data?: any; errors?: string[] };
      
      // Nếu có lỗi, throw error
      if (apiResponse.status === false || (apiResponse.errors && apiResponse.errors.length > 0)) {
        const errorMessage = apiResponse.errors?.join(', ') || 'Failed to fetch product categories';
        throw new Error(errorMessage);
      }
      
      // Lấy data từ APIResponse
      if (apiResponse.data) {
        // data có thể là PagedResponse hoặc array
        if ('data' in apiResponse.data && 'currentPage' in apiResponse.data) {
          return apiResponse.data as PaginatedResponse<ProductCategory>;
        }
        if (Array.isArray(apiResponse.data)) {
          return apiResponse.data as ProductCategory[];
        }
      }
    }
    
    // Nếu response là PagedResponse trực tiếp (fallback)
    if (response && typeof response === 'object' && 'data' in response && 'currentPage' in response) {
      return response as unknown as PaginatedResponse<ProductCategory>;
    }
    
    // Nếu response là array trực tiếp (backward compatibility)
    if (Array.isArray(response)) {
      return response as ProductCategory[];
    }
    
    console.warn('Unexpected response format:', response);
    return [];
  } catch (error) {
    console.error('Get product categories error:', error);
    throw error;
  }
};

// API lấy tất cả danh mục sản phẩm (không phân trang - lấy tất cả)
export const getAllProductCategories = async (): Promise<ProductCategory[]> => {
  try {
    // Fetch page đầu tiên để lấy thông tin totalRecords
    const firstResponse = await getProductCategories({ page: 1, pageSize: 30 });
    
    let categories: ProductCategory[] = [];
    let totalRecords = 0;
    
    // Xử lý response có thể là PaginatedResponse hoặc array
    if (Array.isArray(firstResponse)) {
      // Nếu là array, đã có tất cả rồi
      return firstResponse;
    } else if (firstResponse && typeof firstResponse === 'object' && 'data' in firstResponse) {
      const pagedResponse = firstResponse as PaginatedResponse<ProductCategory>;
      categories = pagedResponse.data || [];
      totalRecords = pagedResponse.totalRecords || categories.length;
      
      // Nếu totalRecords <= 30 (pageSize đã fetch), đã có đủ rồi
      if (totalRecords <= 30) {
        return categories;
      }
      
      // Nếu có nhiều hơn 30, fetch tất cả trong 1 lần với pageSize = totalRecords
      const allResponse = await getProductCategories({ page: 1, pageSize: totalRecords });
      
      if (Array.isArray(allResponse)) {
        return allResponse;
      } else if (allResponse && typeof allResponse === 'object' && 'data' in allResponse) {
        const allPagedResponse = allResponse as PaginatedResponse<ProductCategory>;
        return allPagedResponse.data || [];
      }
      
      // Fallback: return categories từ page đầu
      return categories;
    }
    
    return [];
  } catch (error) {
    console.error('Get all product categories error:', error);
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
      } else if (firstImage && typeof firstImage === 'object') {
        // Trường hợp 3: images là array of objects (MediaLinkItemDTO)
        // Có thể có imageUrl hoặc imagePublicId
        if (firstImage.imageUrl) {
          imageUrl = firstImage.imageUrl;
        } else if (firstImage.imagePublicId) {
          // Nếu chỉ có publicId, có thể cần construct URL (tùy backend)
          imageUrl = firstImage.imagePublicId;
        }
      }
    }
  }

  // Xử lý dimensionsCm: normalize từ PascalCase sang camelCase
  let normalizedDimensionsCm: { width?: number; height?: number; length?: number } | undefined;
  if (apiProduct.dimensionsCm) {
    const dims = apiProduct.dimensionsCm;
    normalizedDimensionsCm = {
      width: dims.width ?? dims.Width,
      height: dims.height ?? dims.Height,
      length: dims.length ?? dims.Length
    };
    // Chỉ giữ lại nếu có ít nhất 1 giá trị hợp lệ
    if (!normalizedDimensionsCm.width && !normalizedDimensionsCm.height && !normalizedDimensionsCm.length) {
      normalizedDimensionsCm = undefined;
    }
  }

  // Xử lý specifications: có thể là JSON string hoặc object
  let normalizedSpecifications: { [key: string]: string } = {};
  if (apiProduct.specifications) {
    if (typeof apiProduct.specifications === 'string') {
      // Nếu là JSON string, parse nó
      try {
        const parsed = JSON.parse(apiProduct.specifications);
        if (typeof parsed === 'object' && parsed !== null) {
          // Filter out null values và empty strings
          Object.entries(parsed).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
              normalizedSpecifications[key] = String(value);
            }
          });
        }
      } catch (e) {
        console.warn('Failed to parse specifications JSON string:', e);
        // Nếu parse lỗi, giữ nguyên string hoặc để empty
      }
    } else if (typeof apiProduct.specifications === 'object' && apiProduct.specifications !== null) {
      // Nếu đã là object, filter out null values và empty strings
      Object.entries(apiProduct.specifications).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          normalizedSpecifications[key] = String(value);
        }
      });
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
    unit: apiProduct.unit || 'chiếc', // Lấy từ API nếu có, fallback 'chiếc'
    category: apiProduct.categoryName || apiProduct.category || '', // Lấy từ API
    rating: apiProduct.ratingAverage ?? 0, // Sửa: 0 thay vì 4.5, dùng ?? để xử lý 0 hợp lệ
    reviews: apiProduct.reviewCount ?? 0, // Sửa: dùng reviewCount từ API, fallback 0
    location: apiProduct.location || apiProduct.vendorLocation || '', // Lấy từ API
    delivery: apiProduct.delivery || apiProduct.deliveryTime || '', // Lấy từ API
    image: imageUrl,
    // Đảm bảo images được giữ nguyên từ API (có thể là MediaLinkItemDTO[] hoặc string)
    images: apiProduct.images || [],
    // Đảm bảo stockQuantity được giữ nguyên từ API (có thể là stockQuantity hoặc stock)
    stockQuantity: apiProduct.stockQuantity ?? apiProduct.stock ?? 0,
    // Normalize dimensionsCm từ PascalCase sang camelCase
    dimensionsCm: normalizedDimensionsCm || apiProduct.dimensionsCm,
    // Parse và normalize specifications từ JSON string hoặc object
    specifications: normalizedSpecifications,
    weightKg: apiProduct.weightKg,
    warrantyMonths: apiProduct.warrantyMonths,
    energyEfficiencyRating: apiProduct.energyEfficiencyRating,
    // Map manualUrls từ API (có thể là manualUrls, manualUrl, hoặc manualPublicUrl)
    manualUrls: apiProduct.manualUrls || apiProduct.manualUrl || apiProduct.manualPublicUrl || undefined
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

// API lấy sản phẩm theo category (có phân trang)
export const getProductsByCategory = async (
  categoryId: number | null,
  params: PaginationParams = { page: 1, pageSize: 1000 }
): Promise<PaginatedResponse<Product>> => {
  try {
    const { page = 1, pageSize = 1000 } = params;
    const response = await apiClient.get('/api/Product/by-category', {
      params: {
        categoryId: categoryId || undefined,
        page,
        pageSize,
      },
    });
    
    console.log('Get products by category response:', response);
    
    // apiClient interceptor đã unwrap response.data
    // Response có thể là PagedResponse trực tiếp hoặc wrapped trong APIResponse
    let pagedResponse: PaginatedResponse<any> | null = null;
    
    // Nếu response có cấu trúc APIResponse (status, data, errors)
    if (response && typeof response === 'object' && 'status' in response && 'data' in response) {
      const apiResponse = response as unknown as { status: boolean; data: any; errors?: string[] };
      if (apiResponse.data && typeof apiResponse.data === 'object' && 'data' in apiResponse.data) {
        pagedResponse = apiResponse.data as PaginatedResponse<any>;
      }
    }
    // Nếu response là PagedResponse trực tiếp
    else if (response && typeof response === 'object' && 'data' in response && 'currentPage' in response) {
      pagedResponse = response as PaginatedResponse<any>;
    }
    
    if (pagedResponse && Array.isArray(pagedResponse.data)) {
      const products = pagedResponse.data.map(transformProductData);
      return {
        ...pagedResponse,
        data: products,
      } as PaginatedResponse<Product>;
    }
    
    // Fallback: nếu response là array trực tiếp
    if (Array.isArray(response)) {
      const products = response.map(transformProductData);
      return {
        data: products,
        currentPage: page,
        pageSize: pageSize,
        totalPages: 1,
        totalRecords: products.length,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }
    
    return {
      data: [],
      currentPage: page,
      pageSize: pageSize,
      totalPages: 0,
      totalRecords: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  } catch (error) {
    console.error('Get products by category error:', error);
    throw error;
  }
};

// API lấy danh sách sản phẩm theo Vendor (có phân trang)
export const getProductsByVendor = async (
  vendorId: number,
  params: PaginationParams = { page: 1, pageSize: 20 }
): Promise<PaginatedResponse<Product>> => {
  try {
    const { page = 1, pageSize = 20 } = params;
    const response = await apiClient.get(`/api/Product/vendor/${vendorId}`, {
      params: { page, pageSize }
    });

    // apiClient interceptor đã unwrap response.data
    let pagedResponse: PaginatedResponse<any> | null = null;

    // Trường hợp response là APIResponse có data
    if (response && typeof response === 'object' && 'status' in response && 'data' in response) {
      const apiResponse = response as unknown as { status: boolean; data: any; errors?: string[] };
      if (apiResponse.data && typeof apiResponse.data === 'object' && 'data' in apiResponse.data) {
        pagedResponse = apiResponse.data as PaginatedResponse<any>;
      }
    }
    // Trường hợp response là PagedResponse trực tiếp
    else if (response && typeof response === 'object' && 'data' in response && 'currentPage' in response) {
      pagedResponse = response as PaginatedResponse<any>;
    }

    if (pagedResponse && Array.isArray(pagedResponse.data)) {
      const products = pagedResponse.data.map(transformProductData);
      return {
        ...pagedResponse,
        data: products
      };
    }

    // Fallback: response là array trực tiếp
    if (Array.isArray(response)) {
      const products = response.map(transformProductData);
      return {
        data: products,
        currentPage: page,
        pageSize: pageSize,
        totalPages: 1,
        totalRecords: products.length,
        hasNextPage: false,
        hasPreviousPage: false
      };
    }

    return {
      data: [],
      currentPage: page,
      pageSize: pageSize,
      totalPages: 0,
      totalRecords: 0,
      hasNextPage: false,
      hasPreviousPage: false
    };
  } catch (error) {
    console.error('Get products by vendor error:', error);
    throw error;
  }
};

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
    
    // Log raw data để kiểm tra stockQuantity
    if (productsArray.length > 0) {
      console.log('Raw product sample:', productsArray[0]);
      console.log('StockQuantity in raw data:', productsArray[0]?.stockQuantity, productsArray[0]?.stock);
    }
    
    const transformedProducts = productsArray.map(transformProductData);
    console.log('Transformed products sample:', transformedProducts.slice(0, 3).map(p => ({ id: p.id, name: p.productName, stockQuantity: p.stockQuantity })));
    return transformedProducts;
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

// API cập nhật sản phẩm
export interface UpdateProductRequest {
  commissionRate?: number;
  isActive?: boolean;
  unitPrice?: number;
  stockQuantity?: number;
  discountPercentage?: number;
}

export interface ProductUpdateDTO {
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
  warrantyMonths: number;
  stockQuantity: number;
  weightKg?: number;
  dimensionsCm?: {
    width?: number;
    height?: number;
    length?: number;
  };
  isActive: boolean;
  viewCount?: number;
  soldCount?: number;
  ratingAverage?: number;
}

export interface UpdateProductPayload {
  data: ProductUpdateDTO;
  addImages?: Array<{
    imageUrl?: string;
    imagePublicId?: string;
    purpose?: string;
    sortOrder?: number;
  }>;
  removeImagePublicIds?: string[];
}

export const updateProduct = async (
  id: number,
  data: UpdateProductRequest
): Promise<Product> => {
  try {
    // Load product hiện tại để lấy đầy đủ thông tin
    const currentProduct = await getProductById(id);
    
    // Merge với data cần update
    const updateData: ProductUpdateDTO = {
      categoryId: currentProduct.categoryId,
      vendorId: currentProduct.vendorId,
      productCode: currentProduct.productCode,
      productName: currentProduct.productName,
      description: currentProduct.description,
      unitPrice: data.unitPrice !== undefined ? data.unitPrice : currentProduct.unitPrice,
      commissionRate: data.commissionRate !== undefined ? data.commissionRate : currentProduct.commissionRate,
      discountPercentage: data.discountPercentage !== undefined ? data.discountPercentage : currentProduct.discountPercentage,
      energyEfficiencyRating: currentProduct.energyEfficiencyRating,
      specifications: currentProduct.specifications,
      manualUrls: currentProduct.manualUrls,
      publicUrl: currentProduct.publicUrl,
      warrantyMonths: currentProduct.warrantyMonths,
      stockQuantity: data.stockQuantity !== undefined ? data.stockQuantity : currentProduct.stockQuantity,
      weightKg: currentProduct.weightKg,
      dimensionsCm: currentProduct.dimensionsCm,
      isActive: data.isActive !== undefined ? data.isActive : currentProduct.isActive,
      viewCount: currentProduct.viewCount,
      soldCount: currentProduct.soldCount,
      ratingAverage: currentProduct.ratingAverage
    };
    
    // Format payload theo API spec: { data: {...}, addImages: [], removeImagePublicIds: [] }
    const payload: UpdateProductPayload = {
      data: updateData,
      addImages: [],
      removeImagePublicIds: []
    };
    
    const response = await apiClient.put(`/api/Product/${id}`, payload);
    
    let productData = null;
    
    if (response.data) {
      productData = response.data;
    } else if (response && typeof response === 'object' && 'id' in response) {
      productData = response;
    }
    
    if (!productData) {
      throw new Error('Failed to update product');
    }
    
    return transformProductData(productData);
  } catch (error) {
    console.error('Update product error:', error);
    throw error;
  }
};

// API cập nhật hoa hồng sản phẩm
export interface UpdateProductCommissionRequest {
  commissionRate: number; // 0.05 = 5%, 0.1 = 10%, etc.
}

export interface UpdateProductCommissionResponse {
  id: number;
  commissionRate: number;
}

export const updateProductCommission = async (
  id: number,
  data: UpdateProductCommissionRequest
): Promise<UpdateProductCommissionResponse> => {
  try {
    const response = await apiClient.patch(`/api/Product/${id}/emission`, {
      commissionRate: data.commissionRate
    });
    
    console.log('Update product commission response:', response);
    console.log('Response type:', typeof response);
    
    // apiClient đã unwrap response.data do interceptor, response là data trực tiếp
    // Response có thể là:
    // 1. Object với id và commissionRate
    // 2. String (success message)
    // 3. Empty object hoặc null
    // 4. Object với data field
    
    if (response && typeof response === 'object' && !Array.isArray(response)) {
      // Trường hợp 1: Response có id và commissionRate trực tiếp
      if ('id' in response && 'commissionRate' in response) {
        return response as UpdateProductCommissionResponse;
      }
      
      // Trường hợp 2: Response có data field
      if ('data' in response && response.data && typeof response.data === 'object') {
        if ('id' in response.data && 'commissionRate' in response.data) {
          return response.data as UpdateProductCommissionResponse;
        }
      }
      
      // Trường hợp 3: Response là empty object hoặc chỉ có message - coi như thành công
      // Trả về object với id và commissionRate từ request
      if (Object.keys(response).length === 0 || 'message' in response || 'status' in response) {
        return {
          id: id,
          commissionRate: data.commissionRate
        };
      }
    }
    
    // Trường hợp 4: Response là string hoặc null - coi như thành công
    if (typeof response === 'string' || response === null || response === undefined) {
      return {
        id: id,
        commissionRate: data.commissionRate
      };
    }
    
    // Nếu không match bất kỳ trường hợp nào, throw error
    console.error('Unexpected response format:', response);
    throw new Error('Invalid response format');
  } catch (error: any) {
    console.error('Update product commission error:', error);
    // Nếu error có message, throw với message đó
    if (error?.message) {
      throw error;
    }
    // Nếu error có errors array, throw với message đầu tiên
    if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
      throw new Error(error.errors[0]);
    }
    throw new Error('Không thể cập nhật hoa hồng. Vui lòng thử lại.');
  }
};

// Interface cho payload tạo yêu cầu cập nhật sản phẩm (ProductUpdateRequest)
export interface ProductUpdateRequestPayload {
  productId: number;
  productCode?: string | null;
  productName?: string | null;
  description?: string | null;
  unitPrice?: number | null;
  discountPercentage?: number | null;
  energyEfficiencyRating?: number | null;
  specifications?: Record<string, string> | null;
  manualFile?: File | null;
  warrantyMonths?: number | null;
  weightKg?: number | null;
  dimensionsCm?: {
    width?: number | null;
    height?: number | null;
    length?: number | null;
  } | null;
  imagesToAdd?: (File | string)[] | null;
  imagesToDelete?: number[] | null;
}

// Interface cho yêu cầu cập nhật sản phẩm (staff view)
export interface ProductUpdateRequest {
  id: number;
  productId: number;
  productSnapshot?: any;
  productCode?: string;
  productName?: string;
  vendorId?: number;
  status?: 'Pending' | 'Approved' | 'Rejected' | string;
  createdAt?: string;
  updatedAt?: string;
  processedAt?: string | null;
  processedByUser?: any;
  [key: string]: any;
}

export interface ProcessProductUpdateRequestPayload {
  status: 'Approved' | 'Rejected';
  rejectionReason?: string | null;
}

export interface ProductUpdateRequestQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  vendorId?: number;
}

export interface ProductUpdateRequestResponse {
  data: ProductUpdateRequest[];
  totalRecords: number;
  currentPage?: number;
  pageSize?: number;
}

// API lấy danh sách yêu cầu cập nhật sản phẩm (staff)
export const getProductUpdateRequests = async (
  params: ProductUpdateRequestQuery = { page: 1, pageSize: 20 }
): Promise<ProductUpdateRequestResponse> => {
  const { page = 1, pageSize = 20, status, vendorId } = params;
  try {
    const response = await apiClient.get('/api/ProductUpdateRequest', {
      params: { page, pageSize, status, vendorId }
    });

    // apiClient đã unwrap response.data; có thể là:
    // 1) APIResponse { status, data, errors }
    // 2) PagedResponse { data, totalRecords, currentPage, pageSize }
    // 3) Array trực tiếp
    let items: ProductUpdateRequest[] = [];
    let totalRecords = 0;
    let currentPage = page;
    let size = pageSize;

    if (Array.isArray(response)) {
      items = response as ProductUpdateRequest[];
      totalRecords = items.length;
    } else if (response && typeof response === 'object') {
      // Nếu là APIResponse bọc data
      if ('data' in response && response.data) {
        const dataField = (response as any).data;
        if (Array.isArray(dataField)) {
          items = dataField as ProductUpdateRequest[];
          totalRecords = (response as any).totalRecords || items.length;
        } else if (
          dataField &&
          typeof dataField === 'object' &&
          'data' in dataField &&
          Array.isArray(dataField.data)
        ) {
          items = dataField.data as ProductUpdateRequest[];
          totalRecords = dataField.totalRecords || items.length;
          currentPage = dataField.currentPage || currentPage;
          size = dataField.pageSize || size;
        }
      } else if ('data' in response && Array.isArray((response as any).data)) {
        items = (response as any).data as ProductUpdateRequest[];
        totalRecords = (response as any).totalRecords || items.length;
      }
    }

    return {
      data: items,
      totalRecords,
      currentPage,
      pageSize: size
    };
  } catch (error) {
    console.error('Get product update requests error:', error);
    throw error;
  }
};

// API duyệt / từ chối yêu cầu cập nhật sản phẩm
export const processProductUpdateRequest = async (
  requestId: number,
  payload: ProcessProductUpdateRequestPayload
): Promise<any> => {
  try {
    const response = await apiClient.patch(`/api/ProductUpdateRequest/${requestId}`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response;
  } catch (error) {
    console.error('Process product update request error:', error);
    throw error;
  }
};

// API tạo yêu cầu cập nhật sản phẩm (ProductUpdateRequest)
export const createProductUpdateRequest = async (payload: ProductUpdateRequestPayload): Promise<any> => {
  const formData = new FormData();

  // Helper: chỉ append khi có giá trị (BE không chấp nhận 'null' string)
  const appendIfDefined = (key: string, value: any) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    formData.append(key, value as any);
  };

  // ProductId bắt buộc
  formData.append('ProductId', String(payload.productId));

  appendIfDefined('ProductCode', payload.productCode ?? undefined);
  appendIfDefined('ProductName', payload.productName ?? undefined);
  appendIfDefined('Description', payload.description ?? undefined);
  appendIfDefined('UnitPrice', payload.unitPrice);
  appendIfDefined('DiscountPercentage', payload.discountPercentage);
  appendIfDefined('EnergyEfficiencyRating', payload.energyEfficiencyRating);

  // Specifications: gửi JSON string nếu có
  if (payload.specifications && Object.keys(payload.specifications).length > 0) {
    appendIfDefined('Specifications', JSON.stringify(payload.specifications));
  }

  appendIfDefined('WarrantyMonths', payload.warrantyMonths);
  appendIfDefined('WeightKg', payload.weightKg);

  // Dimensions: chuẩn hóa sang Dictionary<string, decimal> và bỏ các giá trị null
  if (payload.dimensionsCm) {
    const dim: Record<string, number> = {};
    const { width, height, length } = payload.dimensionsCm;

    if (width != null && !Number.isNaN(width)) {
      dim.Width = width;
    }
    if (height != null && !Number.isNaN(height)) {
      dim.Height = height;
    }
    if (length != null && !Number.isNaN(length)) {
      dim.Length = length;
    }

    if (Object.keys(dim).length > 0) {
      appendIfDefined('DimensionsCm', JSON.stringify(dim));
    }
  }

  // Manual file: chỉ gửi khi chọn file
  if (payload.manualFile instanceof File) {
    formData.append('ManualFile', payload.manualFile);
  }

  // ImagesToAdd: gửi từng item nếu có
  if (Array.isArray(payload.imagesToAdd) && payload.imagesToAdd.length > 0) {
    payload.imagesToAdd.forEach((img) => {
      if (img instanceof File) {
        formData.append('ImagesToAdd', img);
      } else {
        formData.append('ImagesToAdd', img);
      }
    });
  }

  // ImagesToDelete: gửi từng id nếu có
  if (Array.isArray(payload.imagesToDelete) && payload.imagesToDelete.length > 0) {
    payload.imagesToDelete.forEach((id) => formData.append('ImagesToDelete', String(id)));
  }

  try {
    const response = await apiClient.post('/api/ProductUpdateRequest', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response;
  } catch (error) {
    console.error('Create product update request error:', error);
    throw error;
  }
};

// Interface for product registration (matches backend API)
export interface RegisterProductRequest {
  vendorId: number;
  categoryId: number;
  proposedProductCode: string;
  proposedProductName: string;
  description?: string;
  unitPrice: number;
  energyEfficiencyRating?: number; // Must be 0-5
  specifications?: {
    [key: string]: string;
  };
  warrantyMonths?: number;
  weightKg?: number;
  dimensionsCm?: {
    width?: number;
    height?: number;
    length?: number;
  };
  certificationCode?: string[];
  certificationName?: string[];
  manualFile?: File | null;
  images?: File[];
  certificate?: File[];
}

// API đăng ký sản phẩm mới (multipart/form-data)
export const registerProduct = async (data: RegisterProductRequest): Promise<any> => {
  try {
    const formData = new FormData();
    
    // Add Data fields with "Data." prefix
    formData.append('Data.VendorId', data.vendorId.toString());
    formData.append('Data.CategoryId', data.categoryId.toString());
    formData.append('Data.ProposedProductCode', data.proposedProductCode);
    formData.append('Data.ProposedProductName', data.proposedProductName);
    
    if (data.description) {
      formData.append('Data.Description', data.description);
    }
    
    formData.append('Data.UnitPrice', data.unitPrice.toString());
    
    if (data.energyEfficiencyRating !== undefined && data.energyEfficiencyRating !== null) {
      formData.append('Data.EnergyEfficiencyRating', data.energyEfficiencyRating.toString());
    }

    // Add specifications as individual key-value pairs
    // Backend nhận specifications dưới dạng các field riêng lẻ (không có prefix Data.Specifications[...])
    // Ví dụ: -F 'Màu=Vàng' -F 'Năng suât=100 mã lực'
    if (data.specifications && Object.keys(data.specifications).length > 0) {
      console.log('Sending specifications:', data.specifications);
      
      Object.entries(data.specifications).forEach(([key, value]) => {
        // Đảm bảo key và value đều có giá trị hợp lệ
        const trimmedKey = key ? String(key).trim() : '';
        const trimmedValue = value ? String(value).trim() : '';
        
        // Chỉ gửi nếu cả key và value đều có giá trị hợp lệ
        if (trimmedKey && trimmedValue) {
          console.log(`Adding specification: ${trimmedKey} = ${trimmedValue}`);
          // SỬA: Gửi key trực tiếp, không có prefix Data.Specifications[...]
          formData.append(trimmedKey, trimmedValue);
        } else {
          console.warn(`Skipping invalid specification: key="${trimmedKey}", value="${trimmedValue}"`);
        }
      });
      
      // Debug: Log số lượng specifications được gửi
      const validSpecs = Object.entries(data.specifications).filter(([key, value]) => {
        const trimmedKey = key ? String(key).trim() : '';
        const trimmedValue = value ? String(value).trim() : '';
        return trimmedKey && trimmedValue;
      });
      console.log(`Total valid specifications to send: ${validSpecs.length}`);
    } else {
      console.log('No specifications to send or specifications is empty');
    }
    
    if (data.warrantyMonths !== undefined) {
      formData.append('Data.WarrantyMonths', data.warrantyMonths.toString());
    }
    
    if (data.weightKg !== undefined) {
      formData.append('Data.WeightKg', data.weightKg.toString());
    }
    
    // Add dimensions (required fields) - Thứ tự: Length, Width, Height
    if (data.dimensionsCm) {
      formData.append('Data.DimensionsCm.Length', (data.dimensionsCm.length || 0).toString());
      formData.append('Data.DimensionsCm.Width', (data.dimensionsCm.width || 0).toString());
      formData.append('Data.DimensionsCm.Height', (data.dimensionsCm.height || 0).toString());
    } else {
      // If dimensionsCm is not provided, send default values
      formData.append('Data.DimensionsCm.Length', '0');
      formData.append('Data.DimensionsCm.Width', '0');
      formData.append('Data.DimensionsCm.Height', '0');
    }
    
    // Add certification fields (required by BE) - arrays
    if (data.certificationCode && Array.isArray(data.certificationCode)) {
      data.certificationCode.forEach((code, index) => {
        formData.append(`Data.CertificationCode[${index}]`, code);
      });
    }
    
    if (data.certificationName && Array.isArray(data.certificationName)) {
      data.certificationName.forEach((name, index) => {
        formData.append(`Data.CertificationName[${index}]`, name);
      });
    }
    
    // Add files
    if (data.manualFile) {
      formData.append('ManualFile', data.manualFile);
    }
    
    if (data.images && data.images.length > 0) {
      data.images.forEach((image) => {
        formData.append('Images', image);
      });
    }
    
    if (data.certificate && data.certificate.length > 0) {
      data.certificate.forEach((cert) => {
        formData.append('Certificate', cert);
      });
    }
    
    // Debug: Log FormData contents
    console.log('FormData contents:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + (pair[1] instanceof File ? `[File: ${pair[1].name}]` : pair[1]));
    }
    
    const response = await apiClient.post('/api/ProductRegistrations', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('=== Register product response ===');
    console.log('Full response:', JSON.stringify(response, null, 2));
    console.log('Response type:', typeof response);
    console.log('Is array:', Array.isArray(response));
    if (response && typeof response === 'object') {
      console.log('Response keys:', Object.keys(response));
      if ('images' in response) {
        console.log('Images field:', response.images);
        console.log('Images type:', typeof response.images);
        console.log('Images is array:', Array.isArray(response.images));
      }
      if ('id' in response) {
        console.log('Product Registration ID:', response.id);
      }
    }
    console.log('================================');
    return response;
  } catch (error: any) {
    console.error('Register product error:', error);
    
    // Log detailed validation errors
    if (error?.errors) {
      console.error('Validation errors:', error.errors);
      Object.keys(error.errors).forEach(key => {
        console.error(`  ${key}:`, error.errors[key]);
      });
    }
    
    throw error;
  }
};

// API lấy tất cả sản phẩm đã đăng ký theo VendorID
export const getProductRegistrations = async (): Promise<ProductRegistration[]> => {
  try {
    const response = await apiClient.get('/api/ProductRegistrations');
    console.log('Get product registrations response:', response);
    console.log('Response type:', typeof response);
    console.log('Is array:', Array.isArray(response));
    
    // Xử lý pagination response (có data array)
    if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
      const data = response.data;
      // Log first item để xem structure
      if (data.length > 0) {
        console.log('=== First ProductRegistration item (from pagination) ===');
        console.log('Full item:', JSON.stringify(data[0], null, 2));
        console.log('All keys:', Object.keys(data[0]));
        console.log('Images field:', data[0].images);
        console.log('Images type:', typeof data[0].images);
        console.log('Images is array:', Array.isArray(data[0].images));
        if (data[0].images) {
          if (typeof data[0].images === 'string') {
            console.log('Images is string, value:', data[0].images);
          } else if (Array.isArray(data[0].images)) {
            console.log('Images is array, length:', data[0].images.length);
            console.log('First image item:', data[0].images[0]);
            console.log('First image item type:', typeof data[0].images[0]);
            if (data[0].images[0] && typeof data[0].images[0] === 'object') {
              console.log('First image item keys:', Object.keys(data[0].images[0]));
            }
          }
        }
        // Kiểm tra các field có thể chứa media links
        const possibleFields = ['mediaLinks', 'media_links', 'imageUrls', 'ImageUrls', 'MediaLinks'];
        for (const field of possibleFields) {
          if (field in data[0]) {
            console.log(`Found field "${field}":`, (data[0] as any)[field]);
          }
        }
        console.log('=====================================');
      }
      return data;
    }
    
    // Fallback: nếu response là array trực tiếp (không có pagination)
    if (response && Array.isArray(response)) {
      // Log first item để xem structure
      if (response.length > 0) {
        console.log('=== First ProductRegistration item (direct array) ===');
        console.log('Full item:', JSON.stringify(response[0], null, 2));
        console.log('All keys:', Object.keys(response[0]));
        console.log('Images field:', response[0].images);
        console.log('Images type:', typeof response[0].images);
        console.log('Images is array:', Array.isArray(response[0].images));
        if (response[0].images) {
          if (typeof response[0].images === 'string') {
            console.log('Images is string, value:', response[0].images);
          } else if (Array.isArray(response[0].images)) {
            console.log('Images is array, length:', response[0].images.length);
            console.log('First image item:', response[0].images[0]);
            console.log('First image item type:', typeof response[0].images[0]);
            if (response[0].images[0] && typeof response[0].images[0] === 'object') {
              console.log('First image item keys:', Object.keys(response[0].images[0]));
            }
          }
        }
        // Kiểm tra các field có thể chứa media links
        const possibleFields = ['mediaLinks', 'media_links', 'imageUrls', 'ImageUrls', 'MediaLinks'];
        for (const field of possibleFields) {
          if (field in response[0]) {
            console.log(`Found field "${field}":`, (response[0] as any)[field]);
          }
        }
        console.log('=====================================');
      }
      return response;
    }
    
    return [];
  } catch (error: any) {
    console.error('Get product registrations error:', error);
    
    // Cải thiện error message cho lỗi SQL backend
    if (error?.response?.data?.message) {
      const errorMsg = error.response.data.message;
      if (errorMsg.includes('registration_id') || errorMsg.includes('Unknown column')) {
        const enhancedError = new Error(
          'Lỗi cơ sở dữ liệu từ backend. Vui lòng liên hệ quản trị viên để sửa lỗi SQL.\n' +
          'Chi tiết: ' + errorMsg
        );
        (enhancedError as any).isBackendError = true;
        (enhancedError as any).originalError = error;
        throw enhancedError;
      }
    }
    
    throw error;
  }
};

// API lấy chi tiết product registration theo ID
export const getProductRegistrationById = async (id: number): Promise<ProductRegistration> => {
  try {
    const response = await apiClient.get(`/api/ProductRegistrations/${id}`);
    console.log(`Get product registration ${id} response:`, response);
    
    // apiClient đã unwrap response.data do interceptor, response là data trực tiếp
    if (response && typeof response === 'object' && 'id' in response) {
      const registration = response as unknown as ProductRegistration;
      console.log(`=== ProductRegistration ${id} detail ===`);
      console.log('Full response:', JSON.stringify(registration, null, 2));
      console.log('All keys:', Object.keys(registration));
      console.log('Images field:', registration.images);
      console.log('Images type:', typeof registration.images);
      console.log('Images is array:', Array.isArray(registration.images));
      if (registration.images) {
        if (typeof registration.images === 'string') {
          console.log('Images is string, value:', registration.images);
        } else if (Array.isArray(registration.images)) {
          console.log('Images is array, length:', registration.images.length);
          if (registration.images.length > 0) {
            console.log('First image item:', registration.images[0]);
            console.log('First image item type:', typeof registration.images[0]);
            if (registration.images[0] && typeof registration.images[0] === 'object') {
              console.log('First image item keys:', Object.keys(registration.images[0]));
            }
          }
        }
      }
      // Kiểm tra các field có thể chứa media links
      const possibleFields = ['mediaLinks', 'media_links', 'imageUrls', 'ImageUrls', 'MediaLinks'];
      for (const field of possibleFields) {
        if (field in registration) {
          console.log(`Found field "${field}":`, (registration as any)[field]);
        }
      }
      console.log('======================================');
      return registration;
    }
    
    // Fallback nếu response có cấu trúc khác
    if (response && typeof response === 'object' && 'data' in response) {
      const data = (response as { data: ProductRegistration }).data;
      console.log(`Registration ${id} images field (from data):`, data.images);
      return data;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error(`Get product registration ${id} error:`, error);
    throw error;
  }
};

// Interface cho MediaLink (theo database schema)
export interface MediaLink {
  id: number;
  ownerType: string; // Từ database: 'product_registrations', 'products', 'product_reviews', etc.
  ownerId: number;  // ID của ProductRegistration
  imageUrl: string; // URL đầy đủ của ảnh trên Cloudinary
  imagePublicId: string; // Public ID trên Cloudinary
  purpose?: string; // Có thể là 'none' hoặc các giá trị khác
  sortOrder?: number; // Thứ tự sắp xếp
  createdAt?: string; // Timestamp
}

// API lấy media links theo owner_type và owner_id
// Đơn giản hóa: chỉ thử endpoint format cơ bản nhất
export const getMediaLinks = async (
  ownerType: string,
  ownerId: number
): Promise<MediaLink[]> => {
  // Thử endpoint format cơ bản nhất (snake_case - đúng với database)
  // Từ database: owner_type = 'product_registrations', owner_id = ProductRegistration.id
  const endpoints = [
    `/api/MediaLinks?owner_type=${ownerType}&owner_id=${ownerId}`, // ✅ Ưu tiên: snake_case
    `/api/MediaLinks?ownerType=${ownerType}&ownerId=${ownerId}`,   // camelCase (fallback)
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await apiClient.get(endpoint);
      
      // apiClient đã unwrap response.data do interceptor
      if (response && Array.isArray(response) && response.length > 0) {
        // Map snake_case từ database sang camelCase cho interface
        const mapped = response.map((item: any) => ({
          id: item.id,
          ownerType: item.owner_type || item.ownerType,
          ownerId: item.owner_id || item.ownerId,
          imageUrl: item.image_url || item.imageUrl,
          imagePublicId: item.image_public_id || item.imagePublicId,
          purpose: item.purpose,
          sortOrder: item.sort_order || item.sortOrder,
          createdAt: item.created_at || item.createdAt
        })) as MediaLink[];
        
        console.log(`✅ Found ${mapped.length} media links for ${ownerType}:${ownerId} via ${endpoint}`);
        return mapped;
      }
      
      // Fallback nếu response có cấu trúc khác
      if (response && typeof response === 'object' && 'data' in response) {
        const data = (response as { data: any }).data;
        if (Array.isArray(data) && data.length > 0) {
          // Map snake_case từ database sang camelCase cho interface
          const mapped = data.map((item: any) => ({
            id: item.id,
            ownerType: item.owner_type || item.ownerType,
            ownerId: item.owner_id || item.ownerId,
            imageUrl: item.image_url || item.imageUrl,
            imagePublicId: item.image_public_id || item.imagePublicId,
            purpose: item.purpose,
            sortOrder: item.sort_order || item.sortOrder,
            createdAt: item.created_at || item.createdAt
          })) as MediaLink[];
          
          console.log(`✅ Found ${mapped.length} media links in data field for ${ownerType}:${ownerId} via ${endpoint}`);
          return mapped;
        }
      }
    } catch (error: any) {
      // Chỉ log lỗi cho endpoint đầu tiên để debug
      if (endpoint === endpoints[0]) {
        console.log(`❌ Endpoint ${endpoint} failed:`, error?.message || error);
      }
      // Thử endpoint tiếp theo
      continue;
    }
  }
  
  return [];
};

// Interface for updating product registration status
export interface UpdateProductRegistrationStatusRequest {
  id: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  approvedBy: number;
}

// API cập nhật trạng thái đăng ký sản phẩm (duyệt/từ chối)
export const updateProductRegistrationStatus = async (
  id: number,
  data: Omit<UpdateProductRegistrationStatusRequest, 'id'>
): Promise<ProductRegistration> => {
  try {
    const payload: UpdateProductRegistrationStatusRequest = {
      id,
      status: data.status,
      rejectionReason: data.rejectionReason,
      approvedBy: data.approvedBy,
    };
    
    const response = await apiClient.patch(`/api/ProductRegistrations/${id}/status`, payload);
    console.log('Update product registration status response:', response);
    console.log('Response type:', typeof response);
    
    // apiClient đã unwrap response.data do interceptor, response là data trực tiếp
    // Nếu response là ProductRegistration object (có id và các field cần thiết)
    if (response && typeof response === 'object' && !Array.isArray(response) && 'id' in response && 'status' in response) {
      return response as unknown as ProductRegistration;
    }
    
    // Nếu response có cấu trúc { data: ProductRegistration }
    if (response && typeof response === 'object' && !Array.isArray(response) && 'data' in response) {
      const data = (response as { data: any }).data;
      if (data && typeof data === 'object' && 'id' in data) {
        return data as ProductRegistration;
      }
    }
    
    // Nếu response là empty/null/undefined/string/empty object, API có thể chỉ trả về success
    // Fetch lại registration để lấy data mới nhất
    const isEmptyResponse = !response || 
                           (typeof response === 'string' && (response as string).trim() === '') ||
                           (typeof response === 'object' && !Array.isArray(response) && Object.keys(response).length === 0);
    
    if (isEmptyResponse || typeof response === 'string') {
      console.log('Response is empty or string, fetching updated registration...');
      const updatedRegistrations = await getProductRegistrations();
      const found = updatedRegistrations.find(reg => reg.id === id);
      if (found) {
        return found;
      }
      // Nếu không tìm thấy, throw error
      throw new Error('Không thể lấy thông tin đăng ký sau khi cập nhật');
    }
    
    // Nếu response có cấu trúc khác (có thể là success message object)
    // Vẫn fetch lại để đảm bảo có data
    console.log('Response format unexpected, fetching updated registration...');
    const updatedRegistrations = await getProductRegistrations();
    const found = updatedRegistrations.find(reg => reg.id === id);
    if (found) {
      return found;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Update product registration status error:', error);
    throw error;
  }
};

// =====================================================
// EXCEL IMPORT APIs
// =====================================================

export interface ProductRegistrationImportResponseDTO {
  totalRows: number;
  successfulCount: number;
  failedCount: number;
  results: ProductRegistrationImportRowResultDTO[];
}

export interface ProductRegistrationImportRowResultDTO {
  rowNumber: number;
  isSuccess: boolean;
  productRegistrationId?: number;
  proposedProductName?: string;
  errorMessage?: string;
}

// Import Product Registrations from Excel
export const importProductRegistrationsFromExcel = async (
  file: File
): Promise<ProductRegistrationImportResponseDTO> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/api/ProductRegistrations/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  // apiClient interceptor đã unwrap AxiosResponse nên response ở đây thường là dữ liệu thực tế
  // Tuy nhiên, để an toàn nếu backend bọc thêm APIResponse { data: ... } thì vẫn xử lý được.
  if (response && typeof response === 'object' && 'data' in (response as any)) {
    return (response as any).data as ProductRegistrationImportResponseDTO;
  }

  return response as ProductRegistrationImportResponseDTO;
};

// Download Excel Template for Product Registration
export const downloadProductRegistrationTemplate = async (): Promise<void> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/ProductRegistrations/import/template`, {
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ProductRegistration_Import_Template.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading template:', error);
    throw error;
  }
};

// Upload images for Product Registration after import
export const uploadProductRegistrationImages = async (
  registrationId: number,
  images: File[]
): Promise<ProductRegistration> => {
  const formData = new FormData();
  images.forEach((image) => {
    formData.append('images', image);
  });

  const response = await apiClient.post(
    `/api/ProductRegistrations/${registrationId}/images`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data as ProductRegistration;
};

// Upload certificates for Product Registration after import
export const uploadProductRegistrationCertificates = async (
  registrationId: number,
  certificates: Array<{ file: File; code?: string; name: string }>
): Promise<ProductRegistration> => {
  const formData = new FormData();
  
  const certificationCodes: string[] = [];
  const certificationNames: string[] = [];
  
  certificates.forEach((cert, index) => {
    formData.append('certificates', cert.file);
    if (cert.code) {
      certificationCodes.push(cert.code);
      formData.append(`certificationCodes[${index}]`, cert.code);
    }
    if (cert.name) {
      certificationNames.push(cert.name);
      formData.append(`certificationNames[${index}]`, cert.name);
    }
  });

  const response = await apiClient.post(
    `/api/ProductRegistrations/${registrationId}/certificates`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data as ProductRegistration;
};

// Upload manual for Product Registration after import
export const uploadProductRegistrationManual = async (
  registrationId: number,
  manualFile: File
): Promise<ProductRegistration> => {
  const formData = new FormData();
  formData.append('manualFile', manualFile);

  const response = await apiClient.post(
    `/api/ProductRegistrations/${registrationId}/manual`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data as ProductRegistration;
};