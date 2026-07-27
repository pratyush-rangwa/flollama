import * as Clipboard from "expo-clipboard";
import React, { useMemo, useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { CodeToken, resolveLanguage, tokenizeCode } from "@/lib/highlightCode";
import { AnimatedPressable } from "./ui/AnimatedPressable";

const MONOSPACE = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

// Loosely VS Code Dark+/Light+ inspired — small, deliberate palette rather
// than pulling in a full highlight.js theme stylesheet.
const TOKEN_COLORS: Record<string, { dark: string; light: string }> = {
  comment: { dark: "#6a9955", light: "#008000" },
  prolog: { dark: "#6a9955", light: "#008000" },
  doctype: { dark: "#6a9955", light: "#008000" },
  cdata: { dark: "#6a9955", light: "#008000" },
  string: { dark: "#ce9178", light: "#a31515" },
  char: { dark: "#ce9178", light: "#a31515" },
  attr_value: { dark: "#ce9178", light: "#a31515" },
  keyword: { dark: "#569cd6", light: "#0000ff" },
  boolean: { dark: "#569cd6", light: "#0000ff" },
  operator: { dark: "#d4d4d4", light: "#000000" },
  punctuation: { dark: "#d4d4d4", light: "#000000" },
  number: { dark: "#b5cea8", light: "#098658" },
  function: { dark: "#dcdcaa", light: "#795e26" },
  "class-name": { dark: "#4ec9b0", light: "#267f99" },
  builtin: { dark: "#4ec9b0", light: "#267f99" },
  tag: { dark: "#569cd6", light: "#800000" },
  attr_name: { dark: "#9cdcfe", light: "#ff0000" },
  property: { dark: "#9cdcfe", light: "#001080" },
  regex: { dark: "#d16969", light: "#811f3f" },
  important: { dark: "#569cd6", light: "#0000ff" },
  selector: { dark: "#d7ba7d", light: "#800000" },
};

function tokenColor(type: string, isDark: boolean, fallback: string): string {
  const entry = TOKEN_COLORS[type];
  if (!entry) return fallback;
  return isDark ? entry.dark : entry.light;
}

function renderTokens(tokens: CodeToken[], isDark: boolean, fallback: string, keyPrefix = ""): React.ReactNode[] {
  return tokens.map((token, i) => {
    const key = `${keyPrefix}${i}`;
    if (typeof token === "string") {
      return (
        <Text key={key} style={{ color: fallback }}>
          {token}
        </Text>
      );
    }
    const color = tokenColor(token.type, isDark, fallback);
    const content = token.content;
    if (typeof content === "string") {
      return (
        <Text key={key} style={{ color }}>
          {content}
        </Text>
      );
    }
    return (
      <Text key={key} style={{ color }}>
        {renderTokens(content, isDark, fallback, `${key}-`)}
      </Text>
    );
  });
}

export function CodeBlock({ code, language }: { code: string; language?: string }) {
  const { isDark, colors } = useTheme();
  const [copied, setCopied] = useState(false);

  const trimmed = code.replace(/\n$/, "");
  const resolvedLanguage = resolveLanguage(language);
  const tokens = useMemo(() => tokenizeCode(trimmed, language), [trimmed, language]);

  const onCopy = async () => {
    await Clipboard.setStringAsync(trimmed);
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
          {resolvedLanguage || language || "text"}
        </Text>
        <AnimatedPressable onPress={onCopy} hitSlop={8}>
          <Text style={{ color: colors.accent, fontSize: 12, fontFamily: "Inter_500Medium" }}>
            {copied ? "Copied" : "Copy"}
          </Text>
        </AnimatedPressable>
      </View>
      <ScrollView horizontal bounces={false} style={{ backgroundColor: isDark ? "#1e1e1e" : "#fafafa" }}>
        <Text
          selectable
          style={{
            fontFamily: MONOSPACE,
            fontSize: 13,
            lineHeight: 19,
            padding: 12,
          }}
        >
          {renderTokens(tokens, isDark, isDark ? "#d4d4d4" : "#1c1c1c")}
        </Text>
      </ScrollView>
    </View>
  );
}
