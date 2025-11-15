import { apiClient } from './apiClient';
import type { Notification } from '@/types/notification.types';

/**
 * Response structure từ API Notification
 */
export interface NotificationApiResponse {
  status: boolean;
  statusCode: string;
  data: NotificationPagedData;
  errors: string[];
}

/**
 * Paginated data structure
 */
export interface NotificationPagedData {
  data: Notification[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Parameters cho getNotificationsByUser
 */
export interface GetNotificationsParams {
  page?: number;
  pageSize?: number;
}

/**
 * Lấy danh sách thông báo của người dùng với phân trang
 * @param userId - ID của người dùng
 * @param params - Tham số phân trang (page, pageSize)
 * @returns Promise<NotificationApiResponse>
 * 
 * @example
 * ```ts
 * const response = await getNotificationsByUser(1, { page: 1, pageSize: 10 });
 * if (response.status) {
 *   console.log(response.data.data); // Array of notifications
 *   console.log(response.data.totalPages); // Total pages
 * }
 * ```
 */
export const getNotificationsByUser = async (
  userId: number,
  params: GetNotificationsParams = {}
): Promise<NotificationApiResponse> => {
  const { page = 1, pageSize = 10 } = params;
  
  const response = await apiClient.get<NotificationApiResponse>(
    `/api/Notification/user/${userId}`,
    {
      params: {
        page,
        pageSize,
      },
    }
  );
  
  return response as unknown as NotificationApiResponse;
};

/**
 * Response structure cho mark as read và revert read status
 */
export interface NotificationStatusResponse {
  status: boolean;
  statusCode: string;
  data: string | null;
  errors: string[];
}

/**
 * Đánh dấu notification đã đọc
 */
export const markNotificationAsRead = async (
  notificationId: number
): Promise<NotificationStatusResponse> => {
  const response = await apiClient.put<NotificationStatusResponse>(
    `/api/Notification/${notificationId}/read`
  );
  
  return response as unknown as NotificationStatusResponse;
};

/**
 * Đảo ngược trạng thái đã đọc/chưa đọc của thông báo
 * PATCH /api/Notification/{id}/revert-read-status
 */
export const revertNotificationReadStatus = async (
  notificationId: number
): Promise<NotificationStatusResponse> => {
  const response = await apiClient.patch<NotificationStatusResponse>(
    `/api/Notification/${notificationId}/revert-read-status`
  );
  
  return response as unknown as NotificationStatusResponse;
};

/**
 * Đánh dấu tất cả notifications đã đọc (nếu có API endpoint)
 */
export const markAllNotificationsAsRead = async (
  userId: number
): Promise<NotificationStatusResponse> => {
  const response = await apiClient.put<NotificationStatusResponse>(
    `/api/Notification/user/${userId}/read-all`
  );
  
  return response as unknown as NotificationStatusResponse;
};

