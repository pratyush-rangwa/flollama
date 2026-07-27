import React, { useRef, useState } from "react";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, View } from "react-native";
import { LocalMessage } from "@/store/chatStore";
import { JumpToLatestPill } from "./JumpToLatestPill";
import { MessageBubble } from "./MessageBubble";

type Props = {
  messages: LocalMessage[];
  onRetry: () => void;
};

const NEAR_BOTTOM_THRESHOLD = 80;

export function MessageList({ messages, onRetry }: Props) {
  const listRef = useRef<FlatList<LocalMessage>>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const scrollToBottom = (animated = true) => {
    listRef.current?.scrollToOffset({ offset: 0, animated });
    setUserScrolledUp(false);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // List is rendered inverted, so "near bottom" (latest message) is offset ~0.
    const offsetY = e.nativeEvent.contentOffset.y;
    setUserScrolledUp(offsetY > NEAR_BOTTOM_THRESHOLD);
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={listRef}
        data={[...messages].reverse()}
        inverted
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 20, gap: 12 }}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            onRetry={item.status === "failed" ? onRetry : undefined}
          />
        )}
        onScroll={onScroll}
        scrollEventThrottle={32}
        onContentSizeChange={() => {
          if (!userScrolledUp) scrollToBottom(false);
        }}
      />
      {userScrolledUp && <JumpToLatestPill onPress={() => scrollToBottom(true)} />}
    </View>
  );
}
