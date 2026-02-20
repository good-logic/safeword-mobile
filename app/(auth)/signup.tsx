import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/src/lib/supabase";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSignup() {
    setErr(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      router.replace("/gate");
    } catch (e: any) {
      setErr(e?.message ?? "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 28, marginBottom: 12 }}>Sign up</Text>

      <Text>Email</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 12 }}
      />

      <Text>Password</Text>
      <TextInput
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 12 }}
      />

      {err ? <Text style={{ marginBottom: 12 }}>{err}</Text> : null}

      <Pressable
        onPress={onSignup}
        disabled={loading || !email.trim() || password.length < 6}
        style={{ padding: 14, borderWidth: 1, borderRadius: 8, alignItems: "center" }}
      >
        {loading ? <ActivityIndicator /> : <Text>Create account</Text>}
      </Pressable>

      <Pressable
        onPress={() => router.back()}
        style={{ marginTop: 12, alignItems: "center" }}
      >
        <Text>Back to login</Text>
      </Pressable>
    </View>
  );
}
