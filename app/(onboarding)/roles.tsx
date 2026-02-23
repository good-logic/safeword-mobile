import React, { useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/src/lib/supabase";
import { useSession } from "@/src/state/session";

export default function RolesScreen() {
  const router = useRouter();
  const { session } = useSession();
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  async function onNext() {
    if (!selectedRoleId) {
      Alert.alert("Select a primary role");
      return;
    }

    const userId = session?.user.id;
    if (!userId) return;

    await supabase.from("user_roles").delete().eq("user_id", userId);

    const { error } = await supabase.from("user_roles").insert({
      user_id: userId,
      role_id: selectedRoleId,
      is_primary: true,
    });

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    router.push("/(onboarding)/intents");
  }

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text>Select Primary Role</Text>

      {[1, 2, 3, 4].map((id) => (
        <Pressable
          key={id}
          onPress={() => setSelectedRoleId(id)}
          style={{
            padding: 12,
            borderWidth: 1,
            marginVertical: 6,
            backgroundColor: selectedRoleId === id ? "#ccc" : "#fff",
          }}
        >
          <Text>Role {id}</Text>
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