import { apiClient } from './apiClient';

// Interface cho request đăng ký vendor
export interface VendorSignUpRequest {
  email: string;
  password: string;
  fullName?: string;
  phoneNumber?: string;
  taxCode?: string;
  companyName: string;
  businessRegistrationNumber: string;
  companyAddress?: string;
  province?: string;
  district?: string;
  commune?: string;
  certificationName?: string[];
  certificationCode?: string[];
  files?: File[];
}

// Interface cho response vendor profile
export interface VendorProfileResponse {
  id: number;
  userId: number;
  email: string;
  fullName: string;
  phoneNumber: string;
  taxCode: string;
  avatarUrl: string;
  status: string;
  subscriptionActive: boolean;
  companyName: string;
  slug: string;
  businessRegistrationNumber: string;
  companyAddress: string;
  province: string;
  district: string;
  commune: string;
  files: Array<{
    id: number;
    imagePublicId: string;
    imageUrl: string;
    purpose: string;
    sortOrder: number;
  }>;
  verifiedAt: string | null;
  verifiedBy: number | null;
  createdAt: string;
  updatedAt: string;
}

// API đăng ký vendor (multipart/form-data)
export const signUpVendor = async (data: VendorSignUpRequest): Promise<VendorProfileResponse> => {
  try {
    const formData = new FormData();
    
    // Add required fields
    formData.append('Email', data.email);
    formData.append('Password', data.password);
    
    // Add optional fields
    if (data.fullName) {
      formData.append('FullName', data.fullName);
    }
    
    if (data.phoneNumber) {
      formData.append('PhoneNumber', data.phoneNumber);
    }
    
    if (data.taxCode) {
      formData.append('TaxCode', data.taxCode);
    }
    
    // Add required company fields
    formData.append('CompanyName', data.companyName);
    formData.append('BusinessRegistrationNumber', data.businessRegistrationNumber);
    
    // Add optional address fields
    if (data.companyAddress) {
      formData.append('CompanyAddress', data.companyAddress);
    }
    
    if (data.province) {
      formData.append('Province', data.province);
    }
    
    if (data.district) {
      formData.append('District', data.district);
    }
    
    if (data.commune) {
      formData.append('Commune', data.commune);
    }
    
    // Add certification arrays
    if (data.certificationName && data.certificationName.length > 0) {
      data.certificationName.forEach((name, index) => {
        formData.append(`CertificationName[${index}]`, name);
      });
    }
    
    if (data.certificationCode && data.certificationCode.length > 0) {
      data.certificationCode.forEach((code, index) => {
        formData.append(`CertificationCode[${index}]`, code);
      });
    }
    
    // Add files
    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => {
        formData.append('files', file);
      });
    }
    
    // Debug: Log FormData contents
    console.log('Vendor SignUp FormData contents:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + (pair[1] instanceof File ? `[File: ${pair[1].name}]` : pair[1]));
    }
    
    const response = await apiClient.post('/api/VendorProfiles', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('Vendor SignUp API response:', response);
    //return response as VendorProfileResponse;
    return response.data as VendorProfileResponse;

    
  } catch (error: unknown) {
    console.error('Vendor SignUp API error:', error);
    
    // Xử lý các loại lỗi khác nhau
    if (error && typeof error === 'object') {
      // Lỗi từ Axios (network error, server error)
      if ('response' in error && error.response) {
        const response = error.response as { status: number; data?: { errors?: string[]; message?: string } };
        
        if (response.status === 500) {
          throw new Error('Lỗi máy chủ. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.');
        } else if (response.status === 400) {
          const errorMsg = response.data?.errors?.[0] || response.data?.message || 'Dữ liệu đăng ký không hợp lệ';
          throw new Error(errorMsg);
        } else if (response.status === 409) {
          throw new Error('Email đã tồn tại trong hệ thống. Vui lòng sử dụng email khác.');
        } else if (response.status >= 500) {
          throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
        } else {
          const errorMsg = response.data?.errors?.[0] || response.data?.message || 'Đăng ký thất bại';
          throw new Error(errorMsg);
        }
      }
      
      // Lỗi từ server response
      if ('status' in error && (error as { status: boolean }).status === false) {
        const errorData = error as { errors?: string[]; message?: string };
        const errorMsg = errorData.errors?.[0] || errorData.message || 'Đăng ký thất bại';
        throw new Error(errorMsg);
      }
      
      // Lỗi network
      if ('message' in error && error.message === 'Network Error') {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại.');
      }
      
      // Lỗi timeout
      if ('code' in error && (error as { code: string }).code === 'ECONNABORTED') {
        throw new Error('Kết nối bị timeout. Vui lòng thử lại.');
      }
    }
    
    // Lỗi mặc định
    const errorMessage = error && typeof error === 'object' && 'message' in error 
      ? String(error.message) 
      : "Đăng ký làm nhà cung cấp thất bại. Vui lòng thử lại.";
    throw new Error(errorMessage);
  }
};

