import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import React, { forwardRef, useCallback } from "react";
import { Alert, Text, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { clearAllChats } from "@/lib/chatService";
import { logger } from "@/lib/logger";
import { DangerousButton, DangerousOutlineButton, SecondaryButton } from "./ui/Button";

export type SettingsSheetHandle = React.ElementRef<typeof BottomSheet>;

export const SettingsSheet = forwardRef<SettingsSheetHandle>((_props, ref) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  const confirmClear = () => {
    Alert.alert(
      "Clear all conversations?",
      "This permanently deletes every chat. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            try {
              await clearAllChats(user.uid);
            } catch (err) {
              logger.error("clearAllChats failed", err);
              Alert.alert("Something went wrong", "Couldn't clear conversations.");
            }
          },
        },
      ]
    );
  };

  const confirmLogout = () => {
    Alert.alert("Log out?", "You'll need to sign in again to see your chats.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => logout() },
    ]);
  };

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={["45%"]}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.popupBackground }}
      handleIndicatorStyle={{ backgroundColor: colors.stroke }}
    >
      <BottomSheetView style={{ padding: 20, gap: 20 }}>
        <Text style={{ color: colors.text, fontFamily: "Inter_500Medium", fontSize: 24 }}>
          Settings
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: colors.text, fontFamily: "Inter_400Regular", fontSize: 18 }}>
            Theme
          </Text>
          <SecondaryButton onPress={toggleTheme}>
            {isDark ? "Light mode" : "Dark mode"}
          </SecondaryButton>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: colors.text, fontFamily: "Inter_400Regular", fontSize: 18 }}>
            Clear all conversations
          </Text>
          <DangerousOutlineButton onPress={confirmClear}>Clear</DangerousOutlineButton>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: colors.text, fontFamily: "Inter_400Regular", fontSize: 18 }}>
            Logout
          </Text>
          <DangerousButton onPress={confirmLogout}>Logout</DangerousButton>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
});
SettingsSheet.displayName = "SettingsSheet";
