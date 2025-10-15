import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { apiService } from "@/api/apiService";
import { RootState } from "@/redux/store"; // <-- Adjust path to your store
import { CartItem } from "@/types/common"; // <-- Adjust path to your types
import { addItemToCart } from "@/redux/cartSlice"; // <-- Adjust path to your slice
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

// --- Utility for Unique ID ---
const generateUniqueId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
};

// --- Interface Definitions (Kept the same) ---
export interface CompatibleComponent {
  Id: number;
  Name: string;
}

export interface Component {
  Id: number;
  Name: string;
  Type: string;
  UnitPrice: number;
  Stock: number;
  ImageUrl: string;
  Category: string; // Ensure this is correctly typed
  Description: string;
  CompatibleComponents: CompatibleComponent[];
}

// Extend CartItem's product to ensure Category is available
interface ComponentProduct {
  componentId: number;
  quantity: number;
  componentName: string;
  unitPrice: number;
  imageUrl: string;
  itemType: "component";
  category: string; // <-- Added category here
}

// Redefine CartItem to use the extended product type
export interface CategorizedCartItem extends Omit<CartItem, "product"> {
  product: ComponentProduct;
}

// --- Constants ---
const FURNITURE_CATEGORIES = [
  "Chair",
  "Table",
  "Sofa",
  "Bed",
  "Cabinet",
  "Desk",
  "Shelf",
];

