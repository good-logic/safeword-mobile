import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/src/lib/supabase";
import { useSession } from "@/src/state/session";

type RoleRow = {
  id: number;
  code: string;
  label: string;
};

export default function RolesScreen() {
  const router = useRouter();
  const { session, isHydrated } = useSession();

  const userId = session?.user?.id ?? null;

  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  const sortedRoles = useMemo(() => {
    return [...roles].sort((a, b) => a.label.localeCompare(b.label));
  }, [roles]);

  useEffect(() => {
    if (!isHydrated) return;

    async function loadRoles() {
      const { data, error } = await supabase
        .from("roles")
        .select("id, code, label");

      if (error) {
        Alert.alert("Error loading roles", error.message);
        setLoading(false);
        return;
      }

      setRoles((data ?? []) as RoleRow[]);
      setLoading(false);
    }

    loadRoles();
  }, [isHydrated]);

  async function onNext() {
    if (!userId || selectedRoleId === null) {
      Alert.alert("Select your primary role");
      return;
    }

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
        <Text style={{ fontSize: 28, marginBottom: 16 }}>
          Primary Role
        </Text>

        {sortedRoles.map((item) => {
          const selected = selectedRoleId === item.id;

          return (
            <Pressable
              key={item.id}
              onPress={() => {
                Keyboard.dismiss();
                setSelectedRoleId(item.id);
              }}
              style={{
                padding: 14,
                borderWidth: 1,
                borderRadius: 12,
                marginBottom: 10,
                backgroundColor: selected ? "#111" : "#fff",
              }}
            >
              <Text style={{ color: selected ? "#fff" : "#111" }}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={onNext}
          disabled={selectedRoleId === null}
          style={{
            marginTop: 12,
            padding: 14,
            borderWidth: 1,
            borderRadius: 12,
            opacity: selectedRoleId === null ? 0.5 : 1,
            alignItems: "center",
          }}
        >
          <Text>Next</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}