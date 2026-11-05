import type { ProfileType } from '../types/models';

export type AnnexAudience = 'ALZHEIMER' | 'TSA_TDAH';

export type AnnexLink = {
  id: string;
  audience: AnnexAudience;
  title: string;
  blurb: string;
  url: string;
};

/** Validated useful links annex (user content 2026-11-05). */
export const ANNEX_LINKS: AnnexLink[] = [
  {
    id: 'alz-comm',
    audience: 'ALZHEIMER',
    title: 'Communication claire et simple',
    blurb: 'Conseils pour parler clairement et simplement à un proche Alzheimer.',
    url: 'https://aideclaire.fr/parent-alzheimer-que-faire',
  },
  {
    id: 'alz-routines',
    audience: 'ALZHEIMER',
    title: 'Organisation du quotidien (routines)',
    blurb: 'Aides et solutions pour organiser le quotidien et les routines.',
    url: 'https://maison-et-autonomie.fr/blog/aidant-parent-alzheimer-aides-solutions',
  },
  {
    id: 'alz-securite',
    audience: 'ALZHEIMER',
    title: 'Sécurité et adaptation du domicile',
    blurb: 'Adapter le domicile et renforcer la sécurité au quotidien.',
    url: 'https://maison-et-autonomie.fr/blog/aidant-parent-alzheimer-aides-solutions',
  },
  {
    id: 'alz-soutien',
    audience: 'ALZHEIMER',
    title: 'Ressources et soutien (groupes)',
    blurb: 'Ressources et groupes de soutien pour les proches aidants.',
    url: 'https://zensanté.fr/alzheimer-conseils-proches-aidants/',
  },
  {
    id: 'alz-synthese',
    audience: 'ALZHEIMER',
    title: 'Synthèse / organisations spécialisées',
    blurb: 'Synthèse de conseils et organisations spécialisées Alzheimer.',
    url: 'https://www.ssiad75.fr/lesa/conseils-pour-les-aidants-alzheimer/',
  },
  {
    id: 'tsa-formation',
    audience: 'TSA_TDAH',
    title: 'Formation et sensibilisation',
    blurb:
      'Formation pour collaborer avec les familles et les professionnels autour d’un enfant TSA.',
    url: 'https://lesptitssages.com/formations/collaborer-avec-les-familles-et-les-professionnels-pour-mieux-accompagner-un-enfant-avec-tsa/',
  },
  {
    id: 'tsa-comm',
    audience: 'TSA_TDAH',
    title: 'Communication et éducation',
    blurb: 'Pistes de communication et d’éducation pour accompagner un enfant autiste.',
    url: 'https://www.autismeinfoservice.fr/accompagner/enfant/',
  },
  {
    id: 'tsa-routines',
    audience: 'TSA_TDAH',
    title: 'Routines et supports visuels',
    blurb: 'Routines et supports visuels pour structurer le quotidien.',
    url: 'https://www.autismeinfoservice.fr/accompagner/enfant/',
  },
  {
    id: 'tsa-soutien',
    audience: 'TSA_TDAH',
    title: 'Soutien parental et suivi pédagogique',
    blurb: 'Soutien parental et pistes pour accompagner et éduquer un enfant autiste.',
    url: 'https://maboussoleaidants.fr/ma-vie-daidant/devenir-aidant/gerer-maladie-handicap/accompagner-et-eduquer-enfant-autiste',
  },
  {
    id: 'tsa-collab',
    audience: 'TSA_TDAH',
    title: 'Collaboration avec les professionnels',
    blurb: 'Travailler main dans la main avec les professionnels qui suivent l’enfant.',
    url: 'https://www.autismeinfoservice.fr/accompagner/enfant/',
  },
];

export const ANNEX_AUDIENCE_LABELS: Record<AnnexAudience, string> = {
  ALZHEIMER: 'Conseils pour les aidants Alzheimer',
  TSA_TDAH: 'Conseils professionnels parent / enfant TSA',
};

export function annexLinksForProfile(profileType: ProfileType): AnnexLink[] {
  if (profileType === 'ALZHEIMER') {
    return ANNEX_LINKS.filter((l) => l.audience === 'ALZHEIMER');
  }
  if (profileType === 'TSA_TDAH') {
    return ANNEX_LINKS.filter((l) => l.audience === 'TSA_TDAH');
  }
  return ANNEX_LINKS;
}

export function annexLinkGroupsForProfile(
  profileType: ProfileType,
): { audience: AnnexAudience; links: AnnexLink[] }[] {
  const links = annexLinksForProfile(profileType);
  const groups: { audience: AnnexAudience; links: AnnexLink[] }[] = [];
  const alz = links.filter((l) => l.audience === 'ALZHEIMER');
  const tsa = links.filter((l) => l.audience === 'TSA_TDAH');
  if (alz.length > 0) groups.push({ audience: 'ALZHEIMER', links: alz });
  if (tsa.length > 0) groups.push({ audience: 'TSA_TDAH', links: tsa });
  return groups;
}
