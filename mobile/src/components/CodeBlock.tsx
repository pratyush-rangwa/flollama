import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { Text, View } from "react-native";
// @ts-expect-error - no bundled types for this package
import SyntaxHighlighter from "react-native-syntax-highlighter";
import { atomOneDark, atomOneLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { useTheme } from "@/context/ThemeContext";
import { AnimatedPressable } from "./ui/AnimatedPressable";

export function CodeBlock({ code, language }: { code: string; language?: string }) {
  const { isDark, colors } = useTheme();
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <View
      style={{
        borderRadius: 8,
        overflow: "hidden",
        marginVertical: 8,
        borderWidth: 1,
        borderColor: colors.stroke,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 6,
          backgroundColor: colors.tertiary,
        }}
      >
        <Text style={{ color: colors.tertiaryText, fontSize: 12, fontFamily: "Inter_400Regular" }}>
          {language || "text"}
        </Text>
        <AnimatedPressable onPress={onCopy} hitSlop={8}>
          <Text style={{ color: colors.accent, fontSize: 12, fontFamily: "Inter_500Medium" }}>
            {copied ? "Copied" : "Copy"}
          </Text>
        </AnimatedPressable>
      </View>
      <SyntaxHighlighter
        language={language || "text"}
        style={isDark ? atomOneDark : atomOneLight}
        highlighter="hljs"
        fontSize={13}
        customStyle={{ padding: 12, margin: 0 }}
      >
        {code}
      </SyntaxHighlighter>
    </View>
  );
}
