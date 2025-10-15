import React from "react";
import { View, StyleSheet, Text as RNText } from "react-native";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";

interface DrawerContentProps {
  navigation: any;
}

const DrawerContent: React.FC<DrawerContentProps> = (props) => {
  const { logout,user} = useAuth();
 
  const handleLogout = async () => {
    if (logout) {
      await logout();
      router.replace("/login");
    }
  };

const getInitials = () => {
  if (!user?.fullName) return "";
  const words = user.fullName.split(" ");
  const first = words[0]?.[0] ?? "";
  const last = words[1]?.[0] ?? "";
  return (first + last).toUpperCase();
};

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1, backgroundColor: "#2A3142" }}
    >
      {/* User Info */}
      <View style={styles.userContainer}>
        <View style={styles.avatar}>
          <RNText style={styles.avatarText}>{getInitials()}</RNText>
        </View>
        <View style={styles.userInfo}>
          <RNText
            style={styles.userName}
          >{`${user?.fullName}`}</RNText>
          <RNText style={styles.userEmail}>{user?.email}</RNText>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        <DrawerItem
          icon={() => (
            <SimpleLineIcons name="settings" size={24} color="#ADD8E6" />
          )}
          label="Settings"
          labelStyle={styles.drawerLabel}
          onPress={() => console.log("Settings Pressed")}
        />
        <DrawerItem
          icon={() => <SimpleLineIcons name="bag" size={24} color="#ADD8E6" />}
          label="Orders"
          labelStyle={styles.drawerLabel}
          onPress={() => console.log("Orders Pressed")}
        />
        <DrawerItem
          icon={() => <SimpleLineIcons name="doc" size={24} color="#ADD8E6" />}
          label="Terms & Conditions"
          labelStyle={styles.drawerLabel}
          onPress={() => console.log("Terms & Conditions Pressed")}
        />
      </View>

      {/* Bottom */}
      <View style={styles.bottomContainer}>
        <RNText style={styles.versionText}>App version 1.0.0</RNText>
        <DrawerItem
          icon={() => (
            <SimpleLineIcons name="logout" size={24} color="#ADD8E6" />
          )}
          label="Logout"
          labelStyle={styles.drawerLabel}
          onPress={handleLogout}
        />
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#3A3F55",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ADD8E6",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#000",
    fontSize: 20,
    fontWeight: "bold",
  },
  userInfo: {
    marginLeft: 12,
  },
  userName: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  userEmail: {
    color: "#CCC",
    fontSize: 14,
    marginTop: 2,
  },
  menuContainer: {
    marginTop: 16,
    flex: 1,
  },
  drawerLabel: {
    color: "white",
  },
  bottomContainer: {
    borderTopWidth: 1,
    borderTopColor: "#3A3F55",
    padding: 16,
  },
  versionText: {
    color: "#AAA",
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center",
  },
});

export default DrawerContent;
