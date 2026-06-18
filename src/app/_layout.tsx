import { Stack, router, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { getJwt, getOnboardingCompleted } from "../lib/storage";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [onboardingCompleted, jwt] = await Promise.all([
          getOnboardingCompleted(),
          getJwt(),
        ]);

        const segment = segments[0] as string | undefined;
        const inOnboardingGroup = segment === "onboarding";
        const inAuthGroup = segment === "auth";

        if (!onboardingCompleted && !inOnboardingGroup) {
          router.replace("/onboarding");
        } else if (onboardingCompleted && inOnboardingGroup) {
          router.replace("/");
        } else if (onboardingCompleted && !jwt && !inAuthGroup) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          router.replace("/auth/sign-in" as any);
        } else if (onboardingCompleted && jwt && inAuthGroup) {
          router.replace("/");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsReady(true);
      }
    };

    checkAuth();
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
      <Stack.Screen name="auth/sign-in" options={{ headerShown: false }} />
    </Stack>
  );
}
