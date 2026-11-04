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
import { Avatar, ScreenHeader, SectionHeader } from '../../ui';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Aidant principal',
  caregiver: 'Aidant secondaire',
  aesh: 'AESH',
};

export function HouseholdScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
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
      setInviteOpen(false);
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
      <ScreenHeader
        title="Foyer"
        subtitle="Gérez les aidants et invitations"
      />

      {loading ? (
        <ActivityIndicator color={AidAmiTheme.colors.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : household ? (
        <>
          <SectionHeader title="Aidants actifs" count={users.length} />
          <View style={styles.listCard}>
            {users.length === 0 ? (
              <Text style={styles.emptyInline}>Aucun aidant pour le moment.</Text>
            ) : (
              users.map((user, index) => (
                <View key={user.id}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <View style={styles.personRow}>
                    <Avatar name={user.full_name} id={user.id} size={48} />
                    <View style={styles.personText}>
                      <Text style={styles.personName}>{user.full_name}</Text>
                      <Text style={styles.personMeta}>
                        {ROLE_LABEL[user.role ?? ''] ?? user.role ?? 'Aidant'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          <SectionHeader
            title="Invitations en attente"
            count={1}
            badgeColor={AidAmiTheme.colors.pending}
          />
          <View style={styles.listCard}>
            <Text style={styles.inviteText}>
              Code foyer « {household.invite_code} » — partagez-le pour
              inviter un aidant.
            </Text>
          </View>

          {inviteOpen ? (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Inviter un aidant</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom complet"
                placeholderTextColor={AidAmiTheme.colors.textMuted}
                value={name}
                onChangeText={setName}
                accessibilityLabel="Nom de l'aidant"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={AidAmiTheme.colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                accessibilityLabel="Email de l'aidant"
              />
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  (!name.trim() || !email.trim() || saving) &&
                    styles.buttonDisabled,
                  pressed && styles.pressed,
                ]}
                onPress={() => void onAddCaregiver()}
                disabled={!name.trim() || !email.trim() || saving}
                accessibilityRole="button"
                accessibilityLabel="Confirmer l'invitation"
              >
                <Text style={styles.buttonLabel}>
                  {saving ? 'Ajout…' : 'Confirmer'}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => setInviteOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Annuler l'invitation"
              >
                <Text style={styles.secondaryLabel}>Annuler</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.pressed,
              ]}
              onPress={() => setInviteOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Inviter un aidant"
            >
              <Text style={styles.buttonLabel}>+ Inviter un aidant</Text>
            </Pressable>
          )}
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
  listCard: {
    backgroundColor: AidAmiTheme.colors.surface,
    borderRadius: px(AidAmiTheme.borderRadius.card),
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 24,
    ...AidAmiTheme.shadow.card,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: px(AidAmiTheme.touchTarget.minHeight) + 12,
    paddingVertical: 12,
  },
  personText: {
    flex: 1,
    gap: 2,
  },
  personName: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
  },
  personMeta: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    color: AidAmiTheme.colors.textMuted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: AidAmiTheme.colors.border,
  },
  inviteText: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    lineHeight:
      px(AidAmiTheme.typography.sizeBody) * AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.textMuted,
    textAlign: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
  },
  emptyInline: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    color: AidAmiTheme.colors.textMuted,
    paddingVertical: 18,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: AidAmiTheme.colors.surface,
    borderRadius: px(AidAmiTheme.borderRadius.card),
    padding: 16,
    marginBottom: 12,
    ...AidAmiTheme.shadow.card,
  },
  formTitle: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeSubTitle),
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
    marginBottom: 12,
  },
  input: {
    backgroundColor: AidAmiTheme.colors.surfaceMuted,
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
    fontWeight: '700',
    color: AidAmiTheme.colors.onAccent,
  },
  secondaryButton: {
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  secondaryLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '600',
    color: AidAmiTheme.colors.textMuted,
  },
  error: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    color: AidAmiTheme.colors.emotionalRed,
  },
});
