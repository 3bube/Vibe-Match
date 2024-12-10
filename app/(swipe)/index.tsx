import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { useNavigation } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import {
  fetchProfiles,
  handleSwipeLeft,
  handleSwipeRight,
} from "../../utils/profile.utils";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/auth.context";

const { width, height } = Dimensions.get("window");
const SWIPE_THRESHOLD = 120;

export default function Swipe() {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { user } = useAuth();

  const {
    data: profiles = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => await fetchProfiles(),
  });

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardRotate = useSharedValue(0);
  const likeOpacity = useSharedValue(0);
  const nopeOpacity = useSharedValue(0);

  const panRef = useRef(null);

  const resetPosition = useCallback(() => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    cardRotate.value = withSpring(0);
    likeOpacity.value = withSpring(0);
    nopeOpacity.value = withSpring(0);
  }, [translateX, translateY, cardRotate, likeOpacity, nopeOpacity]);

  const handleSwipe = useCallback(
    (direction) => {
      if (direction === "right") {
        handleSwipeRight(profiles[currentIndex]);
      } else {
        handleSwipeLeft(profiles[currentIndex]);
      }

      setCurrentIndex((prev) => {
        if (prev === profiles.length - 1) {
          // Reset to the first profile if we've reached the end
          return 0;
        }
        return prev + 1;
      });

      resetPosition();
    },
    [currentIndex, profiles, resetPosition]
  );

  const onGestureEvent = useCallback(
    (event) => {
      translateX.value = event.nativeEvent.translationX;
      translateY.value = event.nativeEvent.translationY;
      cardRotate.value = interpolate(
        translateX.value,
        [-width / 2, 0, width / 2],
        [-10, 0, 10],
        Extrapolate.CLAMP
      );
      likeOpacity.value = interpolate(
        translateX.value,
        [0, width / 4],
        [0, 1],
        Extrapolate.CLAMP
      );
      nopeOpacity.value = interpolate(
        translateX.value,
        [-width / 4, 0],
        [1, 0],
        Extrapolate.CLAMP
      );
    },
    [translateX, translateY, cardRotate, likeOpacity, nopeOpacity]
  );

  const onHandlerStateChange = useCallback(
    (event) => {
      if (event.nativeEvent.oldState === State.ACTIVE) {
        const translationX = event.nativeEvent.translationX;
        const translationY = event.nativeEvent.translationY;

        if (Math.abs(translationX) > SWIPE_THRESHOLD) {
          const direction = translationX > 0 ? "right" : "left";
          translateX.value = withTiming(
            direction === "right" ? width : -width,
            {},
            () => runOnJS(handleSwipe)(direction)
          );
        } else {
          resetPosition();
        }
      }
    },
    [translateX, handleSwipe, resetPosition]
  );

  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${cardRotate.value}deg` },
      ],
    };
  });

  const likeStyle = useAnimatedStyle(() => {
    return {
      opacity: likeOpacity.value,
    };
  });

  const nopeStyle = useAnimatedStyle(() => {
    return {
      opacity: nopeOpacity.value,
    };
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading profiles...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading profiles</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noProfilesText}>No more profiles available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <View style={styles.container}>
      <PanGestureHandler
        ref={panRef}
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View style={[styles.card, cardStyle]}>
          <Image
            source={{ uri: currentProfile.photo_url }}
            style={styles.image}
          />
          <View style={styles.infoContainer}>
            <Text style={styles.name}>{currentProfile.name ?? "Unknown"}</Text>
            <Text style={styles.age}>{currentProfile.age ?? "Unknown"}</Text>
          </View>
          <Text style={styles.bio}>{currentProfile.bio}</Text>
          <Animated.View style={[styles.likeStamp, likeStyle]}>
            <Text style={styles.stampText}>LIKE</Text>
          </Animated.View>
          <Animated.View style={[styles.nopeStamp, nopeStyle]}>
            <Text style={styles.stampText}>NOPE</Text>
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.nopeButton]}
          onPress={() => handleSwipe("left")}
        >
          <Ionicons name="close" size={30} color="#F06795" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.likeButton]}
          onPress={() => handleSwipe("right")}
        >
          <Ionicons name="heart" size={30} color="#64EDCC" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  card: {
    width: width * 0.9,
    height: height * 0.7,
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.36,
    shadowRadius: 6.68,
    elevation: 11,
  },
  image: {
    width: "100%",
    height: "70%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    padding: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    marginRight: 10,
  },
  age: {
    fontSize: 22,
    color: "#666",
  },
  bio: {
    fontSize: 16,
    color: "#666",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  likeStamp: {
    position: "absolute",
    top: 50,
    right: 40,
    transform: [{ rotate: "30deg" }],
  },
  nopeStamp: {
    position: "absolute",
    top: 50,
    left: 40,
    transform: [{ rotate: "-30deg" }],
  },
  stampText: {
    fontSize: 32,
    fontWeight: "bold",
    textTransform: "uppercase",
    borderWidth: 4,
    borderRadius: 10,
    padding: 8,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    paddingVertical: 20,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nopeButton: {
    backgroundColor: "#fff",
  },
  likeButton: {
    backgroundColor: "#fff",
  },
  loadingText: {
    fontSize: 18,
    color: "#666",
  },
  errorText: {
    fontSize: 18,
    color: "#F06795",
    marginBottom: 20,
  },
  noProfilesText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#64EDCC",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
