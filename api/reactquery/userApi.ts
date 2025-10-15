import { UserRq } from "@/types/common";
import { apiService } from "../apiService";

export const getCurrentUser = async (userId: number) => {
  const response = await apiService.get<UserRq>(`/Users/${userId}`);
  return response.data;
}