
import { Component } from "@/types/common";
import { apiService } from "../apiService";

export const fetchComponents = async (): Promise<Component[]> => {
  const response = await apiService.get<Component[]>("/Components");
  return response.data;
};

export const fetchComponentsByCategory = async (category: string): Promise<Component[]> => {
  const response = await apiService.get<Component[]>(`/Components/category/${category}`);
  return response.data;
};

