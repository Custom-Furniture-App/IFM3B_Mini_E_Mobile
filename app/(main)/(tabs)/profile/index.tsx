import { useAuth } from "@/context/AuthContext";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform, // Import Platform for OS-specific logic
  KeyboardAvoidingView, // Import KeyboardAvoidingView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Define a simple custom type for the props for clarity
interface UserData {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  address?: string;
}

// Helper to get initials for the circle
const getInitials = (fullName: string): string => {
  if (!fullName) return "";
  const names = fullName.split(" ");
  return names
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

export default function Profile() {
  const { user } = useAuth();
  const userData: UserData | null = user as UserData | null;

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: userData?.fullName || "",
    email: userData?.email || "",
    phone: userData?.phone || "",
    role: userData?.role || "",
    address: userData?.address || "",
  });

  if (!userData) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>
          Please log in to view your profile.
        </Text>
      </View>
    );
  }

  const toggleEdit = () => {
    if (isEditing) {
      // Logic for saving changes goes here
      console.log("Saving changes:", profileData);
      // TODO: Add API call to update user data
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (
    field: keyof typeof profileData,
    value: string
  ) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const initials = getInitials(profileData.fullName);

  return (
    // 1. Wrap the entire screen in SafeAreaView
    <SafeAreaView style={styles.container}>
      {/* 2. Wrap the scrollable content and button in KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20} // Adjust this offset as needed
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* --- Profile Avatar Circle --- */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.fullNameText}>{profileData.fullName}</Text>
          </View>

          {/* --- Information Inputs --- */}
          <ProfileInput
            label="Full Name"
            value={profileData.fullName}
            onChangeText={(text) => handleInputChange("fullName", text)}
            editable={isEditing}
          />
          <ProfileInput
            label="Email"
            value={profileData.email}
            onChangeText={(text) => handleInputChange("email", text)}
            editable={isEditing}
            keyboardType="email-address"
          />
          <ProfileInput
            label="Phone"
            value={profileData.phone}
            onChangeText={(text) => handleInputChange("phone", text)}
            editable={isEditing}
            keyboardType="phone-pad"
          />
          <ProfileInput
            label="Role"
            value={profileData.role}
            onChangeText={(text) => handleInputChange("role", text)}
            editable={false}
          />
          <ProfileInput
            label="Address"
            value={profileData.address}
            onChangeText={(text) => handleInputChange("address", text)}
            editable={isEditing}
            multiline
          />

          {/* Extra padding to ensure the last input is visible above the fixed button */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* --- Edit/Save Button (Fixed at bottom) --- */}
        {/* NOTE: This button is placed *inside* the KeyboardAvoidingView 
           to allow KAV to correctly calculate space, but we keep its position styling */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            onPress={toggleEdit}
            style={[styles.editButton, isEditing && styles.saveButton]}
          >
            <Text style={styles.buttonText}>
              {isEditing ? "Save Changes" : "Edit Profile"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Reusable Input Component ---
interface ProfileInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  editable: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  multiline?: boolean;
}

const ProfileInput: React.FC<ProfileInputProps> = ({
  label,
  value,
  onChangeText,
  editable,
  keyboardType = "default",
  multiline = false,
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        !editable && styles.disabledInput,
        multiline && { height: 80, textAlignVertical: "top" },
      ]}
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      keyboardType={keyboardType}
      placeholder={`Enter ${label}`}
      multiline={multiline}
    />
  </View>
);

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "red",
  },
  scrollContent: {
    padding: 20,
    // Ensure bottom padding is enough to see the last input above the fixed button
    paddingBottom: 120,
  },

  // Avatar Styles (rest of avatar styles omitted for brevity)
  avatarContainer: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
  },
  fullNameText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
  },

  // Input Styles (rest of input styles omitted for brevity)
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: "#333",
  },
  disabledInput: {
    backgroundColor: "#eee",
    color: "#777",
  },

  // Button Styles (Fixed at Bottom)
  bottomContainer: {
    // The position is relative to the KeyboardAvoidingView,
    // which manages the overall screen height.
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30, // Increase padding bottom for safety and visual appeal
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  editButton: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#28a745",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
