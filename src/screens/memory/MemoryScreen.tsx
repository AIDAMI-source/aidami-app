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
  updateMemoryItem,
} from '../../db';
import type { CareRecipient, MemoryItem } from '../../types/models';
import { AidAmiTheme, px } from '../../theme/AidAmiTheme';
import { AudioMemoControl, Avatar, ScreenHeader } from '../../ui';

export function MemoryScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<CareRecipient | null>(null);
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
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
      setComposerOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const onAudioRecordChange = async (item: MemoryItem, uri: string | null) => {
    try {
      await updateMemoryItem(item.id, { audio_record_url: uri });
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
      accessibilityLabel="Module Mémoire"
    >
      <ScreenHeader
        title="Mémoire"
        subtitle={
          recipient
            ? `Trombinoscope pour ${recipient.first_name}`
            : 'Trombinoscope des proches'
        }
      />

      {loading ? (
        <ActivityIndicator color={AidAmiTheme.colors.accent} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <>
          {items.length === 0 ? (
            <Text style={styles.empty}>Aucun souvenir pour le moment.</Text>
          ) : (
            <View style={styles.list}>
              {items.map((item) => (
                <View
                  key={item.id}
                  style={styles.card}
                  accessibilityRole="summary"
                  accessibilityLabel={`${item.title}, ${item.relation_type ?? 'Proche'}`}
                >
                  <View style={styles.cardHeader}>
                    <Avatar name={item.title} id={item.id} size={64} />
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.cardMeta} numberOfLines={1}>
                        {item.relation_type ?? 'Proche'}
                      </Text>
                      {item.key_anecdote ? (
                        <Text style={styles.anecdote} numberOfLines={2}>
                          {item.key_anecdote}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <Text style={styles.audioLabel}>
                    Voix rassurante (module Alzheimer)
                  </Text>
                  <AudioMemoControl
                    uri={item.audio_record_url}
                    onChange={(uri) => onAudioRecordChange(item, uri)}
                    accessibilityContext={`voix de ${item.title}`}
                  />
                </View>
              ))}
            </View>
          )}

          {composerOpen ? (
            <View style={styles.composer}>
              <Text style={styles.composerTitle}>Ajouter un souvenir</Text>
              <TextInput
                style={styles.input}
                placeholder="Prénom / titre"
                placeholderTextColor={AidAmiTheme.colors.textMuted}
                value={title}
                onChangeText={setTitle}
                accessibilityLabel="Titre du souvenir"
              />
              <TextInput
                style={styles.input}
                placeholder="Lien (frère, amie…)"
                placeholderTextColor={AidAmiTheme.colors.textMuted}
                value={relation}
                onChangeText={setRelation}
                accessibilityLabel="Type de relation"
              />
              <TextInput
                style={styles.input}
                placeholder="Anecdote clé (optionnel)"
                placeholderTextColor={AidAmiTheme.colors.textMuted}
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
              accessibilityLabel="Ajouter un souvenir"
            >
              <Text style={styles.buttonLabel}>+ Ajouter un proche</Text>
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
  list: {
    marginBottom: 20,
    gap: 12,
  },
  card: {
    backgroundColor: AidAmiTheme.colors.surface,
    borderRadius: px(AidAmiTheme.borderRadius.card),
    padding: 16,
    ...AidAmiTheme.shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
  },
  cardMeta: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    color: AidAmiTheme.colors.textMuted,
  },
  anecdote: {
    marginTop: 4,
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    color: AidAmiTheme.colors.textPrimary,
  },
  audioLabel: {
    marginTop: 12,
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
  },
  composer: {
    backgroundColor: AidAmiTheme.colors.surface,
    borderRadius: px(AidAmiTheme.borderRadius.card),
    padding: 16,
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
