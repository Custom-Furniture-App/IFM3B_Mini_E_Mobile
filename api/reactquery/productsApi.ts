import { Product } from "@/types/common";
import { apiService } from "../apiService";


export const fetchProducts = async (): Promise<Product[]> => {
  const response = await apiService.get<Product[]>("/Products");
  return response.data;
};

export const fetchProductById = async (id: number): Promise<Product> => {
  const response = await apiService.get<Product>(`/Products/${id}`);
  return response.data;
};


