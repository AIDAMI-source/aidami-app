import type { ProfileType } from '../types/models';

export const PROFILE_TYPES: ProfileType[] = ['ALZHEIMER', 'TSA_TDAH', 'MIXED'];

export const PROFILE_TYPE_LABELS: Record<ProfileType, string> = {
  ALZHEIMER: 'Alzheimer',
  TSA_TDAH: 'TSA / TDAH',
  MIXED: 'Mixte',
};

export const PROFILE_TYPE_HINTS: Record<ProfileType, string> = {
  ALZHEIMER: 'Mémoire et trombinoscope mis en avant',
  TSA_TDAH: 'Comportements et kit émotionnel mis en avant',
  MIXED: 'Mémoire et comportements disponibles ensemble',
};

export type ModuleKey =
  | 'household'
  | 'tasks'
  | 'behavior'
  | 'memory'
  | 'advice'
  | 'community';

export type ModuleEmphasis = 'emphasized' | 'normal' | 'deemphasized';

/** Soft guidance only — never hide a module. */
export function moduleEmphasisForProfile(
  profileType: ProfileType,
  moduleKey: ModuleKey,
): ModuleEmphasis {
  if (
    moduleKey === 'household' ||
    moduleKey === 'tasks' ||
    moduleKey === 'advice' ||
    moduleKey === 'community'
  ) {
    return 'normal';
  }

  if (profileType === 'ALZHEIMER') {
    if (moduleKey === 'memory') return 'emphasized';
    if (moduleKey === 'behavior') return 'deemphasized';
  }
  if (profileType === 'TSA_TDAH') {
    if (moduleKey === 'behavior') return 'emphasized';
    if (moduleKey === 'memory') return 'deemphasized';
  }
  if (profileType === 'MIXED') {
    if (moduleKey === 'memory' || moduleKey === 'behavior') return 'emphasized';
  }
  return 'normal';
}

export function profileGuidanceSentence(profileType: ProfileType): string {
  return PROFILE_TYPE_HINTS[profileType];
}
