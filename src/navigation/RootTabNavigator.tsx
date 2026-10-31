import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';

import { BehaviorLogsPlaceholder } from '../screens/behavior-logs/BehaviorLogsPlaceholder';
import { HomeScreen } from '../screens/HomeScreen';
import { HouseholdPlaceholder } from '../screens/household/HouseholdPlaceholder';
import { MemoryPlaceholder } from '../screens/memory/MemoryPlaceholder';
import { TasksPlaceholder } from '../screens/tasks/TasksPlaceholder';
import { AidAmiTheme, px } from '../theme/AidAmiTheme';

import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_LABELS: Record<keyof RootTabParamList, string> = {
  Accueil: 'Accueil',
  Foyer: 'Foyer',
  Taches: 'Tâches',
  Comportements: 'Comportements',
  Memoire: 'Mémoire',
};

function TabLabel({
  routeName,
  focused,
}: {
  routeName: keyof RootTabParamList;
  focused: boolean;
}) {
  return (
    <Text
      style={[styles.tabLabel, focused && styles.tabLabelFocused]}
      numberOfLines={1}
      accessibilityRole="text"
    >
      {TAB_LABELS[routeName]}
    </Text>
  );
}

export function RootTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Accueil"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: AidAmiTheme.colors.primary,
        tabBarInactiveTintColor: AidAmiTheme.colors.secondary,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabel: ({ focused }) => (
          <TabLabel routeName={route.name} focused={focused} />
        ),
        tabBarIcon: () => null,
        tabBarIconStyle: styles.tabBarIconHidden,
        tabBarAccessibilityLabel: TAB_LABELS[route.name],
        sceneStyle: styles.scene,
      })}
    >
      <Tab.Screen
        name="Accueil"
        component={HomeScreen}
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen
        name="Foyer"
        component={HouseholdPlaceholder}
        options={{ title: 'Foyer' }}
      />
      <Tab.Screen
        name="Taches"
        component={TasksPlaceholder}
        options={{ title: 'Tâches' }}
      />
      <Tab.Screen
        name="Comportements"
        component={BehaviorLogsPlaceholder}
        options={{ title: 'Comportements' }}
      />
      <Tab.Screen
        name="Memoire"
        component={MemoryPlaceholder}
        options={{ title: 'Mémoire' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: AidAmiTheme.colors.surface,
    borderTopColor: AidAmiTheme.colors.background,
    borderTopWidth: 1,
    minHeight: px(AidAmiTheme.touchTarget.minHeight) + 16,
    paddingTop: 6,
    paddingBottom: 6,
  },
  tabBarItem: {
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    paddingVertical: 4,
  },
  tabBarIconHidden: {
    display: 'none',
    height: 0,
    width: 0,
  },
  tabLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: AidAmiTheme.colors.secondary,
    textAlign: 'center',
  },
  tabLabelFocused: {
    color: AidAmiTheme.colors.primary,
    fontWeight: '700',
  },
  scene: {
    backgroundColor: AidAmiTheme.colors.background,
  },
});