// Interface cho response danh sách vendor với phân trang
export interface VendorListResponse {
  data: VendorProfileResponse[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

// API lấy tất cả vendors (không phân trang backend, fetch tất cả)
export const getAllVendors = async (): Promise<VendorProfileResponse[]> => {
  try {
    // Fetch tất cả vendors với pageSize lớn để lấy toàn bộ
    const response = await apiClient.get('/api/VendorProfiles', {
      params: {
        page: 1,
        pageSize: 10000 // Số lớn để lấy tất cả
      }
    });
    
    console.log('Get all vendors API response:', response);
    
    let vendorsArray: VendorProfileResponse[] = [];
    
    // API trả về array trực tiếp
    if (Array.isArray(response)) {
      vendorsArray = response as VendorProfileResponse[];
    }
    // Nếu có cấu trúc pagination
    else if (response && typeof response === 'object' && 'data' in response) {
      const paginatedResponse = response as VendorListResponse;
      vendorsArray = paginatedResponse.data || [];
      
      // Nếu có totalCount và cần fetch thêm các trang khác
      const totalCount = paginatedResponse.totalCount || vendorsArray.length;
      if (totalCount > vendorsArray.length && paginatedResponse.totalPages && paginatedResponse.totalPages > 1) {
        // Fetch tất cả các trang còn lại
        const allPromises = [];
        for (let page = 2; page <= paginatedResponse.totalPages; page++) {
          allPromises.push(
            apiClient.get('/api/VendorProfiles', {
              params: {
                page,
                pageSize: 10000
              }
            })
          );
        }
        
        const additionalResponses = await Promise.all(allPromises);
        additionalResponses.forEach((resp) => {
          if (Array.isArray(resp)) {
            vendorsArray = vendorsArray.concat(resp as VendorProfileResponse[]);
          } else if (resp && typeof resp === 'object' && 'data' in resp) {
            const additionalData = (resp as VendorListResponse).data || [];
            vendorsArray = vendorsArray.concat(additionalData);
          }
        });
      }
    }
    
    // Sắp xếp theo createdAt DESC (mới nhất lên đầu)
    vendorsArray.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // DESC
    });
    
    return vendorsArray;
  } catch (error: unknown) {
    console.error('Get all vendors API error:', error);
    
    if (error && typeof error === 'object') {
      if ('response' in error && error.response) {
        const response = error.response as { status: number; data?: { errors?: string[]; message?: string } };
        if (response.status === 401) {
          throw new Error('Không có quyền truy cập. Vui lòng đăng nhập lại.');
        } else if (response.status >= 500) {
          throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
        } else {
          const errorMsg = response.data?.errors?.[0] || response.data?.message || 'Không thể tải danh sách nhà cung cấp';
          throw new Error(errorMsg);
        }
      }
      
      if ('message' in error) {
        throw new Error(String(error.message));
      }
    }
    
    throw new Error('Không thể tải danh sách nhà cung cấp. Vui lòng thử lại.');
  }
};

