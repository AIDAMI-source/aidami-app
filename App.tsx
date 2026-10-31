import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootTabNavigator } from './src/navigation';
import { AidAmiTheme } from './src/theme/AidAmiTheme';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: AidAmiTheme.colors.primary,
    background: AidAmiTheme.colors.background,
    card: AidAmiTheme.colors.surface,
    text: AidAmiTheme.colors.textPrimary,
    border: AidAmiTheme.colors.background,
    notification: AidAmiTheme.colors.accent,
  },
};

export default function App() {
  return (
    <SafeAreaProvider style={styles.root}>
      <StatusBar style="dark" />
      <NavigationContainer theme={navigationTheme}>
        <RootTabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AidAmiTheme.colors.background,
  },
});
