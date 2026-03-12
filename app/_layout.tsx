import "react-native-get-random-values";
import React from "react";
import { Stack } from "expo-router";
import { SessionProvider } from "@/src/state/session";

export default function RootLayout() {
  return (
    <SessionProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="gate" />
        <Stack.Screen name="chat/[match_id]" />
      </Stack>
    </SessionProvider>
  );
}