import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// NOTE: Ensure your types and API functions are correctly imported
// ASSUMPTION: OrderItem now includes a 'Category' field
// export interface OrderItem { ..., ItemName: string, Category: string, ... }
import { fetchOrdersForUser } from "@/api/reactquery/ordersApi";
import { Order, OrderItem } from "@/types/common";

// Helper to format date
const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ----------------------------------------------------------------
// Order Detail Modal Component (UPDATED)
// ----------------------------------------------------------------

interface OrderDetailModalProps {
  isVisible: boolean;
  order: Order | null;
  onClose: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isVisible,
  order,
  onClose,
}) => {
  // 🚀 NEW: Group items by category
  const categorizedItems = useMemo(() => {
    if (!order) return {};
    // Assuming OrderItem is typed to include 'Category: string'
    return order.Items.reduce((acc, item) => {
      // Use 'Unknown' as a fallback if the Category field is missing
      const category = (item as any).ItemCategory || "Unknown Category";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, OrderItem[]>);
  }, [order]);
  // ------------------------------------

  if (!order) return null;

  const fulfillmentText =
    order.FulfillmentType === "delivery"
      ? `Delivery to: ${order.Address || "N/A"}`
      : "Ready for Collection";

  // 🚀 NEW: Render function for a single category group
  const renderCategoryGroup = (category: string, items: OrderItem[]) => (
    <View key={category} style={styles.categoryGroupContainer}>
      <Text style={styles.categoryHeader}>
        {category} Build ({items.length} component
        {items.length !== 1 ? "s" : ""})
      </Text>
      {items.map((item: OrderItem, index: number) => (
        <View key={index} style={styles.itemRow}>
          <Text style={styles.itemQuantity}>{item.Quantity}x</Text>
          <Text style={styles.itemName}>{item.ItemName}</Text>
          <Text style={styles.itemTotal}>
            R{(item.Quantity * item.UnitPrice).toFixed(2)}
          </Text>
        </View>
      ))}
    </View>
  );
  // ------------------------------------

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalBackButton}>
            <Text style={styles.modalBackButtonText}>{"< Back"}</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Order Details</Text>
          <View style={styles.modalSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.detailHeader}>
            Order #<Text style={styles.detailValue}>{order.OrderNumber}</Text>
          </Text>
          <Text style={styles.detailStatus}>
            Status: {order.Status.toUpperCase().replace("-", " ")}
          </Text>

          {/* Customer Info */}
          <View style={styles.infoBox}>
            <Text style={styles.sectionTitle}>Customer Info</Text>
            <Text style={styles.infoText}>Name: {order.CustomerName}</Text>
            <Text style={styles.infoText}>Email: {order.Email}</Text>
            <Text style={styles.infoText}>Phone: {order.Phone}</Text>
          </View>

          {/* Fulfillment Info */}
          <View style={styles.infoBox}>
            <Text style={styles.sectionTitle}>
              Fulfillment ({order.FulfillmentType.toUpperCase()})
            </Text>
            <Text style={styles.infoText}>{fulfillmentText}</Text>
          </View>

          {/* Items List (NOW CATEGORIZED) */}
          <View style={styles.itemsContainer}>
            <Text style={styles.sectionTitle}>
              Items ({order.Items.length})
            </Text>
            {/* 🚀 Render items grouped by category 🚀 */}
            {Object.entries(categorizedItems).map(([category, items]) =>
              renderCategoryGroup(category, items)
            )}
            {/* ------------------------------------- */}
          </View>

          {/* Summary */}
          <View style={styles.summaryContainer}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={styles.totalValue}>
              R{order.TotalAmount.toFixed(2)}
            </Text>
          </View>

          {/* Dates */}
          <View style={styles.dateInfoBox}>
            <Text style={styles.dateDetailText}>
              Placed On:{" "}
              <Text style={styles.dateValue}>
                {formatDate(order.CreatedAt)}
              </Text>
            </Text>
            {order.UpdatedAt && (
              <Text style={styles.dateDetailText}>
                Last Updated:{" "}
                <Text style={styles.dateValue}>
                  {formatDate(order.UpdatedAt)}
                </Text>
              </Text>
            )}
            {order.CompletedAt && (
              <Text style={styles.dateDetailText}>
                Completed:{" "}
                <Text style={styles.dateValue}>
                  {formatDate(order.CompletedAt)}
                </Text>
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ----------------------------------------------------------------
// Main Orders Component (REMAINS THE SAME)
// ----------------------------------------------------------------

export default function Orders() {
  const { user } = useAuth();
  const userId = user?.id;

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const {
    data: orders,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery<Order[]>({
    queryKey: ["userOrders", userId],
    queryFn: () => fetchOrdersForUser(userId!),
    enabled: !!userId,
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => setSelectedOrder(item)}
    >
      <View style={styles.cardRow}>
        <Text style={styles.orderNumber}>
          Order #<Text style={styles.orderNumberValue}>{item.OrderNumber}</Text>
        </Text>
        <Text style={styles.totalAmount}>R{item.TotalAmount.toFixed(2)}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.dateText}>{formatDate(item.CreatedAt)}</Text>
        <Text
          style={[
            styles.statusText,
            {
              backgroundColor:
                item.Status === "completed" ? "#10B981" : "#F59E0B",
            },
          ]}
        >
          {item.Status.toUpperCase().replace("-", " ")}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!userId) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>
          Please log in to view your orders.
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>
          Error loading orders. Pull down to retry.
        </Text>
      </View>
    );
  }

  if (isLoading && !isRefetching) {
    return (
      <View style={styles.messageContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.messageText}>Loading Orders...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.header}>My Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.Id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              You have not placed any orders yet.
            </Text>
          </View>
        }
        onRefresh={handleRefresh}
        refreshing={isRefetching}
      />

      {/* Detail Modal */}
      <OrderDetailModal
        isVisible={!!selectedOrder}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </SafeAreaView>
  );
}

