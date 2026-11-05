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
  createCommunityPost,
  createCommunityReply,
  getAppSession,
  listCommunityPosts,
  listRepliesForPost,
  type CommunityPostWithMeta,
  type CommunityReplyWithAuthor,
} from '../../db';
import { AidAmiTheme, px } from '../../theme/AidAmiTheme';
import {
  Avatar,
  caregiverDisplayName,
  formatDayGroupShort,
  formatTimeFr,
  ScreenHeader,
} from '../../ui';

export function CommunauteScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<CommunityPostWithMeta[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [replies, setReplies] = useState<CommunityReplyWithAuthor[]>([]);
  const [replyDraft, setReplyDraft] = useState('');
  const [replySaving, setReplySaving] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const session = await getAppSession();
      setActiveUserId(session.activeUser.id);
      const list = await listCommunityPosts();
      setPosts(list);
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

  const loadReplies = useCallback(async (postId: string) => {
    setLoadingReplies(true);
    try {
      const rows = await listRepliesForPost(postId);
      setReplies(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingReplies(false);
    }
  }, []);

  const onToggleReplies = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      setReplies([]);
      setReplyDraft('');
      return;
    }
    setExpandedPostId(postId);
    setReplyDraft('');
    await loadReplies(postId);
  };

  const onPublish = async () => {
    if (!activeUserId || !draft.trim() || saving) return;
    setSaving(true);
    try {
      await createCommunityPost({
        author_user_id: activeUserId,
        body: draft.trim(),
      });
      setDraft('');
      setComposerOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const onReply = async () => {
    if (!activeUserId || !expandedPostId || !replyDraft.trim() || replySaving) {
      return;
    }
    setReplySaving(true);
    try {
      await createCommunityReply({
        post_id: expandedPostId,
        author_user_id: activeUserId,
        body: replyDraft.trim(),
      });
      setReplyDraft('');
      await loadReplies(expandedPostId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setReplySaving(false);
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
      accessibilityLabel="Communauté — expériences entre aidants"
    >
      <ScreenHeader
        title="Communauté"
        subtitle="Partagez une courte expérience avec d'autres aidants. Prénom uniquement — jamais l'e-mail."
      />

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.pressed,
        ]}
        onPress={() => setComposerOpen((open) => !open)}
        accessibilityRole="button"
        accessibilityLabel={
          composerOpen ? 'Fermer le formulaire' : 'Partager une expérience'
        }
      >
        <Text style={styles.primaryButtonLabel}>
          {composerOpen ? 'Fermer' : 'Partager une expérience'}
        </Text>
      </Pressable>

      {composerOpen ? (
        <View style={styles.composer}>
          <Text style={styles.composerLabel}>Votre message</Text>
          <TextInput
            style={styles.inputMultiline}
            value={draft}
            onChangeText={setDraft}
            placeholder="Une situation, une astuce, un moment qui a aidé…"
            placeholderTextColor={AidAmiTheme.colors.textMuted}
            multiline
            maxLength={500}
            accessibilityLabel="Texte de l'expérience"
          />
          <Text style={styles.charCount}>{draft.trim().length}/500</Text>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              (!draft.trim() || saving) && styles.buttonDisabled,
              pressed && styles.pressed,
            ]}
            onPress={() => void onPublish()}
            disabled={!draft.trim() || saving}
            accessibilityRole="button"
            accessibilityLabel="Publier l'expérience"
          >
            <Text style={styles.primaryButtonLabel}>
              {saving ? 'Publication…' : 'Publier'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={AidAmiTheme.colors.accent} />
          <Text style={styles.meta}>Chargement du fil…</Text>
        </View>
      ) : posts.length === 0 ? (
        <Text style={styles.empty}>
          Aucune expérience pour l'instant. Soyez la première personne à
          partager.
        </Text>
      ) : (
        <View style={styles.feed}>
          {posts.map((post) => {
            const author = caregiverDisplayName(post.author_full_name);
            const expanded = expandedPostId === post.id;
            const when = [
              formatDayGroupShort(post.created_at),
              formatTimeFr(post.created_at),
            ]
              .filter(Boolean)
              .join(' · ');
            return (
              <View
                key={post.id}
                style={styles.card}
                accessibilityLabel={`Expérience de ${author}`}
              >
                <View style={styles.cardHeader}>
                  <Avatar name={author} id={post.author_user_id} size={40} />
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.author}>{author}</Text>
                    <Text style={styles.meta}>{when}</Text>
                  </View>
                </View>
                <Text style={styles.body}>{post.body}</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.replyToggle,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => void onToggleReplies(post.id)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    expanded
                      ? 'Masquer les réponses'
                      : `Voir les réponses, ${post.reply_count}`
                  }
                >
                  <Text style={styles.replyToggleLabel}>
                    {expanded
                      ? 'Masquer les réponses'
                      : post.reply_count > 0
                        ? `Réponses (${post.reply_count})`
                        : 'Répondre'}
                  </Text>
                </Pressable>

                {expanded ? (
                  <View style={styles.repliesBlock}>
                    {loadingReplies ? (
                      <ActivityIndicator color={AidAmiTheme.colors.accent} />
                    ) : (
                      replies.map((reply) => {
                        const replyAuthor = caregiverDisplayName(
                          reply.author_full_name,
                        );
                        return (
                          <View key={reply.id} style={styles.replyCard}>
                            <Text style={styles.replyAuthor}>{replyAuthor}</Text>
                            <Text style={styles.replyBody}>{reply.body}</Text>
                          </View>
                        );
                      })
                    )}
                    <TextInput
                      style={styles.inputReply}
                      value={replyDraft}
                      onChangeText={setReplyDraft}
                      placeholder="Écrire une réponse…"
                      placeholderTextColor={AidAmiTheme.colors.textMuted}
                      maxLength={300}
                      accessibilityLabel="Texte de la réponse"
                    />
                    <Pressable
                      style={({ pressed }) => [
                        styles.secondaryButton,
                        (!replyDraft.trim() || replySaving) &&
                          styles.buttonDisabled,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => void onReply()}
                      disabled={!replyDraft.trim() || replySaving}
                      accessibilityRole="button"
                      accessibilityLabel="Envoyer la réponse"
                    >
                      <Text style={styles.secondaryButtonLabel}>
                        {replySaving ? 'Envoi…' : 'Envoyer'}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      <Text style={styles.privacyNote}>
        Mode local : le fil reste sur cet appareil tant que Supabase n'est pas
        synchronisé. Les écritures sont placées dans sync_queue.
      </Text>
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
  primaryButton: {
    backgroundColor: AidAmiTheme.colors.accent,
    borderRadius: px(AidAmiTheme.borderRadius.button),
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '700',
    color: AidAmiTheme.colors.onAccent,
  },
  secondaryButton: {
    backgroundColor: AidAmiTheme.colors.primary,
    borderRadius: px(AidAmiTheme.borderRadius.button),
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '600',
    color: AidAmiTheme.colors.onAccent,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  composer: {
    backgroundColor: AidAmiTheme.colors.surface,
    borderRadius: px(AidAmiTheme.borderRadius.card),
    padding: 16,
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AidAmiTheme.colors.border,
  },
  composerLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    fontWeight: '600',
    color: AidAmiTheme.colors.primary,
    marginBottom: 8,
  },
  inputMultiline: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: AidAmiTheme.colors.border,
    borderRadius: px(AidAmiTheme.borderRadius.card),
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    color: AidAmiTheme.colors.textPrimary,
    textAlignVertical: 'top',
    backgroundColor: AidAmiTheme.colors.surfaceMuted,
  },
  inputReply: {
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    borderWidth: 1,
    borderColor: AidAmiTheme.colors.border,
    borderRadius: px(AidAmiTheme.borderRadius.button),
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    color: AidAmiTheme.colors.textPrimary,
    backgroundColor: AidAmiTheme.colors.surface,
    marginTop: 8,
  },
  charCount: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    color: AidAmiTheme.colors.textMuted,
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  empty: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    color: AidAmiTheme.colors.textMuted,
    lineHeight:
      px(AidAmiTheme.typography.sizeBody) * AidAmiTheme.typography.lineHeight,
  },
  error: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    color: AidAmiTheme.colors.emotionalRed,
    marginBottom: 12,
  },
  feed: {
    gap: 14,
  },
  card: {
    backgroundColor: AidAmiTheme.colors.surface,
    borderRadius: px(AidAmiTheme.borderRadius.card),
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AidAmiTheme.colors.border,
    ...AidAmiTheme.shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  cardHeaderText: {
    flex: 1,
  },
  author: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
  },
  meta: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    color: AidAmiTheme.colors.textMuted,
  },
  body: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    lineHeight:
      px(AidAmiTheme.typography.sizeBody) * AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.textPrimary,
  },
  replyToggle: {
    marginTop: 12,
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: px(AidAmiTheme.borderRadius.button),
    backgroundColor: AidAmiTheme.colors.surfaceMuted,
    paddingHorizontal: 12,
  },
  replyToggleLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '600',
    color: AidAmiTheme.colors.primary,
  },
  repliesBlock: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AidAmiTheme.colors.border,
    gap: 8,
  },
  replyCard: {
    backgroundColor: AidAmiTheme.colors.surfaceMuted,
    borderRadius: 12,
    padding: 12,
  },
  replyAuthor: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    fontWeight: '700',
    color: AidAmiTheme.colors.secondary,
    marginBottom: 4,
  },
  replyBody: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    color: AidAmiTheme.colors.textPrimary,
  },
  privacyNote: {
    marginTop: 24,
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    lineHeight:
      px(AidAmiTheme.typography.sizeCaption) *
      AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.textMuted,
  },
});
