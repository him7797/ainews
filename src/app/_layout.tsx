import { Stack, router, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { getOnboardingCompleted } from "../lib/storage";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await getOnboardingCompleted();
        const inOnboardingGroup = segments[0] === "onboarding";
        
        if (!completed && !inOnboardingGroup) {
          router.replace("/onboarding");
        } else if (completed && inOnboardingGroup) {
          router.replace("/");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsReady(true);
      }
    };
    
    checkOnboarding();
  }, [segments]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
    </Stack>
  );
}
