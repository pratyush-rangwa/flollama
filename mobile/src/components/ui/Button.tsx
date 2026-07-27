import React from "react";
import { PressableProps, Text, View, ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { AnimatedPressable } from "./AnimatedPressable";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "dangerous"
  | "dangerous-outline"
  | "link"
  | "sidebar";

type ButtonProps = PressableProps & {
  children: React.ReactNode;
  variant?: Variant;
  active?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

/**
 * Mirrors next/src/components/ui/Button.jsx's variant set 1:1
 * (PrimaryButton/SecondaryButton/OutlineButton/LinkButton/SidebarButton/
 * DangerousButton/DangerousOutlineButton), styled from globals.scss's
 * .pri-button/.sec-button/etc rules via theme.ts colors.
 */
export function Button({
  children,
  variant = "primary",
  active = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();

  const base: ViewStyle = {
    flexDirection: "row",
    justifyContent: variant === "sidebar" ? "flex-start" : "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: variant === "sidebar" ? 12 : 24,
    borderRadius: variant === "sidebar" ? 6 : 8,
    opacity: disabled ? 0.5 : 1,
    alignSelf: fullWidth ? "stretch" : "flex-start",
  };

  let variantStyle: ViewStyle = {};
  let textColor = colors.text;

  switch (variant) {
    case "primary":
      variantStyle = { backgroundColor: colors.primary };
      textColor = colors.secondary;
      break;
    case "secondary":
      variantStyle = { backgroundColor: colors.secondary };
      textColor = colors.text;
      break;
    case "outline":
      variantStyle = {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: colors.stroke,
      };
      textColor = colors.text;
      break;
    case "dangerous":
      variantStyle = { backgroundColor: colors.dangerous };
      textColor = "#ffffff";
      break;
    case "dangerous-outline":
      variantStyle = {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: colors.dangerous,
      };
      textColor = colors.dangerousText;
      break;
    case "link":
      variantStyle = { backgroundColor: "transparent" };
      textColor = colors.text;
      break;
    case "sidebar":
      variantStyle = {
        backgroundColor: active ? colors.secondary : "transparent",
      };
      textColor = colors.text;
      break;
  }

  return (
    <AnimatedPressable
      disabled={disabled}
      style={[base, variantStyle, style]}
      {...props}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {typeof children === "string" ? (
          <Text
            style={{
              color: textColor,
              fontFamily: "Inter_400Regular",
              fontSize: 18,
            }}
          >
            {children}
          </Text>
        ) : (
          <ButtonTextColorContext.Provider value={textColor}>
            {children}
          </ButtonTextColorContext.Provider>
        )}
      </View>
    </AnimatedPressable>
  );
}

export const ButtonTextColorContext = React.createContext<string>("#000000");

export function PrimaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="primary" {...props} />;
}
export function SecondaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="secondary" {...props} />;
}
export function OutlineButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="outline" {...props} />;
}
export function LinkButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="link" {...props} />;
}
export function SidebarButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="sidebar" {...props} />;
}
export function DangerousButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="dangerous" {...props} />;
}
export function DangerousOutlineButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="dangerous-outline" {...props} />;
}
