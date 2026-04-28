import type { ParamListBase, RouteProp } from '@react-navigation/native';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Redirect, Tabs } from 'expo-router';

import { FloatingTabBarV2 } from '@/components/v2';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Routes inside the `inbox` tab that must hide the floating tab bar.
 * Today only the conversation detail (`[id]/index` and `[id]/client`) need
 * to take over the full screen.
 */
const INBOX_HIDDEN_ROUTES: ReadonlyArray<string> = ['[id]', '[id]/index', '[id]/client'];

function inboxTabBarStyle(
  route: RouteProp<ParamListBase, string>,
): { display: 'none' } | undefined {
  const focused = getFocusedRouteNameFromRoute(route) ?? 'index';
  if (INBOX_HIDDEN_ROUTES.includes(focused)) {
    return { display: 'none' };
  }
  return undefined;
}

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBarV2 {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="inbox"
        options={({ route }) => ({
          title: 'Inbox',
          // Hide the floating tab bar on conversation detail (and the legacy
          // V1 client sheet) so they can render edge-to-edge.
          tabBarStyle: inboxTabBarStyle(route),
        })}
      />
      {/*
        `channels` route is created in Lote C. Declared here so the
        FloatingTabBarV2 reserves its slot once the directory lands.
      */}
      <Tabs.Screen name="channels" options={{ title: 'Channels' }} />
      <Tabs.Screen name="ai" options={{ title: 'AI' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