// API lấy chi tiết vendor theo ID
export const getVendorById = async (id: number): Promise<VendorProfileResponse> => {
  try {
    const response = await apiClient.get(`/api/VendorProfiles/${id}`, {
      headers: { accept: 'text/plain' }
    });
    
    console.log('Get vendor by ID API response:', response);
    console.log('Response type:', typeof response);
    console.log('Response keys:', response && typeof response === 'object' ? Object.keys(response) : 'N/A');
    
    // Handle response structure - apiClient interceptor already returns response.data
    // So response here is already the data, but check if it's wrapped
    let vendorData: any;
    if (response && typeof response === 'object') {
      // Check if response has a 'data' property (might be double-wrapped)
      vendorData = (response as any)?.data || response;
    } else {
      vendorData = response;
    }
    
    // Validate that we have the required fields
    if (!vendorData || typeof vendorData !== 'object') {
      throw new Error('Response không hợp lệ: dữ liệu trả về không phải object');
    }
    
    if (!vendorData.id && !vendorData.userId) {
      console.warn('Vendor data might be incomplete:', vendorData);
    }
    
    return vendorData as VendorProfileResponse;

    
  } catch (error: unknown) {
    console.error('Get vendor by ID API error:', error);
    
    if (error && typeof error === 'object') {
      if ('response' in error && error.response) {
        const response = error.response as { status: number; data?: { errors?: string[]; message?: string } };
        if (response.status === 404) {
          throw new Error('Không tìm thấy nhà cung cấp với ID này.');
        } else if (response.status === 401) {
          throw new Error('Không có quyền truy cập. Vui lòng đăng nhập lại.');
        } else if (response.status >= 500) {
          throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
        } else {
          const errorMsg = response.data?.errors?.[0] || response.data?.message || 'Không thể tải thông tin nhà cung cấp';
          throw new Error(errorMsg);
        }
      }
      
      if ('message' in error) {
        throw new Error(String(error.message));
      }
    }
    
    throw new Error('Không thể tải thông tin nhà cung cấp. Vui lòng thử lại.');
  }
};

// API lấy vendor profile theo userId
export const getVendorByUserId = async (userId: number): Promise<VendorProfileResponse | null> => {
  try {
    // Get all vendors and find the one with matching userId
    const vendors = await getAllVendors();
    const vendor = vendors.find(v => v.userId === userId);
    
    if (!vendor) {
      return null;
    }
    
    // Get full details using vendor ID
    return await getVendorById(vendor.id);
    
  } catch (error: unknown) {
    console.error('Get vendor by userId API error:', error);
    throw error;
  }
};

// Interface cho request approve vendor
export interface ApproveVendorRequest {
  id: number;
  verifiedBy: number;
}

// Interface cho request reject vendor
export interface RejectVendorRequest {
  id: number;
  verifiedBy: number;
  rejectionReason: string;
}

// Interface cho request cập nhật vendor profile
export interface UpdateVendorProfileRequest {
  id: number;
  companyName: string;
  businessRegistrationNumber: string;
  companyAddress: string;
  province: string;
  district: string;
  commune: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  taxCode: string;
}

// API duyệt vendor profile
export const approveVendor = async (id: number, verifiedBy: number): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post(`/api/VendorProfiles/${id}/approve`, {
      id,
      verifiedBy
    });
    
    console.log('Approve vendor API response:', response);
    //return response as { message: string };
    return response.data as { message: string };

    
  } catch (error: unknown) {
    console.error('Approve vendor API error:', error);
    
    if (error && typeof error === 'object') {
      if ('response' in error && error.response) {
        const response = error.response as { status: number; data?: { errors?: string[]; message?: string } };
        if (response.status === 404) {
          throw new Error('Không tìm thấy vendor với ID này.');
        } else if (response.status === 401) {
          throw new Error('Không có quyền truy cập. Vui lòng đăng nhập lại.');
        } else if (response.status === 400) {
          const errorMsg = response.data?.errors?.[0] || response.data?.message || 'Dữ liệu không hợp lệ';
          throw new Error(errorMsg);
        } else if (response.status >= 500) {
          throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
        } else {
          const errorMsg = response.data?.errors?.[0] || response.data?.message || 'Không thể duyệt vendor';
          throw new Error(errorMsg);
        }
      }
      
      if ('message' in error) {
        throw new Error(String(error.message));
      }
    }
    
    throw new Error('Không thể duyệt vendor. Vui lòng thử lại.');
  }
};

