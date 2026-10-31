import { StyleSheet, Text, View } from 'react-native';

import { AidAmiTheme, px } from '../../theme/AidAmiTheme';

/** Placeholder — écran foyer (à implémenter). */
export function HouseholdPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Foyer</Text>
      <Text style={styles.body}>Gestion du foyer et des aidants — bientôt.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AidAmiTheme.colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeTitle),
    lineHeight: px(AidAmiTheme.typography.sizeTitle) * AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.primary,
    marginBottom: 8,
  },
  body: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    lineHeight: px(AidAmiTheme.typography.sizeBody) * AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.textPrimary,
  },
});