// --- API Function (Kept the same) ---
export const fetchComponentsByCategory = async (
  category: string
): Promise<Component[]> => {
  try {
    const response = await apiService.get<Component[]>(
      `/Components/category/${category}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching components:", error);
    throw new Error("Failed to fetch components for the selected category.");
  }
};

// ----------------------------------------------------------------
// Component Detail Modal Component (Kept the same)
// ----------------------------------------------------------------

interface ComponentDetailProps {
  component: Component;
  onClose: () => void;
  onAddToCart: (component: Component, quantity: number) => void;
}

const ComponentDetail: React.FC<ComponentDetailProps> = React.memo(
  ({ component, onClose, onAddToCart }) => {
    const [quantity, setQuantity] = useState(1);
    const maxPurchaseQuantity = Math.min(component.Stock, 10);

    const handleDecreaseQuantity = () => {
      setQuantity((prev) => Math.max(1, prev - 1));
    };

    const handleIncreaseQuantity = () => {
      setQuantity((prev) => Math.min(maxPurchaseQuantity, prev + 1));
    };

    const isAddToCartDisabled = component.Stock < 1 || quantity < 1;

    return (
      <View style={styles.detailContainer}>
        <Text style={styles.detailTitle}>{component.Name}</Text>
        <Image
          source={{
            uri:
              component.ImageUrl ||
              "https://via.placeholder.com/150?text=No+Image",
          }}
          style={styles.detailImage}
          resizeMode="contain"
        />

        <ScrollView style={{ maxHeight: 200, marginBottom: 15 }}>
          <Text style={styles.detailLabel}>
            Price:{" "}
            <Text style={styles.detailValue}>
              R{component.UnitPrice.toFixed(2)}
            </Text>
          </Text>
          <Text style={styles.detailLabel}>
            Stock:{" "}
            <Text
              style={component.Stock < 1 ? styles.outOfStock : styles.inStock}
            >
              {component.Stock}
            </Text>
          </Text>
          <Text style={styles.descriptionText}>
            {component.Description || "No description provided."}
          </Text>
        </ScrollView>

        {/* --- Quantity Selector with Plus/Minus Buttons --- */}
        <View style={styles.quantitySelectorRow}>
          <Text style={styles.detailLabel}>Quantity:</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[
                styles.quantityButton,
                quantity === 1 && styles.quantityButtonDisabled,
              ]}
              onPress={handleDecreaseQuantity}
              disabled={quantity === 1}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityDisplay}>{quantity}</Text>
            <TouchableOpacity
              style={[
                styles.quantityButton,
                quantity === maxPurchaseQuantity &&
                  styles.quantityButtonDisabled,
              ]}
              onPress={handleIncreaseQuantity}
              disabled={quantity === maxPurchaseQuantity}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* ------------------------------------------------ */}

        <View style={styles.detailButtonRow}>
          <TouchableOpacity
            style={[styles.button, styles.closeButton]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              isAddToCartDisabled ? styles.disabledButton : styles.addButton,
            ]}
            onPress={() => onAddToCart(component, quantity)}
            disabled={isAddToCartDisabled}
          >
            <Text style={styles.buttonText}>
              {isAddToCartDisabled ? "Cannot Add" : "Add to Cart"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);
ComponentDetail.displayName = "ComponentDetail";

// ----------------------------------------------------------------
// Category Picker Modal Component (New)
// ----------------------------------------------------------------

interface CategoryPickerProps {
  onSelectCategory: (category: string) => void;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({
  onSelectCategory,
}) => (
  <View style={styles.pickerModalContainer}>
    <Text style={styles.pickerHeader}>Select a Furniture Category</Text>
    <ScrollView contentContainerStyle={styles.pickerListContent}>
      {FURNITURE_CATEGORIES.map((category) => (
        <TouchableOpacity
          key={category}
          style={styles.pickerCategoryButton}
          onPress={() => onSelectCategory(category)}
        >
          <Text style={styles.pickerCategoryText}>{category}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

// ----------------------------------------------------------------
// Main Shop Component (UPDATED LOGIC)
// ----------------------------------------------------------------

export default function Shop() {
  const dispatch = useDispatch();
  const cartItems: CategorizedCartItem[] = useSelector(
    (state: RootState) => state.cart.items
  ) as CategorizedCartItem[];

  // This state now determines which category's components are displayed
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // New state to control the visibility of the CategoryPicker modal/view
  const [showCategoryPicker, setShowCategoryPicker] = useState<boolean>(true);

  const [activeComponent, setActiveComponent] = useState<Component | null>(
    null
  );

  // --- Data Fetching ---
  const {
    data: componentsList,
    isLoading,
    isError,
    error,
  } = useQuery<Component[]>({
    queryKey: ["components", selectedCategory],
    queryFn: () => fetchComponentsByCategory(selectedCategory!),
    enabled: !!selectedCategory, // Only run query if a category is selected
  });

  // --- Handlers ---
  const handleSelectCategory = useCallback((category: string) => {
    setSelectedCategory(category);
    setShowCategoryPicker(false); // Hide picker, show components
    setActiveComponent(null);
  }, []);

  const handleGoBackToPicker = useCallback(() => {
    setSelectedCategory(null);
    setShowCategoryPicker(true); // Show picker
  }, []);

  const handleSelectComponent = (component: Component) => {
    // No lock needed. Component selection is only possible once a category is selected and components are displayed.
    setActiveComponent(component);
  };

  const handleAddComponentToCart = useCallback(
    (component: Component, quantity: number) => {
      const cartItemPayload: CategorizedCartItem = {
        cartId: generateUniqueId(),
        product: {
          componentId: component.Id,
          quantity: quantity,
          componentName: component.Name,
          unitPrice: component.UnitPrice,
          imageUrl:
            component.ImageUrl ||
            "https://via.placeholder.com/50?text=No+Image",
          itemType: "component",
          category: selectedCategory!, // Use the currently selected category
        },
        quantity: quantity,
      };

      dispatch(addItemToCart(cartItemPayload));
      setActiveComponent(null);
      Alert.alert(
        "Added to Cart",
        `${quantity}x ${component.Name} has been added to your order for the ${selectedCategory} build.`
      );
      // User stays on the same category component screen until they manually go back.
    },
    [dispatch, selectedCategory]
  );

  // Group cart items by category for display (Kept the same)
  const categorizedCart = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const category = item.product.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, CategorizedCartItem[]>);
  }, [cartItems]);

  // Safe Calculation for Total Items and Price (Kept the same)
  const totalCartItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalCartPrice = cartItems.reduce((sum, item) => {
    const unitPrice = item.product?.unitPrice ?? 0;
    return sum + unitPrice * item.quantity;
  }, 0);

  // --- Render Functions ---

  const renderComponentItem = ({ item }: { item: Component }) => {
    const isInCart = cartItems.some(
      (cartItem) => cartItem.product?.componentId === item.Id
    );

    return (
      <TouchableOpacity
        style={[styles.componentCard, isInCart && styles.componentSelected]}
        onPress={() => handleSelectComponent(item)}
      >
        <Image
          source={{
            uri:
              item.ImageUrl || "https://via.placeholder.com/50?text=No+Image",
          }}
          style={styles.componentImage}
          resizeMode="cover"
        />
        <View style={styles.componentInfo}>
          <Text style={styles.componentName}>{item.Name}</Text>
          <Text style={styles.componentPrice}>
            R{item.UnitPrice.toFixed(2)}
          </Text>
          <Text style={item.Stock < 1 ? styles.outOfStock : styles.stockCount}>
            Stock: {item.Stock}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCartCategory = (
    category: string,
    items: CategorizedCartItem[]
  ) => (
    <View key={category} style={styles.cartCategorySection}>
      <Text style={styles.cartCategoryHeader}>{category} Build</Text>
      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.cartId}
        renderItem={({ item }) => (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemText}>
              {item.quantity}x {item.product.componentName}
            </Text>
          </View>
        )}
        style={{ marginBottom: 5 }}
      />
    </View>
  );

  // --- Main Render Logic ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollViewContent}>
        <View style={styles.paddingContainer}>
          <Text style={styles.header}>Build Your Furniture</Text>

          {/* Step 1 & 2: Category Picker or Component List */}
          {showCategoryPicker ? (
            <CategoryPicker onSelectCategory={handleSelectCategory} />
          ) : (
            <View style={styles.componentSection}>
              <View style={styles.currentCategoryHeader}>
                <Text style={styles.subHeader}>
                  2. Select Components for **{selectedCategory}**:
                </Text>
                <TouchableOpacity
                  onPress={handleGoBackToPicker}
                  style={styles.changeCategoryButton}
                >
                  <Text style={styles.changeCategoryButtonText}>
                    Change Category
                  </Text>
                </TouchableOpacity>
              </View>

              {isLoading && (
                <ActivityIndicator
                  size="large"
                  color="#4F46E5"
                  style={styles.loadingIndicator}
                />
              )}

              {isError && (
                <Text style={styles.errorText}>
                  Error fetching components: {error?.message}
                </Text>
              )}

              {selectedCategory && !isLoading && !isError && (
                <FlatList
                  data={componentsList}
                  renderItem={renderComponentItem}
                  keyExtractor={(item) => item.Id.toString()}
                  numColumns={2}
                  columnWrapperStyle={styles.row}
                  ListEmptyComponent={() => (
                    <Text style={styles.emptyText}>
                      No components found for this category.
                    </Text>
                  )}
                  scrollEnabled={false}
                  contentContainerStyle={{ paddingBottom: 10 }}
                />
              )}
            </View>
          )}

          {/* Step 3: Current Order Summary (Redux Cart) */}
          <View style={styles.summarySection}>
            <Text style={styles.subHeader}>
              3. Cart Summary ({totalCartItems} items):
            </Text>

            {Object.keys(categorizedCart).length > 0 ? (
              <View>
                {Object.entries(categorizedCart).map(([category, items]) =>
                  renderCartCategory(category, items)
                )}
              </View>
            ) : (
              <Text style={styles.emptySummaryText}>
                Cart is empty. Select components above.
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.placeOrderButton,
                totalCartItems === 0 && styles.disabledButton,
              ]}
              onPress={
                () => router.push("/cart") // Navigate to Cart Screen
              }
              disabled={totalCartItems === 0}
            >
              <Text style={styles.placeOrderButtonText}>
                Go To Cart (R{totalCartPrice.toFixed(2)})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Component Detail Modal/View */}
      {activeComponent && (
        <View style={styles.modalOverlay}>
          <ComponentDetail
            component={activeComponent}
            onClose={() => setActiveComponent(null)}
            onAddToCart={handleAddComponentToCart}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

// ----------------------------------------------------------------
// Stylesheet (UPDATED for Category Picker)
// ----------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  paddingContainer: {
    paddingHorizontal: 15,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#1F2937",
    textAlign: "center",
  },
  subHeader: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 8,
    color: "#4B5563",
  },
  // --- New Category Picker Styles ---
  pickerModalContainer: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginTop: 10,
    elevation: 3,
    minHeight: 300,
  },
  pickerHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#4F46E5",
    textAlign: "center",
  },
  pickerListContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  pickerCategoryButton: {
    width: "45%",
    marginVertical: 8,
    paddingVertical: 15,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  pickerCategoryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  // --- Category and Component Header Styles ---
  currentCategoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  changeCategoryButton: {
    backgroundColor: "#9CA3AF",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  changeCategoryButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  // --- Component List Styles (existing) ---
  componentSection: {
    minHeight: 250,
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  componentCard: {
    flex: 1,
    margin: 5,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    borderWidth: 2,
    borderColor: "transparent",
  },
  componentSelected: {
    borderColor: "#00C49F",
  },
  componentImage: {
    width: "100%",
    height: 100,
    backgroundColor: "#eee",
  },
  componentInfo: {
    padding: 8,
  },
  componentName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F2937",
  },
  componentPrice: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
  },
  stockCount: {
    fontSize: 12,
    color: "#4B5563",
  },
  outOfStock: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "bold",
  },
  loadingIndicator: {
    padding: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    padding: 20,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#6B7280",
  },
  // --- Summary Styles (categorized cart) ---
  summarySection: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginBottom: 20,
  },
  cartCategorySection: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cartCategoryHeader: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#4F46E5",
  },
  emptySummaryText: {
    paddingVertical: 10,
    color: "#6B7280",
    textAlign: "center",
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 8,
    height: 35,
  },
  summaryItemText: {
    fontSize: 14,
    color: "#1E40AF",
    fontWeight: "500",
  },
  placeOrderButton: {
    backgroundColor: "#4F46E5",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  placeOrderButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  // --- Detail Modal Styles (existing) ---
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  detailContainer: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    elevation: 10,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 5,
  },
  detailImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 5,
    color: "#374151",
  },
  detailValue: {
    fontWeight: "normal",
    color: "#1F2937",
  },
  descriptionText: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 5,
    marginBottom: 10,
  },
  quantitySelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 10,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  quantityButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 5,
  },
  quantityButtonDisabled: {
    backgroundColor: "#F3F4F6",
    opacity: 0.6,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
  },
  quantityDisplay: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginHorizontal: 15,
    minWidth: 20,
    textAlign: "center",
  },
  detailButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  closeButton: {
    backgroundColor: "#6B7280",
  },
  addButton: {
    backgroundColor: "#4F46E5",
  },
  disabledButton: {
    backgroundColor: "#D1D5DB",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  inStock: {
    color: "#10B981",
    fontWeight: "600",
  },
});
