import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createUser,
  getAppSession,
  listUsersByHousehold,
} from '../../db';
import type { Household, User } from '../../types/models';
import { AidAmiTheme, px } from '../../theme/AidAmiTheme';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  caregiver: 'Aidant',
  aesh: 'AESH',
};

export function HouseholdScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const session = await getAppSession();
      const list = await listUsersByHousehold(session.household.id);
      setHousehold(session.household);
      setUsers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const onAddCaregiver = async () => {
    if (!household || !name.trim() || !email.trim() || saving) return;
    setSaving(true);
    try {
      await createUser({
        household_id: household.id,
        full_name: name.trim(),
        email: email.trim(),
        role: 'caregiver',
      });
      setName('');
      setEmail('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top, 24) + 16,
          paddingBottom: Math.max(insets.bottom, 24) + 24,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      accessibilityLabel="Module Foyer"
    >
      <Text style={styles.title}>Foyer</Text>
      <Text style={styles.subtitle}>Aidants & code d'invitation</Text>

      {loading ? (
        <ActivityIndicator color={AidAmiTheme.colors.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : household ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Nom du foyer</Text>
            <Text style={styles.cardValue}>{household.name}</Text>
            <Text style={[styles.cardLabel, styles.cardLabelSpaced]}>
              Code d'invitation
            </Text>
            <Text
              style={styles.inviteCode}
              accessibilityLabel={`Code d'invitation ${household.invite_code}`}
            >
              {household.invite_code}
            </Text>
          </View>

          <Text style={styles.section}>Aidants</Text>
          {users.map((user) => (
            <View key={user.id} style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{user.full_name}</Text>
                <Text style={styles.rowMeta}>
                  {ROLE_LABEL[user.role ?? ''] ?? user.role ?? '—'} · {user.email}
                </Text>
              </View>
            </View>
          ))}

          <Text style={styles.section}>Ajouter un aidant</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom complet"
            placeholderTextColor={AidAmiTheme.colors.secondary}
            value={name}
            onChangeText={setName}
            accessibilityLabel="Nom de l'aidant"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={AidAmiTheme.colors.secondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            accessibilityLabel="Email de l'aidant"
          />
          <Pressable
            style={({ pressed }) => [
              styles.button,
              (!name.trim() || !email.trim() || saving) && styles.buttonDisabled,
              pressed && styles.pressed,
            ]}
            onPress={() => void onAddCaregiver()}
            disabled={!name.trim() || !email.trim() || saving}
            accessibilityRole="button"
            accessibilityLabel="Ajouter l'aidant"
          >
            <Text style={styles.buttonLabel}>
              {saving ? 'Ajout…' : 'Ajouter'}
            </Text>
          </Pressable>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: AidAmiTheme.colors.background,
  },
  content: {
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeTitle),
    lineHeight: px(AidAmiTheme.typography.sizeTitle) * AidAmiTheme.typography.lineHeight,
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
  },
  subtitle: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    color: AidAmiTheme.colors.secondary,
    marginBottom: 20,
  },
  card: {
    backgroundColor: AidAmiTheme.colors.surface,
    borderRadius: px(AidAmiTheme.borderRadius.card),
    padding: 20,
    marginBottom: 24,
  },
  cardLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: 14,
    color: AidAmiTheme.colors.secondary,
    marginBottom: 4,
  },
  cardLabelSpaced: {
    marginTop: 16,
  },
  cardValue: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeSubTitle),
    fontWeight: '600',
    color: AidAmiTheme.colors.textPrimary,
  },
  inviteCode: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 4,
    color: AidAmiTheme.colors.primary,
  },
  section: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeSubTitle),
    fontWeight: '600',
    color: AidAmiTheme.colors.primary,
    marginBottom: 12,
  },
  row: {
    backgroundColor: AidAmiTheme.colors.surface,
    borderRadius: px(AidAmiTheme.borderRadius.card),
    padding: 16,
    marginBottom: 10,
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    justifyContent: 'center',
  },
  rowText: {
    gap: 2,
  },
  rowTitle: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '600',
    color: AidAmiTheme.colors.textPrimary,
  },
  rowMeta: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: 14,
    color: AidAmiTheme.colors.secondary,
  },
  input: {
    backgroundColor: AidAmiTheme.colors.surface,
    borderRadius: px(AidAmiTheme.borderRadius.button),
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    paddingHorizontal: 16,
    marginBottom: 10,
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    color: AidAmiTheme.colors.textPrimary,
  },
  button: {
    backgroundColor: AidAmiTheme.colors.accent,
    borderRadius: px(AidAmiTheme.borderRadius.button),
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '600',
    color: AidAmiTheme.colors.primary,
  },
  error: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    color: AidAmiTheme.colors.emotionalRed,
  },
});
