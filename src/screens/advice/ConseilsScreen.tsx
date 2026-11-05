import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
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
  ADVICE_DISCLAIMER_FR,
  ANNEX_AUDIENCE_LABELS,
  TIP_SHEET_AUDIENCE_LABELS,
  annexLinkGroupsForProfile,
  createAdviceProvider,
  createOfflineAdviceProvider,
  isOpenAiConfigured,
  tipSheetGroupsForProfile,
  type AdviceChatMessage,
  type AnnexLink,
  type TipSheet,
} from '../../advice';
import {
  clearAdviceMessages,
  createAdviceMessage,
  getAppSession,
  listAdviceMessages,
} from '../../db';
import { PROFILE_TYPE_LABELS } from '../../profile';
import type { AdviceMessage, CareRecipient, ProfileType } from '../../types/models';
import { AidAmiTheme, px } from '../../theme/AidAmiTheme';
import { ScreenHeader, SectionHeader } from '../../ui';

const WELCOME_ASSISTANT =
  'Bonjour. Décrivez ce que vous vivez avec votre proche — inquiétude, surcharge, confusion, fatigue… Je vous proposerai des pistes concrètes et bienveillantes.';

type ConseilsSection = 'fiches' | 'assistant' | 'annexe';

const SECTION_TABS: { id: ConseilsSection; label: string }[] = [
  { id: 'fiches', label: 'Fiches' },
  { id: 'assistant', label: 'Assistant' },
  { id: 'annexe', label: 'Annexe' },
];

