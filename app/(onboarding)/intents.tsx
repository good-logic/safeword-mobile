import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/src/lib/supabase";
import { useSession } from "@/src/state/session";

function formatIntentLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function IntentsScreen() {
  const router = useRouter();
  const { session, isHydrated } = useSession();
  const userId = session?.user?.id ?? null;

  const [intentOptions, setIntentOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isHydrated) return;

    async function load() {
      const { data, error } = await supabase.rpc("get_intent_types");

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      setIntentOptions(data ?? []);
      setLoading(false);
    }

    load();
  }, [isHydrated]);

  function toggle(value: string) {
    setSelected((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  }

  async function onNext() {
    if (!userId || selected.length === 0) {
      Alert.alert("Select at least one intent");
      return;
    }

    await supabase.from("user_intents").delete().eq("user_id", userId);

    const { error } = await supabase.from("user_intents").insert(
      selected.map((intent) => ({
        user_id: userId,
        intent,
      }))
    );

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    router.push("/(onboarding)/photos");
  }

  if (!isHydrated || loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 28, marginBottom: 16 }}>Intent</Text>

        {intentOptions.map((value) => {
          const isSelected = selected.includes(value);

          return (
            <Pressable
              key={value}
              onPress={() => {
                Keyboard.dismiss();
                toggle(value);
              }}
              style={{
                padding: 14,
                borderWidth: 1,
                borderRadius: 12,
                marginBottom: 10,
                backgroundColor: isSelected ? "#111" : "#fff",
              }}
            >
              <Text style={{ color: isSelected ? "#fff" : "#111" }}>
                {formatIntentLabel(value)}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={onNext}
          disabled={selected.length === 0}
          style={{
            marginTop: 12,
            padding: 14,
            borderWidth: 1,
            borderRadius: 12,
            opacity: selected.length === 0 ? 0.5 : 1,
            alignItems: "center",
          }}
        >
          <Text>Next</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}