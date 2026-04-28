import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandmarkV2 } from '@/components/v2';
import { ApiError } from '@m2/api-client';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Atmosphere,
  Body,
  Caption,
  colorsV2,
  Display,
  Glass,
  radiiV2,
  SerifItalic,
  shadowsV2,
  typographyV2,
} from '@/theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEmailValid = useMemo(() => EMAIL_REGEX.test(email.trim()), [email]);
  const isPasswordValid = password.length >= MIN_PASSWORD_LENGTH;
  const canSubmit = isEmailValid && isPasswordValid && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await useAuthStore.getState().signInWithEmail(email.trim(), password);
      router.replace('/(app)/inbox');
    } catch (err: unknown) {
      if (isApiError(err) && err.message) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Error al iniciar sesión');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <Atmosphere mood="profile" intensity="rich" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.brandmarkWrap}>
              <BrandmarkV2 size={80} />
            </View>

            <View style={styles.headerBlock}>
              <Display style={styles.headline}>
                Sign in to <SerifItalic size={typographyV2.display.fontSize}>Motomoto</SerifItalic>
              </Display>
              <Body color={colorsV2.text.muted} style={styles.subtitle}>
                Tu workspace editorial para conversaciones impecables.
              </Body>
            </View>

            <View style={styles.form}>
              <Glass variant="input" style={styles.inputGlass}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Correo electrónico"
                  placeholderTextColor={colorsV2.text.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  editable={!submitting}
                  style={styles.input}
                />
              </Glass>

              <Glass variant="input" style={styles.inputGlass}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Contraseña"
                  placeholderTextColor={colorsV2.text.muted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                  autoCorrect={false}
                  editable={!submitting}
                  style={styles.input}
                />
              </Glass>

              {errorMessage !== null && (
                <View style={styles.errorChip}>
                  <Caption style={styles.errorText}>{errorMessage}</Caption>
                </View>
              )}

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSubmit }}
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={[styles.submitWrap, !canSubmit ? styles.submitDisabled : null]}
              >
                <LinearGradient
                  colors={[colorsV2.accent[100], colorsV2.accent[300]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitGradient}
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Body color={colorsV2.text.primary} style={styles.submitLabel}>
                      Iniciar sesión
                    </Body>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colorsV2.bg.base,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  brandmarkWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headline: {
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 12,
    textAlign: 'center',
  },
  form: {
    gap: 14,
  },
  inputGlass: {
    borderRadius: radiiV2.md,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 6,
    minHeight: 52,
    justifyContent: 'center',
  },
  input: {
    color: colorsV2.text.primary,
    fontFamily: typographyV2.body.fontFamily,
    fontSize: typographyV2.body.fontSize,
    lineHeight: typographyV2.body.lineHeight,
    paddingVertical: Platform.OS === 'ios' ? 0 : 8,
  },
  errorChip: {
    alignSelf: 'stretch',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radiiV2.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  errorText: {
    color: colorsV2.state.danger,
    textAlign: 'center',
  },
  submitWrap: {
    marginTop: 6,
    borderRadius: radiiV2.pill,
    overflow: 'hidden',
    ...shadowsV2.glow.accent,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderRadius: radiiV2.pill,
  },
  submitLabel: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
