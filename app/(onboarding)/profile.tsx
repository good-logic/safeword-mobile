import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { supabase } from "@/src/lib/supabase";

const EXPERIENCE_OPTIONS = [
  { label: "Curious", value: "curious" },
  { label: "New", value: "new" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Experienced", value: "experienced" },
  { label: "Lifestyle", value: "lifestyle" },
];

function formatDate(date: Date) {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

function calculateAge(date: Date) {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  return age;
}

export default function ProfileScreen() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pronouns, setPronouns] = useState("");
  const [bio, setBio] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<string | null>(null);
  const [ageMin, setAgeMin] = useState("18");
  const [ageMax, setAgeMax] = useState("60");
  const [loading, setLoading] = useState(false);

  const bioTooLong = bio.length > 300;
  const bioCount = bio.length;

  async function onNext() {
    try {
      if (!displayName.trim()) {
        Alert.alert("Display name required");
        return;
      }

      if (!dob) {
        Alert.alert("Date of birth required");
        return;
      }

      const age = calculateAge(dob);
      if (age < 18) {
        Alert.alert("You must be 18+ to use Safeword.");
        return;
      }

      if (!experienceLevel) {
        Alert.alert("Select experience level");
        return;
      }

      if (bioTooLong) {
        Alert.alert("Bio exceeds 300 characters");
        return;
      }

      setLoading(true);

      const { error } = await supabase.rpc("upsert_profile", {
        p_display_name: displayName.trim(),
        p_dob: formatDate(dob),
        p_pronouns: pronouns || null,
        p_bio: bio || null,
        p_experience_level: experienceLevel,
        p_age_min: parseInt(ageMin, 10),
        p_age_max: parseInt(ageMax, 10),
      });

      if (error) throw error;

      router.push("/(onboarding)/roles");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Profile save failed");
    } finally {
      setLoading(false);
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
        <Text style={{ fontSize: 28, marginBottom: 16 }}>Profile</Text>

        {/* Display Name */}
        <TextInput
          placeholder="Display Name"
          value={displayName}
          onChangeText={setDisplayName}
          style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
        />

        {/* DOB Picker */}
        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            setShowPicker(true);
          }}
          style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
        >
          <Text>
            {dob ? formatDate(dob) : "Select Date of Birth"}
          </Text>
        </Pressable>

        {showPicker && (
          <DateTimePicker
            value={dob ?? new Date(2000, 0, 1)}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            maximumDate={new Date()}
            onChange={(_, selectedDate) => {
              setShowPicker(false);
              if (selectedDate) setDob(selectedDate);
            }}
          />
        )}

        {/* Pronouns */}
        <TextInput
          placeholder="Pronouns (optional)"
          value={pronouns}
          onChangeText={setPronouns}
          style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
        />

        {/* Bio */}
        <TextInput
          placeholder="Bio (max 300 characters)"
          value={bio}
          onChangeText={(text) => {
            if (text.length <= 300) setBio(text);
          }}
          multiline
          style={{
            borderWidth: 1,
            padding: 12,
            marginBottom: 4,
            height: 100,
          }}
        />
        <Text style={{ marginBottom: 12 }}>
          {bioCount} / 300
        </Text>

        {/* Experience Level */}
        <Text style={{ marginBottom: 6 }}>Experience Level</Text>
        {EXPERIENCE_OPTIONS.map((opt) => {
          const selected = experienceLevel === opt.value;

          return (
            <Pressable
              key={opt.value}
              onPress={() => {
                Keyboard.dismiss(); // optional quality fix
                setExperienceLevel(opt.value);
              }}
              style={{
                padding: 12,
                borderWidth: 1,
                marginBottom: 8,
                backgroundColor: selected ? "#111" : "#fff",
              }}
            >
              <Text style={{ color: selected ? "#fff" : "#111" }}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}

        {/* Preferred Age */}
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

        {/* Next Button */}
        <Pressable
          onPress={onNext}
          disabled={loading}
          style={{
            padding: 14,
            borderWidth: 1,
            alignItems: "center",
            marginTop: 8,
          }}
        >
          {loading ? <ActivityIndicator /> : <Text>Next</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}