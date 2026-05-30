import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

// Auth & shared screens
import SplashScreen         from './src/screens/SplashScreen';
import RoleSelectScreen     from './src/screens/RoleSelectScreen';
import StudentLoginScreen   from './src/screens/StudentLoginScreen';
import ParentLoginScreen    from './src/screens/ParentLoginScreen';

// Student screens
import DashboardScreen      from './src/screens/DashboardScreen';
import ScanScreen           from './src/screens/ScanScreen';
import IdentificationScreen from './src/screens/IdentificationScreen';
import SpellingScreen       from './src/screens/SpellingScreen';
import GalleryScreen        from './src/screens/GalleryScreen';

// Parent screens
import ParentDashboardScreen      from './src/screens/ParentDashboardScreen';
import ParentMessagesScreen       from './src/screens/ParentMessagesScreen';
import ParentConsultationScreen   from './src/screens/ParentConsultationScreen';
import ParentProgressDetailScreen from './src/screens/ParentProgressDetailScreen';

// Store & theme
import { useProfileStore, useProgressStore } from './src/store/store';
import { Colors } from './src/theme/colors';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

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
          tabBarIcon: function(props) {
            return <Text style={{ fontSize: 20, color: props.color }}>{'🏠'}</Text>;
          },
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: function(props) {
            return <Text style={{ fontSize: 20, color: props.color }}>{'📷'}</Text>;
          },
        }}
      />
      <Tab.Screen
        name="Gallery"
        component={GalleryScreen}
        options={{
          tabBarLabel: 'Journal',
          tabBarIcon: function(props) {
            return <Text style={{ fontSize: 20, color: props.color }}>{'📖'}</Text>;
          },
        }}
      />
    </Tab.Navigator>
  );
}

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
          tabBarIcon: function(props) {
            return <Text style={{ fontSize: 20, color: props.color }}>{'📊'}</Text>;
          },
        }}
      />
      <Tab.Screen
        name="ParentMessages"
        component={ParentMessagesScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: function(props) {
            return <Text style={{ fontSize: 20, color: props.color }}>{'💬'}</Text>;
          },
        }}
      />
      <Tab.Screen
        name="ParentConsultation"
        component={ParentConsultationScreen}
        options={{
          tabBarLabel: 'Book Slot',
          tabBarIcon: function(props) {
            return <Text style={{ fontSize: 20, color: props.color }}>{'📅'}</Text>;
          },
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const loadProfiles  = useProfileStore(function(s) { return s.loadProfiles; });
  const activeProfile = useProfileStore(function(s) { return s.activeProfile; });
  const loadProgress  = useProgressStore(function(s) { return s.loadProgress; });
  const startSession  = useProgressStore(function(s) { return s.startSession; });

  useEffect(function() { loadProfiles(); }, []);

  useEffect(function() {
    if (activeProfile && !activeProfile.isParent) {
      loadProgress(activeProfile.id).then(function() { startSession(); });
    }
  }, [activeProfile ? activeProfile.id : null]);

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: true }}>
        <Stack.Screen name="Splash"       component={SplashScreen} />
        <Stack.Screen name="RoleSelect"   component={RoleSelectScreen} />
        <Stack.Screen name="StudentLogin" component={StudentLoginScreen} />
        <Stack.Screen name="ParentLogin"  component={ParentLoginScreen} />

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

        <Stack.Screen name="ParentArea" component={ParentTabs} />
        <Stack.Screen
          name="ParentProgressDetail"
          component={ParentProgressDetailScreen}
          options={{ presentation: 'card' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}