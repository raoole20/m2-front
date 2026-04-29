import { Stack } from 'expo-router';

/**
 * Channels tab — nested Stack.
 * Screens:
 *   index → connected channels list
 *
 * Detail / connect-flow screens are intentionally out of scope for the V2
 * MVP redesign and will land as a follow-up.
 */
export default function ChannelsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