// API từ chối vendor profile
export const rejectVendor = async (id: number, verifiedBy: number, rejectionReason: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post(`/api/VendorProfiles/${id}/reject`, {
      id,
      verifiedBy,
      rejectionReason
    });
    
    console.log('Reject vendor API response:', response);
    //return response as { message: string };
    return response.data as { message: string };
    
  } catch (error: unknown) {
    console.error('Reject vendor API error:', error);
    
    if (error && typeof error === 'object') {
      if ('response' in error && error.response) {
        const response = error.response as { status: number; data?: { errors?: string[]; message?: string } };
        if (response.status === 404) {
          throw new Error('Không tìm thấy vendor với ID này.');
        } else if (response.status === 401) {
          throw new Error('Không có quyền truy cập. Vui lòng đăng nhập lại.');
        } else if (response.status === 400) {
          const errorMsg = response.data?.errors?.[0] || response.data?.message || 'Dữ liệu không hợp lệ';
          throw new Error(errorMsg);
        } else if (response.status >= 500) {
          throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
        } else {
          const errorMsg = response.data?.errors?.[0] || response.data?.message || 'Không thể từ chối vendor';
          throw new Error(errorMsg);
        }
      }
      
      if ('message' in error) {
        throw new Error(String(error.message));
      }
    }
    
    throw new Error('Không thể từ chối vendor. Vui lòng thử lại.');
  }
};

// API cập nhật vendor profile
export const updateVendorProfile = async (id: number, data: UpdateVendorProfileRequest): Promise<VendorProfileResponse> => {
  try {
    const response = await apiClient.put(`/api/VendorProfiles/${id}`, data, {
      headers: {
        'Content-Type': 'application/json',
        accept: 'text/plain'
      }
    });
    
    console.log('Update vendor profile API response:', response);
    
    // Handle response structure - might be wrapped in data property
    //const payload = (response as any) || {};
    //const vendorData = payload.data || payload;
    //return vendorData as VendorProfileResponse;
    return response.data as VendorProfileResponse;

    
  } catch (error: unknown) {
    console.error('Update vendor profile API error:', error);
    
    if (error && typeof error === 'object') {
      if ('response' in error && error.response) {
        const response = error.response as { status: number; data?: { errors?: string[]; message?: string } };
        if (response.status === 404) {
          throw new Error('Không tìm thấy nhà cung cấp với ID này.');
        } else if (response.status === 401) {
          throw new Error('Không có quyền truy cập. Vui lòng đăng nhập lại.');
        } else if (response.status === 400) {
          const errorMsg = response.data?.errors?.[0] || response.data?.message || 'Dữ liệu cập nhật không hợp lệ';
          throw new Error(errorMsg);
        } else if (response.status >= 500) {
          throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
        } else {
          const errorMsg = response.data?.errors?.[0] || response.data?.message || 'Không thể cập nhật thông tin vendor';
          throw new Error(errorMsg);
        }
      }
      
      if ('message' in error) {
        throw new Error(String(error.message));
      }
    }
    
    throw new Error('Không thể cập nhật thông tin nhà cung cấp. Vui lòng thử lại.');
  }
};

// API soft delete vendor account
export const deleteVendorAccount = async (userId: number): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete(`/api/VendorProfiles/account/${userId}`);
    
    console.log('Delete vendor account API response:', response);
    //return response as { message: string };
    return response.data as { message: string };
    
  } catch (error: unknown) {
    console.error('Delete vendor account API error:', error);
    
    if (error && typeof error === 'object') {
      if ('response' in error && error.response) {
        const response = error.response as { status: number; data?: { errors?: string[]; message?: string } };
        if (response.status === 404) {
          throw new Error('Không tìm thấy vendor với userId này.');
        } else if (response.status === 401) {
          throw new Error('Không có quyền truy cập. Vui lòng đăng nhập lại.');
        } else if (response.status === 400) {
          const errorMsg = response.data?.errors?.[0] || response.data?.message || 'Dữ liệu không hợp lệ';
          throw new Error(errorMsg);
        } else if (response.status >= 500) {
          throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
        } else {
          const errorMsg = response.data?.errors?.[0] || response.data?.message || 'Không thể xóa tài khoản nhà cung cấp';
          throw new Error(errorMsg);
        }
      }
      
      if ('message' in error) {
        throw new Error(String(error.message));
      }
    }
    
    throw new Error('Không thể xóa tài khoản nhà cung cấp. Vui lòng thử lại.');
  }
};

