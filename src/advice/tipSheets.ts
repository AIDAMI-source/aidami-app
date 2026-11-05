import type { ProfileType } from '../types/models';

/** Tip sheet audience — MIXED is never stored on a tip; filtering expands it. */
export type TipSheetAudience = 'ALZHEIMER' | 'TSA_TDAH';

export type TipSheet = {
  id: string;
  number: number;
  audience: TipSheetAudience;
  title: string;
};

/** Validated caregiver tip sheets (2026-11-05). */
export const TIP_SHEETS: TipSheet[] = [
  {
    id: 'alz-1',
    number: 1,
    audience: 'ALZHEIMER',
    title: 'Rassurer plutôt que « faire raisonner »',
  },
  {
    id: 'alz-2',
    number: 2,
    audience: 'ALZHEIMER',
    title: 'Une consigne à la fois, phrases courtes',
  },
  {
    id: 'alz-3',
    number: 3,
    audience: 'ALZHEIMER',
    title: 'Routines stables (mêmes horaires / lieux)',
  },
  {
    id: 'alz-4',
    number: 4,
    audience: 'ALZHEIMER',
    title: 'Utiliser photos et mémos audio familiers',
  },
  {
    id: 'alz-5',
    number: 5,
    audience: 'ALZHEIMER',
    title: 'Ne pas contredire un souvenir faux : rediriger doucement',
  },
  {
    id: 'tsa-6',
    number: 6,
    audience: 'TSA_TDAH',
    title: 'Crise : réduire stimuli, espace calme, peu de paroles',
  },
  {
    id: 'tsa-7',
    number: 7,
    audience: 'TSA_TDAH',
    title: 'Anticiper les déclencheurs (bruit, foule, transitions)',
  },
  {
    id: 'tsa-8',
    number: 8,
    audience: 'TSA_TDAH',
    title: 'Proposer le kit (casque, objet sensoriel) avant le pic',
  },
  {
    id: 'tsa-9',
    number: 9,
    audience: 'TSA_TDAH',
    title: 'Après crise : récupération sans interrogatoire immédiat',
  },
  {
    id: 'tsa-10',
    number: 10,
    audience: 'TSA_TDAH',
    title: 'Prévenir les changements (timer, pictos, agenda)',
  },
];

export const TIP_SHEET_AUDIENCE_LABELS: Record<TipSheetAudience, string> = {
  ALZHEIMER: 'Alzheimer',
  TSA_TDAH: 'TSA / TDAH',
};

export function tipSheetsForProfile(profileType: ProfileType): TipSheet[] {
  if (profileType === 'ALZHEIMER') {
    return TIP_SHEETS.filter((t) => t.audience === 'ALZHEIMER');
  }
  if (profileType === 'TSA_TDAH') {
    return TIP_SHEETS.filter((t) => t.audience === 'TSA_TDAH');
  }
  return TIP_SHEETS;
}

export function tipSheetGroupsForProfile(
  profileType: ProfileType,
): { audience: TipSheetAudience; tips: TipSheet[] }[] {
  const tips = tipSheetsForProfile(profileType);
  const groups: { audience: TipSheetAudience; tips: TipSheet[] }[] = [];
  const alz = tips.filter((t) => t.audience === 'ALZHEIMER');
  const tsa = tips.filter((t) => t.audience === 'TSA_TDAH');
  if (alz.length > 0) groups.push({ audience: 'ALZHEIMER', tips: alz });
  if (tsa.length > 0) groups.push({ audience: 'TSA_TDAH', tips: tsa });
  return groups;
}
