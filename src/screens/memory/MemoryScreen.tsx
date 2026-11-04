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
  createMemoryItem,
  getAppSession,
  listMemoryItemsByCareRecipient,
} from '../../db';
import type { CareRecipient, MemoryItem } from '../../types/models';
import { AidAmiTheme, px } from '../../theme/AidAmiTheme';

export function MemoryScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<CareRecipient | null>(null);
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [title, setTitle] = useState('');
  const [relation, setRelation] = useState('');
  const [anecdote, setAnecdote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const session = await getAppSession();
      const list = await listMemoryItemsByCareRecipient(session.careRecipient.id);
      setRecipient(session.careRecipient);
      setItems(list);
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
      await createMemoryItem({
        care_recipient_id: recipient.id,
        title: title.trim(),
        relation_type: relation.trim() || null,
        key_anecdote: anecdote.trim() || null,
      });
      setTitle('');
      setRelation('');
      setAnecdote('');
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
      accessibilityLabel="Module Mémoire"
    >
      <Text style={styles.title}>Mémoire</Text>
      <Text style={styles.subtitle}>
        {recipient
          ? `Trombinoscope pour ${recipient.first_name}`
          : 'Trombinoscope & anecdotes'}
      </Text>

      {loading ? (
        <ActivityIndicator color={AidAmiTheme.colors.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <>
          {items.length === 0 ? (
            <Text style={styles.empty}>Aucun souvenir pour le moment.</Text>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>
                    {item.title.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowMeta}>
                    {item.relation_type ?? 'Proche'}
                    {item.key_anecdote ? ` · ${item.key_anecdote}` : ''}
                  </Text>
                </View>
              </View>
            ))
          )}

          <Text style={styles.section}>Ajouter un souvenir</Text>
          <TextInput
            style={styles.input}
            placeholder="Prénom / titre"
            placeholderTextColor={AidAmiTheme.colors.secondary}
            value={title}
            onChangeText={setTitle}
            accessibilityLabel="Titre du souvenir"
          />
          <TextInput
            style={styles.input}
            placeholder="Lien (frère, amie…)"
            placeholderTextColor={AidAmiTheme.colors.secondary}
            value={relation}
            onChangeText={setRelation}
            accessibilityLabel="Type de relation"
          />
          <TextInput
            style={styles.input}
            placeholder="Anecdote clé (optionnel)"
            placeholderTextColor={AidAmiTheme.colors.secondary}
            value={anecdote}
            onChangeText={setAnecdote}
            accessibilityLabel="Anecdote clé"
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
            accessibilityLabel="Ajouter le souvenir"
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AidAmiTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
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
