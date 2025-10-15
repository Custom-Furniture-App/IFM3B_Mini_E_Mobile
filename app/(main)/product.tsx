import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator, // 👈 Import for loading state
} from "react-native";
import { CartItem, Product } from "@/types/common";
import { addItemToCart } from "@/redux/cartSlice";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchProductById } from "@/api/reactquery/productsApi";

const generateUniqueId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
};

// HELPER FUNCTION TO CORRECTLY URL-ENCODE SPACES IN THE FIREBASE PATH
const encodeFirebaseUrl = (url: string): string => {
  if (!url) return "";
  const [baseUrl, queryString] = url.split("?");
  const encodedPath = baseUrl.replace(/ /g, "%20");
  return queryString ? `${encodedPath}?${queryString}` : encodedPath;
};

export default function ProductPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  // 💡 NOW FETCHING 'id' INSTEAD OF 'product'
  const { product: productIdParam } = useLocalSearchParams<{
    product?: string;
  }>();

  // 1. ⚙️ State for Data and Loading
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert the URL param string to a number
  const productId = productIdParam ? parseInt(productIdParam) : null;

  // 2. 🎣 Data Fetching Hook
  useEffect(() => {
    if (!productId) {
      setLoading(false);
      setError("Invalid product ID.");
      return;
    }

    const loadProduct = async () => {
      try {
        setLoading(true);
        const data = await fetchProductById(productId);
        setProduct(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setError("Failed to load product details.");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]); // Rerun when the ID changes

  // --- Early Returns ---
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Loading product...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>
          Error: {error || "Product not found."}
        </Text>
        <TouchableOpacity onPress={router.back} style={{ marginTop: 20 }}>
          <Text style={{ color: "#007AFF", fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }


  const handleBackPress = () => {
    router.back();
  };

  const handleAddToCart = () => {
    const cartItemPayload: CartItem = {
      cartId: generateUniqueId(),
      product: {
        // The API returns the Product structure, so we use its fields directly
        productId: Number(product.Id) ?? 0, // Ensure it's a number
        quantity: 1,
        componentName: product.ProductName,
        unitPrice: product.Price,
        imageUrl:
          product.ImageUrl || "https://via.placeholder.com/50?text=No+Image",
        itemType: "component",
      },
      quantity: 1,
    };
    dispatch(addItemToCart(cartItemPayload));
    setModalVisible(true);
  };

  const handleSeeCart = () => {
    setModalVisible(false);
    router.push("/cart");
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* --- Confirmation Modal (Unchanged) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
            <Text style={styles.modalText}>**Item Added to Cart!**</Text>
            <Text style={styles.modalSubText}>
              {product.ProductName} has been successfully added.
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.buttonSeeCart]}
                onPress={handleSeeCart}
              >
                <Text style={styles.textStyle}>See Cart</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.buttonClose]}
                onPress={handleCancel}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- Top Section with Back Chevron --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={30} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={styles.backButton} />
      </View>

      {/* --- Scrollable Product Details --- */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {product.ImageUrl ? (
          <Image
            source={{ uri: product.ImageUrl }}
            style={styles.productImage}
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="image-outline" size={80} color="#ccc" />
            <Text style={{ color: "#ccc" }}>Image not available</Text>
          </View>
        )}

        <Text style={styles.productName}>{product.ProductName}</Text>
        <Text style={styles.productPrice}>R{product.Price.toFixed(2)}</Text>
        <Text style={styles.productDescription}>{product.Description}</Text>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* --- Bottom Button Container --- */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          onPress={handleAddToCart}
          style={styles.addToCartButton}
        >
          <Text style={styles.addToCartText}>Add To Cart</Text>
          <Text style={styles.addToCartPrice}>R{product.Price.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  errorText: {
    fontSize: 18,
    color: "red",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  productImage: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    marginBottom: 16,
    resizeMode: "contain",
  },
  productImagePlaceholder: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  productName: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 24,
    color: "#E91E63",
    fontWeight: "600",
    marginBottom: 16,
  },
  productDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  addToCartButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#007AFF",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  addToCartText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  addToCartPrice: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
    width: "80%",
  },
  modalText: {
    marginBottom: 10,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalSubText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 16,
    color: "#666",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  modalButton: {
    borderRadius: 8,
    padding: 10,
    elevation: 2,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonSeeCart: {
    backgroundColor: "#007AFF",
  },
  buttonClose: {
    backgroundColor: "#ccc",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});
