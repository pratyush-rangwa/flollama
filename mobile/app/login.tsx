import React, { useState } from "react";
import { Alert, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ContinueWithGoogleButton } from "@/components/ContinueWithGoogleButton";
import { LlamaLogo } from "@/components/LlamaLogo";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme";

// Fixed dark palette regardless of the user's theme preference — the login
// screen is full-bleed #141414 per Figma, independent of light/dark toggle
// (which only exists once you're signed in and inside the app).
const c = colors.dark;

export default function Login() {
  const { login } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  const handleLogin = async () => {
    setSigningIn(true);
    try {
      await login();
    } catch (err) {
      Alert.alert("Sign-in failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <StatusBar barStyle="light-content" backgroundColor={c.background} />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
        <LlamaLogo size={96} color={c.logicon} />
      </View>

      <View
        style={{
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          backgroundColor: c.popupBackground,
          paddingHorizontal: 24,
          paddingTop: 32,
        }}
      >
        <SafeAreaView edges={["bottom"]}>
          <Text
            style={{
              color: c.text,
              fontFamily: "Inter_700Bold",
              fontSize: 28,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Login to flollama
          </Text>
          <Text
            style={{
              color: c.secondaryText,
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              textAlign: "center",
              marginBottom: 28,
            }}
          >
            Sign in with your Google account to continue.
          </Text>
          <ContinueWithGoogleButton
            onPress={handleLogin}
            disabled={signingIn}
            backgroundColor={c.secondary}
            textColor={c.secondaryText}
          />
          <View style={{ height: 24 }} />
        </SafeAreaView>
      </View>
    </View>
  );
}
