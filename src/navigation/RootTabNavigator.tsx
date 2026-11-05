import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';

import { ConseilsScreen } from '../screens/advice/ConseilsScreen';
import { BehaviorLogsScreen } from '../screens/behavior-logs/BehaviorLogsScreen';
import { CommunauteScreen } from '../screens/community/CommunauteScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { HouseholdScreen } from '../screens/household/HouseholdScreen';
import { MemoryScreen } from '../screens/memory/MemoryScreen';
import { TasksScreen } from '../screens/tasks/TasksScreen';
import { AidAmiTheme, px } from '../theme/AidAmiTheme';

import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_LABELS: Record<keyof RootTabParamList, string> = {
  Accueil: 'Accueil',
  Foyer: 'Foyer',
  Taches: 'Tâches',
  Comportements: 'Comport.',
  Memoire: 'Mémoire',
  Conseils: 'Conseils',
  Communaute: 'Commun.',
};

function TabIcon({ focused }: { focused: boolean }) {
  return (
    <View
      style={[styles.tabIcon, focused ? styles.tabIconFocused : styles.tabIconIdle]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

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
        tabBarActiveTintColor: AidAmiTheme.colors.accent,
        tabBarInactiveTintColor: AidAmiTheme.colors.tabInactive,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabel: ({ focused }) => (
          <TabLabel routeName={route.name} focused={focused} />
        ),
        tabBarIcon: ({ focused }) => <TabIcon focused={focused} />,
        tabBarAccessibilityLabel:
          route.name === 'Comportements'
            ? 'Comportements'
            : route.name === 'Communaute'
              ? 'Communauté'
              : TAB_LABELS[route.name],
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
        component={HouseholdScreen}
        options={{ title: 'Foyer' }}
      />
      <Tab.Screen
        name="Taches"
        component={TasksScreen}
        options={{ title: 'Tâches' }}
      />
      <Tab.Screen
        name="Comportements"
        component={BehaviorLogsScreen}
        options={{ title: 'Comportements' }}
      />
      <Tab.Screen
        name="Memoire"
        component={MemoryScreen}
        options={{ title: 'Mémoire' }}
      />
      <Tab.Screen
        name="Conseils"
        component={ConseilsScreen}
        options={{ title: 'Conseils' }}
      />
      <Tab.Screen
        name="Communaute"
        component={CommunauteScreen}
        options={{ title: 'Communauté' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: AidAmiTheme.colors.surface,
    borderTopColor: AidAmiTheme.colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: px(AidAmiTheme.touchTarget.minHeight) + 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tabBarItem: {
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    paddingVertical: 2,
  },
  tabIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    marginBottom: 2,
  },
  tabIconFocused: {
    backgroundColor: AidAmiTheme.colors.accent,
  },
  tabIconIdle: {
    backgroundColor: AidAmiTheme.colors.tabInactive,
  },
  tabLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: AidAmiTheme.colors.tabInactive,
    textAlign: 'center',
  },
  tabLabelFocused: {
    color: AidAmiTheme.colors.accent,
    fontWeight: '700',
  },
  scene: {
    backgroundColor: AidAmiTheme.colors.background,
  },
});
