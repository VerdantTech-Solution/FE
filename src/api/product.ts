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
      
      // Nếu totalRecords <= pageSize (100), đã có đủ rồi
      if (totalRecords <= 100) {
        return categories;
      }
      
      // Nếu có nhiều hơn 100, fetch tất cả trong 1 lần với pageSize = totalRecords
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
    image: imageUrl,
    // Đảm bảo images được giữ nguyên từ API (có thể là MediaLinkItemDTO[] hoặc string)
    images: apiProduct.images || [],
    // Đảm bảo stockQuantity được giữ nguyên từ API (có thể là stockQuantity hoặc stock)
    stockQuantity: apiProduct.stockQuantity ?? apiProduct.stock ?? 0
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

export const updateProduct = async (
  id: number,
  data: UpdateProductRequest
): Promise<Product> => {
  try {
    const response = await apiClient.patch(`/api/Product/${id}`, data);
    
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
    if (data.specifications && Object.keys(data.specifications).length > 0) {
      Object.entries(data.specifications).forEach(([key, value]) => {
        formData.append(`Data.Specifications[${key}]`, value);
      });
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