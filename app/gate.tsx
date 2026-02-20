import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "@/src/state/session";
import { supabase } from "@/src/lib/supabase";

export default function Gate() {
  const router = useRouter();
  const { session, isHydrated } = useSession();

  const routedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) return; // critical: wait for hydration

    if (routedRef.current) return;

    async function run() {
      setError(null);

      // No session → auth
      if (!session) {
        routedRef.current = true;
        router.replace("/(auth)/login");
        return;
      }

      // Session exists → ask backend if profile is complete
      const { data, error } = await supabase.rpc("complete_profile_check");
      if (error) {
        // If RPC fails, fail closed to onboarding (safe default)
        setError(error.message);
        routedRef.current = true;
        router.replace("/(onboarding)/profile");
        return;
      }

      const isComplete = Boolean(data);

      routedRef.current = true;
      router.replace(isComplete ? "/(tabs)/browse" : "/(onboarding)/profile");
    }

    run();
  }, [isHydrated, session, router]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <ActivityIndicator />
      <Text style={{ marginTop: 12 }}>Checking profile…</Text>
      {error ? <Text style={{ marginTop: 12 }}>{error}</Text> : null}
    </View>
  );
}