// ----------------------------------------------------------------
// Stylesheet (UPDATED for category grouping)
// ----------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    padding: 15,
    paddingBottom: 10,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6B7280",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
  },
  // --- Order Card Styles (existing) ---
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: "#4F46E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  orderNumber: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },
  orderNumberValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#10B981",
  },
  dateText: {
    fontSize: 12,
    color: "#6B7280",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    color: "#FFFFFF",
  },
  // --- Modal Styles (existing) ---
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalBackButton: {
    padding: 10,
  },
  modalBackButtonText: {
    fontSize: 16,
    color: "#4F46E5",
    fontWeight: "600",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  modalSpacer: {
    width: 60,
  },
  modalContent: {
    padding: 20,
  },
  detailHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 5,
    color: "#4B5563",
  },
  detailValue: {
    fontWeight: "bold",
    color: "#1F2937",
  },
  detailStatus: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#F59E0B",
    marginBottom: 15,
  },
  infoBox: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4F46E5",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 3,
  },
  itemsContainer: {
    marginBottom: 20,
  },
  // 🚀 NEW Category Group Styles 🚀
  categoryGroupContainer: {
    backgroundColor: "#E0E7FF", // Light blue background for separation
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#4F46E5",
  },
  categoryHeader: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#9DAFE5",
    paddingBottom: 5,
  },
  // Item row styles adjusted slightly to fit within the group container
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5, // Reduced padding for compactness
    borderBottomWidth: 0, // Removed inner borders for cleaner look
    alignItems: "center",
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6B7280",
    width: 30,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
    paddingHorizontal: 10,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#10B981",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 2,
    borderTopColor: "#4F46E5",
    paddingTop: 15,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4F46E5",
  },
  dateInfoBox: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  dateDetailText: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 5,
  },
  dateValue: {
    fontWeight: "600",
    color: "#374151",
  },
});
