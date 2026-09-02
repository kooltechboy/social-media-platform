import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TOKENS } from './src/theme/tokens';
import { Header } from './src/components/Header';
import { HomeScreen } from './src/screens/HomeScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { CommunitiesScreen } from './src/screens/CommunitiesScreen';
import { MessagesScreen } from './src/screens/MessagesScreen';
import { FinancialCenterScreen } from './src/screens/FinancialCenterScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { supabase } from './src/lib/supabase';

const Tab = createBottomTabNavigator();
const Navigation = NavigationContainer as React.ComponentType<any>;
const Navigator = Tab.Navigator as React.ComponentType<any>;
const Screen = Tab.Screen as React.ComponentType<any>;

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check existing auth session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setLoading(false);
    });

    // 2. Subscribe to auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerBox]}>
        <StatusBar barStyle="light-content" backgroundColor={TOKENS.canvas} />
        <ActivityIndicator size="large" color={TOKENS.action} />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={TOKENS.canvas} />
        <AuthScreen onAuthSuccess={(newSession) => setSession(newSession)} />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={TOKENS.canvas} />
      <Navigation>
        <Navigator
          screenOptions={{
            header: () => <Header onWalletPress={() => {}} />,
            tabBarStyle: {
              backgroundColor: TOKENS.surface,
              borderTopColor: TOKENS.border,
              paddingBottom: 4,
              height: 60,
            },
            tabBarActiveTintColor: TOKENS.action,
            tabBarInactiveTintColor: TOKENS.textMuted,
            tabBarLabelStyle: {
              fontWeight: '700',
              fontSize: 11,
            },
          }}
        >
          <Screen name="Home" component={HomeScreen} />
          <Screen name="Explore" component={ExploreScreen} />
          <Screen name="Communities" component={CommunitiesScreen} />
          <Screen name="Messages" component={MessagesScreen} />
          <Screen name="Finance" component={FinancialCenterScreen} />
          <Screen
            name="Profile"
            children={() => <ProfileScreen onLogout={() => setSession(null)} />}
          />
        </Navigator>
      </Navigation>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.canvas,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
