import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useShallow } from 'zustand/react/shallow';
import { useColors, useIsDark } from '@/hooks/useColors';
import { ToastProvider } from '@/components/ui/Toast';

// Prevent splash screen from auto-hiding before fonts and auth are ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isAuthenticated, rehydrate } = useAuthStore(
    useShallow((s) => ({
      isAuthenticated: s.isAuthenticated,
      rehydrate: s.rehydrate,
    }))
  );
  const rehydrateTheme = useThemeStore((s) => s.rehydrate);

  const colors = useColors();
  const isDark = useIsDark();

  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Log font errors but proceed with system font fallback
  useEffect(() => {
    if (fontError) {
      console.warn('[RootLayout] Font loading failed, falling back to system fonts:', fontError.message);
    }
  }, [fontError]);

  // Rehydrate auth and theme state
  useEffect(() => {
    Promise.all([rehydrate(), rehydrateTheme()]).finally(() => setIsReady(true));
  }, [rehydrate, rehydrateTheme]);

  // Hide splash screen once fonts and auth are ready
  useEffect(() => {
    if ((fontsLoaded || fontError) && isReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isReady]);

  // Safety timeout: hide splash screen after 3 seconds no matter what
  useEffect(() => {
    const t = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  // Auth routing guard
  useEffect(() => {
    if (!isReady) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login' as never);
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(app)/home' as never);
    }
  }, [isAuthenticated, isReady, segments, router]);

  if (!isReady || (!fontsLoaded && !fontError)) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <SafeAreaProvider>
        <ToastProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background.primary },
              animation: 'fade',
            }}
          />
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
