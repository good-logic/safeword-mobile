import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useRouter } from "expo-router";
import { supabase } from "@/src/lib/supabase";
import { useSession } from "@/src/state/session";

async function compressImage(uri: string) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1080 } }],
    { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

type PhotoItem = {
  uri: string; // local compressed URI
};

export default function PhotosScreen() {
  const { session } = useSession();
  const router = useRouter();
  const userId = session?.user?.id;

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [uploading, setUploading] = useState(false);

  async function addFromLibrary() {
    if (photos.length >= 4) return Alert.alert("Max 4 photos");

    Keyboard.dismiss();

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return Alert.alert("Permission required", "Allow photo library access.");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // ✅ SDK 54 safe
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) return;

    const compressedUri = await compressImage(result.assets[0].uri);
    setPhotos((prev) => [...prev, { uri: compressedUri }]);
  }

  async function addFromCamera() {
    if (photos.length >= 4) return Alert.alert("Max 4 photos");

    Keyboard.dismiss();

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      return Alert.alert("Permission required", "Allow camera access.");
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"], // ✅ SDK 54 safe
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) return;

    const compressedUri = await compressImage(result.assets[0].uri);
    setPhotos((prev) => [...prev, { uri: compressedUri }]);
  }

  async function uploadAll() {
    if (!userId) return;
    if (photos.length === 0) return Alert.alert("At least one photo required");

    try {
      setUploading(true);

      for (let i = 0; i < photos.length; i++) {
        const imageUri = photos[i].uri;

        // 1) Call Edge Function to get signedUploadUrl + storagePath
        const { data, error } = await supabase.functions.invoke(
          "generate-profile-upload-url",
          {
            body: {}, // edge function should use auth.uid() server-side
          }
        );

        if (error) throw error;

        const signedUploadUrl = data?.signedUploadUrl as string | undefined;
        const storagePath = data?.storagePath as string | undefined;

        if (!signedUploadUrl || !storagePath) {
          throw new Error("Edge function did not return signedUploadUrl/storagePath");
        }

        // 2) Convert image URI to ArrayBuffer
        const img = await fetch(imageUri);
        if (!img.ok) throw new Error("Failed to read local image file");
        const file = await img.arrayBuffer();

        // 3) Upload directly to signed URL via PUT
        const putRes = await fetch(signedUploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "image/jpeg" },
          body: file,
        });

        if (!putRes.ok) {
          const text = await putRes.text().catch(() => "");
          throw new Error(`Signed upload failed (${putRes.status}): ${text}`);
        }

        // 4) Insert metadata into profile_photos
        const { error: insertError } = await supabase.from("profile_photos").insert({
          user_id: userId,
          storage_path: storagePath,
          sort_order: i,
          is_primary: i === 0,
        });

        if (insertError) throw insertError;
      }

      router.replace("/(tabs)/browse");
    } catch (err: any) {
      console.error("Photo upload failed:", err);
      Alert.alert("Upload failed", err?.message ?? "Unknown error");
    } finally {
      setUploading(false);
    }
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
        <Text style={{ fontSize: 28, marginBottom: 16 }}>Upload Photos</Text>

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
          <Pressable
            onPress={addFromLibrary}
            disabled={uploading}
            style={{
              flex: 1,
              padding: 14,
              borderWidth: 1,
              borderRadius: 12,
              alignItems: "center",
              opacity: uploading ? 0.6 : 1,
            }}
          >
            <Text>Add Photo</Text>
          </Pressable>

          <Pressable
            onPress={addFromCamera}
            disabled={uploading}
            style={{
              flex: 1,
              padding: 14,
              borderWidth: 1,
              borderRadius: 12,
              alignItems: "center",
              opacity: uploading ? 0.6 : 1,
            }}
          >
            <Text>Camera</Text>
          </Pressable>
        </View>

        {photos.map((p, idx) => (
          <Image
            key={idx}
            source={{ uri: p.uri }}
            style={{
              width: "100%",
              height: 200,
              marginBottom: 12,
              borderRadius: 12,
            }}
          />
        ))}

        <Pressable
          onPress={uploadAll}
          disabled={uploading}
          style={{
            padding: 14,
            borderWidth: 1,
            borderRadius: 12,
            alignItems: "center",
            opacity: uploading ? 0.6 : 1,
          }}
        >
          <Text>{uploading ? "Uploading..." : "Finish"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}