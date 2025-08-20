import axios, { AxiosError, type AxiosResponse } from "axios"

export const apiClient = axios.create({
    baseURL: import.meta.env.BASE_URL || "http://localhost:3000",
    headers: {
        "Content-Type": "application/json",
    },
})

apiClient.interceptors.request.use(config => {
    return config
})

apiClient.interceptors.response.use((response: AxiosResponse) => response?.data, (error: AxiosError) => Promise.reject(error.response?.data))
