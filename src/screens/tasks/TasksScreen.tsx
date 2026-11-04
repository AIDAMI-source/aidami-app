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
  createTask,
  getAppSession,
  listTasksByCareRecipient,
  toggleTaskComplete,
} from '../../db';
import type { CareRecipient, Task, User } from '../../types/models';
import { AidAmiTheme, px } from '../../theme/AidAmiTheme';

const CATEGORY_LABEL: Record<string, string> = {
  MEDICATION: 'Médicament',
  APPOINTMENT: 'Rendez-vous',
  ROUTINE: 'Routine',
  MEAL: 'Repas',
  HYGIENE: 'Hygiène',
};

export function TasksScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<CareRecipient | null>(null);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

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
      });
      setTitle('');
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
      <Text style={styles.title}>Tâches</Text>
      <Text style={styles.subtitle}>
        {recipient
          ? `Agenda & routines pour ${recipient.first_name}`
          : 'Agenda & routines'}
      </Text>

      {loading ? (
        <ActivityIndicator color={AidAmiTheme.colors.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <>
          {tasks.length === 0 ? (
            <Text style={styles.empty}>Aucune tâche pour le moment.</Text>
          ) : (
            tasks.map((task) => (
              <Pressable
                key={task.id}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                onPress={() => void onToggle(task)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: task.is_completed === 1 }}
                accessibilityLabel={`${task.title}, ${task.is_completed ? 'terminée' : 'à faire'}`}
              >
                <View
                  style={[
                    styles.checkbox,
                    task.is_completed === 1 && styles.checkboxDone,
                  ]}
                >
                  {task.is_completed === 1 ? (
                    <Text style={styles.checkMark}>✓</Text>
                  ) : null}
                </View>
                <View style={styles.rowText}>
                  <Text
                    style={[
                      styles.rowTitle,
                      task.is_completed === 1 && styles.rowTitleDone,
                    ]}
                  >
                    {task.title}
                  </Text>
                  {task.category ? (
                    <Text style={styles.rowMeta}>
                      {CATEGORY_LABEL[task.category] ?? task.category}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))
          )}

          <Text style={styles.section}>Nouvelle tâche</Text>
          <TextInput
            style={styles.input}
            placeholder="Titre de la tâche"
            placeholderTextColor={AidAmiTheme.colors.secondary}
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
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: AidAmiTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: AidAmiTheme.colors.accent,
    borderColor: AidAmiTheme.colors.accent,
  },
  checkMark: {
    color: AidAmiTheme.colors.primary,
    fontWeight: '700',
    fontSize: 16,
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
  rowTitleDone: {
    textDecorationLine: 'line-through',
    color: AidAmiTheme.colors.secondary,
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
