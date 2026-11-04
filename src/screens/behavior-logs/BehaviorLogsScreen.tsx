import { useCallback, useMemo, useState } from 'react';
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
import {
  dayKey,
  formatDayGroupShort,
  formatTimeFr,
  ScreenHeader,
} from '../../ui';

const INTENSITIES: {
  level: IntensityLevel;
  label: string;
  title: string;
  color: string;
  /** Label color chosen for contrast on the chip fill. */
  onColor: string;
}[] = [
  {
    level: 'GREEN',
    label: 'Vert',
    title: 'État calme',
    color: AidAmiTheme.colors.emotionalGreen,
    onColor: AidAmiTheme.colors.primary,
  },
  {
    level: 'YELLOW',
    label: 'Jaune',
    title: 'Légère agitation',
    color: AidAmiTheme.colors.emotionalYellow,
    onColor: AidAmiTheme.colors.primary,
  },
  {
    level: 'ORANGE',
    label: 'Orange',
    title: 'Surcharge sensorielle',
    color: AidAmiTheme.colors.emotionalOrange,
    onColor: AidAmiTheme.colors.primary,
  },
  {
    level: 'RED',
    label: 'Rouge',
    title: 'Crise',
    color: AidAmiTheme.colors.emotionalRed,
    onColor: AidAmiTheme.colors.primary,
  },
];

function intensityMeta(level: IntensityLevel) {
  return (
    INTENSITIES.find((item) => item.level === level) ?? INTENSITIES[1]
  );
}

type LogGroup = {
  key: string;
  heading: string;
  logs: BehaviorLog[];
};

function groupLogs(logs: BehaviorLog[]): LogGroup[] {
  const map = new Map<string, BehaviorLog[]>();
  for (const log of logs) {
    const key = dayKey(log.logged_at);
    const list = map.get(key) ?? [];
    list.push(log);
    map.set(key, list);
  }

  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, group]) => ({
      key,
      heading: formatDayGroupShort(group[0].logged_at),
      logs: [...group].sort((a, b) => b.logged_at.localeCompare(a.logged_at)),
    }));
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
  const [composerOpen, setComposerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const groups = useMemo(() => groupLogs(logs), [logs]);

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
      setComposerOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 24) + 16,
            paddingBottom: Math.max(insets.bottom, 24) + 88,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        accessibilityLabel="Module Comportements"
      >
        <ScreenHeader
          title="Comportements"
          subtitle={
            recipient
              ? `Suivi des surcharges pour ${recipient.first_name}`
              : 'Suivi des surcharges & crises'
          }
        />

        <View style={styles.chipRow}>
          {INTENSITIES.map((item) => {
            const selected = intensity === item.level;
            return (
              <Pressable
                key={item.level}
                style={({ pressed }) => [
                  styles.chip,
                  { backgroundColor: item.color },
                  selected && styles.chipSelected,
                  pressed && styles.pressed,
                ]}
                onPress={() => {
                  setIntensity(item.level);
                  setComposerOpen(true);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Intensité ${item.label}`}
              >
                <Text style={[styles.chipLabel, { color: item.onColor }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator color={AidAmiTheme.colors.accent} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <>
            {logs.length === 0 ? (
              <Text style={styles.empty}>Aucun journal pour le moment.</Text>
            ) : (
              groups.map((group) => (
                <View key={group.key} style={styles.group}>
                  <Text style={styles.dayHeading}>{group.heading}</Text>
                  {group.logs.map((log) => {
                    const meta = intensityMeta(log.intensity_level);
                    const time = formatTimeFr(log.logged_at);
                    return (
                      <View
                        key={log.id}
                        style={[styles.card, { borderLeftColor: meta.color }]}
                      >
                        <View style={styles.cardTop}>
                          <Text style={styles.time}>{time ?? '—'}</Text>
                          <View
                            style={[
                              styles.pill,
                              { backgroundColor: meta.color },
                            ]}
                          >
                            <Text
                              style={[
                                styles.pillLabel,
                                { color: meta.onColor },
                              ]}
                            >
                              {meta.label}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.cardTitle}>{meta.title}</Text>
                        {log.description ? (
                          <Text style={styles.cardBody}>{log.description}</Text>
                        ) : log.trigger_event ? (
                          <Text style={styles.cardBody}>{log.trigger_event}</Text>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ))
            )}

            {composerOpen ? (
              <View style={styles.composer}>
                <Text style={styles.composerTitle}>Nouveau journal</Text>
                <Text style={styles.composerHint}>
                  Intensité : {intensityMeta(intensity).label}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Description (optionnel)"
                  placeholderTextColor={AidAmiTheme.colors.textMuted}
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
                  accessibilityLabel="Enregistrer le journal"
                >
                  <Text style={styles.buttonLabel}>
                    {saving ? 'Ajout…' : 'Enregistrer'}
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => setComposerOpen(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Annuler"
                >
                  <Text style={styles.secondaryLabel}>Annuler</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { bottom: Math.max(insets.bottom, 12) + 12 },
          pressed && styles.pressed,
        ]}
        onPress={() => setComposerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Ajouter un journal de comportement"
      >
        <Text style={styles.fabLabel}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AidAmiTheme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 24,
  },
  chip: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 78,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
  },
  chipSelected: {
    borderWidth: 3,
    borderColor: AidAmiTheme.colors.primary,
  },
  chipLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: 13,
    fontWeight: '700',
  },
  empty: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    color: AidAmiTheme.colors.textMuted,
    marginBottom: 16,
  },
  group: {
    marginBottom: 8,
  },
  dayHeading: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: AidAmiTheme.colors.surface,
    borderRadius: px(AidAmiTheme.borderRadius.card),
    borderLeftWidth: 5,
    padding: 16,
    marginBottom: 12,
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    ...AidAmiTheme.shadow.card,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  time: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    color: AidAmiTheme.colors.textMuted,
    fontWeight: '600',
  },
  pill: {
    borderRadius: px(AidAmiTheme.borderRadius.chip),
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: 12,
    fontWeight: '700',
  },
  cardTitle: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
    marginBottom: 4,
  },
  cardBody: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    lineHeight:
      px(AidAmiTheme.typography.sizeCaption) *
      AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.textMuted,
  },
  composer: {
    backgroundColor: AidAmiTheme.colors.surface,
    borderRadius: px(AidAmiTheme.borderRadius.card),
    padding: 16,
    marginTop: 8,
    ...AidAmiTheme.shadow.card,
  },
  composerTitle: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeSubTitle),
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
    marginBottom: 4,
  },
  composerHint: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    color: AidAmiTheme.colors.textMuted,
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
  },
  secondaryLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '600',
    color: AidAmiTheme.colors.textMuted,
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AidAmiTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...AidAmiTheme.shadow.card,
  },
  fabLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '600',
    color: AidAmiTheme.colors.onAccent,
  },
  error: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    color: AidAmiTheme.colors.emotionalRed,
  },
});
