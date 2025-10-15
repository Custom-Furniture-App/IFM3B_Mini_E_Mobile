import { apiService } from "../apiService";
import { Notification } from "@/types/common";

export const fetchNotificationsForUser = async (userId: number): Promise<Notification[]> => {
  const response = await apiService.get<Notification[]>(`/Notifications/user/${userId}`);
  return response.data;
};

export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  await apiService.put(`/Notifications/mark-read/${notificationId}`);
};
