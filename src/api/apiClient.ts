import axios, { AxiosError, type AxiosResponse } from "axios"

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "https://sep490.onrender.com",
    headers: {
        "Content-Type": "application/json",
    },
})

// Interceptor để thêm token vào header
apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config
})

// Interceptor để xử lý response
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response?.data, 
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Token hết hạn, xóa token và chuyển về trang login
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        }
        return Promise.reject(error.response?.data)
    }
)