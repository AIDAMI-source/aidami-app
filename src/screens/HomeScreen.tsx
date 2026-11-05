import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../auth';
import {
  getAppSession,
  initializeDatabase,
  setActiveCareRecipientId,
  updateCareRecipient,
  type DbInitResult,
} from '../db';
import type { RootTabParamList } from '../navigation/types';
import {
  moduleEmphasisForProfile,
  PROFILE_TYPE_LABELS,
  profileGuidanceSentence,
  type ModuleEmphasis,
  type ModuleKey,
} from '../profile';
import {
  flushSyncQueue,
  getSyncQueueDepth,
  getSyncTransport,
  type FlushSyncResult,
} from '../sync';
import { AidAmiTheme, px } from '../theme/AidAmiTheme';
import type { CareRecipient, ProfileType } from '../types/models';
import { ProfileTypePicker } from '../ui';

const MODULES: {
  key: ModuleKey;
  route: keyof RootTabParamList;
  label: string;
  hint: string;
}[] = [
  {
    key: 'household',
    route: 'Foyer',
    label: 'Foyer',
    hint: 'Aidants & invitations',
  },
  {
    key: 'tasks',
    route: 'Taches',
    label: 'Tâches',
    hint: 'Agenda & routines',
  },
  {
    key: 'behavior',
    route: 'Comportements',
    label: 'Comportements',
    hint: 'Surcharge & crises',
  },
  {
    key: 'memory',
    route: 'Memoire',
    label: 'Mémoire',
    hint: 'Trombinoscope',
  },
  {
    key: 'advice',
    route: 'Conseils',
    label: 'Conseils',
    hint: 'Soutien IA aidant',
  },
];

function sortModulesForProfile(profileType: ProfileType | null) {
  if (!profileType) return MODULES;
  return [...MODULES].sort((a, b) => {
    const rank = (key: ModuleKey) => {
      const e = moduleEmphasisForProfile(profileType, key);
      if (e === 'emphasized') return 0;
      if (e === 'normal') return 1;
      return 2;
    };
    return rank(a.key) - rank(b.key);
  });
}

function moduleStyle(emphasis: ModuleEmphasis) {
  if (emphasis === 'emphasized') return styles.moduleEmphasized;
  if (emphasis === 'deemphasized') return styles.moduleDeemphasized;
  return null;
}

