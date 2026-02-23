import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "@/src/state/session";

export default function AccountScreen() {
  const router = useRouter();
  const { signOut } = useSession();

  async function handleSignOut() {
    await signOut();
    router.replace("/(auth)/login");
  }

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 24, marginBottom: 16 }}>Account</Text>

      <Pressable
        onPress={handleSignOut}
        style={{ padding: 14, borderWidth: 1 }}
      >
        <Text>Sign Out</Text>
      </Pressable>
    </View>
  );
}