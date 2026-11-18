import { StyleSheet, Text, View } from 'react-native';

import {
  moduleEmphasisForProfile,
  PROFILE_TYPE_LABELS,
  profileChipSelected,
  profileSectionTint,
  type ModuleKey,
} from '../profile';
import type { ProfileType } from '../types/models';
import { AidAmiTheme, px } from '../theme/AidAmiTheme';

type ProfileGuidanceBannerProps = {
  profileType: ProfileType;
  moduleKey: Extract<ModuleKey, 'memory' | 'behavior'>;
};

const MODULE_LABEL: Record<'memory' | 'behavior', string> = {
  memory: 'Mémoire',
  behavior: 'Comportements',
};

/**
 * Soft guidance banner — never blocks access.
 * Teinte pêche (Alzheimer) / menthe (TSA) selon le profil.
 */
export function ProfileGuidanceBanner({
  profileType,
  moduleKey,
}: ProfileGuidanceBannerProps) {
  const emphasis = moduleEmphasisForProfile(profileType, moduleKey);
  const moduleLabel = MODULE_LABEL[moduleKey];
  const profileLabel = PROFILE_TYPE_LABELS[profileType];

  let message: string;
  if (emphasis === 'emphasized') {
    message = `${moduleLabel} est prioritaire pour le profil ${profileLabel}.`;
  } else if (emphasis === 'deemphasized') {
    message = `${moduleLabel} est secondaire pour le profil ${profileLabel} — toujours disponible.`;
  } else {
    return null;
  }

  const tint = profileSectionTint(profileType);
  const border =
    emphasis === 'emphasized'
      ? profileChipSelected(profileType)
      : AidAmiTheme.colors.border;

  return (
    <View
      style={[styles.banner, { backgroundColor: tint, borderColor: border }]}
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: px(AidAmiTheme.borderRadius.card),
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  text: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    lineHeight:
      px(AidAmiTheme.typography.sizeCaption) *
      AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.textOnPastel,
  },
});
