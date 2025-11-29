import { apiClient } from './apiClient';

export interface ForumPostContent {
  order: number;
  type: 'text' | 'image';
  content: string;
}

export interface ForumComment {
  id: number;
  forumPostId: number;
  userId: number;
  // Backend trả về fullName cho người bình luận
  fullName?: string;
  // Dự phòng nếu sau này backend trả userName
  userName?: string;
  parentCommentId?: number | null;
  parentId?: number | null; // Alias for parentCommentId
  content: string;
  createdAt: string;
  updatedAt?: string;
  replies?: ForumComment[]; // Nested comments (replies)
}

export interface ForumPost {
  id: number;
  forumCategoryId: number;
  userId: number;
  title: string;
  slug: string;
  tags?: string;
  isPinned: boolean;
  status: string;
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  createdAt: string;
  updatedAt: string;
  content: ForumPostContent[];
  images: any[];
  comments: any[];
}

export interface ForumCategory {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ForumPostPaginationData {
  data: ForumPost[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GetForumPostsResponse {
  status: boolean;
  statusCode: string | number;
  data: ForumPostPaginationData | null;
  errors: string[];
}

export interface ForumCategoryPaginationData {
  data: ForumCategory[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GetForumCategoriesResponse {
  status: boolean;
  statusCode: string | number;
  data: ForumCategoryPaginationData | null;
  errors: string[];
}

export interface GetForumCategoriesParams {
  page?: number;
  pageSize?: number;
}

export interface CreateForumCategoryRequest {
  name: string;
  description?: string;
}

export interface CreateForumCategoryResponse {
  status: boolean;
  statusCode: string | number;
  data: ForumCategory | null;
  errors: string[];
}

export interface DeleteForumCategoryResponse {
  status: boolean;
  statusCode: string | number;
  errors: string[];
}

export interface CreateForumPostContentBlock {
  order: number;
  type: 'text' | 'image';
  content: string;
}

export interface CreateForumPostRequest {
  forumCategoryId: number;
  title: string;
  tags?: string;
  content: CreateForumPostContentBlock[];
  images?: File[];
  userId?: number;
}

export interface CreateForumPostResponse {
  status: boolean;
  statusCode: string | number;
  data: ForumPost | null;
  errors: string[];
}

export interface UpdateForumPostRequest {
  id: number;
  forumCategoryId?: number | null;
  title: string;
  tags?: string;
  content: CreateForumPostContentBlock[];
  addImages?: File[];
  removeImagePublicIds?: string[];
}

export interface UpdateForumPostResponse {
  status: boolean;
  statusCode: string | number;
  data: ForumPost | null;
  errors: string[];
}

export interface DeleteForumPostResponse {
  status: boolean;
  statusCode: string | number;
  errors: string[];
}

export interface GetForumPostsParams {
  page?: number;
  pageSize?: number;
  forumCategoryId?: number;
}

export const getForumPosts = async (
  params: GetForumPostsParams = {}
): Promise<GetForumPostsResponse> => {
  try {
    console.log('Fetching forum posts with params:', params);
    const response = await apiClient.get<any>('/api/ForumPost', {
      params: {
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        forumCategoryId:
          params.forumCategoryId !== undefined ? params.forumCategoryId : undefined,
      },
    });

    console.log('Forum posts API response:', response);
    console.log('Response type:', Array.isArray(response) ? 'array' : typeof response);
    
    // API trả về mảng trực tiếp ForumPost[]
    if (Array.isArray(response)) {
      let posts = response as ForumPost[];
      if (params.forumCategoryId !== undefined && params.forumCategoryId !== null) {
        posts = posts.filter((post) => post.forumCategoryId === params.forumCategoryId);
      }
      const totalRecords = posts.length;
      const currentPage = params.page || 1;
      const pageSize = params.pageSize || 10;
      const totalPages = Math.ceil(totalRecords / pageSize);
      
      return {
        status: true,
        statusCode: 200,
        data: {
          data: posts,
          currentPage,
          pageSize,
          totalPages,
          totalRecords,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        },
        errors: [],
      };
    }
    
    // Nếu response có cấu trúc GetForumPostsResponse thì trả về luôn
    if (response && typeof response === 'object' && ('status' in response || 'data' in response)) {
      return response as unknown as GetForumPostsResponse;
    }

    // Fallback: wrap response vào cấu trúc chuẩn
    const responseArray = Array.isArray(response) ? response : [];
    return {
      status: true,
      statusCode: 200,
      data: {
        data: responseArray as ForumPost[],
        currentPage: params.page || 1,
        pageSize: params.pageSize || 10,
        totalPages: 1,
        totalRecords: responseArray.length,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      errors: [],
    };
  } catch (error: any) {
    console.error('Error fetching forum posts:', error);
    console.error('Error details:', {
      error,
      type: typeof error,
      keys: error ? Object.keys(error) : [],
    });
    
    // Interceptor đã reject với error.response?.data, nên error đã là data object
    if (error && typeof error === 'object') {
      return {
        status: false,
        statusCode: error.statusCode || error.status || 'Error',
        data: null,
        errors: Array.isArray(error.errors)
          ? error.errors
          : [error.message || error.error || 'Không thể tải danh sách bài viết diễn đàn'],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      data: null,
      errors: ['Không thể tải danh sách bài viết diễn đàn'],
    };
  }
};

export const getForumCategories = async (
  params: GetForumCategoriesParams = {}
): Promise<GetForumCategoriesResponse> => {
  try {
    console.log('Fetching forum categories with params:', params);
    const response = await apiClient.get<any>('/api/ForumCategory', {
      params: {
        page: params.page || 1,
        pageSize: params.pageSize || 10,
      },
    });

    console.log('Forum categories API response:', response);
    console.log('Response type:', Array.isArray(response) ? 'array' : typeof response);

    if (Array.isArray(response)) {
      const categories = response as ForumCategory[];
      const totalRecords = categories.length;
      const currentPage = params.page || 1;
      const pageSize = params.pageSize || 10;
      const totalPages = Math.ceil(totalRecords / pageSize) || 1;

      return {
        status: true,
        statusCode: 200,
        data: {
          data: categories,
          currentPage,
          pageSize,
          totalPages,
          totalRecords,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        },
        errors: [],
      };
    }

    if (response && typeof response === 'object' && ('status' in response || 'data' in response)) {
      return response as unknown as GetForumCategoriesResponse;
    }

    const responseArray = Array.isArray(response) ? (response as ForumCategory[]) : [];
    return {
      status: true,
      statusCode: 200,
      data: {
        data: responseArray,
        currentPage: params.page || 1,
        pageSize: params.pageSize || 10,
        totalPages: 1,
        totalRecords: responseArray.length,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      errors: [],
    };
  } catch (error: any) {
    console.error('Error fetching forum categories:', error);
    console.error('Error details:', {
      error,
      type: typeof error,
      keys: error ? Object.keys(error) : [],
    });

    if (error && typeof error === 'object') {
      return {
        status: false,
        statusCode: error.statusCode || error.status || 'Error',
        data: null,
        errors: Array.isArray(error.errors)
          ? error.errors
          : [error.message || error.error || 'Không thể tải danh mục diễn đàn'],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      data: null,
      errors: ['Không thể tải danh mục diễn đàn'],
    };
  }
};

export const createForumCategory = async (
  payload: CreateForumCategoryRequest
): Promise<CreateForumCategoryResponse> => {
  try {
    console.log('Creating forum category:', payload);
    const response = await apiClient.post<any>('/api/ForumCategory', {
      name: payload.name,
      description: payload.description,
    });

    console.log('Create category API response:', response);

    if (response && typeof response === 'object') {
      if ('status' in response && 'data' in response) {
        return response as unknown as CreateForumCategoryResponse;
      }

      return {
        status: true,
        statusCode: 200,
        data: response as ForumCategory,
        errors: [],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      data: null,
      errors: ['Không thể tạo danh mục diễn đàn'],
    };
  } catch (error: any) {
    console.error('Error creating forum category:', error);
    if (error && typeof error === 'object') {
      return {
        status: false,
        statusCode: error.statusCode || error.status || 'Error',
        data: null,
        errors: Array.isArray(error.errors)
          ? error.errors
          : [error.message || error.error || 'Không thể tạo danh mục diễn đàn'],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      data: null,
      errors: ['Không thể tạo danh mục diễn đàn'],
    };
  }
};

export const deleteForumCategory = async (
  id: number
): Promise<DeleteForumCategoryResponse> => {
  try {
    console.log('Deleting forum category:', id);
    await apiClient.delete(`/api/ForumCategory/${id}`);

    return {
      status: true,
      statusCode: 200,
      errors: [],
    };
  } catch (error: any) {
    console.error('Error deleting forum category:', error);
    if (error && typeof error === 'object') {
      return {
        status: false,
        statusCode: error.statusCode || error.status || 'Error',
        errors: Array.isArray(error.errors)
          ? error.errors
          : [error.message || error.error || 'Không thể xóa danh mục diễn đàn'],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      errors: ['Không thể xóa danh mục diễn đàn'],
    };
  }
};

export const createForumPost = async (
  payload: CreateForumPostRequest
): Promise<CreateForumPostResponse> => {
  try {
    console.log('Creating forum post payload:', payload);
    const formData = new FormData();
    formData.append('ForumCategoryId', String(payload.forumCategoryId));
    formData.append('Title', payload.title);

    if (payload.tags) {
      formData.append('Tags', payload.tags);
    }

    // Gửi từng content block như một string item riêng biệt trong array
    if (payload.content && payload.content.length > 0) {
      payload.content.forEach((block) => {
        formData.append('Content', JSON.stringify(block));
      });
    } else {
      // Nếu không có content, gửi array rỗng
      formData.append('Content', JSON.stringify([]));
    }

    payload.images?.forEach((file) => {
      formData.append('AddImages', file);
    });

    const requestConfig: {
      headers: Record<string, string>;
      params?: Record<string, number>;
    } = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    if (payload.userId) {
      requestConfig.params = { userId: payload.userId };
    }

    const response = await apiClient.post<any>(
      '/api/ForumPost',
      formData,
      requestConfig
    );

    console.log('Create forum post response:', response);

    if (response && typeof response === 'object') {
      if ('status' in response && 'data' in response) {
        return response as unknown as CreateForumPostResponse;
      }

      return {
        status: true,
        statusCode: 200,
        data: response as ForumPost,
        errors: [],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      data: null,
      errors: ['Không thể tạo bài viết diễn đàn'],
    };
  } catch (error: any) {
    console.error('Error creating forum post:', error);

    if (error && typeof error === 'object') {
      return {
        status: false,
        statusCode: error.statusCode || error.status || 'Error',
        data: null,
        errors: Array.isArray(error.errors)
          ? error.errors
          : [error.message || error.error || 'Không thể tạo bài viết diễn đàn'],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      data: null,
      errors: ['Không thể tạo bài viết diễn đàn'],
    };
  }
};

export const updateForumPost = async (
  payload: UpdateForumPostRequest
): Promise<UpdateForumPostResponse> => {
  try {
    console.log('Updating forum post payload:', payload);
    const formData = new FormData();
    formData.append('Id', String(payload.id));
    formData.append('Title', payload.title);

    if (payload.forumCategoryId !== undefined && payload.forumCategoryId !== null) {
      formData.append('ForumCategoryId', String(payload.forumCategoryId));
    }

    if (payload.tags) {
      formData.append('Tags', payload.tags);
    }

    // Gửi từng content block như một string item riêng biệt trong array
    if (payload.content && payload.content.length > 0) {
      payload.content.forEach((block) => {
        formData.append('Content', JSON.stringify(block));
      });
    } else {
      // Nếu không có content, gửi array rỗng
      formData.append('Content', JSON.stringify([]));
    }

    payload.addImages?.forEach((file) => {
      formData.append('AddImages', file);
    });

    payload.removeImagePublicIds
      ?.filter((publicId) => !!publicId)
      .forEach((publicId) => {
        formData.append('RemoveImagePublicIds', publicId);
      });

    const response = await apiClient.put<any>(
      `/api/ForumPost/${payload.id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('Update forum post response:', response);

    if (response && typeof response === 'object') {
      if ('status' in response && 'data' in response) {
        return response as unknown as UpdateForumPostResponse;
      }

      return {
        status: true,
        statusCode: 200,
        data: response as ForumPost,
        errors: [],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      data: null,
      errors: ['Không thể cập nhật bài viết diễn đàn'],
    };
  } catch (error: any) {
    console.error('Error updating forum post:', error);

    if (error && typeof error === 'object') {
      return {
        status: false,
        statusCode: error.statusCode || error.status || 'Error',
        data: null,
        errors: Array.isArray(error.errors)
          ? error.errors
          : [error.message || error.error || 'Không thể cập nhật bài viết diễn đàn'],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      data: null,
      errors: ['Không thể cập nhật bài viết diễn đàn'],
    };
  }
};

export const deleteForumPost = async (
  id: number
): Promise<DeleteForumPostResponse> => {
  try {
    console.log('Deleting forum post:', id);
    const response = await apiClient.delete<any>(`/api/ForumPost/${id}`);

    if (response && typeof response === 'object' && 'status' in response) {
      return response as unknown as DeleteForumPostResponse;
    }

    return {
      status: true,
      statusCode: 200,
      errors: [],
    };
  } catch (error: any) {
    console.error('Error deleting forum post:', error);

    if (error && typeof error === 'object') {
      return {
        status: false,
        statusCode: error.statusCode || error.status || 'Error',
        errors: Array.isArray(error.errors)
          ? error.errors
          : [error.message || error.error || 'Không thể xóa bài viết diễn đàn'],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      errors: ['Không thể xóa bài viết diễn đàn'],
    };
  }
};

export interface ForumPostWithComments extends ForumPost {
  comments: ForumComment[];
}

export interface GetForumPostByIdResponse {
  status: boolean;
  statusCode: string | number;
  data: ForumPost | null;
  errors: string[];
}

export interface GetForumPostWithCommentsResponse {
  status: boolean;
  statusCode: string | number;
  data: ForumPostWithComments | null;
  errors: string[];
}

export const getForumPostById = async (
  id: number
): Promise<GetForumPostByIdResponse> => {
  try {
    console.log('Fetching forum post by id:', id);
    const response = await apiClient.get<any>(
      `/api/ForumPost/${id}`
    );

    console.log('Forum post detail API response:', response);
    
    // API có thể trả về ForumPost trực tiếp hoặc có wrapper
    if (response && typeof response === 'object') {
      // Nếu response đã có cấu trúc GetForumPostByIdResponse thì trả về luôn
      if ('status' in response && 'data' in response) {
        return response as unknown as GetForumPostByIdResponse;
      }
      
      // Nếu response là ForumPost trực tiếp, wrap vào cấu trúc chuẩn
      return {
        status: true,
        statusCode: 200,
        data: response as ForumPost,
        errors: [],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      data: null,
      errors: ['Không thể tải chi tiết bài viết'],
    };
  } catch (error: any) {
    console.error('Error fetching forum post detail:', error);
    console.error('Error details:', {
      error,
      type: typeof error,
      keys: error ? Object.keys(error) : [],
    });
    
    // Interceptor đã reject với error.response?.data, nên error đã là data object
    if (error && typeof error === 'object') {
      return {
        status: false,
        statusCode: error.statusCode || error.status || 'Error',
        data: null,
        errors: Array.isArray(error.errors)
          ? error.errors
          : [error.message || error.error || 'Không thể tải chi tiết bài viết diễn đàn'],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      data: null,
      errors: ['Không thể tải chi tiết bài viết diễn đàn'],
    };
  }
};

export const getForumPostWithComments = async (
  id: number
): Promise<GetForumPostWithCommentsResponse> => {
  try {
    console.log('Fetching forum post with comments by id:', id);
    const response = await apiClient.get<any>(
      `/api/ForumPost/${id}/with-comments`
    );

    console.log('Forum post with comments API response:', response);
    
    // API có thể trả về ForumPostWithComments trực tiếp hoặc có wrapper
    if (response && typeof response === 'object') {
      // Nếu response đã có cấu trúc GetForumPostWithCommentsResponse thì trả về luôn
      if ('status' in response && 'data' in response) {
        return response as unknown as GetForumPostWithCommentsResponse;
      }
      
      // Nếu response là ForumPostWithComments trực tiếp, wrap vào cấu trúc chuẩn
      // Map comments thành nested structure nếu cần
      const postData = response as ForumPostWithComments;
      
      // Nếu comments là flat array, có thể cần map thành nested structure
      // Nhưng API đã trả về nested, nên chỉ cần cast
      return {
        status: true,
        statusCode: 200,
        data: postData,
        errors: [],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      data: null,
      errors: ['Không thể tải bài viết kèm bình luận'],
    };
  } catch (error: any) {
    console.error('Error fetching forum post with comments:', error);
    console.error('Error details:', {
      error,
      type: typeof error,
      keys: error ? Object.keys(error) : [],
    });
    
    // Interceptor đã reject với error.response?.data, nên error đã là data object
    if (error && typeof error === 'object') {
      return {
        status: false,
        statusCode: error.statusCode || error.status || 'Error',
        data: null,
        errors: Array.isArray(error.errors)
          ? error.errors
          : [error.message || error.error || 'Không thể tải bài viết kèm bình luận'],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      data: null,
      errors: ['Không thể tải bài viết kèm bình luận'],
    };
  }
};

export interface ForumPostActionResponse {
  status: boolean;
  statusCode: string | number;
  message?: string;
  errors: string[];
}

export const incrementForumPostView = async (
  id: number
): Promise<ForumPostActionResponse> => {
  try {
    console.log('Incrementing view for post:', id);
    await apiClient.post(`/api/ForumPost/${id}/view`);
    
    return {
      status: true,
      statusCode: 200,
      message: 'View count increased',
      errors: [],
    };
  } catch (error: any) {
    console.error('Error incrementing view:', error);
    
    if (error && typeof error === 'object') {
      return {
        status: false,
        statusCode: error.statusCode || error.status || 'Error',
        errors: Array.isArray(error.errors)
          ? error.errors
          : [error.message || error.error || 'Không thể tăng lượt xem'],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      errors: ['Không thể tăng lượt xem'],
    };
  }
};

export const incrementForumPostLike = async (
  id: number
): Promise<ForumPostActionResponse> => {
  try {
    console.log('Incrementing like for post:', id);
    await apiClient.post(`/api/ForumPost/${id}/like`);
    
    return {
      status: true,
      statusCode: 200,
      message: 'Like count increased',
      errors: [],
    };
  } catch (error: any) {
    console.error('Error incrementing like:', error);
    
    if (error && typeof error === 'object') {
      return {
        status: false,
        statusCode: error.statusCode || error.status || 'Error',
        errors: Array.isArray(error.errors)
          ? error.errors
          : [error.message || error.error || 'Không thể tăng lượt thích'],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      errors: ['Không thể tăng lượt thích'],
    };
  }
};

export const incrementForumPostDislike = async (
  id: number
): Promise<ForumPostActionResponse> => {
  try {
    console.log('Incrementing dislike for post:', id);
    await apiClient.post(`/api/ForumPost/${id}/dislike`);
    
    return {
      status: true,
      statusCode: 200,
      message: 'Dislike count increased',
      errors: [],
    };
  } catch (error: any) {
    console.error('Error incrementing dislike:', error);
    
    if (error && typeof error === 'object') {
      return {
        status: false,
        statusCode: error.statusCode || error.status || 'Error',
        errors: Array.isArray(error.errors)
          ? error.errors
          : [error.message || error.error || 'Không thể tăng lượt không thích'],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      errors: ['Không thể tăng lượt không thích'],
    };
  }
};

// ==================== Forum Comment APIs ====================

export interface CreateForumCommentRequest {
  forumPostId: number;
  userId: number;
  parentId?: number | null; // null hoặc undefined = top-level comment, có giá trị = reply
  content: string;
}

export interface CreateForumCommentResponse {
  status: boolean;
  statusCode: string | number;
  data: ForumComment | null;
  errors: string[];
}

export interface UpdateForumCommentRequest {
  id: number;
  userId: number;
  content: string;
}

export interface UpdateForumCommentResponse {
  status: boolean;
  statusCode: string | number;
  data: ForumComment | null;
  errors: string[];
}

export const createForumComment = async (
  request: CreateForumCommentRequest
): Promise<CreateForumCommentResponse> => {
  try {
    console.log('Creating forum comment:', request);
    
    // Build request body - chỉ gửi parentId nếu có giá trị
    const requestBody: any = {
      forumPostId: request.forumPostId,
      userId: request.userId,
      content: request.content,
    };
    
    // Chỉ thêm parentId nếu có giá trị (không phải null hoặc undefined)
    if (request.parentId !== null && request.parentId !== undefined) {
      requestBody.parentId = request.parentId;
    }
    
    const response = await apiClient.post<any>(
      '/api/ForumComment',
      requestBody
    );

    console.log('Create comment API response:', response);
    
    // API có thể trả về ForumComment trực tiếp hoặc có wrapper
    if (response && typeof response === 'object') {
      // Nếu response đã có cấu trúc CreateForumCommentResponse thì trả về luôn
      if ('status' in response && 'data' in response) {
        return response as unknown as CreateForumCommentResponse;
      }
      
      // Nếu response là ForumComment trực tiếp, wrap vào cấu trúc chuẩn
      return {
        status: true,
        statusCode: 200,
        data: response as ForumComment,
        errors: [],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      data: null,
      errors: ['Không thể tạo bình luận'],
    };
  } catch (error: any) {
    console.error('Error creating forum comment:', error);
    console.error('Error details:', {
      error,
      type: typeof error,
      keys: error ? Object.keys(error) : [],
    });
    
    // Interceptor đã reject với error.response?.data, nên error đã là data object
    if (error && typeof error === 'object') {
      return {
        status: false,
        statusCode: error.statusCode || error.status || 'Error',
        data: null,
        errors: Array.isArray(error.errors)
          ? error.errors
          : [error.message || error.error || 'Không thể tạo bình luận'],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      data: null,
      errors: ['Không thể tạo bình luận'],
    };
  }
};

export const updateForumComment = async (
  id: number,
  request: UpdateForumCommentRequest
): Promise<UpdateForumCommentResponse> => {
  try {
    console.log('Updating forum comment:', id, request);
    const response = await apiClient.put<any>(
      `/api/ForumComment/${id}`,
      {
        id,
        userId: request.userId,
        content: request.content,
      }
    );

    console.log('Update comment API response:', response);

    if (response && typeof response === 'object') {
      if ('status' in response && 'data' in response) {
        return response as unknown as UpdateForumCommentResponse;
      }

      return {
        status: true,
        statusCode: 200,
        data: response as ForumComment,
        errors: [],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      data: null,
      errors: ['Không thể cập nhật bình luận'],
    };
  } catch (error: any) {
    console.error('Error updating forum comment:', error);

    if (error && typeof error === 'object') {
      return {
        status: false,
        statusCode: error.statusCode || error.status || 'Error',
        data: null,
        errors: Array.isArray(error.errors)
          ? error.errors
          : [error.message || error.error || 'Không thể cập nhật bình luận'],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      data: null,
      errors: ['Không thể cập nhật bình luận'],
    };
  }
};

export interface DeleteForumCommentResponse {
  status: boolean;
  statusCode: string | number;
  errors: string[];
}

export const deleteForumComment = async (
  id: number
): Promise<DeleteForumCommentResponse> => {
  try {
    console.log('Deleting forum comment:', id);
    await apiClient.delete(`/api/ForumComment/${id}`);

    return {
      status: true,
      statusCode: 200,
      errors: [],
    };
  } catch (error: any) {
    console.error('Error deleting forum comment:', error);

    if (error && typeof error === 'object') {
      return {
        status: false,
        statusCode: error.statusCode || error.status || 'Error',
        errors: Array.isArray(error.errors)
          ? error.errors
          : [error.message || error.error || 'Không thể xóa bình luận'],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      errors: ['Không thể xóa bình luận'],
    };
  }
};

export interface ForumCommentPaginationData {
  data: ForumComment[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GetForumCommentsResponse {
  status: boolean;
  statusCode: string | number;
  data: ForumCommentPaginationData | null;
  errors: string[];
}

export interface GetForumCommentsParams {
  page?: number;
  pageSize?: number;
}

export const getForumCommentsByPostId = async (
  postId: number,
  params: GetForumCommentsParams = {}
): Promise<GetForumCommentsResponse> => {
  try {
    console.log('Fetching forum comments for post:', postId, 'with params:', params);
    const response = await apiClient.get<any>(
      `/api/ForumComment/post/${postId}`,
      {
        params: {
          page: params.page || 1,
          pageSize: params.pageSize || 10,
        },
      }
    );

    console.log('Forum comments API response:', response);
    console.log('Response type:', Array.isArray(response) ? 'array' : typeof response);
    
    // API có thể trả về mảng trực tiếp hoặc có pagination wrapper
    if (Array.isArray(response)) {
      const comments = response as ForumComment[];
      const totalRecords = comments.length;
      const currentPage = params.page || 1;
      const pageSize = params.pageSize || 10;
      const totalPages = Math.ceil(totalRecords / pageSize);
      
      return {
        status: true,
        statusCode: 200,
        data: {
          data: comments,
          currentPage,
          pageSize,
          totalPages,
          totalRecords,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1,
        },
        errors: [],
      };
    }
    
    // Nếu response có cấu trúc GetForumCommentsResponse thì trả về luôn
    if (response && typeof response === 'object' && ('status' in response || 'data' in response)) {
      return response as unknown as GetForumCommentsResponse;
    }

    // Fallback: wrap response vào cấu trúc chuẩn
    const responseArray = Array.isArray(response) ? response : [];
    return {
      status: true,
      statusCode: 200,
      data: {
        data: responseArray as ForumComment[],
        currentPage: params.page || 1,
        pageSize: params.pageSize || 10,
        totalPages: 1,
        totalRecords: responseArray.length,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      errors: [],
    };
  } catch (error: any) {
    console.error('Error fetching forum comments:', error);
    console.error('Error details:', {
      error,
      type: typeof error,
      keys: error ? Object.keys(error) : [],
    });
    
    // Interceptor đã reject với error.response?.data, nên error đã là data object
    if (error && typeof error === 'object') {
      return {
        status: false,
        statusCode: error.statusCode || error.status || 'Error',
        data: null,
        errors: Array.isArray(error.errors)
          ? error.errors
          : [error.message || error.error || 'Không thể tải danh sách bình luận'],
      };
    }

    return {
      status: false,
      statusCode: 'Error',
      data: null,
      errors: ['Không thể tải danh sách bình luận'],
    };
  }
};

