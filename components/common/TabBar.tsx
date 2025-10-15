import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
  Text
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Feather from "@expo/vector-icons/Feather";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

const TabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const iconSize = 24;
  const icons: Record<
    string,
    (props: { color: string; size?: number }) => React.ReactElement
  > = {
    home: (props) => <Feather name="home" size={iconSize} {...props} />,
    wallet: (props) => (
      <MaterialIcons name="account-balance-wallet" size={iconSize} {...props} />
    ),
    shop: (props) => (
      <MaterialCommunityIcons
        name="table-furniture"
        size={iconSize}
        {...props}
      />
    ),
    profile: (props) => (
      <FontAwesome5 name="user-circle" size={iconSize} {...props} />
    ),
    orders: (props) => (
      <SimpleLineIcons name="bag" size={iconSize} {...props} />
    ),
  };

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBarContent}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;

          const isFocused = state.index === index;
          const iconColor = isFocused ? "#1E90FF" : "#555"; // blue if focused, gray otherwise
          const backgroundColor = isFocused ? "#ADD8E6" : "#333"; // light blue or dark gray

          const onPress = (event: GestureResponderEvent) => {
            const tabPressEvent = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !tabPressEvent.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = (event: GestureResponderEvent) => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tabBarItem, { backgroundColor }]}
            >
              <View style={styles.tabBarItemContent}>
                {icons[route.name]?.({ color: iconColor })}
                {isFocused && typeof label === "string" && (
                  <Text style={styles.tabBarLabel}>
                    {label}
                  </Text>
                )}
                {isFocused && typeof label === "function" && (
                  <Text style={styles.tabBarLabel}>
                    {label({ focused: isFocused, color: iconColor, position: "below-icon", children: route.name })}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#76959eff",
    shadowColor: "gray",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  tabBarContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 5,
  },
  tabBarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginHorizontal: 4,
  },
  tabBarItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  tabBarLabel: {
    fontSize: 14,
    color: "#000",
  },
});

export default TabBar;