export function ConseilsScreen() {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<AdviceMessage>>(null);
  const [section, setSection] = useState<ConseilsSection>('fiches');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<CareRecipient | null>(null);
  const [messages, setMessages] = useState<AdviceMessage[]>([]);
  const [draft, setDraft] = useState('');
  const liveAi = isOpenAiConfigured();

  const load = useCallback(async () => {
    try {
      setError(null);
      const session = await getAppSession();
      setRecipient(session.careRecipient);
      const rows = await listAdviceMessages(session.careRecipient.id);
      setMessages(rows);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
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

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError(null);
    setDraft('');

    try {
      const session = await getAppSession();
      const careRecipient = session.careRecipient;
      setRecipient(careRecipient);

      const userMsg = await createAdviceMessage({
        care_recipient_id: careRecipient.id,
        role: 'user',
        content: text,
      });

      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      scrollToEnd();

      const history: AdviceChatMessage[] = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const provider = createAdviceProvider();
      let replyText: string;
      try {
        const result = await provider.reply({
          messages: history,
          profileType: careRecipient.profile_type,
          careRecipientFirstName: careRecipient.first_name,
        });
        replyText = result.content;
      } catch (liveError) {
        const fallback = createOfflineAdviceProvider();
        const result = await fallback.reply({
          messages: history,
          profileType: careRecipient.profile_type,
          careRecipientFirstName: careRecipient.first_name,
        });
        const detail =
          liveError instanceof Error ? liveError.message : String(liveError);
        replyText = `${result.content}\n\n(Mode démo : l’IA en ligne est indisponible — ${detail})`;
      }

      const assistantMsg = await createAdviceMessage({
        care_recipient_id: careRecipient.id,
        role: 'assistant',
        content: replyText,
      });
      setMessages((prev) => [...prev, assistantMsg]);
      scrollToEnd();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setSending(false);
    }
  }, [draft, messages, scrollToEnd, sending]);

  const resetChat = useCallback(async () => {
    if (sending) return;
    try {
      const session = await getAppSession();
      await clearAdviceMessages(session.careRecipient.id);
      setMessages([]);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    }
  }, [sending]);

  const openAnnexLink = useCallback(async (link: AnnexLink) => {
    setLinkError(null);
    try {
      const supported = await Linking.canOpenURL(link.url);
      if (!supported) {
        setLinkError('Impossible d’ouvrir ce lien sur cet appareil.');
        return;
      }
      await Linking.openURL(link.url);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setLinkError(message);
    }
  }, []);

  const profileType: ProfileType = recipient?.profile_type ?? 'MIXED';
  const tipGroups = tipSheetGroupsForProfile(profileType);
  const annexGroups = annexLinkGroupsForProfile(profileType);

  const subtitle = recipient
    ? `Pour ${recipient.first_name} · ${PROFILE_TYPE_LABELS[recipient.profile_type]}`
    : 'Soutien pour l’aidant';

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + 12 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <View style={styles.headerPad}>
        <ScreenHeader title="Conseils" subtitle={subtitle} />
        <Text style={styles.disclaimer}>{ADVICE_DISCLAIMER_FR}</Text>

        <View
          style={styles.segmentRow}
          accessibilityRole="tablist"
          accessibilityLabel="Sections Conseils"
        >
          {SECTION_TABS.map((tab) => {
            const active = section === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => {
                  setSection(tab.id);
                  setLinkError(null);
                }}
                style={({ pressed }) => [
                  styles.segmentBtn,
                  active && styles.segmentBtnActive,
                  pressed && styles.segmentBtnPressed,
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={tab.label}
              >
                <Text
                  style={[
                    styles.segmentBtnText,
                    active && styles.segmentBtnTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AidAmiTheme.colors.accent} />
        </View>
      ) : section === 'fiches' ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
          accessibilityLabel="Fiches conseils"
        >
          <Text style={styles.sectionIntro}>
            Fiches filtrées selon le profil actif (
            {PROFILE_TYPE_LABELS[profileType]}).
          </Text>
          {tipGroups.map((group) => (
            <View key={group.audience} style={styles.groupBlock}>
              <SectionHeader
                title={TIP_SHEET_AUDIENCE_LABELS[group.audience]}
                count={group.tips.length}
              />
              {group.tips.map((tip) => (
                <TipSheetCard key={tip.id} tip={tip} />
              ))}
            </View>
          ))}
        </ScrollView>
      ) : section === 'annexe' ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
          accessibilityLabel="Annexe de liens utiles"
        >
          <Text style={styles.sectionIntro}>
            Liens utiles filtrés selon le profil actif. Touchez un lien pour
            l’ouvrir dans le navigateur.
          </Text>
          {linkError ? (
            <Text style={styles.error} accessibilityRole="alert">
              {linkError}
            </Text>
          ) : null}
          {annexGroups.map((group) => (
            <View key={group.audience} style={styles.groupBlock}>
              <SectionHeader
                title={ANNEX_AUDIENCE_LABELS[group.audience]}
                count={group.links.length}
              />
              {group.links.map((link) => (
                <Pressable
                  key={link.id}
                  onPress={() => void openAnnexLink(link)}
                  style={({ pressed }) => [
                    styles.linkCard,
                    pressed && styles.linkCardPressed,
                  ]}
                  accessibilityRole="link"
                  accessibilityLabel={`${link.title}. ${link.blurb}`}
                  accessibilityHint="Ouvre le lien dans le navigateur"
                >
                  <Text style={styles.linkTitle}>{link.title}</Text>
                  <Text style={styles.linkBlurb}>{link.blurb}</Text>
                  <Text style={styles.linkUrl} numberOfLines={1}>
                    {link.url}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      ) : (
        <>
          <View style={styles.metaRowPad}>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>
                {liveAi ? 'IA en ligne (OpenAI)' : 'Mode démo hors-ligne'}
              </Text>
              <Pressable
                onPress={() => void resetChat()}
                style={({ pressed }) => [
                  styles.clearBtn,
                  pressed && styles.clearBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Effacer la conversation"
                hitSlop={8}
              >
                <Text style={styles.clearBtnText}>Effacer</Text>
              </Pressable>
            </View>
          </View>

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={scrollToEnd}
            ListEmptyComponent={
              <View style={[styles.bubble, styles.bubbleAssistant]}>
                <Text style={styles.bubbleTextAssistant}>
                  {WELCOME_ASSISTANT}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isUser = item.role === 'user';
              return (
                <View
                  style={[
                    styles.bubble,
                    isUser ? styles.bubbleUser : styles.bubbleAssistant,
                  ]}
                  accessibilityRole="text"
                >
                  <Text
                    style={
                      isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant
                    }
                  >
                    {item.content}
                  </Text>
                </View>
              );
            }}
          />

          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          <View
            style={[
              styles.composer,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Décrivez la situation…"
              placeholderTextColor={AidAmiTheme.colors.textMuted}
              multiline
              editable={!sending}
              accessibilityLabel="Message à Aid'Ami Conseils"
            />
            <Pressable
              onPress={() => void send()}
              disabled={sending || !draft.trim()}
              style={({ pressed }) => [
                styles.sendBtn,
                (sending || !draft.trim()) && styles.sendBtnDisabled,
                pressed && !sending && draft.trim()
                  ? styles.sendBtnPressed
                  : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Envoyer"
              accessibilityState={{ disabled: sending || !draft.trim() }}
            >
              {sending ? (
                <ActivityIndicator color={AidAmiTheme.colors.onAccent} />
              ) : (
                <Text style={styles.sendBtnText}>Envoyer</Text>
              )}
            </Pressable>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

function TipSheetCard({ tip }: { tip: TipSheet }) {
  return (
    <View
      style={styles.tipCard}
      accessibilityRole="text"
      accessibilityLabel={`Fiche ${tip.number}. ${tip.title}`}
    >
      <View style={styles.tipNumberBadge}>
        <Text style={styles.tipNumberText}>{tip.number}</Text>
      </View>
      <Text style={styles.tipTitle}>{tip.title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AidAmiTheme.colors.background,
  },
  headerPad: {
    paddingHorizontal: 20,
  },
  disclaimer: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    lineHeight:
      px(AidAmiTheme.typography.sizeCaption) * AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.secondary,
    marginTop: -12,
    marginBottom: 12,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    borderRadius: px(AidAmiTheme.borderRadius.button),
    backgroundColor: AidAmiTheme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  segmentBtnActive: {
    backgroundColor: AidAmiTheme.colors.primary,
  },
  segmentBtnPressed: {
    opacity: 0.88,
  },
  segmentBtnText: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
  },
  segmentBtnTextActive: {
    color: AidAmiTheme.colors.onAccent,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  sectionIntro: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    lineHeight:
      px(AidAmiTheme.typography.sizeCaption) * AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.textMuted,
    marginBottom: 8,
  },
  groupBlock: {
    marginBottom: 16,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: AidAmiTheme.colors.surface,
    borderRadius: px(AidAmiTheme.borderRadius.card),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AidAmiTheme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
  },
  tipNumberBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AidAmiTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipNumberText: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    fontWeight: '700',
    color: AidAmiTheme.colors.onAccent,
  },
  tipTitle: {
    flex: 1,
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    lineHeight:
      px(AidAmiTheme.typography.sizeBody) * AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.textPrimary,
    fontWeight: '600',
  },
  linkCard: {
    backgroundColor: AidAmiTheme.colors.surface,
    borderRadius: px(AidAmiTheme.borderRadius.card),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AidAmiTheme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
  },
  linkCardPressed: {
    backgroundColor: AidAmiTheme.colors.surfaceMuted,
  },
  linkTitle: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
    marginBottom: 4,
  },
  linkBlurb: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    lineHeight:
      px(AidAmiTheme.typography.sizeCaption) * AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.textPrimary,
    marginBottom: 6,
  },
  linkUrl: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: 12,
    color: AidAmiTheme.colors.secondary,
  },
  metaRowPad: {
    paddingHorizontal: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  meta: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: 13,
    color: AidAmiTheme.colors.textMuted,
  },
  clearBtn: {
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: px(AidAmiTheme.borderRadius.button),
    backgroundColor: AidAmiTheme.colors.surfaceMuted,
  },
  clearBtnPressed: {
    opacity: 0.85,
  },
  clearBtnText: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    fontWeight: '600',
    color: AidAmiTheme.colors.primary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
    gap: 10,
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: px(AidAmiTheme.borderRadius.card),
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: AidAmiTheme.colors.primary,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: AidAmiTheme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AidAmiTheme.colors.border,
  },
  bubbleTextUser: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    lineHeight:
      px(AidAmiTheme.typography.sizeBody) * AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.onAccent,
  },
  bubbleTextAssistant: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    lineHeight:
      px(AidAmiTheme.typography.sizeBody) * AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.textPrimary,
  },
  error: {
    marginHorizontal: 20,
    marginBottom: 8,
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    color: AidAmiTheme.colors.emotionalRed,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AidAmiTheme.colors.border,
    backgroundColor: AidAmiTheme.colors.surface,
  },
  input: {
    flex: 1,
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    maxHeight: 120,
    borderRadius: px(AidAmiTheme.borderRadius.card),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AidAmiTheme.colors.border,
    backgroundColor: AidAmiTheme.colors.background,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    color: AidAmiTheme.colors.textPrimary,
  },
  sendBtn: {
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    minWidth: 96,
    paddingHorizontal: 16,
    borderRadius: px(AidAmiTheme.borderRadius.button),
    backgroundColor: AidAmiTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnPressed: {
    opacity: 0.9,
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  sendBtnText: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '700',
    color: AidAmiTheme.colors.onAccent,
  },
});
