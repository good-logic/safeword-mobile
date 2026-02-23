import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, ActivityIndicator, Alert, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/src/lib/supabase";

type MatchItem = {
  match_id: string; // REQUIRED for routing
  user_id: string;
  display_name: string;
  primary_photo_path: string | null;
  roles: string[];
  matched_at: string;
  matched_last_active_at: string;
};

export default function MatchesScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMatches();
  }, []);

  async function fetchMatches() {
    setLoading(true);

    const { data, error } = await supabase.rpc("get_my_matches", {
      p_limit: 20,
      p_offset: 0,
    });

    if (error) {
      Alert.alert("Error", error.message);
      setLoading(false);
      return;
    }

    setMatches((data ?? []) as MatchItem[]);
    await generateSignedUrls((data ?? []) as MatchItem[]);
    setLoading(false);
  }

  async function generateSignedUrls(list: MatchItem[]) {
    const updates: Record<string, string> = {};

    for (const item of list) {
      if (!item.primary_photo_path) continue;

      const { data, error } = await supabase.storage
        .from("profile-photos")
        .createSignedUrl(item.primary_photo_path, 60 * 60);

      if (!error && data?.signedUrl) {
        updates[item.user_id] = data.signedUrl;
      }
    }

    setSignedUrls(updates);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      data={matches}
      keyExtractor={(item) => item.match_id}
      contentContainerStyle={{ padding: 24 }}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/chat/${item.match_id}`)}
          style={{ marginBottom: 24 }}
        >
          {item.primary_photo_path && signedUrls[item.user_id] && (
            <Image
              source={{ uri: signedUrls[item.user_id] }}
              style={{ width: "100%", height: 200, marginBottom: 8 }}
            />
          )}
          <Text style={{ fontSize: 20 }}>{item.display_name}</Text>
          <Text>{item.roles?.join(", ")}</Text>
          <Text>Matched: {item.matched_at}</Text>
          <Text>Last Active: {item.matched_last_active_at}</Text>
        </Pressable>
      )}
    />
  );
}