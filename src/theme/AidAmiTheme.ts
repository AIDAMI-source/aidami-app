// Thème visuel Aid'Ami (Accessible WCAG AAA)
export const AidAmiTheme = {
  colors: {
    primary: '#2B4C5F', // Bleu Nuit (Structurel / Réconfort)
    secondary: '#5C766D', // Vert Sauge (Apaisement)
    accent: '#2DD4BF', // Teal Chaleureux (Bouton d'action principal)
    onAccent: '#FFFFFF', // Texte sur boutons teal
    background: '#F8FAFC', // Blanc cassé doux (Anti-éblouissement)
    surface: '#FFFFFF', // Blanc pur pour les cartes
    surfaceMuted: '#EEF2F5', // Carte statut / fonds discrets
    textPrimary: '#1E293B', // Texte sombre à fort contraste
    textMuted: '#64748B', // Sous-titres / méta
    border: '#E2E8F0', // Bordures de cartes
    pending: '#F59E0B', // Badge invitations
    tabInactive: '#94A3B8',

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
      shadowColor: '#1E293B',
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
