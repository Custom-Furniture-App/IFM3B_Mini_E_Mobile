import TabBar from "@/components/common/TabBar";
import { Tabs } from "expo-router";

export default function Layout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: "Home", tabBarLabel: "Home" }}
      />
      <Tabs.Screen
        name="shop"
        options={{ title: "Shop", tabBarLabel: "Shop" }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarLabel: "Profile" }}
      />

      <Tabs.Screen
        name="orders"
        options={{ title: "Orders", tabBarLabel: "Orders" }}
      />
    </Tabs>
  );
}
