import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "@/src/lib/supabase";
import { useSession } from "@/src/state/session";

type MessageRow = {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

function isAccessDenied(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  const code = String(err?.code ?? "");
  const status = Number(err?.status ?? err?.statusCode ?? NaN);

  // PostgREST/Supabase typical patterns
  if (status === 401 || status === 403) return true;
  if (code === "42501") return true; // insufficient_privilege
  if (msg.includes("permission denied")) return true;
  if (msg.includes("not authorized")) return true;
  if (msg.includes("insufficient privilege")) return true;

  return false;
}

export default function ChatScreen() {
  const { match_id } = useLocalSearchParams<{ match_id: string }>();
  const matchId = useMemo(() => String(match_id || ""), [match_id]);

  const { session, isHydrated } = useSession();
  const myUserId = session?.user?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const listRef = useRef<FlatList<MessageRow>>(null);

  function scrollToBottom() {
    // FlatList inverted is not used; we keep ascending and scroll to end.
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }

  async function fetchMessages() {
    setLoading(true);
    setAccessDenied(false);
    setErrorText(null);

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true })
        .limit(50);

      if (error) {
        if (isAccessDenied(error)) {
          setAccessDenied(true);
          setMessages([]);
          return;
        }
        throw error;
      }

      setMessages((data ?? []) as MessageRow[]);
      scrollToBottom();
    } catch (e: any) {
      setErrorText(e?.message ?? "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    const body = draft.trim();
    if (!body || !myUserId) return;

    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        match_id: matchId,
        sender_id: myUserId, // must equal auth.uid(); RLS enforces
        body,
      });

      if (error) {
        if (isAccessDenied(error)) {
          setAccessDenied(true);
          return;
        }
        throw error;
      }

      setDraft("");
      // No need to manually append here; realtime INSERT will deliver it.
      // But realtime can be slow in dev; we still rely on realtime per scope.
    } catch (e: any) {
      setErrorText(e?.message ?? "Failed to send");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    // Wait for session hydration; RLS depends on auth context
    if (!isHydrated) return;
    if (!matchId) return;

    fetchMessages();

    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const row = payload.new as MessageRow;

          setMessages((prev) => {
            // Dedup by id (realtime can replay)
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row].sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
          });

          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, matchId]);

  if (!matchId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text>Missing match id</Text>
      </View>
    );
  }

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!myUserId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text>Session missing</Text>
      </View>
    );
  }

  if (accessDenied) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text style={{ fontSize: 18 }}>Access denied</Text>
        <Text style={{ marginTop: 8, textAlign: "center" }}>
          You don’t have permission to view this chat.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 18, marginBottom: 12 }}>Chat</Text>

        {errorText ? (
          <Text style={{ marginBottom: 8 }}>
            {errorText}
          </Text>
        ) : null}

        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 12 }}
            renderItem={({ item }) => {
              const isMine = item.sender_id === myUserId;

              return (
                <View
                  style={{
                    alignSelf: isMine ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 10,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ textAlign: isMine ? "right" : "left" }}>
                    {item.body}
                  </Text>
                  <Text style={{ marginTop: 4, fontSize: 10, opacity: 0.7, textAlign: isMine ? "right" : "left" }}>
                    {new Date(item.created_at).toLocaleString()}
                  </Text>
                </View>
              );
            }}
            onContentSizeChange={scrollToBottom}
          />
        )}

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message"
            style={{
              flex: 1,
              borderWidth: 1,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              marginRight: 8,
            }}
          />
          <Pressable
            onPress={sendMessage}
            disabled={sending || draft.trim().length === 0}
            style={{
              borderWidth: 1,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 10,
              opacity: sending || draft.trim().length === 0 ? 0.5 : 1,
            }}
          >
            <Text>{sending ? "…" : "Send"}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}