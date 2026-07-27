import React, { useState } from "react";
import { TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@/context/ThemeContext";
import { AnimatedPressable } from "./ui/AnimatedPressable";

const SEND_PATH =
  "M1.513 1.96a1.374 1.374 0 0 1 1.499-.21l19.335 9.215a1.147 1.147 0 0 1 0 2.07L3.012 22.25a1.374 1.374 0 0 1-1.947-1.46L2.49 12 1.065 3.21a1.375 1.375 0 0 1 .448-1.25Zm2.375 10.79-1.304 8.042L21.031 12 2.584 3.208l1.304 8.042h7.362a.75.75 0 0 1 0 1.5Z";

type Props = {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function Composer({ onSend, disabled, placeholder = "Type your message…" }: Props) {
  const { colors } = useTheme();
  const [text, setText] = useState("");

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 16,
        backgroundColor: colors.secondary,
      }}
    >
      <TextInput
        value={text}
        onChangeText={setText}
        editable={!disabled}
        placeholder={placeholder}
        placeholderTextColor={colors.tertiaryText}
        style={{
          flex: 1,
          color: colors.text,
          fontFamily: "Inter_400Regular",
          fontSize: 16,
          lineHeight: 22,
          maxHeight: 120,
          paddingVertical: 8,
        }}
        multiline
        onSubmitEditing={submit}
      />
      <AnimatedPressable
        onPress={submit}
        disabled={disabled || !text.trim()}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled || !text.trim() ? 0.4 : 1,
        }}
      >
        <Svg width={22} height={22} viewBox="0 0 24 24" fill={colors.text}>
          <Path d={SEND_PATH} />
        </Svg>
      </AnimatedPressable>
    </View>
  );
}
