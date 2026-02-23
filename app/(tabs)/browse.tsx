import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Image, ActivityIndicator, Alert } from "react-native";
import { supabase } from "@/src/lib/supabase";

type BrowseItem = {
  user_id: string;
  display_name: string;
  primary_photo_path: string | null;
  roles: string[];
  last_active_at: string;
};

export default function BrowseScreen() {
  const [items, setItems] = useState<BrowseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchFeed();
  }, []);

  async function fetchFeed() {
    setLoading(true);

    const { data, error } = await supabase.rpc("get_browse_feed", {
      p_limit: 20,
      p_offset: 0,
    });

    if (error) {
      Alert.alert("Error", error.message);
      setLoading(false);
      return;
    }

    setItems(data ?? []);
    await generateSignedUrls(data ?? []);
    setLoading(false);
  }

  async function generateSignedUrls(feed: BrowseItem[]) {
    const updates: Record<string, string> = {};

    for (const item of feed) {
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

  async function handleSwipe(targetUserId: string, action: "like" | "skip") {
    const { error } = await supabase.from("swipes").insert({
      to_user_id: targetUserId,
      action,
    });

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    // remove locally (backend trigger handles match)
    setItems((prev) => prev.filter((i) => i.user_id !== targetUserId));
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No more profiles.</Text>
      </View>
    );
  }

  const item = items[0];

  return (
    <View style={{ flex: 1, padding: 24 }}>
      {item.primary_photo_path && signedUrls[item.user_id] && (
        <Image
          source={{ uri: signedUrls[item.user_id] }}
          style={{ width: "100%", height: 300, marginBottom: 12 }}
        />
      )}

      <Text style={{ fontSize: 24 }}>{item.display_name}</Text>
      <Text>{item.roles?.join(", ")}</Text>
      <Text>Active: {item.last_active_at}</Text>

      <View style={{ flexDirection: "row", marginTop: 24 }}>
        <Pressable
          onPress={() => handleSwipe(item.user_id, "skip")}
          style={{ flex: 1, padding: 14, borderWidth: 1, marginRight: 8 }}
        >
          <Text style={{ textAlign: "center" }}>Skip</Text>
        </Pressable>

        <Pressable
          onPress={() => handleSwipe(item.user_id, "like")}
          style={{ flex: 1, padding: 14, borderWidth: 1 }}
        >
          <Text style={{ textAlign: "center" }}>Like</Text>
        </Pressable>
      </View>
    </View>
  );
}