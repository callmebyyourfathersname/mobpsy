import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

// Screens — Auth & Shared
import SplashScreen         from './src/screens/SplashScreen';
import RoleSelectScreen     from './src/screens/RoleSelectScreen';
import StudentLoginScreen   from './src/screens/StudentLoginScreen';
import ParentLoginScreen    from './src/screens/ParentLoginScreen';

// Screens — Student area
import DashboardScreen      from './src/screens/DashboardScreen';
import ScanScreen           from './src/screens/ScanScreen';
import IdentificationScreen from './src/screens/IdentificationScreen';
import SpellingScreen       from './src/screens/SpellingScreen';
import GalleryScreen        from './src/screens/GalleryScreen';

// Screens — Parent area
import ParentDashboardScreen      from './src/screens/ParentDashboardScreen';
import ParentMessagesScreen       from './src/screens/ParentMessagesScreen';
import ParentConsultationScreen   from './src/screens/ParentConsultationScreen';
import ParentProgressDetailScreen from './src/screens/ParentProgressDetailScreen';

// Store
import { useProfileStore, useProgressStore } from './src/store/store';

// Colors
import { Colors } from './src/theme/colors';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Student bottom tabs ───────────────────────────────────────────────────────
function StudentTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.divider,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📷</Text>,
        }}
      />
      <Tab.Screen
        name="Gallery"
        component={GalleryScreen}
        options={{
          tabBarLabel: 'Journal',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📖</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

// ── Parent bottom tabs ────────────────────────────────────────────────────────
function ParentTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.secondary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.divider,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="ParentDashboard"
        component={ParentDashboardScreen}
        options={{
          tabBarLabel: 'Overview',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text>,
        }}
      />
      <Tab.Screen
        name="ParentMessages"
        component={ParentMessagesScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💬</Text>,
        }}
      />
      <Tab.Screen
        name="ParentConsultation"
        component={ParentConsultationScreen}
        options={{
          tabBarLabel: 'Book Slot',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📅</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const loadProfiles  = useProfileStore(s => s.loadProfiles);
  const activeProfile = useProfileStore(s => s.activeProfile);
  const loadProgress  = useProgressStore(s => s.loadProgress);
  const startSession  = useProgressStore(s => s.startSession);

  useEffect(() => { loadProfiles(); }, []);

  useEffect(() => {
    if (activeProfile && !activeProfile.isParent) {
      loadProgress(activeProfile.id).then(() => startSession());
    }
  }, [activeProfile?.id]);

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: true }}>
        <Stack.Screen name="Splash"       component={SplashScreen} />
        <Stack.Screen name="RoleSelect"   component={RoleSelectScreen} />
        <Stack.Screen name="StudentLogin" component={StudentLoginScreen} />
        <Stack.Screen name="ParentLogin"  component={ParentLoginScreen} />

        {/* Student area */}
        <Stack.Screen name="StudentArea"  component={StudentTabs} />
        <Stack.Screen
          name="Identification"
          component={IdentificationScreen}
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="Spelling"
          component={SpellingScreen}
          options={{ presentation: 'card' }}
        />

        {/* Parent area */}
        <Stack.Screen name="ParentArea"   component={ParentTabs} />
        <Stack.Screen
          name="ParentProgressDetail"
          component={ParentProgressDetailScreen}
          options={{ presentation: 'card' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}