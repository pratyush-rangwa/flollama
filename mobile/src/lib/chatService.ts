import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  FirebaseFirestoreTypes,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from "@react-native-firebase/firestore";
import { firestore } from "./firebase";
import { generateId } from "./id";
import type { ChatMessage, ChatRole } from "./api";

/**
 * Firestore data layer (modular API — the namespaced `firestore()` style is
 * deprecated as of react-native-firebase v22). Same collection shape as
 * next/src/lib/chatService.js (users/{uid}/chats/{chatId}) but with the
 * fixes called out for a shipped mobile app instead of a scrappy web app:
 *  - chatId is a client-generated UUID, not the title string (two chats can
 *    summarize to the same title; the web app's title-as-ID collides on that).
 *  - title/createdAt/updatedAt are real fields.
 *  - messages carry a per-message id + createdAt (web app has neither).
 *  - appends use arrayUnion, not read-then-write (avoids dropping a message
 *    when two writes race — e.g. send + immediate background/foreground sync).
 */

export type StoredMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
};

export type ChatSummary = {
  id: string;
  title: string;
  createdAt: FirebaseFirestoreTypes.Timestamp | null;
  updatedAt: FirebaseFirestoreTypes.Timestamp | null;
};

function chatsCollection(uid: string) {
  return collection(firestore, "users", uid, "chats");
}

function chatDoc(uid: string, chatId: string) {
  return doc(firestore, "users", uid, "chats", chatId);
}

export function toStoredMessage(role: ChatRole, content: string): StoredMessage {
  return {
    id: generateId(),
    role,
    content,
    createdAt: Timestamp.now(),
  };
}

/**
 * Creates a new chat document at a caller-supplied id (generated client-side
 * up front, via generateId(), so the UI can navigate to the thread instantly
 * instead of waiting on this write or on title summarization to resolve).
 */
export async function createChat(
  uid: string,
  chatId: string,
  title: string,
  firstMessage: ChatMessage
): Promise<void> {
  const now = serverTimestamp();

  await setDoc(chatDoc(uid, chatId), {
    title,
    createdAt: now,
    updatedAt: now,
    messages: [toStoredMessage(firstMessage.role, firstMessage.content)],
  });
}

export async function appendMessage(
  uid: string,
  chatId: string,
  message: ChatMessage
): Promise<StoredMessage> {
  const stored = toStoredMessage(message.role, message.content);

  await updateDoc(chatDoc(uid, chatId), {
    messages: arrayUnion(stored),
    updatedAt: serverTimestamp(),
  });

  return stored;
}

export function listenToUserChats(
  uid: string,
  callback: (chats: ChatSummary[]) => void
) {
  const q = query(chatsCollection(uid), orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    callback(
      snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title ?? "untitled chat",
          createdAt: data.createdAt ?? null,
          updatedAt: data.updatedAt ?? null,
        };
      })
    );
  });
}

export function loadChatMessages(
  uid: string,
  chatId: string,
  callback: (messages: StoredMessage[]) => void
) {
  return onSnapshot(chatDoc(uid, chatId), (snap) => {
    if (!snap.exists()) return callback([]);
    const data = snap.data();
    callback((data?.messages as StoredMessage[]) ?? []);
  });
}

export function doesChatExist(
  uid: string,
  chatId: string,
  callback: (exists: boolean) => void
) {
  return onSnapshot(chatDoc(uid, chatId), (snap) => callback(snap.exists()));
}

export async function deleteChat(uid: string, chatId: string): Promise<void> {
  await deleteDoc(chatDoc(uid, chatId));
}

export async function clearAllChats(uid: string): Promise<void> {
  const snap = await getDocs(chatsCollection(uid));
  const batch = writeBatch(firestore);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
