import { Redirect, Tabs } from 'expo-router';

import { FloatingTabBarV2 } from '@/components/v2';
import { useAuthStore } from '@/store/useAuthStore';

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
      <Tabs.Screen name="inbox" options={{ title: 'Inbox' }} />
      {/*
        `channels` route is created in Lote B. Declared here so the
        FloatingTabBarV2 reserves its slot once the directory lands.
      */}
      <Tabs.Screen name="channels" options={{ title: 'Channels' }} />
      <Tabs.Screen name="ai" options={{ title: 'AI' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
