import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal, // Import Modal for the overlay
  RefreshControl, // 👈 IMPORT REFRESH CONTROL
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/api/reactquery/productsApi";
import { Order, Product, UserRq, Notification } from "@/types/common";
import { router } from "expo-router";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
// 🎯 Import refetch and isFetching from the notifications query
import { fetchNotificationsForUser } from "@/api/reactquery/notificationsApi";
import { getCurrentUser } from "@/api/reactquery/userApi";
import { fetchOrdersForUser } from "@/api/reactquery/ordersApi";

// This will likely come from a React Query call in a real app
const MOCK_CATEGORIES = [
  "Chair",
  "Table",
  "Sofa",
  "Bed",
  "Cabinet",
  "Desk",
  "Shelf",
];

const ADMIN_EMAIL = "ujfurn@admin.co.za";
const ADMIN_PHONE = "01176572653";

export default function Home() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const cartItems = useSelector((state: RootState) => state.cart.items);

  // State for controlling the disabled account modal visibility
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Fetch Products
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch Current User
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser", user?.id],
    queryFn: () => getCurrentUser(user?.id!),
    staleTime: 5 * 60 * 1000,
    enabled: !!user?.id, // Only run if user ID is available
  });

  // Fetch User Orders
  const { data: orders } = useQuery({
    queryKey: ["userOrders", user?.id],
    queryFn: () => fetchOrdersForUser(user?.id!),
    enabled: !!user?.id,
  });

  const currentOrders = Array.isArray(orders)
    ? orders.filter((order) => order.Status?.toLowerCase() !== "completed")
        .length
    : 0;

  // Fetch Notifications
  const {
    data: notifications,
    refetch: refetchNotifications, // 👈 DESTRUCTURE refetch FUNCTION
    isFetching: isNotificationsFetching, // 👈 DESTRUCTURE isFetching STATE
  } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => fetchNotificationsForUser(user?.id!),
    enabled: !!user?.id,
  });

  const unreadNotificationsCount = Array.isArray(notifications)
    ? notifications.filter((n) => !n.IsRead).length
    : 0;

  // 🎯 Custom function for pull-to-refresh
  const handleRefresh = async () => {
    // You can refetch other queries here if needed, but for the task,
    // we'll focus on the notifications query since it's the one you asked about.
    // The isFetching state from useQuery handles the loading spinner automatically.
    await refetchNotifications();
  };

  // --- EFFECT FOR DISABLED ACCOUNT CHECK ---
  useEffect(() => {
    // Check if currentUser data has been fetched and if the account is disabled
    if (currentUser && currentUser.Disabled) {
      setIsModalVisible(true);
    }
  }, [currentUser]); // Re-run when currentUser changes

  // Handler for the "Okay" button in the disabled modal
  const handleDisabledOkay = async () => {
    setIsModalVisible(false);
    // 1. Log the user out
    await logout();
    // 2. Navigate back to the login screen (assuming index is the entry/login point)
    router.replace("/");
  };
  // ----------------------------------------

  const handleProductPress = (product: Product) => {
    router.push(`/product?product=${product.Id}`);
  };

  const handleNotificationsPress = () => {
    router.push("/notifications");
  };

  const renderProductCard = (product: Product) => (
    <TouchableOpacity
      key={product.Id}
      style={styles.productCard}
      onPress={() => handleProductPress(product)}
    >
      {product.ImageUrl && (
        <Image
          source={{ uri: product.ImageUrl }}
          style={styles.productImagePlaceholder}
        />
      )}
      <Text style={styles.productName}>{product.ProductName}</Text>
      <Text style={styles.productPrice}>R{product.Price.toFixed(2)}</Text>
      <TouchableOpacity style={styles.addToCartButton}>
        <Text style={styles.addToCartButtonText}>Buy Now</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // --- Disabled Account Modal Component ---
  const DisabledAccountModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isModalVisible}
      onRequestClose={() => {
        // Prevent closing via back button, must use Okay button
      }}
    >
      <View style={modalStyles.centeredView}>
        <View style={modalStyles.modalView}>
          <MaterialIcons
            name="block"
            size={40}
            color="#EF4444"
            style={{ marginBottom: 10 }}
          />
          <Text style={modalStyles.modalTitle}>Account Disabled</Text>
          <Text style={modalStyles.modalText}>
            Your account has been disabled by an administrator.
          </Text>
          <Text style={modalStyles.contactText}>
            Please contact the admin for assistance:
          </Text>
          <Text style={modalStyles.contactInfo}>
            Email: <Text style={modalStyles.link}>{ADMIN_EMAIL}</Text>
          </Text>
          <Text style={modalStyles.contactInfo}>
            Call: <Text style={modalStyles.link}>{ADMIN_PHONE}</Text>
          </Text>

          <TouchableOpacity
            style={modalStyles.buttonOkay}
            onPress={handleDisabledOkay}
          >
            <Text style={modalStyles.textStyle}>Okay (Go to Login)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  // ----------------------------------------

  return (
    <View style={styles.appContainer}>
      <DisabledAccountModal />
      <SafeAreaView style={styles.headerArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIconContainer}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <MaterialIcons name="menu" size={28} color="#000" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>UJ Furn</Text>

          {/* New Container for Notifications and Cart Icons */}
          <View style={styles.rightIconsContainer}>
            {/* Notifications Icon and Counter */}
            <TouchableOpacity
              style={styles.headerIconContainer}
              onPress={handleNotificationsPress}
            >
              <MaterialIcons name="notifications" size={28} color="#000" />
              {unreadNotificationsCount ? (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationText}>
                    {unreadNotificationsCount}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
            {/* Cart Icon and Counter */}
            <TouchableOpacity
              style={[styles.headerIconContainer, { marginLeft: 10 }]} // Added margin for spacing
              onPress={() => router.push("/cart")}
            >
              <MaterialIcons name="shopping-cart" size={28} color="#000" />
              {cartItems.length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationText}>
                    {cartItems.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.greetingBar}>
          <Text style={styles.greetingText}>
            Good Day, {currentUser?.FullName || "Guest"}
          </Text>
          <View style={styles.ordersContainer}>
            <Text style={styles.ordersText}>
              Current Orders: {currentOrders}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        // 🎯 IMPLEMENT REFRESH CONTROL HERE
        refreshControl={
          <RefreshControl
            // The loading state is controlled by React Query's isFetching
            refreshing={isNotificationsFetching}
            // When the user pulls down, we call the refetch function
            onRefresh={handleRefresh}
            tintColor={PRIMARY_BLUE} // Optional: Customize the spinner color (iOS)
          />
        }
      >
        <Text style={styles.sectionTitle}>Top Products</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}
        >
          {products.map(renderProductCard)}
        </ScrollView>

        {/* Categories Section */}
        <Text style={styles.sectionTitle}>Browse Categories</Text>
        <View style={styles.categoryGrid}>
          {MOCK_CATEGORIES.map((category, index) => (
            <TouchableOpacity key={index} style={styles.categoryRect}>
              <Text style={styles.categoryRectText}>{category}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const PRIMARY_BLUE = "#3B82F6";
const BACKGROUND_LIGHT = "white";
const ACCENT_WHITE = "#FFFFFF";

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: BACKGROUND_LIGHT,
  },

  // --- Header & Greeting Styles (Non-Scrollable) ---
  headerArea: {
    backgroundColor: "#E6F2FF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: PRIMARY_BLUE,
    letterSpacing: 0.5,
  },
  // New style to group the right-side icons
  rightIconsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconContainer: {
    padding: 5,
    position: "relative", // Ensures badge position is relative to this container
  },
  notificationBadge: {
    position: "absolute",
    top: -2, // Adjusted for better visibility on a smaller icon set
    right: -2, // Adjusted for better visibility on a smaller icon set
    backgroundColor: "#FF5252",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: ACCENT_WHITE,
  },
  notificationText: {
    color: ACCENT_WHITE,
    fontSize: 10,
    fontWeight: "bold",
  },

  greetingBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  ordersContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  ordersText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },

  // --- Scrollable Content Styles ---
  scrollContainer: {
    flex: 1,
    backgroundColor: BACKGROUND_LIGHT,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    paddingHorizontal: 16,
    marginBottom: 15,
    marginTop: 15,
  },
  horizontalScroll: {
    paddingLeft: 16,
    marginBottom: 20,
  },

  // Product Card Styles
  productCard: {
    backgroundColor: ACCENT_WHITE,
    borderRadius: 12,
    padding: 10,
    marginRight: 15,
    width: 150,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  productImagePlaceholder: {
    height: 100,
    width: "100%",
    backgroundColor: "#E0F2FF",
    borderRadius: 8,
    marginBottom: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: PRIMARY_BLUE,
    marginBottom: 8,
  },
  addToCartButton: {
    backgroundColor: PRIMARY_BLUE,
    borderRadius: 8,
    paddingVertical: 8,
  },
  addToCartButtonText: {
    color: ACCENT_WHITE,
    textAlign: "center",
    fontWeight: "600",
  },

  productCardPlaceholder: {
    backgroundColor: "#E0E0E0",
    borderRadius: 12,
    padding: 10,
    marginRight: 15,
    width: 150,
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#A0A0A0",
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    paddingVertical: 40,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginBottom: 20,
    justifyContent: "space-between",
  },
  categoryRect: {
    backgroundColor: ACCENT_WHITE,
    width: "48%",
    paddingVertical: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#D0D0D0",
  },
  categoryRectText: {
    color: PRIMARY_BLUE,
    fontWeight: "500",
    fontSize: 14,
    textAlign: "center",
  },

  logoutSection: {
    paddingHorizontal: 16,
    marginTop: 30,
  },
});

// --- Modal Styles ---
const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)", // Dark overlay
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
    maxWidth: 350,
  },
  modalTitle: {
    marginBottom: 10,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#EF4444",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 16,
    color: "#333",
  },
  contactText: {
    marginBottom: 5,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
  },
  contactInfo: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  link: {
    color: PRIMARY_BLUE,
  },
  buttonOkay: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    backgroundColor: PRIMARY_BLUE,
    marginTop: 20,
    width: "100%",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
});
