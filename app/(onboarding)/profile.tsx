import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/src/lib/supabase";

function calculateAge(dob: Date) {
  const diff = Date.now() - dob.getTime();
  const age = new Date(diff).getUTCFullYear() - 1970;
  return age;
}

export default function ProfileScreen() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [dob, setDob] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [bio, setBio] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [ageMin, setAgeMin] = useState("18");
  const [ageMax, setAgeMax] = useState("60");

  const [loading, setLoading] = useState(false);

  async function onNext() {
    try {
      setLoading(true);

      const dobDate = new Date(dob);
      if (isNaN(dobDate.getTime())) {
        Alert.alert("Invalid DOB");
        return;
      }

      const age = calculateAge(dobDate);
      if (age < 18) {
        Alert.alert("You must be 18+ to use Safeword.");
        return;
      }

      if (!displayName.trim()) {
        Alert.alert("Display name required");
        return;
      }

      const { error } = await supabase.rpc("upsert_profile", {
        p_display_name: displayName.trim(),
        p_dob: dob,
        p_pronouns: pronouns || null,
        p_bio: bio || null,
        p_experience_level: experienceLevel || null,
        p_age_min: parseInt(ageMin, 10),
        p_age_max: parseInt(ageMax, 10),
      });

      if (error) throw error;

      router.push("/(onboarding)/roles");
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Profile save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 28, marginBottom: 16 }}>Profile</Text>

      <TextInput
        placeholder="Display Name"
        value={displayName}
        onChangeText={setDisplayName}
        style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
      />

      <TextInput
        placeholder="DOB (YYYY-MM-DD)"
        value={dob}
        onChangeText={setDob}
        style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
      />

      <TextInput
        placeholder="Pronouns"
        value={pronouns}
        onChangeText={setPronouns}
        style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
      />

      <TextInput
        placeholder="Bio"
        value={bio}
        onChangeText={setBio}
        style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
      />

      <TextInput
        placeholder="Experience Level"
        value={experienceLevel}
        onChangeText={setExperienceLevel}
        style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
      />

      <TextInput
        placeholder="Preferred Age Min"
        keyboardType="numeric"
        value={ageMin}
        onChangeText={setAgeMin}
        style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
      />

      <TextInput
        placeholder="Preferred Age Max"
        keyboardType="numeric"
        value={ageMax}
        onChangeText={setAgeMax}
        style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
      />

      <Pressable
        onPress={onNext}
        disabled={loading}
        style={{ padding: 14, borderWidth: 1, alignItems: "center" }}
      >
        {loading ? <ActivityIndicator /> : <Text>Next</Text>}
      </Pressable>
    </View>
  );
}