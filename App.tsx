import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';

import { HomeScreen } from './src/screens/HomeScreen';
import { AidAmiTheme } from './src/theme/AidAmiTheme';

export default function App() {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <HomeScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AidAmiTheme.colors.background,
  },
});
