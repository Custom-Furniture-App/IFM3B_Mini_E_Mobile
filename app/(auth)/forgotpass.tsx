import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { apiService } from "@/api/apiService"; // Assuming apiService is configured correctly

export default function ForgotPasswordScreen() {
  const router = useRouter();

  // State for the two-step flow: 'email' or 'reset'
  const [step, setStep] = useState("email");

  // Input states
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State for displaying errors on screen
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- Step 1: Check Email ---
  const handleCheckEmail = async () => {
    setError(""); // Clear previous errors

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await apiService.post("/Auth/check-email", { email });

      if (response.data.exists) {
        setStep("reset");
      } else {
        setError("No account found with this email.");
      }
    } catch (err) {
      setError("Failed to check email. Please try again later.");
      console.error("Email check error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Step 2: Reset Password ---
  const handleResetPassword = async () => {
    setError(""); // Clear previous errors

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setIsLoading(true);

      await apiService.post("/Auth/forgot-password", {
        email: email, // Use the stored email
        password: newPassword,
      });

      // Using the built-in alert for final success for immediate user notification
      alert("Success! Your password has been updated.");
      router.back();
    } catch (err) {
      setError(
        "Unable to update password. Please ensure your details are correct."
      );
      console.error("Password reset error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render based on Step ---
  const renderEmailStep = () => (
    <>
      <Text style={styles.title}>Find Your Account 📧</Text>

      <TextInput
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        onPress={handleCheckEmail}
        disabled={isLoading}
        style={styles.button}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Find Account</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderResetStep = () => (
    <>
      <Text style={styles.title}>Set New Password 🔒</Text>

      {/* 🌟 Display and Disable Email Input */}
      <TextInput
        placeholder="Email"
        value={email}
        editable={false} // Disable editing
        style={[styles.input, styles.disabledInput]}
      />
      {/* 🌟 End Display and Disable Email Input */}

      <TextInput
        placeholder="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        style={styles.input}
      />

      <TextInput
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        onPress={handleResetPassword}
        disabled={isLoading}
        style={styles.button}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Reset Password</Text>
        )}
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.container}>
      {step === "email" ? renderEmailStep() : renderResetStep()}

      <View style={styles.footer}>
        <Link href="/(auth)/login" style={styles.link}>
          Back to Login
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  // New style for disabled input to visually indicate it's read-only
  disabledInput: {
    backgroundColor: "#f5f5f5",
    color: "#777",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#007bff",
    borderRadius: 10,
    paddingVertical: 14,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
  footer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
  },
  link: {
    color: "#007bff",
    fontWeight: "500",
  },
});
