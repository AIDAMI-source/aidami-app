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
  createBehaviorLog,
  getAppSession,
  listBehaviorLogsByCareRecipient,
} from '../../db';
import type {
  BehaviorLog,
  CareRecipient,
  IntensityLevel,
  User,
} from '../../types/models';
import { AidAmiTheme, px } from '../../theme/AidAmiTheme';

const INTENSITIES: {
  level: IntensityLevel;
  label: string;
  color: string;
}[] = [
  { level: 'GREEN', label: 'Vert', color: AidAmiTheme.colors.emotionalGreen },
  { level: 'YELLOW', label: 'Jaune', color: AidAmiTheme.colors.emotionalYellow },
  { level: 'ORANGE', label: 'Orange', color: AidAmiTheme.colors.emotionalOrange },
  { level: 'RED', label: 'Rouge', color: AidAmiTheme.colors.emotionalRed },
];

function intensityColor(level: IntensityLevel): string {
  return INTENSITIES.find((item) => item.level === level)?.color ?? AidAmiTheme.colors.secondary;
}

function intensityLabel(level: IntensityLevel): string {
  return INTENSITIES.find((item) => item.level === level)?.label ?? level;
}

function formatLoggedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function BehaviorLogsScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<CareRecipient | null>(null);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<BehaviorLog[]>([]);
  const [intensity, setIntensity] = useState<IntensityLevel>('YELLOW');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const session = await getAppSession();
      const list = await listBehaviorLogsByCareRecipient(session.careRecipient.id);
      setRecipient(session.careRecipient);
      setActiveUser(session.activeUser);
      setLogs(list);
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

  const onAdd = async () => {
    if (!recipient || !activeUser || saving) return;
    setSaving(true);
    try {
      await createBehaviorLog({
        care_recipient_id: recipient.id,
        user_id: activeUser.id,
        intensity_level: intensity,
        description: description.trim() || null,
      });
      setDescription('');
      setIntensity('YELLOW');
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
      accessibilityLabel="Module Comportements"
    >
      <Text style={styles.title}>Comportements</Text>
      <Text style={styles.subtitle}>
        {recipient
          ? `Journal de surcharge pour ${recipient.first_name}`
          : 'Journal de surcharge & crises'}
      </Text>

      {loading ? (
        <ActivityIndicator color={AidAmiTheme.colors.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <>
          {logs.length === 0 ? (
            <Text style={styles.empty}>Aucun journal pour le moment.</Text>
          ) : (
            logs.map((log) => (
              <View key={log.id} style={styles.row}>
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: intensityColor(log.intensity_level) },
                  ]}
                />
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>
                    {intensityLabel(log.intensity_level)}
                    {log.description ? ` — ${log.description}` : ''}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {formatLoggedAt(log.logged_at)}
                    {log.trigger_event ? ` · ${log.trigger_event}` : ''}
                  </Text>
                </View>
              </View>
            ))
          )}

          <Text style={styles.section}>Nouveau journal</Text>
          <View style={styles.intensityRow}>
            {INTENSITIES.map((item) => {
              const selected = intensity === item.level;
              return (
                <Pressable
                  key={item.level}
                  style={({ pressed }) => [
                    styles.intensityButton,
                    { borderColor: item.color },
                    selected && { backgroundColor: item.color },
                    pressed && styles.pressed,
                  ]}
                  onPress={() => setIntensity(item.level)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Intensité ${item.label}`}
                >
                  <Text
                    style={[
                      styles.intensityLabel,
                      selected && styles.intensityLabelSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Description (optionnel)"
            placeholderTextColor={AidAmiTheme.colors.secondary}
            value={description}
            onChangeText={setDescription}
            accessibilityLabel="Description du comportement"
          />
          <Pressable
            style={({ pressed }) => [
              styles.button,
              saving && styles.buttonDisabled,
              pressed && styles.pressed,
            ]}
            onPress={() => void onAdd()}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Ajouter le journal"
          >
            <Text style={styles.buttonLabel}>
              {saving ? 'Ajout…' : 'Ajouter'}
            </Text>
          </Pressable>
        </>
      )}
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
  empty: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    color: AidAmiTheme.colors.secondary,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: AidAmiTheme.colors.surface,
    borderRadius: px(AidAmiTheme.borderRadius.card),
    padding: 16,
    marginBottom: 10,
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  rowText: {
    flex: 1,
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
  section: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeSubTitle),
    fontWeight: '600',
    color: AidAmiTheme.colors.primary,
    marginTop: 16,
    marginBottom: 12,
  },
  intensityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  intensityButton: {
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    minWidth: 72,
    paddingHorizontal: 14,
    borderRadius: px(AidAmiTheme.borderRadius.button),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AidAmiTheme.colors.surface,
  },
  intensityLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: AidAmiTheme.colors.textPrimary,
  },
  intensityLabelSelected: {
    color: AidAmiTheme.colors.primary,
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
