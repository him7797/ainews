import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useGoogleSignIn } from "../../services/authService";

export default function SignInScreen() {
  const { signIn, loading, error } = useGoogleSignIn();

  async function handleSignIn() {
    const result = await signIn();
    console.log("[sign-in] result:", JSON.stringify(result));
    if (result) {
      router.replace("/");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Brief</Text>
      <Text style={styles.subtitle}>AI news, curated for you.</Text>

      <TouchableOpacity style={styles.button} onPress={handleSignIn} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <AntDesign name="google" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>Sign in with Google</Text>
          </>
        )}
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 40,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 48,
  },
  button: {
    backgroundColor: "#4285F4",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    lineHeight: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    marginTop: 20,
    color: "#c0392b",
    textAlign: "center",
    fontSize: 14,
  },
});
