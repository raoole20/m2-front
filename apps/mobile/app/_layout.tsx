import { useEffect, useState } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif';
import { QueryClientProvider } from '@tanstack/react-query';

import { bootstrapApi } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useColors, useIsDark } from '@/hooks/useColors';
import { ToastProvider } from '@/components/ui/Toast';

// Prevent splash screen from auto-hiding before bootstrap completes.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const rehydrateAuth = useAuthStore((s) => s.rehydrate);
  const rehydrateTheme = useThemeStore((s) => s.rehydrate);

  const colors = useColors();
  const isDark = useIsDark();

  const [bootstrapped, setBootstrapped] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
  });

  // Log font errors but proceed with system font fallback.
  useEffect(() => {
    if (fontError) {
      console.warn(
        '[RootLayout] Font loading failed, falling back to system fonts:',
        fontError.message,
      );
    }
  }, [fontError]);

  // Bootstrap order:
  //  1. Rehydrate the secure token store + wire it into the api-client.
  //  2. Rehydrate the auth user + theme preference from secure storage.
  //  3. Mark ready so the splash can hide and the first render proceeds.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await bootstrapApi();
        await Promise.all([rehydrateAuth(), rehydrateTheme()]);
      } catch (err) {
        console.warn('[RootLayout] Bootstrap failed:', err);
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rehydrateAuth, rehydrateTheme]);

  // Hide splash once everything is ready.
  useEffect(() => {
    if (bootstrapped && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync();
    }
  }, [bootstrapped, fontsLoaded, fontError]);

  // Safety timeout: hide splash after 3 seconds no matter what.
  useEffect(() => {
    const t = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  if (!bootstrapped || (!fontsLoaded && !fontError)) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
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
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
