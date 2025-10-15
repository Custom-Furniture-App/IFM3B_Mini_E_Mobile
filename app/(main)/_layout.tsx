
import DrawerContent from "@/components/common/DrawerContent";
import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function DrawerLayout() {
  return (
    <GestureHandlerRootView>
      <Drawer
        drawerContent={(props) => <DrawerContent {...props} />}
        screenOptions={{ headerShown: false, swipeEdgeWidth: 0 }}
      >
        <Drawer.Screen
          name="(tabs)"
          options={{ title: "Home", drawerLabel: "Home" }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
