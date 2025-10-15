import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

//const baseUrl = process.env.EXPO_PUBLIC_BASE_URL;
const baseUrl = "http://192.168.100.28:5012/api";
const api: AxiosInstance = axios.create({
  baseURL: baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});


api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response) {
      console.error(
        `[API ERROR] ${error.response.status}: ${
          error.response.data?.message || error.message
        }`
      );
    } else {
      console.error(`[NETWORK ERROR]: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

const apiService = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    api.get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    api.post<T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    api.put<T>(url, data, config),
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    api.patch<T>(url, data, config),
  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    api.delete<T>(url, config),
};

export { api, apiService };

