import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';

import { useAuthStore } from '@/store/useAuthStore';
import { Pressable } from '@/components/ui/Pressable';
import { GlassCard } from '@/components/ui/GlassCard';
import { AuraGlow } from '@/components/ui/AuraGlow';
import { SunkenInput } from '@/components/ui/SunkenInput';
import { GradientButton } from '@/components/ui/GradientButton';
import { useColors } from '@/hooks/useColors';
import {
  spacing,
  typography,
  fontFamily,
  borderRadius,
  shadows,
  type ThemeColors,
} from '@m2/design';

export default function LoginScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const signIn = useAuthStore((s) => s.signIn);
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length >= 8;

  async function handleEmailSignIn() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email.trim(), password);
    } catch {
      setError('No se pudo iniciar sesion. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoadingGoogle(true);
    setError(null);
    try {
      await signIn();
    } catch {
      setError('No se pudo iniciar sesion con Google. Intenta de nuevo.');
    } finally {
      setLoadingGoogle(false);
    }
  }

  const isLoading = loading || loadingGoogle;

  const eyeToggle = (
    <Pressable
      onPress={() => setShowPassword((v) => !v)}
      disabled={isLoading}
    >
      <MaterialCommunityIcons
        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
        size={20}
        color={colors.onSurfaceVariant}
      />
    </Pressable>
  );

  return (
    <View style={styles.root}>
      {/* Decorative aura background */}
      <AuraGlow />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* -- Hero ---------------------------------------- */}
            <Animated.View entering={FadeInUp.duration(600).delay(100)} style={styles.hero}>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons
                  name="motorbike"
                  size={64}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.appName}>motomoto</Text>
              <Text style={styles.tagline}>Precision CRM Systems</Text>
            </Animated.View>

            {/* -- Login Form ---------------------------------- */}
            <Animated.View entering={FadeInDown.duration(600).delay(300)}>
              <GlassCard style={styles.formCard}>
                <Text style={styles.welcomeText}>Bienvenido de nuevo</Text>

                {error !== null && (
                  <View style={styles.errorContainer}>
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={16}
                      color={colors.error}
                    />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Email input */}
                <SunkenInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Correo electronico"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isLoading}
                  leftIcon="email-outline"
                />

                {/* Password input */}
                <SunkenInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Contrasena"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  editable={!isLoading}
                  leftIcon="lock-outline"
                  rightAccessory={eyeToggle}
                />

                {/* Forgot password link */}
                <Pressable onPress={() => {}} style={styles.forgotButton}>
                  <Text style={styles.forgotText}>Olvido su contrasena?</Text>
                </Pressable>

                {/* Sign in button */}
                <GradientButton
                  label="Iniciar sesion"
                  onPress={handleEmailSignIn}
                  disabled={!canSubmit || isLoading}
                  loading={loading}
                  fullWidth
                />

                {/* Google Workspace button */}
                <Pressable
                  onPress={handleGoogleSignIn}
                  style={styles.googleButton}
                  disabled={isLoading}
                >
                  {loadingGoogle ? (
                    <ActivityIndicator color={colors.onSurface} size="small" />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="google"
                        size={22}
                        color={colors.onSurface}
                      />
                      <Text style={styles.googleButtonLabel}>Google Workspace</Text>
                    </>
                  )}
                </Pressable>

                {/* Biometric row */}
                <View style={styles.biometricRow}>
                  <Pressable onPress={() => {}} style={styles.biometricIcon}>
                    <MaterialCommunityIcons
                      name="fingerprint"
                      size={28}
                      color={colors.primary}
                    />
                  </Pressable>
                  <Pressable onPress={() => {}} style={styles.biometricIcon}>
                    <MaterialCommunityIcons
                      name="face-recognition"
                      size={28}
                      color={colors.primary}
                    />
                  </Pressable>
                </View>
              </GlassCard>
            </Animated.View>

            {/* -- Bottom link --------------------------------- */}
            <Animated.View entering={FadeInDown.duration(600).delay(500)}>
              <Text style={styles.bottomText}>
                No tienes una cuenta?{' '}
                <Text style={styles.bottomLink}>Solicitar acceso</Text>
              </Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surfaceBackground,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
    justifyContent: 'center',
  },

  /* Hero */
  hero: {
    alignItems: 'center',
    marginBottom: spacing[10],
  },
  iconWrapper: {
    marginBottom: spacing[4],
    ...(Platform.OS === 'ios' ? shadows.glow(colors.primary, 24, 0.6) : undefined),
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    fontFamily: fontFamily.displayExtraBold,
    letterSpacing: -0.02 * 36,
    color: colors.onSurface,
    marginBottom: spacing[1],
  },
  tagline: {
    ...typography.subhead,
    fontFamily: fontFamily.bodyRegular,
    color: colors.onSurfaceVariant,
  },

  /* Form card */
  formCard: {
    padding: spacing[6],
    gap: spacing[4],
  },
  welcomeText: {
    ...typography.headline,
    fontFamily: fontFamily.bodyRegular,
    color: colors.onSurface,
    marginBottom: spacing[1],
  },

  /* Error */
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.errorContainer,
    borderRadius: borderRadius.md,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    flex: 1,
  },

  /* Forgot password */
  forgotButton: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    ...typography.labelMedium,
    color: colors.primary,
  },

  /* Google button */
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.outlineVariant,
    paddingVertical: spacing[4],
    minHeight: 52,
  },
  googleButtonLabel: {
    ...typography.labelLarge,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.onSurface,
  },

  /* Biometric row */
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[6],
    marginTop: spacing[1],
  },
  biometricIcon: {
    padding: spacing[2],
  },

  /* Bottom */
  bottomText: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing[6],
  },
  bottomLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
