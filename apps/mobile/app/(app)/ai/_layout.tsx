import { Stack } from 'expo-router';

/**
 * AI tab — nested Stack.
 * Screens:
 *   index       → AI Center hub
 */
export default function AILayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
