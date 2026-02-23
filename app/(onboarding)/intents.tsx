import React, { useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/src/lib/supabase";
import { useSession } from "@/src/state/session";

const INTENTS = ["chat", "dating", "play"];

export default function IntentsScreen() {
  const router = useRouter();
  const { session } = useSession();
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(intent: string) {
    setSelected((prev) =>
      prev.includes(intent)
        ? prev.filter((i) => i !== intent)
        : [...prev, intent]
    );
  }

  async function onNext() {
    if (selected.length === 0) {
      Alert.alert("Select at least one intent");
      return;
    }

    const userId = session?.user.id;
    if (!userId) return;

    await supabase.from("user_intents").delete().eq("user_id", userId);

    const inserts = selected.map((intent) => ({
      user_id: userId,
      intent,
    }));

    const { error } = await supabase.from("user_intents").insert(inserts);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    router.push("/(onboarding)/photos");
  }

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text>Select Intents</Text>

      {INTENTS.map((intent) => (
        <Pressable
          key={intent}
          onPress={() => toggle(intent)}
          style={{
            padding: 12,
            borderWidth: 1,
            marginVertical: 6,
            backgroundColor: selected.includes(intent) ? "#ccc" : "#fff",
          }}
        >
          <Text>{intent}</Text>
        </Pressable>
      ))}

      <Pressable
        onPress={onNext}
        style={{ padding: 14, borderWidth: 1, marginTop: 16 }}
      >
        <Text>Next</Text>
      </Pressable>
    </View>
  );
}