import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import { PersistConfig, persistReducer, persistStore } from "redux-persist";
import cartReducer from "./cartSlice";
import SecureStorage from "./secureStorage";

//this combines reducerss
const rootReducer = combineReducers({
  cart: cartReducer,
});

//persistant config
const persistConfig: PersistConfig<ReturnType<typeof rootReducer>> = {
  key: "root",
  storage: SecureStorage,
  whitelist: ["uj_cart"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
