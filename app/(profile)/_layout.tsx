import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { Button } from "react-native";
import { useAuth } from "../../contexts/auth.context";

export default function ProfilesLayout() {
  // const { session, isLoading } = useAuth();

  // useEffect(() => {
  //   if (!isLoading && !session) {
  //     // Redirect to auth page if not authenticated
  //     router.replace("/auth");
  //   }
  // }, [session, isLoading]);

  // // Don't render anything while checking authentication
  // if (isLoading || !session) {
  //   return null;
  // }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
