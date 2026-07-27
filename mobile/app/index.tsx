import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";

// Entry route. No landing page — AuthGate in the root layout redirects to
// /login or /(app) as soon as auth state resolves. This just covers the
// brief moment before that redirect fires.
export default function Index() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={colors.text} />
    </View>
  );
}
