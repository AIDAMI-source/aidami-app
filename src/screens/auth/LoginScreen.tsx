import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../auth';
import { AidAmiTheme, px } from '../../theme/AidAmiTheme';

type Mode = 'signin' | 'signup';

/**
 * French auth gate — large touch targets, AidAmiTheme.
 * Shown only when Supabase env is configured and the user has not skipped to demo.
 */
export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp, continueAsDemo, error, clearError, loading } =
    useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (busy) return;
    clearError();
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName);
      }
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next: Mode) => {
    clearError();
    setMode(next);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={AidAmiTheme.colors.accent} />
        <Text style={styles.loadingText}>Restauration de la session…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 32,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.brand}>Aid'Ami</Text>
        <Text style={styles.subtitle}>
          {mode === 'signin'
            ? 'Connectez-vous pour synchroniser votre foyer'
            : 'Créez un compte aidant'}
        </Text>

        {mode === 'signup' ? (
          <TextInput
            style={styles.input}
            placeholder="Nom complet"
            placeholderTextColor={AidAmiTheme.colors.textMuted}
            autoCapitalize="words"
            value={fullName}
            onChangeText={setFullName}
            accessibilityLabel="Nom complet"
          />
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor={AidAmiTheme.colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          value={email}
          onChangeText={setEmail}
          accessibilityLabel="E-mail"
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={AidAmiTheme.colors.textMuted}
          secureTextEntry
          textContentType={mode === 'signin' ? 'password' : 'newPassword'}
          value={password}
          onChangeText={setPassword}
          accessibilityLabel="Mot de passe"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
            busy && styles.disabled,
          ]}
          onPress={() => void onSubmit()}
          disabled={busy || !email.trim() || password.length < 6}
          accessibilityRole="button"
          accessibilityLabel={
            mode === 'signin' ? 'Se connecter' : 'Créer un compte'
          }
        >
          {busy ? (
            <ActivityIndicator color={AidAmiTheme.colors.onAccent} />
          ) : (
            <Text style={styles.primaryLabel}>
              {mode === 'signin' ? 'Se connecter' : 'Créer un compte'}
            </Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
          onPress={() =>
            switchMode(mode === 'signin' ? 'signup' : 'signin')
          }
          accessibilityRole="button"
        >
          <Text style={styles.linkLabel}>
            {mode === 'signin'
              ? 'Pas encore de compte ? S’inscrire'
              : 'Déjà un compte ? Se connecter'}
          </Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
          onPress={continueAsDemo}
          accessibilityRole="button"
          accessibilityLabel="Continuer en mode démo"
        >
          <Text style={styles.secondaryLabel}>
            Continuer en mode démo (hors-ligne)
          </Text>
        </Pressable>

        <Text style={styles.hint}>
          Sans clés Supabase, l’app démarre directement en mode démo avec les
          données locales.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AidAmiTheme.colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AidAmiTheme.colors.background,
    gap: 12,
  },
  loadingText: {
    color: AidAmiTheme.colors.textMuted,
    fontSize: px(AidAmiTheme.typography.sizeBody),
  },
  content: {
    paddingHorizontal: 24,
    gap: 14,
  },
  brand: {
    fontSize: px(AidAmiTheme.typography.sizeTitle),
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: px(AidAmiTheme.typography.sizeSubTitle),
    color: AidAmiTheme.colors.textMuted,
    lineHeight:
      px(AidAmiTheme.typography.sizeSubTitle) *
      AidAmiTheme.typography.lineHeight,
    marginBottom: 12,
  },
  input: {
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    borderRadius: px(AidAmiTheme.borderRadius.card),
    borderWidth: 1,
    borderColor: AidAmiTheme.colors.border,
    backgroundColor: AidAmiTheme.colors.surface,
    paddingHorizontal: 16,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    color: AidAmiTheme.colors.textPrimary,
  },
  error: {
    color: AidAmiTheme.colors.emotionalRed,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    lineHeight:
      px(AidAmiTheme.typography.sizeCaption) *
      AidAmiTheme.typography.lineHeight,
  },
  primaryButton: {
    minHeight: px(AidAmiTheme.touchTarget.minHeight) + 8,
    borderRadius: px(AidAmiTheme.borderRadius.button),
    backgroundColor: AidAmiTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryLabel: {
    color: AidAmiTheme.colors.onAccent,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    borderRadius: px(AidAmiTheme.borderRadius.button),
    backgroundColor: AidAmiTheme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryLabel: {
    color: AidAmiTheme.colors.primary,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '600',
    textAlign: 'center',
  },
  linkButton: {
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: {
    color: AidAmiTheme.colors.secondary,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: AidAmiTheme.colors.border,
    marginVertical: 8,
  },
  hint: {
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    color: AidAmiTheme.colors.textMuted,
    textAlign: 'center',
    lineHeight:
      px(AidAmiTheme.typography.sizeCaption) *
      AidAmiTheme.typography.lineHeight,
    marginTop: 8,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
});
