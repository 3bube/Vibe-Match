import * as Location from "expo-location";
import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";

// Function to get user's current location
export async function getUserLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Permission Denied",
      "Location permission is required to match users."
    );
    return null;
  }

  const location = await Location.getCurrentPositionAsync({});

  return location.coords;
}

// Function to update user location in the database
export async function updateUserLocation(
  userId: string,
  latitude: number,
  longitude: number
) {
  const radius = calculateRadius(latitude, longitude);

  const { error } = await supabase
    .from("profiles")
    .update({ latitude, longitude, radius })
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating location:", error);
    Alert.alert("Error", "Failed to update location.");
  }
}

// Function to find users within a certain radius
export async function findUsersWithinRadius(userId: string, radius: number) {
  const { data: user, error: userError } = await supabase
    .from("profiles")
    .select("latitude, longitude")
    .eq("user_id", userId)
    .single();

  if (userError || !user) {
    console.error("Error fetching user location:", userError);
    return [];
  }

  const { latitude, longitude } = user;

  // Fetch users within the radius using the Haversine formula
  const { data: nearbyUsers, error: nearbyError } = await supabase.rpc(
    "get_nearby_users",
    {
      user_lat: latitude,
      user_lon: longitude,
      radius_km: radius,
    }
  );

  if (nearbyError) {
    console.error("Error fetching nearby users:", nearbyError);
    return [];
  }

  return nearbyUsers;
}

// Function to calculate radius based with latitude and longitude
export function calculateRadius(latitude: number, longitude: number) {
  const radius =
    6371 *
    Math.acos(
      Math.cos((latitude * Math.PI) / 180) *
        Math.cos((latitude * Math.PI) / 180) *
        Math.cos((longitude * Math.PI) / 180) *
        Math.cos((longitude * Math.PI) / 180)
    );
  return radius;
}
