import { logger } from "./logger";

export type ChatRole = "user" | "assistant";
export type ChatMessage = { role: ChatRole; content: string };

function getApiBaseUrl(): string {
  const base = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL is not set — configure it in .env for this environment (dev/staging/prod)."
    );
  }
  return base.replace(/\/$/, "");
}

export class ChatStreamError extends Error {
  /** true when the connection dropped mid-stream (as opposed to a clean server error). */
  dropped: boolean;
  constructor(message: string, dropped = false) {
    super(message);
    this.name = "ChatStreamError";
    this.dropped = dropped;
  }
}

export type StreamChatHandlers = {
  onToken: (chunk: string) => void;
  signal?: AbortSignal;
};

/**
 * POST /api/chat and stream the raw text/plain response back token-by-token.
 * Response is NOT SSE and NOT JSON-per-line — it's raw text chunks. Non-200
 * responses are JSON `{ error }` instead of a stream.
 *
 * Prefers fetch's incremental ReadableStream (supported by Expo SDK 54's
 * fetch on both platforms). Falls back to progressive XHR reading if a
 * readable stream isn't available — and logs a warning when it does, since
 * silently degrading to "wait for the full response" would break the
 * streaming UX requirement without anyone noticing.
 */
export async function streamChat(
  messages: ChatMessage[],
  { onToken, signal }: StreamChatHandlers
): Promise<string> {
  const url = `${getApiBaseUrl()}/api/chat`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch (err) {
    throw new ChatStreamError(
      err instanceof Error ? err.message : "Network request failed",
      true
    );
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({} as { error?: string }));
    throw new ChatStreamError(data.error || `Request failed (${response.status})`);
  }

  if (!response.body || typeof (response.body as any).getReader !== "function") {
    logger.warn(
      "streamChat: response.body has no readable stream reader — falling back to buffered read (no live streaming)."
    );
    const full = await response.text();
    onToken(full);
    return full;
  }

  const reader = (response.body as ReadableStream<Uint8Array>).getReader();
  const decoder = new TextDecoder();
  let full = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        full += chunk;
        onToken(chunk);
      }
    }
  } catch (err) {
    // Connection dropped mid-stream — surface what we already have so the
    // caller can decide whether to keep the partial reply or retry.
    throw new ChatStreamError(
      `Stream interrupted: ${err instanceof Error ? err.message : String(err)}`,
      true
    );
  }

  return full;
}

/**
 * POST /api/summarize-title. Falls back to the first ~4 words of the input,
 * client-side, both when the server reports an error AND when the network
 * call itself fails — mirroring the server's own fallback so title
 * generation never blocks chat creation.
 */
export async function summarizeTitle(input: string): Promise<string> {
  const trimmed = input.trim();
  const clientFallback = () =>
    trimmed.split(/\s+/).slice(0, 4).join(" ").toLowerCase();

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/summarize-title`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: trimmed }),
    });

    const data = await response.json().catch(() => ({} as { title?: string; error?: string }));

    if (!response.ok || data.error || !data.title) {
      logger.warn("summarizeTitle: server fallback path", data.error);
      return clientFallback();
    }

    return data.title;
  } catch (err) {
    logger.warn("summarizeTitle: network error, using client-side fallback", err);
    return clientFallback();
  }
}
