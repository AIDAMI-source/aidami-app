import { StyleSheet, Text, View } from 'react-native';

import { AidAmiTheme, px } from '../../theme/AidAmiTheme';

/** Placeholder — tâches, agenda et routines (à implémenter). */
export function TasksPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tâches</Text>
      <Text style={styles.body}>Agenda, routines et médicaments — bientôt.</Text>
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
