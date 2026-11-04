import { StyleSheet, Text, View } from 'react-native';

import { AidAmiTheme } from '../theme/AidAmiTheme';
import { avatarColorForId, initialsFromName } from './format';

type AvatarProps = {
  name: string;
  id?: string;
  size?: number;
  color?: string;
};

export function Avatar({ name, id, size = 48, color }: AvatarProps) {
  const backgroundColor =
    color ??
    avatarColorForId(id ?? name, AidAmiTheme.colors.avatarPalette);
  const fontSize = Math.max(14, Math.round(size * 0.36));

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={[styles.initials, { fontSize }]}>
        {initialsFromName(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontWeight: '700',
    color: AidAmiTheme.colors.onAccent,
    letterSpacing: 0.5,
  },
});
