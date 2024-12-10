import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "../context/auth";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inDashboardGroup = segments[0] === "(dashboard)";

    if (!user && !inAuthGroup) {
      // Redirect to auth if not logged in and not in auth group
      router.replace("/index");
    } else if (user && inAuthGroup) {
      // Redirect to dashboard if logged in and in auth group
      router.replace("/(dashboard)");
    }
  }, [user, loading, segments]);

  return children;
}
