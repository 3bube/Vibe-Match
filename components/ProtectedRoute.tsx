import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "../context/auth";
import type { PropsWithChildren } from "react";

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    
    if (!user && !inAuthGroup) {
      // Redirect to auth if not logged in and not in auth group
      router.replace("/auth");
    } else if (user && inAuthGroup) {
      // Redirect to main app if logged in and in auth group
      router.replace("/(chat)");
    }
  }, [user, loading, segments]);

  return children;
}
