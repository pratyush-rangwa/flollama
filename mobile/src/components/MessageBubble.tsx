import React, { useEffect } from "react";
import { Text, View } from "react-native";
import Markdown from "react-native-markdown-display";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { LocalMessage } from "@/store/chatStore";
import { CodeBlock } from "./CodeBlock";
import { AnimatedPressable } from "./ui/AnimatedPressable";

type Props = {
  message: LocalMessage;
  onRetry?: () => void;
};

export function MessageBubble({ message, onRetry }: Props) {
  const { colors } = useTheme();
  const isUser = message.role === "user";

  // Mount-only entrance: empty dep array means this fires once per bubble,
  // not on every streamed-token content update.
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 150 });
    translateY.value = withTiming(0, { duration: 150 });
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const markdownStyle = {
    body: {
      color: colors.text,
      fontFamily: "Poppins_400Regular",
      fontSize: 16,
    },
    code_inline: {
      backgroundColor: colors.tertiary,
      color: colors.text,
      borderRadius: 4,
      paddingHorizontal: 4,
    },
  };

  const rules = {
    fence: (node: any) => (
      <CodeBlock key={node.key} code={node.content?.trim?.() ?? ""} language={node.sourceInfo || node.info} />
    ),
    code_block: (node: any) => (
      <CodeBlock key={node.key} code={node.content?.trim?.() ?? ""} language={undefined} />
    ),
  };

  if (isUser) {
    return (
      <Animated.View style={[animatedStyle, { alignItems: "flex-end", width: "100%" }]}>
        <View
          style={{
            maxWidth: "80%",
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 12,
            backgroundColor: colors.secondary,
            opacity: message.status === "pending" ? 0.6 : 1,
          }}
        >
          <Markdown style={markdownStyle} rules={rules}>
            {message.content}
          </Markdown>
        </View>
        {message.status === "failed" && (
          <Text style={{ color: colors.dangerousText, fontSize: 12, marginTop: 4 }}>
            Failed to send
          </Text>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animatedStyle, { alignItems: "flex-start", width: "100%" }]}>
      <Markdown style={markdownStyle} rules={rules}>
        {message.content || " "}
      </Markdown>
      {message.status === "failed" && (
        <AnimatedPressable
          onPress={onRetry}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginTop: 4,
            paddingVertical: 4,
            paddingHorizontal: 8,
            borderRadius: 6,
            backgroundColor: colors.popupBackground,
          }}
        >
          <Text style={{ color: colors.dangerousText, fontSize: 13, fontFamily: "Inter_500Medium" }}>
            ↻ Retry
          </Text>
        </AnimatedPressable>
      )}
    </Animated.View>
  );
}
