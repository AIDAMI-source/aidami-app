// Thème visuel Aid'Ami (Accessible WCAG AA+)
// Profils Alzheimer / TSA : pastels différenciés (option C) — sans gris froid.
export const AidAmiTheme = {
  colors: {
    primary: '#2B4C5F', // Bleu Nuit (Structurel / Réconfort)
    secondary: '#5C766D', // Vert Sauge (Apaisement)
    accent: '#2DD4BF', // Teal Chaleureux (Bouton d'action principal)
    onAccent: '#FFFFFF', // Texte sur boutons teal saturés
    background: '#F3F0EA', // Lin clair (fond écran option C)
    surface: '#FCFAF6', // Carte claire chaude
    surfaceSoft: '#EFE8DC', // Surface soft lin (remplace surfaceMuted gris)
    /** @deprecated Prefer surfaceSoft — kept as alias for non-profile screens. */
    surfaceMuted: '#EFE8DC',
    textPrimary: '#2B4C5F', // Texte principal nuit
    textOnPastel: '#3A4538', // Texte sur pastels pêche / menthe
    textMuted: '#5A6554', // Secondaire chaud (plus de gris #64748B)
    border: '#D4C7B2', // Bordure lin
    borderSubtle: '#E8DFD0',
    pending: '#F59E0B', // Badge invitations
    tabInactive: '#8A8578',

    // Chips profil — inactifs
    chipInactive: '#E8DFD0',
    chipInactiveBorder: '#D4C7B2',

    // Chips sélectionnés (légèrement approfondis pour contraste AA avec blanc)
    chipAlzheimer: '#B06852',
    chipTsa: '#2F7A68',
    chipMixed: '#3A6B7A',

    // Modules Accueil selon profil
    moduleAlzheimer: '#E8A090',
    moduleTsa: '#6DB5A3',
    moduleSecondary: '#B8A890',
    onModulePastel: '#3A4538', // Texte sombre sur modules pastel

    // Teintes de sections « Proche accompagné »
    tintAlzheimer: '#F3DDD4',
    tintTsa: '#D5EBE3',
    tintMixed: '#D6E4E8',

    // Hex palette validée (référence maquette C)
    paletteAlzheimerSelected: '#C97B63',
    paletteTsaSelected: '#3F8F7A',

    // Code Couleur Émotionnel (TSA / TDAH)
    emotionalGreen: '#4ADE80',
    emotionalYellow: '#FACC15',
    emotionalOrange: '#FB923C',
    emotionalRed: '#F87171',

    // Trombinoscope — pastilles d'avatar
    avatarPalette: [
      '#2DD4BF',
      '#334155',
      '#F59E0B',
      '#FB7185',
      '#4ADE80',
      '#0F766E',
      '#6366F1',
      '#0EA5E9',
    ],
  },
  typography: {
    fontFamily: 'Inter, Roboto, sans-serif',
    sizeTitle: '28px',
    sizeSubTitle: '18px',
    sizeBody: '16px', // Minimum 16px
    sizeCaption: '14px',
    lineHeight: 1.5, // Interligne aéré
  },
  borderRadius: {
    card: '16px', // Formes douces et rondes
    button: '24px', // Boutons ultra-larges
    chip: '999px',
  },
  touchTarget: {
    minHeight: '48px', // Zones de clic sécurisées
  },
  shadow: {
    card: {
      shadowColor: '#3A4538',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
  },
} as const;

export type AidAmiThemeType = typeof AidAmiTheme;

/** Parse theme px strings for React Native StyleSheet numeric props. */
export function px(value: `${number}px` | string): number {
  return Number.parseInt(value, 10);
}
