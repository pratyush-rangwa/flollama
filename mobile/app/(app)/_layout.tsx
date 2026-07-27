import { Stack } from "expo-router";
import React from "react";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade_from_bottom" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="chat/[id]" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}
