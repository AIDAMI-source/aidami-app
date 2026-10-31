// Thème visuel Aid'Ami (Accessible WCAG AAA)
export const AidAmiTheme = {
  colors: {
    primary: '#2B4C5F', // Bleu Nuit (Structurel / Réconfort)
    secondary: '#5C766D', // Vert Sauge (Apaisement)
    accent: '#2DD4BF', // Teal Chaleureux (Bouton d'action principal)
    background: '#F8FAFC', // Blanc cassé doux (Anti-éblouissement)
    surface: '#FFFFFF', // Blanc pur pour les cartes
    textPrimary: '#1E293B', // Texte sombre à fort contraste

    // Code Couleur Émotionnel (TSA / TDAH)
    emotionalGreen: '#4ADE80',
    emotionalYellow: '#FACC15',
    emotionalOrange: '#FB923C',
    emotionalRed: '#F87171',
  },
  typography: {
    fontFamily: 'Inter, Roboto, sans-serif',
    sizeTitle: '26px',
    sizeSubTitle: '18px',
    sizeBody: '16px', // Minimum 16px
    lineHeight: 1.5, // Interligne aéré
  },
  borderRadius: {
    card: '16px', // Formes douces et rondes
    button: '24px', // Boutons ultra-larges
  },
  touchTarget: {
    minHeight: '48px', // Zones de clic sécurisées
  },
} as const;

export type AidAmiThemeType = typeof AidAmiTheme;

/** Parse theme px strings for React Native StyleSheet numeric props. */
export function px(value: `${number}px` | string): number {
  return Number.parseInt(value, 10);
}
