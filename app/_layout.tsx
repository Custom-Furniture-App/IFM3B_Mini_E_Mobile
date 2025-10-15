import React from "react";
import { Provider as ReduxProvider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { useAuth, AuthProvider } from "@/context/AuthContext";
import { Redirect, Stack } from "expo-router";
import "react-native-reanimated";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistor, store } from "@/redux/store";

function RootNavigator() {
  const { user } = useAuth();
  if (!user) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(main)/(tabs)/home" />;
}

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(main)" />
              <Stack.Screen name="index" />
            </Stack>
          </QueryClientProvider>
          <RootNavigator />
        </AuthProvider>
      </PersistGate>
    </ReduxProvider>
  );
}
