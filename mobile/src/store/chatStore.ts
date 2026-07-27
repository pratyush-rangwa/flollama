import { create } from "zustand";
import { ChatMessage, ChatStreamError, streamChat, summarizeTitle } from "@/lib/api";
import { appendMessage, createChat, StoredMessage } from "@/lib/chatService";
import { generateId } from "@/lib/id";
import { logger } from "@/lib/logger";

export type MessageStatus = "pending" | "sent" | "failed" | "streaming";

export type LocalMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: MessageStatus;
  createdAtMs: number;
};

type ChatState = {
  /** Local view of each chat's messages, keyed by chatId. Optimistic (pending/failed)
   *  messages live here even before Firestore's onSnapshot confirms them. */
  messagesByChat: Record<string, LocalMessage[]>;
  /** True while an assistant reply is being requested/streamed for a chat. */
  loadingByChat: Record<string, boolean>;

  hydrateFromFirestore: (chatId: string, stored: StoredMessage[]) => void;
  createChatAndSend: (
    uid: string,
    text: string
  ) => { chatId: string; promise: Promise<void> };
  sendMessage: (uid: string, chatId: string, text: string) => Promise<void>;
  retryLastReply: (uid: string, chatId: string) => Promise<void>;
  clearChat: (chatId: string) => void;
};

function toLocal(m: StoredMessage): LocalMessage {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    status: "sent",
    createdAtMs: m.createdAt?.toMillis?.() ?? Date.now(),
  };
}

