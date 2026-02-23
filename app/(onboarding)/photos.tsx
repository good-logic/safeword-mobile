import React, { useState } from "react";
import { View, Text, Pressable, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "expo-router";
import { supabase } from "@/src/lib/supabase";
import { useSession } from "@/src/state/session";

export default function PhotosScreen() {
  const { session } = useSession();
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);

  async function pickImage() {
    if (images.length >= 4) {
      Alert.alert("Max 4 photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  }

  async function uploadAll() {
    if (images.length === 0) {
      Alert.alert("At least one photo required");
      return;
    }

    const userId = session?.user.id;
    if (!userId) return;

    for (let i = 0; i < images.length; i++) {
      const uri = images[i];
      const fileExt = uri.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const path = `profiles/${userId}/${fileName}`;

      const file = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, Buffer.from(file, "base64"), {
          contentType: `image/${fileExt}`,
        });

      if (uploadError) {
        Alert.alert("Upload failed", uploadError.message);
        return;
      }

      await supabase.from("profile_photos").insert({
        user_id: userId,
        storage_path: path,
        sort_order: i,
        is_primary: i === 0,
      });
    }

    // re-check completion through backend truth
    const { data } = await supabase.rpc("complete_profile_check");

    router.replace(data ? "/(tabs)/browse" : "/gate");
  }

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text>Upload Photos</Text>

      <Pressable onPress={pickImage} style={{ padding: 12, borderWidth: 1 }}>
        <Text>Add Photo</Text>
      </Pressable>

      {images.map((uri) => (
        <Image
          key={uri}
          source={{ uri }}
          style={{ width: 100, height: 100, marginVertical: 8 }}
        />
      ))}

      <Pressable
        onPress={uploadAll}
        style={{ padding: 14, borderWidth: 1, marginTop: 16 }}
      >
        <Text>Finish</Text>
      </Pressable>
    </View>
  );
}