import type { ProfileType } from '../types/models';
import { AidAmiTheme } from '../theme/AidAmiTheme';

import type { ModuleEmphasis } from './labels';

const { colors } = AidAmiTheme;

/** Fond teinté de la carte « Proche accompagné » selon le profil. */
export function profileSectionTint(profileType: ProfileType): string {
  switch (profileType) {
    case 'ALZHEIMER':
      return colors.tintAlzheimer;
    case 'TSA_TDAH':
      return colors.tintTsa;
    case 'MIXED':
      return colors.tintMixed;
  }
}

/** Couleur de chip / accent sélectionné selon le type de profil. */
export function profileChipSelected(profileType: ProfileType): string {
  switch (profileType) {
    case 'ALZHEIMER':
      return colors.chipAlzheimer;
    case 'TSA_TDAH':
      return colors.chipTsa;
    case 'MIXED':
      return colors.chipMixed;
  }
}

/** Couleur de fond des boutons modules Accueil selon profil + emphase. */
export function profileModuleBackground(
  profileType: ProfileType,
  emphasis: ModuleEmphasis,
): string {
  if (emphasis === 'deemphasized') {
    return colors.moduleSecondary;
  }
  switch (profileType) {
    case 'ALZHEIMER':
      return colors.moduleAlzheimer;
    case 'TSA_TDAH':
      return colors.moduleTsa;
    case 'MIXED':
      return colors.accent;
  }
}

/** Texte sur module pastel (Mixte garde le teal saturé → blanc). */
export function profileModuleTextColor(profileType: ProfileType): string {
  if (profileType === 'MIXED') {
    return colors.onAccent;
  }
  return colors.onModulePastel;
}

/** Bordure / badge prioritaire assorti au profil. */
export function profileEmphasisBorder(profileType: ProfileType): string {
  return profileChipSelected(profileType);
}
