import axios, { AxiosError, type AxiosResponse } from "axios"

const DEFAULT_API_BASE_URL = "https://verdanttechbe-bpbaaghrg5ggexds.southeastasia-01.azurewebsites.net"
const SWAGGER_SUFFIX_REGEX = /\/swagger\/index\.html.*$/i

const normalizeBaseUrl = (value?: string): string => {
    if (!value) return DEFAULT_API_BASE_URL

    const trimmed = value.trim()
    if (!trimmed) return DEFAULT_API_BASE_URL

    const withoutSwagger = trimmed.replace(SWAGGER_SUFFIX_REGEX, "")
    const withoutTrailingSlash = withoutSwagger.replace(/\/+$/, "")

    return withoutTrailingSlash || DEFAULT_API_BASE_URL
}

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
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