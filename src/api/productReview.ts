import { apiClient } from './apiClient';

export interface ProductReviewImage {
  imageUrl: string;
  imagePublicId?: string;
}

export interface ProductReviewAuthor {
  id: number;
  fullName?: string;
  avatarUrl?: string | null;
}

export interface ProductReview {
  id: number;
  productId: number;
  orderId?: number;
  orderDetailId?: number;
  customerId?: number;
  rating: number;
  comment?: string | null;
  images?: ProductReviewImage[];
  createdAt: string;
  updatedAt: string;
  customer?: ProductReviewAuthor | null;
}

export interface ProductReviewResponse<T> {
  status?: boolean;
  statusCode?: number | string;
  data?: T | null;
  errors?: string[];
}

export interface ProductReviewPaginationData {
  data: ProductReview[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProductReviewPaginationResponse {
  status: boolean;
  statusCode: string | number;
  data: ProductReviewPaginationData;
  errors: string[];
}

const normalizeReviewList = (response: any): ProductReview[] => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  // Support pagination structure: response.data.data
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (response?.data?.items && Array.isArray(response.data.items)) return response.data.items;
  return [];
};

const normalizeReview = (response: any): ProductReview | null => {
  if (!response) return null;
  if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
    return response.data as ProductReview;
  }
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    const { status, statusCode, errors, ...rest } = response;
    if ('id' in rest && 'rating' in rest) {
      return rest as ProductReview;
    }
  }
  return null;
};

export interface CreateProductReviewRequest {
  productId: number;
  orderId: number;
  rating: number;
  comment?: string;
  images?: File[];
  orderDetailId?: number;
}

export const createProductReview = async (
  payload: CreateProductReviewRequest
): Promise<ProductReviewResponse<ProductReview>> => {
  const formData = new FormData();
  formData.append('Data.ProductId', payload.productId.toString());
  formData.append('Data.OrderId', payload.orderId.toString());
  formData.append('Data.Rating', payload.rating.toString());

  if (payload.comment?.trim()) {
    formData.append('Data.Comment', payload.comment.trim());
  }

  if (payload.orderDetailId) {
    formData.append('Data.OrderDetailId', payload.orderDetailId.toString());
  }

  if (payload.images && payload.images.length > 0) {
    payload.images.forEach((image) => {
      formData.append('Images', image);
    });
  }

  const response = await apiClient.post('/api/ProductReview', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  const raw = response as any;
  return {
    status: typeof raw?.status === 'boolean' ? raw.status : undefined,
    statusCode: raw?.statusCode,
    errors: raw?.errors,
    data: normalizeReview(raw),
  };
};

export const getProductReviewsByOrderId = async (
  orderId: number
): Promise<ProductReviewResponse<ProductReview[]>> => {
  const response = await apiClient.get(`/api/ProductReview/order/${orderId}`);
  const raw = response as any;
  return {
    status: typeof raw?.status === 'boolean' ? raw.status : undefined,
    statusCode: raw?.statusCode,
    errors: raw?.errors,
    data: normalizeReviewList(raw),
  };
};

export const getProductReviewsByProductId = async (
  productId: number,
  page: number = 1,
  pageSize: number = 20
): Promise<ProductReviewPaginationResponse> => {
  const response = await apiClient.get(`/api/ProductReview/product/${productId}`, {
    params: { page, pageSize }
  });
  const raw = response as any;
  
  // Parse pagination response
  let reviewsData: ProductReview[] = [];
  let paginationData = {
    currentPage: 1,
    pageSize: pageSize,
    totalPages: 1,
    totalRecords: 0,
    hasNextPage: false,
    hasPreviousPage: false
  };

  if (raw?.data) {
    // Check if response has pagination structure: data.data is array
    if (raw.data.data && Array.isArray(raw.data.data)) {
      reviewsData = normalizeReviewList(raw.data.data);
      paginationData = {
        currentPage: raw.data.currentPage ?? 1,
        pageSize: raw.data.pageSize ?? pageSize,
        totalPages: raw.data.totalPages ?? 1,
        totalRecords: raw.data.totalRecords ?? reviewsData.length,
        hasNextPage: raw.data.hasNextPage ?? false,
        hasPreviousPage: raw.data.hasPreviousPage ?? false
      };
    } else if (Array.isArray(raw.data)) {
      // Fallback: if data is array directly (old format)
      reviewsData = normalizeReviewList(raw.data);
      paginationData.totalRecords = reviewsData.length;
    } else if (raw.data && typeof raw.data === 'object') {
      // Try to extract from nested structure
      reviewsData = normalizeReviewList(raw.data);
      paginationData.totalRecords = reviewsData.length;
    }
  } else if (Array.isArray(raw)) {
    // Direct array response
    reviewsData = normalizeReviewList(raw);
    paginationData.totalRecords = reviewsData.length;
  }

  return {
    status: typeof raw?.status === 'boolean' ? raw.status : true,
    statusCode: raw?.statusCode ?? 'OK',
    errors: raw?.errors ?? [],
    data: {
      data: reviewsData,
      ...paginationData
    }
  };
};

// Reply to review
export interface ReplyProductReviewRequest {
  reply: string;
}

export interface ProductReviewWithReply extends ProductReview {
  reply?: string | null;
  repliedAt?: string | null;
  repliedBy?: number | null;
}

export const replyProductReview = async (
  reviewId: number,
  payload: ReplyProductReviewRequest
): Promise<ProductReviewResponse<ProductReviewWithReply>> => {
  const response = await apiClient.post(`/api/ProductReview/${reviewId}/reply`, payload);
  const raw = response as any;
  return {
    status: typeof raw?.status === 'boolean' ? raw.status : undefined,
    statusCode: raw?.statusCode,
    errors: raw?.errors,
    data: normalizeReview(raw) as ProductReviewWithReply | null,
  };
};


