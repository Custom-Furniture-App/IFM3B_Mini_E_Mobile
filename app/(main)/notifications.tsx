import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Button,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchNotificationsForUser, markNotificationAsRead } from "@/api/reactquery/notificationsApi";
import { Notification } from "@/types/common";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";


// --- Component ---

export default function Notifications() {
  // 1. Get userId from context
  const { user } = useAuth(); // Adjust this based on your actual context structure
  const userId = user?.id; // Safely access the user ID

  // React Query client for invalidation
  const queryClient = useQueryClient();

  // State for the modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);

  // 2. Fetch notifications using React Query
  const {
    data: notifications,
    isLoading,
    isError,
    error,
  } = useQuery<Notification[]>({
    queryKey: ["notifications", userId],
    queryFn: () => fetchNotificationsForUser(userId!),
    enabled: !!userId,
  });

  // 3. Mutation for marking as read
  const markReadMutation = useMutation({
    mutationFn: (notificationId: number) =>
      markNotificationAsRead(notificationId),
    onSuccess: (_, notificationId) => {
      // Invalidate the query to refetch or manually update the cache
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      // Optionally, update the local selected item if it's still open
      setSelectedNotification((prev) =>
        prev && prev.Id === notificationId ? { ...prev, IsRead: true } : prev
      );
    },
  });

  // --- Handlers ---

  const handleOpenNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setModalVisible(true);

    // 4. Mark as read logic
    if (!notification.IsRead) {
      markReadMutation.mutate(notification.Id);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedNotification(null);
  };

  // --- Render Functions ---

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading notifications...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Error fetching notifications: {error.message}
        </Text>
      </View>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No new notifications.</Text>
      </View>
    );
  }

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.item, !item.IsRead && styles.unreadItem]}
      onPress={() => handleOpenNotification(item)}
    >
      <View>
        <Text style={styles.title}>{item.Title}</Text>
        <Text numberOfLines={1} style={styles.message}>
          {item.Message}
        </Text>
        <Text style={styles.date}>
          {new Date(item.CreatedDate).toLocaleDateString()}
        </Text>
      </View>
      {!item.IsRead && <View style={styles.unreadBadge} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff" }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 10, marginRight: 5 }}
          accessibilityLabel="Go back"
        >
          <Text style={{ fontSize: 22 }}>{"‹"}</Text>
        </TouchableOpacity>
        <Text style={styles.header}>Your Notifications</Text>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.Id.toString()}
        renderItem={renderNotificationItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />


      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{selectedNotification?.Title}</Text>
            <Text style={styles.modalMessage}>
              {selectedNotification?.Message}
            </Text>
            <Text style={styles.modalDate}>
              Type: {selectedNotification?.NotificationType}
            </Text>
            <Text style={styles.modalDate}>
              Date:{" "}
              {new Date(
                selectedNotification?.CreatedDate || ""
              ).toLocaleString()}
            </Text>
            {markReadMutation.isPending && (
              <ActivityIndicator style={{ marginVertical: 10 }} size="small" />
            )}
            <Button title="Close" onPress={handleCloseModal} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};



// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  unreadItem: {
    backgroundColor: "#e6f7ff", // Light blue background for unread
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  message: {
    fontSize: 14,
    color: "#666",
  },
  date: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "red",
    marginLeft: 10,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
  // Modal Styles
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 15,
  },
  modalDate: {
    fontSize: 12,
    color: "#999",
    marginBottom: 5,
  },
});
