import { router, Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Entypo, Feather } from "@expo/vector-icons";

export default function SwipeScreenLayout() {
  const handleChatPress = () => {
    router.push("/(messages)");
  };

  // const handleSettingsPress = () => {
  //   router.push("/(settings)");
  // }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerTitle: "",
            headerRight: () => (
              <Feather name="settings" size={24} color="black" />
            ),
            headerLeft: () => (
              <Entypo
                name="chat"
                size={24}
                color="black"
                onPress={handleChatPress}
              />
            ),
            headerBackVisible: false,
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
