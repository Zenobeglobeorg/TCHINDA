/**
 * Stack de navigation pour le chat dans les tabs (acheteur)
 * Garde la sidebar web et la barre d'onglets mobile visibles.
 */

import { Stack } from 'expo-router';

export default function ChatTabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
