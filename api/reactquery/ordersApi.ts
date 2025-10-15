
import { Order } from "@/types/common";
import { apiService } from "../apiService";

export const fetchAllOrders = async (): Promise<Order[]> => {
  const response = await apiService.get<Order[]>("/Orders");
  return response.data;
};

export const fetchOrderById = async (id: number): Promise<Order> => {
  const response = await apiService.get<Order>(`/Orders/${id}`);
  return response.data;
};

export const fetchOrdersForUser = async (userId: number): Promise<Order[]> => {
  const response = await apiService.get<Order[]>(`/Orders/user/${userId}`);
  return response.data;
};

