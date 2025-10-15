// secureStorage.ts
import * as SecureStore from "expo-secure-store";

// Only allow alphanumeric, dot, dash, and underscore
const sanitizeKey = (key: string): string => {
  return key.replace(/[^a-zA-Z0-9._-]/g, "_") || "persist_fallback";
};

const SecureStorage = {
  setItem: async (key: string, value: string): Promise<void> => {
    const safeKey = sanitizeKey(key);
    await SecureStore.setItemAsync(safeKey, value);
  },
  getItem: async (key: string): Promise<string | null> => {
    const safeKey = sanitizeKey(key);
    return await SecureStore.getItemAsync(safeKey);
  },
  removeItem: async (key: string): Promise<void> => {
    const safeKey = sanitizeKey(key);
    await SecureStore.deleteItemAsync(safeKey);
  },
};

export default SecureStorage;
