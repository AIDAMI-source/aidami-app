import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { initializeDatabase, type DbInitResult } from '../db/database';
import type { RootTabParamList } from '../navigation/types';
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

const EMOTIONAL = [
  { key: 'green', color: AidAmiTheme.colors.emotionalGreen, label: 'Vert' },
  { key: 'yellow', color: AidAmiTheme.colors.emotionalYellow, label: 'Jaune' },
  { key: 'orange', color: AidAmiTheme.colors.emotionalOrange, label: 'Orange' },
  { key: 'red', color: AidAmiTheme.colors.emotionalRed, label: 'Rouge' },
] as const;

export function HomeScreen() {
  const navigation =
    useNavigation<BottomTabNavigationProp<RootTabParamList, 'Accueil'>>();
  const insets = useSafeAreaInsets();
  const [dbStatus, setDbStatus] = useState<DbInitResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await initializeDatabase();
      if (!cancelled) {
        setDbStatus(result);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
            Prête — {dbStatus.tables.length} tables ({dbStatus.tables.join(', ')})
          </Text>
        ) : (
          <Text style={styles.statusError}>
            Erreur DB : {dbStatus?.error ?? 'inconnue'}
          </Text>
        )}
      </View>

      <Text style={styles.sectionLabel}>Modules</Text>
      <View style={styles.moduleList}>
        {MODULES.map((mod) => (
          <Pressable
            key={mod.key}
            style={({ pressed }) => [styles.moduleButton, pressed && styles.modulePressed]}
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

      <Text style={styles.sectionLabel}>Code émotionnel</Text>
      <View style={styles.emotionRow}>
        {EMOTIONAL.map((tone) => (
          <View key={tone.key} style={styles.emotionItem}>
            <View style={[styles.emotionSwatch, { backgroundColor: tone.color }]} />
            <Text style={styles.emotionLabel}>{tone.label}</Text>
          </View>
        ))}
      </View>
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
    paddingBottom: 48,
  },
  brand: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeTitle),
    lineHeight: px(AidAmiTheme.typography.sizeTitle) * AidAmiTheme.typography.lineHeight,
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    lineHeight: px(AidAmiTheme.typography.sizeBody) * AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.secondary,
    marginBottom: 28,
  },
  statusCard: {
    backgroundColor: AidAmiTheme.colors.surface,
    borderRadius: px(AidAmiTheme.borderRadius.card),
    padding: 20,
    marginBottom: 28,
  },
  statusTitle: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeSubTitle),
    lineHeight: px(AidAmiTheme.typography.sizeSubTitle) * AidAmiTheme.typography.lineHeight,
    fontWeight: '600',
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
    lineHeight: px(AidAmiTheme.typography.sizeBody) * AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.textPrimary,
  },
  statusOk: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    lineHeight: px(AidAmiTheme.typography.sizeBody) * AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.secondary,
  },
  statusError: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    lineHeight: px(AidAmiTheme.typography.sizeBody) * AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.emotionalRed,
  },
  sectionLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeSubTitle),
    lineHeight: px(AidAmiTheme.typography.sizeSubTitle) * AidAmiTheme.typography.lineHeight,
    fontWeight: '600',
    color: AidAmiTheme.colors.primary,
    marginBottom: 12,
  },
  moduleList: {
    gap: 12,
    marginBottom: 28,
  },
  moduleButton: {
    backgroundColor: AidAmiTheme.colors.accent,
    borderRadius: px(AidAmiTheme.borderRadius.button),
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    paddingHorizontal: 20,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  modulePressed: {
    opacity: 0.85,
  },
  moduleLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    lineHeight: px(AidAmiTheme.typography.sizeBody) * AidAmiTheme.typography.lineHeight,
    fontWeight: '600',
    color: AidAmiTheme.colors.primary,
  },
  moduleHint: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody) - 2,
    color: AidAmiTheme.colors.primary,
    opacity: 0.8,
  },
  emotionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  emotionItem: {
    alignItems: 'center',
    flex: 1,
  },
  emotionSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 6,
  },
  emotionLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: 14,
    color: AidAmiTheme.colors.textPrimary,
  },
});
