import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/auth';
import { RootTabNavigator } from './src/navigation';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { startSyncLifecycle } from './src/sync';
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

function AppShell() {
  const { loading, mode, configured } = useAuth();

  useEffect(() => {
    const { stop } = startSyncLifecycle();
    return stop;
  }, []);

  if (loading) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={AidAmiTheme.colors.accent} />
      </View>
    );
  }

  // Auth gate only when Supabase is configured and user has not chosen demo.
  if (configured && mode === 'unauthenticated') {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootTabNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider style={styles.root}>
      <StatusBar style="dark" />
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AidAmiTheme.colors.background,
  },
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AidAmiTheme.colors.background,
  },
});
