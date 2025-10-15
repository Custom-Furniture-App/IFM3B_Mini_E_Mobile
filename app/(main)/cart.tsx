import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
// Picker removed
import { useAuth } from "@/context/AuthContext"; // Assuming this path is correct
import { RootState } from "@/redux/store"; // Adjust path as needed
import {
  increaseItemQuantity,
  decreaseItemQuantity,
  removeItemFromCart,
  clearCart,
} from "@/redux/cartSlice"; // Adjust path as needed
import { CartItem } from "@/types/common";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiService } from "@/api/apiService";
import { router } from "expo-router";
// You might need an icon library like 'react-native-vector-icons' for a proper back arrow
// For this example, I'll use a simple '<' character or assume you have a navigation prop.

// --- Define Order Payload Interface ---
interface OrderItemPayload {
  componentId: number;
  quantity: number;
  unitPrice: number;
}

type FulfillmentType = "collection" | "delivery";

interface OrderPayload {
  customerId: number;
  status: "pending"; // Always start as pending
  fulfillmentType: FulfillmentType;
  items: OrderItemPayload[];
}

// --- Checkout Modal Component ---

interface CheckoutModalProps {
  isVisible: boolean;
  onClose: () => void;
  onPay: (paymentDetails: any) => void;
  totalAmount: number;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isVisible,
  onClose,
  onPay,
  totalAmount,
}) => {
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  const handlePayPress = () => {
    if (cardNumber && expiryDate && cvv) {
      // Dummy payment logic
      onPay({ cardNumber, expiryDate, cvv });
      onClose();
    } else {
      Alert.alert("Error", "Please fill in all payment details.");
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Complete Your Payment</Text>
          <Text style={styles.modalTotal}>
            Total: R{totalAmount.toFixed(2)}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Card Number"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={cardNumber}
            onChangeText={setCardNumber}
            maxLength={16}
          />
          <View style={styles.modalRow}>
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder="MM/YY"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={expiryDate}
              onChangeText={setExpiryDate}
              maxLength={5}
            />
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder="CVV"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={cvv}
              onChangeText={setCvv}
              maxLength={4}
            />
          </View>

          <TouchableOpacity style={styles.payButton} onPress={handlePayPress}>
            <Text style={styles.payButtonText}>PAY NOW</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Text style={styles.modalCloseButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ----------------------------------------------------------------
// Main Cart Component
// ----------------------------------------------------------------

// Assuming you pass a navigation prop, e.g., if using React Navigation
interface CartProps {
  // If using react-navigation:
  // navigation: any;
}

export default function Cart({}: /* navigation */
CartProps) {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const { user } = useAuth(); // Get user and address from AuthContext

  const [fulfillmentType, setFulfillmentType] =
    useState<FulfillmentType>("collection");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [customAddress, setCustomAddress] = useState("");
  // NEW STATE: To show the confirmation screen
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  // Safely calculate totals
  const { totalItems, subTotal } = useMemo(() => {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subTotal = cartItems.reduce(
      (sum, item) => sum + (item.product?.unitPrice ?? 0) * item.quantity,
      0
    );
    return { totalItems, subTotal };
  }, [cartItems]);

  const deliveryFee = fulfillmentType === "delivery" ? 50.0 : 0.0;
  const grandTotal = subTotal + deliveryFee;

  // Handler functions
  const handleIncrease = useCallback(
    (cartId: string) => {
      dispatch(increaseItemQuantity(cartId));
    },
    [dispatch]
  );

  const handleDecrease = useCallback(
    (cartId: string) => {
      dispatch(decreaseItemQuantity(cartId));
    },
    [dispatch]
  );

  const handleRemove = useCallback(
    (cartId: string) => {
      dispatch(removeItemFromCart(cartId));
    },
    [dispatch]
  );

  // NEW: Back Navigation Placeholder
  const handleGoBack = () => {
    router.back();
  };

  // NEW: Go To Orders Navigation Placeholder
  const handleGoToOrders = () => {
    router.push("/orders");
    setIsOrderPlaced(false); 
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert(
        "Cart Empty",
        "Please add items to your cart before checking out."
      );
      return;
    }

    if (fulfillmentType === "delivery" && !user?.address && !customAddress) {
      Alert.alert(
        "Address Missing",
        "Please provide a delivery address or choose 'Collection'."
      );
      return;
    }
    if (!user?.id) {
      Alert.alert("Error", "User ID not found. Cannot proceed with order.");
      return;
    }
    setIsModalVisible(true);
  };

  const handlePaySuccess = async (paymentDetails: any) => {
    if (!user?.id) {
      Alert.alert("Error", "User ID not found. Cannot proceed with order.");
      return;
    }

    // --- CONSTRUCT THE ORDER PAYLOAD ---
    const orderItems: OrderItemPayload[] = cartItems
      .map((item) => {
      if (typeof item.product.componentId === "number") {
        return {
        componentId: item.product.componentId as number,
        quantity: item.quantity,
        unitPrice: item.product.unitPrice,
        itemType: "component",
        };
      } else if (typeof item.product.productId === "number") {
        return {
        productId: item.product.productId as number, // You may want to rename this to productId in your backend
        quantity: item.quantity,
        unitPrice: item.product.unitPrice,
        itemType: "product",
        };
      }
      return null;
      })
      .filter((item) => item !== null) as OrderItemPayload[];

    const orderPayload: OrderPayload = {
      customerId: user.id, 
      status: "pending", 
      fulfillmentType: fulfillmentType,
      items: orderItems,
    };

    console.log("Order Payload:", orderPayload);
    // -----------------------------------

    try {
      // In a real app, you would send this payload to your API *after* payment:
      const response = await apiService.post("/Orders", orderPayload);
      console.log("Order created successfully:", response.data);

      Alert.alert(
        "Order Placed!",
        `Your order for R${grandTotal.toFixed(
          2
        )} has been placed. Fulfillment: ${fulfillmentType}.`
      );

      // Clear the cart and show confirmation screen
      dispatch(clearCart());
      setIsOrderPlaced(true);
    } catch (error) {
      console.error("Error creating order after payment:", error);
      Alert.alert(
        "Order Failed",
        "There was an issue placing your order. Please try again."
      );
    }
  };

  // --- Render Item for FlatList ---
  const renderItem = ({ item }: { item: CartItem }) => {
    // Safely access product details
    const product = item.product;
    const componentName = product?.componentName ?? "Unknown Item";
    const unitPrice = product?.unitPrice ?? 0;
    const imageUrl = product?.imageUrl;
    const itemTotal = unitPrice * item.quantity;

    return (
      <View style={styles.cartItem}>
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.itemImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{componentName}</Text>
          <Text style={styles.itemPrice}>R{unitPrice.toFixed(2)} / unit</Text>

          <View style={styles.quantityControlsContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleDecrease(item.cartId)}
              disabled={item.quantity <= 1}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleIncrease(item.cartId)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.itemSummary}>
          <Text style={styles.itemTotal}>R{itemTotal.toFixed(2)}</Text>
          <TouchableOpacity
            onPress={() => handleRemove(item.cartId)}
            style={styles.removeButton}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // --- Order Placed Confirmation View ---
  if (isOrderPlaced) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {/* NEW: Back Button Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={styles.header}>Order Placed! 🎉</Text>
          <View style={{ width: 40 }} />
          {/* Spacer */}
        </View>
        {/* --- */}

        <View style={styles.orderPlacedContainer}>
          <Text style={styles.orderPlacedText}>
            Your order has been successfully placed and is now{" "}
            <Text style={{ fontWeight: "bold" }}>pending</Text>.
          </Text>

          <Text style={styles.orderPlacedDetails}>
            Fulfillment Type:{" "}
            <Text style={{ fontWeight: "bold" }}>
              {fulfillmentType.toUpperCase()}
            </Text>
          </Text>

        

          {/* <Text style={styles.addressText}>
            Profile Address:{" "}
            <Text style={{ fontWeight: "bold" }}>{user.address}</Text>
          </Text> */}

 

          {/* NEW: Go to Orders Button */}
          <TouchableOpacity
            style={styles.goToOrdersButton}
            onPress={handleGoToOrders}
          >
            <Text style={styles.goToOrdersButtonText}>GO TO ORDERS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGoBack}
            style={styles.backToShopButton}
          >
            <Text style={styles.backToShopButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- Main Cart View ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* NEW: Back Button Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={styles.header}>Your Cart ({totalItems})</Text>
          <View style={{ width: 40 }} />
          {/* Spacer */}
        </View>
        {/* --- */}

        <FlatList
          data={cartItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.cartId}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Your cart is empty.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          style={styles.flatList}
        />

        {/* --- Fulfillment and Address Section (Scrollable) --- */}
        <ScrollView style={styles.optionsContainer}>
          <Text style={styles.subHeader}>Fulfillment Options</Text>

          {/* NEW: Fulfillment Type TouchableOpacities */}
          <View style={styles.fulfillmentToggleContainer}>
            <TouchableOpacity
              style={[
                styles.fulfillmentButton,
                fulfillmentType === "collection" &&
                  styles.fulfillmentButtonActive,
              ]}
              onPress={() => setFulfillmentType("collection")}
            >
              <Text
                style={[
                  styles.fulfillmentButtonText,
                  fulfillmentType === "collection" &&
                    styles.fulfillmentButtonTextActive,
                ]}
              >
                Collection
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.fulfillmentButton,
                fulfillmentType === "delivery" &&
                  styles.fulfillmentButtonActive,
              ]}
              onPress={() => setFulfillmentType("delivery")}
            >
              <Text
                style={[
                  styles.fulfillmentButtonText,
                  fulfillmentType === "delivery" &&
                    styles.fulfillmentButtonTextActive,
                ]}
              >
                Delivery (R50.00 Fee)
              </Text>
            </TouchableOpacity>
          </View>
          {/* Picker Removed */}

          {/* Address Section for Delivery */}
          {fulfillmentType === "delivery" && (
            <View style={styles.addressSection}>
              <Text style={styles.subHeader}>Delivery Address</Text>

              {/* Option 1: Use Profile Address */}
              {user?.address ? (
                <View style={styles.addressOption}>
                  <Text style={styles.addressText}>
                    Profile Address: **{user.address}**
                  </Text>
                  <Text style={styles.addressHelper}>
                    (Will be used if Custom Address is empty)
                  </Text>
                  <Text style={styles.addressHelper}>
                    To use a different address, type below.
                  </Text>
                </View>
              ) : (
                <Text style={styles.addressHelper}>
                  No profile address found. Please enter a custom address.
                </Text>
              )}

              {/* Option 2: Custom Address Input */}
              <TextInput
                style={styles.input}
                placeholder={
                  user?.address
                    ? "Enter custom address (optional)"
                    : "Enter custom address (required)"
                }
                placeholderTextColor="#9CA3AF"
                value={customAddress}
                onChangeText={setCustomAddress}
              />
            </View>
          )}

          {/* Price Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>R{subTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee:</Text>
              <Text style={styles.summaryValue}>R{deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Grand Total:</Text>
              <Text style={styles.totalValue}>R{grandTotal.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        {/* --- Checkout Button (Fixed at Bottom) --- */}
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            totalItems === 0 && styles.disabledButton,
          ]}
          onPress={handleCheckout}
          disabled={totalItems === 0}
        >
          <Text style={styles.checkoutButtonText}>
            PROCEED TO CHECKOUT (R{grandTotal.toFixed(2)})
          </Text>
        </TouchableOpacity>

        {/* Checkout Payment Modal */}
        <CheckoutModal
          isVisible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onPay={handlePaySuccess}
          totalAmount={grandTotal}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ----------------------------------------------------------------
// Updated Stylesheet
// ----------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  container: {
    flex: 1,
    paddingHorizontal: 15,
  },
  // NEW: Header Bar for Back Button
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  backButton: {
    padding: 10,
    minWidth: 40,
  },
  backButtonText: {
    fontSize: 24,
    color: "#4F46E5",
    fontWeight: "300",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    flex: 1, // Allows the title to take up remaining space
  },
  // --- Fulfillment Toggle Styles ---
  fulfillmentToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 10,
  },
  fulfillmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "transparent", // Default
  },
  fulfillmentButtonActive: {
    backgroundColor: "#4F46E5", // Active color
  },
  fulfillmentButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563", // Default text color
  },
  fulfillmentButtonTextActive: {
    color: "#FFFFFF", // Active text color
  },
  // --- Order Placed Styles (NEW) ---
  orderPlacedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    margin: 15,
  },
  orderPlacedTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 10,
  },
  orderPlacedText: {
    fontSize: 16,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: 20,
  },
  orderPlacedDetails: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 5,
  },
  goToOrdersButton: {
    backgroundColor: "#4F46E5",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 30,
    width: "100%",
  },
  goToOrdersButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  backToShopButton: {
    marginTop: 15,
    padding: 10,
  },
  backToShopButtonText: {
    color: "#4B5563",
    fontSize: 14,
  },
  // --- Existing Styles (Unmodified for brevity, but kept here) ---
  flatList: {
    maxHeight: "40%", // Limit cart items height to prevent overflow
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  listContent: {
    paddingBottom: 10,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 10,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  itemPrice: {
    fontSize: 12,
    color: "#4B5563",
    marginTop: 2,
  },
  quantityControlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 4,
    width: 90,
  },
  quantityButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "#F3F4F6",
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4F46E5",
  },
  quantityText: {
    paddingHorizontal: 5,
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
  },
  itemSummary: {
    alignItems: "flex-end",
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 5,
  },
  removeButton: {
    marginTop: 5,
    padding: 4,
  },
  removeButtonText: {
    fontSize: 12,
    color: "#EF4444",
  },
  optionsContainer: {
    flex: 1,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 8,
    color: "#4B5563",
  },
  addressSection: {
    marginBottom: 15,
  },
  addressOption: {
    padding: 10,
    backgroundColor: "#DBEAFE",
    borderRadius: 6,
    marginBottom: 5,
    borderLeftWidth: 3,
    borderLeftColor: "#4F46E5",
  },
  addressText: {
    fontSize: 14,
    color: "#1E40AF",
  },
  addressHelper: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    backgroundColor: "#fff",
    color: "#1F2937",
    fontSize: 14,
  },
  summaryContainer: {
    marginTop: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#4B5563",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#D1D5DB",
    paddingTop: 8,
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4F46E5",
  },
  checkoutButton: {
    backgroundColor: "#4F46E5",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#D1D5DB",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 25,
    alignItems: "stretch",
    elevation: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1F2937",
    textAlign: "center",
  },
  modalTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 20,
    textAlign: "center",
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputHalf: {
    flex: 1,
    marginRight: 5,
  },
  payButton: {
    backgroundColor: "#10B981",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  payButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalCloseButton: {
    marginTop: 15,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#6B7280",
    fontSize: 14,
  },
});
