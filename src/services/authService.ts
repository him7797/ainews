import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { useCallback, useState } from "react";
import { saveJwt } from "../lib/storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  scopes: ["openid", "email"],
});

export type AuthUser = {
  id: string;
  email: string;
  createdAt: string;
};

type SignInResult = {
  user: AuthUser;
  isNewUser: boolean;
};

export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async (): Promise<SignInResult | null> => {
    setLoading(true);
    setError(null);

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;

      console.log("[auth] Google signIn result type:", response.type);

      if (response.type === "cancelled") {
        setError("Sign-in cancelled. Tap below to try again.");
        return null;
      }

      if (!idToken) {
        console.log("[auth] no idToken in response");
        setError("Sign-in failed. Please try again.");
        return null;
      }

      const apiResponse = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await apiResponse.json() as { token?: string; user?: AuthUser; isNewUser?: boolean; error?: string; message?: string };

      if (!apiResponse.ok) {
        const errorMessages: Record<string, string> = {
          invalid_id_token: "Sign-in failed. Please try again.",
          email_not_verified: "Your Google account email must be verified.",
          internal_error: "An unexpected error occurred. Please try again.",
        };
        setError(errorMessages[data.error ?? ""] ?? "Sign-in failed. Please try again.");
        return null;
      }

      await saveJwt(data.token!);
      // Returning user (HTTP 200) and new user (HTTP 201) are handled identically:
      // same JWT storage and navigation — no separate code path needed.
      return { user: data.user!, isNewUser: data.isNewUser! };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      console.log("[auth] error code:", code, "message:", (err as { message?: string })?.message);
      if (code === statusCodes.SIGN_IN_CANCELLED) {
        setError("Sign-in cancelled. Tap below to try again.");
      } else if (code === statusCodes.IN_PROGRESS) {
        setError("Sign-in already in progress.");
      } else {
        setError("Could not connect. Check your internet connection.");
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { signIn, loading, error, setError };
}
