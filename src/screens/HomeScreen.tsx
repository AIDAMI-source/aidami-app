import { useNavigation } from '@react-navigation/native';
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
import { initializeDatabase, type DbInitResult } from '../db/database';
import type { RootTabParamList } from '../navigation/types';
import {
  flushSyncQueue,
  getSyncQueueDepth,
  getSyncTransport,
  type FlushSyncResult,
} from '../sync';
import { AidAmiTheme, px } from '../theme/AidAmiTheme';

const MODULES = [
  {
    key: 'household',
    route: 'Foyer' as const,
    label: 'Foyer',
    hint: 'Aidants & invitations',
  },
  {
    key: 'tasks',
    route: 'Taches' as const,
    label: 'Tâches',
    hint: 'Agenda & routines',
  },
  {
    key: 'behavior',
    route: 'Comportements' as const,
    label: 'Comportements',
    hint: 'Surcharge & crises',
  },
  {
    key: 'memory',
    route: 'Memoire' as const,
    label: 'Mémoire',
    hint: 'Trombinoscope',
  },
] as const;

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
  const transportName = getSyncTransport().name;

  const refreshQueueDepth = useCallback(async () => {
    try {
      const depth = await getSyncQueueDepth();
      setQueueDepth(depth);
    } catch {
      setQueueDepth(null);
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
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshQueueDepth]);

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
      <View style={styles.moduleList}>
        {MODULES.map((mod) => (
          <Pressable
            key={mod.key}
            style={({ pressed }) => [
              styles.moduleButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Ouvrir ${mod.label}`}
            accessibilityHint={mod.hint}
            onPress={() => navigation.navigate(mod.route)}
          >
            <Text style={styles.moduleLabel}>{mod.label}</Text>
            <Text style={styles.moduleHint}>{mod.hint}</Text>
          </Pressable>
        ))}
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