async function runAssistantReply(
  set: (fn: (s: ChatState) => Partial<ChatState>) => void,
  get: () => ChatState,
  uid: string,
  chatId: string,
  history: ChatMessage[]
) {
  const streamingId = generateId();

  set((s) => ({
    loadingByChat: { ...s.loadingByChat, [chatId]: true },
    messagesByChat: {
      ...s.messagesByChat,
      [chatId]: [
        ...(s.messagesByChat[chatId] ?? []),
        {
          id: streamingId,
          role: "assistant",
          content: "",
          status: "streaming",
          createdAtMs: Date.now(),
        },
      ],
    },
  }));

  const applyToken = (chunk: string) => {
    set((s) => ({
      messagesByChat: {
        ...s.messagesByChat,
        [chatId]: (s.messagesByChat[chatId] ?? []).map((m) =>
          m.id === streamingId ? { ...m, content: m.content + chunk } : m
        ),
      },
    }));
  };

  try {
    const full = await streamChat(history, { onToken: applyToken });

    await appendMessage(uid, chatId, { role: "assistant", content: full });

    // Firestore's onSnapshot will hydrate the real message in shortly; drop
    // our streaming placeholder now that it's been persisted.
    set((s) => ({
      loadingByChat: { ...s.loadingByChat, [chatId]: false },
      messagesByChat: {
        ...s.messagesByChat,
        [chatId]: (s.messagesByChat[chatId] ?? []).filter((m) => m.id !== streamingId),
      },
    }));
  } catch (err) {
    logger.error("assistant reply failed", err);
    const dropped = err instanceof ChatStreamError && err.dropped;
    set((s) => ({
      loadingByChat: { ...s.loadingByChat, [chatId]: false },
      messagesByChat: {
        ...s.messagesByChat,
        [chatId]: (s.messagesByChat[chatId] ?? []).map((m) =>
          m.id === streamingId
            ? {
                ...m,
                status: "failed",
                content: dropped && m.content ? m.content : "",
              }
            : m
        ),
      },
    }));
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  messagesByChat: {},
  loadingByChat: {},

  hydrateFromFirestore: (chatId, stored) => {
    set((s) => {
      const local = s.messagesByChat[chatId] ?? [];
      const serverIds = new Set(stored.map((m) => m.id));
      // Keep any locally-pending/failed messages Firestore doesn't know about
      // yet (e.g. a failed retry-able assistant reply), drop everything else
      // local since the server copy now supersedes it.
      const stillLocalOnly = local.filter(
        (m) => (m.status === "pending" || m.status === "failed") && !serverIds.has(m.id)
      );
      return {
        messagesByChat: {
          ...s.messagesByChat,
          [chatId]: [...stored.map(toLocal), ...stillLocalOnly],
        },
      };
    });
  },

  clearChat: (chatId) => {
    set((s) => {
      const { [chatId]: _drop, ...rest } = s.messagesByChat;
      return { messagesByChat: rest };
    });
  },

  /**
   * Explicit "create chat" action (not a length===1 useEffect like the web
   * app). The chatId is generated client-side synchronously so the caller
   * can navigate to the thread screen immediately; title summarization and
   * the Firestore write happen in the background inside the returned
   * promise, with the user's own message already visible optimistically.
   */
  createChatAndSend: (uid, text) => {
    const trimmed = text.trim();
    const chatId = generateId();
    const userMsgId = generateId();

    set((s) => ({
      messagesByChat: {
        ...s.messagesByChat,
        [chatId]: [
          {
            id: userMsgId,
            role: "user",
            content: trimmed,
            status: "pending",
            createdAtMs: Date.now(),
          },
        ],
      },
    }));

    const promise = (async () => {
      try {
        const title = await summarizeTitle(trimmed);
        await createChat(uid, chatId, title, { role: "user", content: trimmed });

        set((s) => ({
          messagesByChat: {
            ...s.messagesByChat,
            [chatId]: (s.messagesByChat[chatId] ?? []).map((m) =>
              m.id === userMsgId ? { ...m, status: "sent" } : m
            ),
          },
        }));

        await runAssistantReply(set, get, uid, chatId, [
          { role: "user", content: trimmed },
        ]);
      } catch (err) {
        logger.error("createChatAndSend failed", err);
        set((s) => ({
          messagesByChat: {
            ...s.messagesByChat,
            [chatId]: (s.messagesByChat[chatId] ?? []).map((m) =>
              m.id === userMsgId ? { ...m, status: "failed" } : m
            ),
          },
        }));
      }
    })();

    return { chatId, promise };
  },

  sendMessage: async (uid, chatId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsgId = generateId();
    set((s) => ({
      messagesByChat: {
        ...s.messagesByChat,
        [chatId]: [
          ...(s.messagesByChat[chatId] ?? []),
          {
            id: userMsgId,
            role: "user",
            content: trimmed,
            status: "pending",
            createdAtMs: Date.now(),
          },
        ],
      },
    }));

    let history: ChatMessage[];
    try {
      await appendMessage(uid, chatId, { role: "user", content: trimmed });
      set((s) => ({
        messagesByChat: {
          ...s.messagesByChat,
          [chatId]: (s.messagesByChat[chatId] ?? []).map((m) =>
            m.id === userMsgId ? { ...m, status: "sent" } : m
          ),
        },
      }));
      history = (get().messagesByChat[chatId] ?? [])
        .filter((m) => m.status !== "failed")
        .map((m) => ({ role: m.role, content: m.content }));
    } catch (err) {
      logger.error("sendMessage: failed to persist user message", err);
      set((s) => ({
        messagesByChat: {
          ...s.messagesByChat,
          [chatId]: (s.messagesByChat[chatId] ?? []).map((m) =>
            m.id === userMsgId ? { ...m, status: "failed" } : m
          ),
        },
      }));
      return;
    }

    await runAssistantReply(set, get, uid, chatId, history);
  },

  retryLastReply: async (uid, chatId) => {
    const messages = get().messagesByChat[chatId] ?? [];
    // Drop the failed placeholder and resend the full message array up to
    // that point, per the "resend, don't resume" contract for dropped streams.
    const withoutFailed = messages.filter((m) => m.status !== "failed");
    set((s) => ({
      messagesByChat: { ...s.messagesByChat, [chatId]: withoutFailed },
    }));

    const history: ChatMessage[] = withoutFailed.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    await runAssistantReply(set, get, uid, chatId, history);
  },
}));
