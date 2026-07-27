import React from "react";
import { Text } from "react-native";
import { GoogleGLogo } from "./GoogleGLogo";
import { AnimatedPressable } from "./ui/AnimatedPressable";

type Props = {
  onPress: () => void;
  disabled?: boolean;
  backgroundColor: string;
  textColor: string;
};

// Figma's login sheet uses a fully-rounded pill for this button, unlike the
// web's radius-8 .google-button — a deliberate mobile-specific departure.
export function ContinueWithGoogleButton({ onPress, disabled, backgroundColor, textColor }: Props) {
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 999,
        backgroundColor,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <GoogleGLogo size={20} />
      <Text style={{ color: textColor, fontFamily: "Inter_500Medium", fontSize: 16 }}>
        Continue with Google
      </Text>
    </AnimatedPressable>
  );
}
