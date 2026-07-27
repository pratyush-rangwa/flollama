import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { Composer } from "@/components/Composer";
import { MessageList } from "@/components/MessageList";
import { PrimaryButton } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { doesChatExist, loadChatMessages } from "@/lib/chatService";
import { useChatStore } from "@/store/chatStore";

export default function ChatThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const messages = useChatStore((s) => s.messagesByChat[id] ?? []);
  const loading = useChatStore((s) => s.loadingByChat[id] ?? false);
  const hydrate = useChatStore((s) => s.hydrateFromFirestore);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const createChatAndSend = useChatStore((s) => s.createChatAndSend);
  const retryLastReply = useChatStore((s) => s.retryLastReply);

  const [existsState, setExistsState] = useState<"checking" | "found" | "missing">(
    isNew ? "found" : "checking"
  );

  useEffect(() => {
    if (isNew || !user) return;

    const unsubExists = doesChatExist(user.uid, id, (exists) => {
      setExistsState(exists ? "found" : "missing");
    });
    const unsubMessages = loadChatMessages(user.uid, id, (stored) => {
      hydrate(id, stored);
    });

    return () => {
      unsubExists();
      unsubMessages();
    };
  }, [id, isNew, user]);

  if (!user) return null;

  const onSend = (text: string) => {
    if (isNew) {
      const { chatId } = createChatAndSend(user.uid, text);
      // chatId is generated synchronously — navigate instantly, the user's
      // message is already visible (optimistic) in the store under it while
      // title summarization + the Firestore write resolve in the background.
      router.replace(`/chat/${chatId}`);
      return;
    }
    sendMessage(user.uid, id, text);
  };

  if (existsState === "checking") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  if (existsState === "missing") {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
        }}
      >
        <Text style={{ color: colors.text, fontFamily: "Inter_700Bold", fontSize: 24, textAlign: "center" }}>
          Chat not found
        </Text>
        <PrimaryButton onPress={() => router.replace("/(app)")}>Go to chats</PrimaryButton>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <MessageList messages={messages} onRetry={() => retryLastReply(user.uid, id)} />
      <Composer onSend={onSend} disabled={loading} />
    </KeyboardAvoidingView>
  );
}
