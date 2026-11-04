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
  createTask,
  getAppSession,
  listTasksByCareRecipient,
  toggleTaskComplete,
  updateTask,
} from '../../db';
import type { CareRecipient, Task, User } from '../../types/models';
import { AidAmiTheme, px } from '../../theme/AidAmiTheme';
import {
  AudioMemoControl,
  dayKey,
  formatDayHeading,
  formatTimeFr,
  ScreenHeader,
} from '../../ui';

const CATEGORY_LABEL: Record<string, string> = {
  MEDICATION: 'Médicament',
  APPOINTMENT: 'Rendez-vous',
  ROUTINE: 'Routine',
  MEAL: 'Repas',
  HYGIENE: 'Hygiène',
};

/** Friendly subtitles for known demo titles (falls back to category). */
const DEMO_SUBTITLE: Record<string, string> = {
  'Petit-déjeuner': 'Routine du matin',
  'Promenade au parc': 'Activité physique légère',
  'Préparation dîner': 'Recette favorite',
  'Visite famille': 'Chez Marie & Jean',
};

function taskSubtitle(task: Task): string | null {
  if (DEMO_SUBTITLE[task.title]) return DEMO_SUBTITLE[task.title];
  if (task.category) return CATEGORY_LABEL[task.category] ?? task.category;
  return null;
}

type TaskGroup = {
  key: string;
  heading: string;
  tasks: Task[];
};

function groupTasks(tasks: Task[]): TaskGroup[] {
  const map = new Map<string, Task[]>();
  for (const task of tasks) {
    const key = dayKey(task.scheduled_at ?? task.created_at);
    const list = map.get(key) ?? [];
    list.push(task);
    map.set(key, list);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, groupTasksList]) => {
      const sample = groupTasksList[0];
      return {
        key,
        heading: formatDayHeading(sample.scheduled_at ?? sample.created_at),
        tasks: [...groupTasksList].sort((left, right) => {
          const leftTime = left.scheduled_at ?? left.created_at;
          const rightTime = right.scheduled_at ?? right.created_at;
          return leftTime.localeCompare(rightTime);
        }),
      };
    });
}

export function TasksScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<CareRecipient | null>(null);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const groups = useMemo(() => groupTasks(tasks), [tasks]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const session = await getAppSession();
      const list = await listTasksByCareRecipient(session.careRecipient.id);
      setRecipient(session.careRecipient);
      setActiveUser(session.activeUser);
      setTasks(list);
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
    if (!recipient || !title.trim() || saving) return;
    setSaving(true);
    try {
      await createTask({
        care_recipient_id: recipient.id,
        title: title.trim(),
        category: 'ROUTINE',
        scheduled_at: new Date().toISOString(),
      });
      setTitle('');
      setComposerOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const onToggle = async (task: Task) => {
    try {
      await toggleTaskComplete(task.id, activeUser?.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const onAudioMemoChange = async (task: Task, uri: string | null) => {
    try {
      await updateTask(task.id, { audio_memo_url: uri });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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
      accessibilityLabel="Module Tâches"
    >
      <ScreenHeader
        title="Tâches"
        subtitle={
          recipient
            ? `Agenda & routines pour ${recipient.first_name}`
            : 'Agenda & routines quotidiennes'
        }
      />

      {loading ? (
        <ActivityIndicator color={AidAmiTheme.colors.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <>
          {tasks.length === 0 ? (
            <Text style={styles.empty}>Aucune tâche pour le moment.</Text>
          ) : (
            groups.map((group) => (
              <View key={group.key} style={styles.group}>
                <Text style={styles.dayHeading}>{group.heading}</Text>
                {group.tasks.map((task) => {
                  const time = formatTimeFr(task.scheduled_at);
                  const done = task.is_completed === 1;
                  return (
                    <View key={task.id} style={styles.card}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.cardMain,
                          pressed && styles.pressed,
                        ]}
                        onPress={() => void onToggle(task)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: done }}
                        accessibilityLabel={`${task.title}, ${done ? 'terminée' : 'à faire'}`}
                      >
                        <View
                          style={[styles.checkbox, done && styles.checkboxDone]}
                        >
                          {done ? (
                            <Text style={styles.checkMark}>✓</Text>
                          ) : null}
                        </View>
                        <View style={styles.cardText}>
                          {time ? (
                            <Text style={styles.time}>{time}</Text>
                          ) : null}
                          <Text
                            style={[
                              styles.cardTitle,
                              done && styles.cardTitleDone,
                            ]}
                          >
                            {task.title}
                          </Text>
                          {taskSubtitle(task) ? (
                            <Text style={styles.cardMeta}>
                              {taskSubtitle(task)}
                            </Text>
                          ) : null}
                        </View>
                      </Pressable>
                      <Text style={styles.audioLabel}>
                        Mémo vocal (consigne familiale)
                      </Text>
                      <AudioMemoControl
                        uri={task.audio_memo_url}
                        onChange={(uri) => onAudioMemoChange(task, uri)}
                        accessibilityContext={`mémo de la tâche ${task.title}`}
                      />
                    </View>
                  );
                })}
              </View>
            ))
          )}

          {composerOpen ? (
            <View style={styles.composer}>
              <Text style={styles.composerTitle}>Nouvelle tâche</Text>
              <TextInput
                style={styles.input}
                placeholder="Titre de la tâche"
                placeholderTextColor={AidAmiTheme.colors.textMuted}
                value={title}
                onChangeText={setTitle}
                accessibilityLabel="Titre de la tâche"
              />
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  (!title.trim() || saving) && styles.buttonDisabled,
                  pressed && styles.pressed,
                ]}
                onPress={() => void onAdd()}
                disabled={!title.trim() || saving}
                accessibilityRole="button"
                accessibilityLabel="Ajouter la tâche"
              >
                <Text style={styles.buttonLabel}>
                  {saving ? 'Ajout…' : 'Ajouter'}
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
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.pressed,
              ]}
              onPress={() => setComposerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Ajouter une tâche"
            >
              <Text style={styles.buttonLabel}>+ Ajouter une tâche</Text>
            </Pressable>
          )}
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
    borderWidth: 1,
    borderColor: AidAmiTheme.colors.border,
    padding: 16,
    marginBottom: 10,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
  },
  audioLabel: {
    marginTop: 12,
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: AidAmiTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: AidAmiTheme.colors.accent,
    borderColor: AidAmiTheme.colors.accent,
  },
  checkMark: {
    color: AidAmiTheme.colors.onAccent,
    fontWeight: '700',
    fontSize: 16,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  time: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    color: AidAmiTheme.colors.textMuted,
  },
  cardTitle: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
  },
  cardTitleDone: {
    textDecorationLine: 'line-through',
    color: AidAmiTheme.colors.textMuted,
  },
  cardMeta: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
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
    marginTop: 8,
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
  error: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    color: AidAmiTheme.colors.emotionalRed,
  },
});
