import React from "react";
import { Text } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { AnimatedPressable } from "./ui/AnimatedPressable";

export function JumpToLatestPill({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(120)}
      exiting={FadeOut.duration(120)}
      style={{ position: "absolute", bottom: 12, alignSelf: "center" }}
    >
      <AnimatedPressable
        onPress={onPress}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 20,
          backgroundColor: colors.popupBackground,
          borderWidth: 1,
          borderColor: colors.stroke,
        }}
      >
        <Text style={{ color: colors.text, fontFamily: "Inter_500Medium", fontSize: 14 }}>
          ↓ Jump to latest
        </Text>
      </AnimatedPressable>
    </Animated.View>
  );
}
