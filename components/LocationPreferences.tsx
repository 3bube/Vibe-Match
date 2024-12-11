import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Slider } from "@rneui/themed";

interface LocationPreferencesProps {
  radius: number;
  onRadiusChange: (value: number) => void;
}

function LocationPreferences({
  radius = 10,
  onRadiusChange,
}: LocationPreferencesProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Maximum Distance</Text>
      <Slider
        minimumValue={1}
        maximumValue={100}
        step={1}
        value={radius}
        onValueChange={onRadiusChange}
        thumbStyle={styles.thumb}
        trackStyle={styles.track}
      />
      <Text style={styles.value}>{radius} km</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 8,
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  value: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  thumb: {
    backgroundColor: "#000",
  },
  track: {
    height: 4,
  },
});

export default LocationPreferences;