export function HomeScreen() {
  const navigation =
    useNavigation<BottomTabNavigationProp<RootTabParamList, 'Accueil'>>();
  const insets = useSafeAreaInsets();
  const { mode, configured, authUser, localUser, signOut, requestLogin } =
    useAuth();
  const [dbStatus, setDbStatus] = useState<DbInitResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [queueDepth, setQueueDepth] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastFlush, setLastFlush] = useState<FlushSyncResult | null>(null);
  const [recipient, setRecipient] = useState<CareRecipient | null>(null);
  const [savingType, setSavingType] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const transportName = getSyncTransport().name;

  const refreshQueueDepth = useCallback(async () => {
    try {
      const depth = await getSyncQueueDepth();
      setQueueDepth(depth);
    } catch {
      setQueueDepth(null);
    }
  }, []);

  const loadRecipient = useCallback(async () => {
    try {
      const session = await getAppSession();
      setRecipient(session.careRecipient);
      setProfileError(null);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await initializeDatabase();
      if (!cancelled) {
        setDbStatus(result);
        setLoading(false);
        if (result.ok) {
          await refreshQueueDepth();
          await loadRecipient();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshQueueDepth, loadRecipient]);

  useFocusEffect(
    useCallback(() => {
      if (dbStatus?.ok) {
        void loadRecipient();
        void refreshQueueDepth();
      }
    }, [dbStatus?.ok, loadRecipient, refreshQueueDepth]),
  );

  const onChangeProfileType = async (type: ProfileType) => {
    if (!recipient || savingType || type === recipient.profile_type) return;
    setSavingType(true);
    try {
      const updated = await updateCareRecipient(recipient.id, {
        profile_type: type,
      });
      if (updated) {
        setActiveCareRecipientId(updated.id);
        setRecipient(updated);
      }
      await refreshQueueDepth();
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingType(false);
    }
  };

  const onSynchroniser = async () => {
    if (syncing || !dbStatus?.ok) return;
    setSyncing(true);
    try {
      const result = await flushSyncQueue();
      setLastFlush(result);
      setQueueDepth(result.pendingRemaining);
    } catch (err) {
      setLastFlush({
        processed: 0,
        succeeded: 0,
        failed: 1,
        skipped: 0,
        pendingRemaining: queueDepth ?? 0,
        transport: '—',
        errors: [err instanceof Error ? err.message : String(err)],
      });
    } finally {
      setSyncing(false);
    }
  };

  const syncSummary = lastFlush
    ? lastFlush.failed > 0
      ? `Échec partiel — ${lastFlush.succeeded} ok, ${lastFlush.failed} en attente (${lastFlush.transport})`
      : `Synchronisé — ${lastFlush.succeeded} envoyé(s) via ${lastFlush.transport}`
    : queueDepth === null
      ? null
      : queueDepth === 0
        ? 'File vide — à jour'
        : `${queueDepth} mutation(s) en file`;

  const modules = sortModulesForProfile(recipient?.profile_type ?? null);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top, 24) + 16 },
      ]}
      accessibilityLabel="Écran d'accueil Aid'Ami"
    >
      <Text style={styles.brand}>Aid'Ami</Text>
      <Text style={styles.subtitle}>
        Accompagnement Alzheimer & TSA-TDAH — hors-ligne d'abord.
      </Text>

      {dbStatus?.ok && recipient ? (
        <View
          style={styles.profileCard}
          accessibilityLabel={`Proche actif ${recipient.first_name}, profil ${PROFILE_TYPE_LABELS[recipient.profile_type]}`}
        >
          <Text style={styles.statusTitle}>Proche accompagné</Text>
          <Text style={styles.profileName}>{recipient.first_name}</Text>
          <Text style={styles.profileMeta}>
            Profil actuel : {PROFILE_TYPE_LABELS[recipient.profile_type]}
          </Text>
          <Text style={styles.guidance}>
            {profileGuidanceSentence(recipient.profile_type)}
          </Text>
          <Text style={styles.pickerLabel}>Changer le type de profil</Text>
          <ProfileTypePicker
            selected={recipient.profile_type}
            onSelect={(type) => void onChangeProfileType(type)}
            disabled={savingType}
          />
          <Pressable
            style={({ pressed }) => [
              styles.foyerLink,
              pressed && styles.pressed,
            ]}
            onPress={() => navigation.navigate('Foyer')}
            accessibilityRole="button"
            accessibilityLabel="Choisir un autre proche dans le Foyer"
          >
            <Text style={styles.foyerLinkLabel}>
              Choisir un autre proche (Foyer)
            </Text>
          </Pressable>
        </View>
      ) : null}
      {profileError ? <Text style={styles.statusError}>{profileError}</Text> : null}

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Base locale</Text>
        {loading ? (
          <View style={styles.statusRow}>
            <ActivityIndicator color={AidAmiTheme.colors.accent} />
            <Text style={styles.statusBody}>Initialisation SQLite…</Text>
          </View>
        ) : dbStatus?.ok ? (
          <Text style={styles.statusOk}>
            Prête — {dbStatus.tables.length} tables
            {dbStatus.seed?.seeded
              ? ' · démo Foyer Martin chargée'
              : ' · données locales'}
          </Text>
        ) : (
          <Text style={styles.statusError}>
            Erreur DB : {dbStatus?.error ?? 'inconnue'}
          </Text>
        )}

        {dbStatus?.ok ? (
          <>
            <Text style={styles.syncMeta}>
              Transport : {transportName}
              {configured ? ' · Supabase configuré' : ' · mode hors-ligne'}
            </Text>
            {mode === 'authenticated' && authUser ? (
              <Text style={styles.syncMeta}>
                Connecté : {authUser.email}
                {localUser
                  ? ` · local ${localUser.full_name}`
                  : ' · pas de user local lié'}
              </Text>
            ) : (
              <Text style={styles.syncMeta}>
                Session : {mode === 'demo' ? 'démo locale' : mode}
              </Text>
            )}
            {syncSummary ? (
              <Text style={styles.syncMeta}>{syncSummary}</Text>
            ) : null}
            <Pressable
              style={({ pressed }) => [
                styles.syncButton,
                (syncing || loading) && styles.syncButtonDisabled,
                pressed && styles.pressed,
              ]}
              onPress={() => void onSynchroniser()}
              disabled={syncing || loading}
              accessibilityRole="button"
              accessibilityLabel="Synchroniser la file hors-ligne"
              accessibilityHint="Pousse les mutations locales vers le transport actif"
            >
              <Text style={styles.syncButtonLabel}>
                {syncing ? 'Synchronisation…' : 'Synchroniser'}
              </Text>
            </Pressable>
            {mode === 'authenticated' ? (
              <Pressable
                style={({ pressed }) => [
                  styles.signOutButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => void signOut()}
                accessibilityRole="button"
                accessibilityLabel="Se déconnecter"
              >
                <Text style={styles.signOutLabel}>Se déconnecter</Text>
              </Pressable>
            ) : configured && mode === 'demo' ? (
              <Pressable
                style={({ pressed }) => [
                  styles.signOutButton,
                  pressed && styles.pressed,
                ]}
                onPress={requestLogin}
                accessibilityRole="button"
                accessibilityLabel="Aller à la connexion"
              >
                <Text style={styles.signOutLabel}>Aller à la connexion</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}
      </View>

      <Text style={styles.sectionLabel}>Modules</Text>
      {recipient ? (
        <Text style={styles.modulesHint} accessibilityLiveRegion="polite">
          Ordre adapté au profil {PROFILE_TYPE_LABELS[recipient.profile_type]} —
          tous les onglets restent accessibles.
        </Text>
      ) : null}
      <View style={styles.moduleList}>
        {modules.map((mod) => {
          const emphasis = recipient
            ? moduleEmphasisForProfile(recipient.profile_type, mod.key)
            : 'normal';
          const emphasisHint =
            emphasis === 'emphasized'
              ? 'Recommandé pour ce profil'
              : emphasis === 'deemphasized'
                ? 'Moins prioritaire pour ce profil'
                : mod.hint;
          return (
            <Pressable
              key={mod.key}
              style={({ pressed }) => [
                styles.moduleButton,
                moduleStyle(emphasis),
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Ouvrir ${mod.label}`}
              accessibilityHint={emphasisHint}
              onPress={() => navigation.navigate(mod.route)}
            >
              <View style={styles.moduleTitleRow}>
                <Text style={styles.moduleLabel}>{mod.label}</Text>
                {emphasis === 'emphasized' ? (
                  <Text style={styles.emphasisBadge}>Prioritaire</Text>
                ) : null}
                {emphasis === 'deemphasized' ? (
                  <Text style={styles.deemphasisBadge}>Secondaire</Text>
                ) : null}
              </View>
              <Text style={styles.moduleHint}>{mod.hint}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: AidAmiTheme.colors.surface,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  brand: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeTitle),
    lineHeight:
      px(AidAmiTheme.typography.sizeTitle) * AidAmiTheme.typography.lineHeight,
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    lineHeight:
      px(AidAmiTheme.typography.sizeBody) * AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.primary,
    marginBottom: 28,
  },
  profileCard: {
    backgroundColor: AidAmiTheme.colors.surfaceMuted,
    borderRadius: px(AidAmiTheme.borderRadius.card),
    padding: 20,
    marginBottom: 20,
  },
  profileName: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeSubTitle),
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
    marginBottom: 4,
  },
  profileMeta: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    color: AidAmiTheme.colors.textPrimary,
    marginBottom: 6,
  },
  guidance: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    lineHeight:
      px(AidAmiTheme.typography.sizeCaption) *
      AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.textMuted,
    marginBottom: 14,
  },
  pickerLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    fontWeight: '600',
    color: AidAmiTheme.colors.primary,
    marginBottom: 8,
  },
  foyerLink: {
    marginTop: 14,
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: px(AidAmiTheme.borderRadius.button),
    borderWidth: 1,
    borderColor: AidAmiTheme.colors.border,
    backgroundColor: AidAmiTheme.colors.surface,
    paddingHorizontal: 16,
  },
  foyerLinkLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '600',
    color: AidAmiTheme.colors.primary,
  },
  statusCard: {
    backgroundColor: AidAmiTheme.colors.surfaceMuted,
    borderRadius: px(AidAmiTheme.borderRadius.card),
    padding: 20,
    marginBottom: 28,
  },
  statusTitle: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeSubTitle),
    lineHeight:
      px(AidAmiTheme.typography.sizeSubTitle) *
      AidAmiTheme.typography.lineHeight,
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBody: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    lineHeight:
      px(AidAmiTheme.typography.sizeBody) * AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.textPrimary,
  },
  statusOk: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    lineHeight:
      px(AidAmiTheme.typography.sizeBody) * AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.textMuted,
  },
  statusError: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    lineHeight:
      px(AidAmiTheme.typography.sizeBody) * AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.emotionalRed,
    marginBottom: 12,
  },
  syncMeta: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    lineHeight:
      px(AidAmiTheme.typography.sizeCaption) *
      AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.textMuted,
    marginTop: 10,
  },
  syncButton: {
    marginTop: 14,
    backgroundColor: AidAmiTheme.colors.primary,
    borderRadius: px(AidAmiTheme.borderRadius.button),
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
  syncButtonLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '600',
    color: AidAmiTheme.colors.onAccent,
  },
  signOutButton: {
    marginTop: 10,
    borderRadius: px(AidAmiTheme.borderRadius.button),
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AidAmiTheme.colors.surface,
    borderWidth: 1,
    borderColor: AidAmiTheme.colors.border,
  },
  signOutLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '600',
    color: AidAmiTheme.colors.primary,
  },
  sectionLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeSubTitle),
    lineHeight:
      px(AidAmiTheme.typography.sizeSubTitle) *
      AidAmiTheme.typography.lineHeight,
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
    marginBottom: 8,
  },
  modulesHint: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    color: AidAmiTheme.colors.textMuted,
    marginBottom: 12,
  },
  moduleList: {
    gap: 12,
  },
  moduleButton: {
    backgroundColor: AidAmiTheme.colors.accent,
    borderRadius: px(AidAmiTheme.borderRadius.button),
    minHeight: 72,
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  moduleEmphasized: {
    borderWidth: 3,
    borderColor: AidAmiTheme.colors.primary,
  },
  moduleDeemphasized: {
    opacity: 0.55,
    backgroundColor: AidAmiTheme.colors.secondary,
  },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  emphasisBadge: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: AidAmiTheme.colors.onAccent,
    backgroundColor: AidAmiTheme.colors.primary,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  deemphasisBadge: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: AidAmiTheme.colors.onAccent,
    opacity: 0.9,
  },
  pressed: {
    opacity: 0.85,
  },
  moduleLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    lineHeight:
      px(AidAmiTheme.typography.sizeBody) * AidAmiTheme.typography.lineHeight,
    fontWeight: '700',
    color: AidAmiTheme.colors.onAccent,
  },
  moduleHint: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    color: AidAmiTheme.colors.onAccent,
    opacity: 0.92,
  },
});
