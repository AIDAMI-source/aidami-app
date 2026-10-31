import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootTabParamList } from '../navigation/types';
import { AidAmiTheme, px } from '../theme/AidAmiTheme';

type Props = {
  title: string;
  description: string;
  accessibilityLabel: string;
};

/** Shared layout for module placeholder screens. */
export function ModulePlaceholder({
  title,
  description,
  accessibilityLabel,
}: Props) {
  const navigation =
    useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 24) + 16,
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{description}</Text>
      <Pressable
        style={({ pressed }) => [styles.homeButton, pressed && styles.homePressed]}
        accessibilityRole="button"
        accessibilityLabel="Retour à l'accueil"
        onPress={() => navigation.navigate('Accueil')}
      >
        <Text style={styles.homeLabel}>Retour à l'accueil</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AidAmiTheme.colors.background,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeTitle),
    lineHeight: px(AidAmiTheme.typography.sizeTitle) * AidAmiTheme.typography.lineHeight,
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
    marginBottom: 8,
  },
  body: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    lineHeight: px(AidAmiTheme.typography.sizeBody) * AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.textPrimary,
    marginBottom: 28,
  },
  homeButton: {
    alignSelf: 'flex-start',
    backgroundColor: AidAmiTheme.colors.accent,
    borderRadius: px(AidAmiTheme.borderRadius.button),
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    paddingHorizontal: 20,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  homePressed: {
    opacity: 0.85,
  },
  homeLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    lineHeight: px(AidAmiTheme.typography.sizeBody) * AidAmiTheme.typography.lineHeight,
    fontWeight: '600',
    color: AidAmiTheme.colors.primary,
  },
});
