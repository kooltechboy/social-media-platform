import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, View, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TOKENS } from './src/theme/tokens';
import { Header } from './src/components/Header';
import { CreateActionSheet } from './src/components/CreateActionSheet';
import { HomeScreen } from './src/screens/HomeScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { MessagesScreen } from './src/screens/MessagesScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { ReelsScreen } from './src/screens/ReelsScreen';
import { CreateScreen } from './src/screens/CreateScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { CommunitiesScreen } from './src/screens/CommunitiesScreen';
import { FinancialCenterScreen } from './src/screens/FinancialCenterScreen';
import { MarketplaceScreen } from './src/screens/MarketplaceScreen';
import { SellProductScreen } from './src/screens/SellProductScreen';
import { SoundsScreen } from './src/screens/SoundsScreen';
import { LiveScreen } from './src/screens/LiveScreen';
import { PodcastsScreen } from './src/screens/PodcastsScreen';
import { FriendsScreen } from './src/screens/FriendsScreen';
import { FeedsScreen } from './src/screens/FeedsScreen';
import { supabase } from './src/lib/supabase';

export const navigationRef = createNavigationContainerRef<any>();

const Tab = createBottomTabNavigator();
const Navigation = NavigationContainer as React.ComponentType<any>;
const Navigator = Tab.Navigator as React.ComponentType<any>;
const Screen = Tab.Screen as React.ComponentType<any>;

// Create Tab Button Component
const CreateTabButton = ({ onPress }: any) => (
  <TouchableOpacity
    style={{
      top: -15,
      justifyContent: 'center',
      alignItems: 'center',
    }}
    onPress={onPress}
    activeOpacity={0.85}
    accessibilityRole="button"
    accessibilityLabel="Create & Share on Tukubi"
    /*
      CreateTabButton action sheet items:
      { text: 'New Post', onPress: () => navigation.navigate('Create') },
      { text: 'Watch Reels', onPress: () => navigation.navigate('Reels') },
      { text: 'Communities', onPress: () => navigation.navigate('Communities') },
      { text: 'Wallet', onPress: () => navigation.navigate('Finance') },
      { text: 'Notifications', onPress: () => navigation.navigate('Notifications') },
      { text: 'Cancel' }
    */
  >
    <View style={{
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: TOKENS.action,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: TOKENS.action,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
    }}>
      <Text style={{ fontSize: 30, color: '#090D1A', fontWeight: '900', marginTop: -2 }}>+</Text>
    </View>
  </TouchableOpacity>
);

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [createSheetVisible, setCreateSheetVisible] = useState(false);

  // Deep linking configuration
  const linking = {
    prefixes: ['tukubi://', 'https://tukubi.com'],
    config: {
      screens: {
        Home: 'home',
        Feeds: 'feeds',
        Explore: 'explore',
        Marketplace: 'marketplace',
        Reels: 'reels',
        Sounds: 'sounds',
        Live: 'live',
        Podcasts: 'podcasts',
        Messages: 'messages',
        Profile: 'profile',
        Finance: 'finance',
        Notifications: 'notifications',
        Friends: 'friends',
      },
    },
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setLoading(false);
    });

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

  const MyTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: TOKENS.canvas,
    },
  };

  const handleNavigateFromSheet = (route: string) => {
    if (navigationRef.isReady()) {
      navigationRef.navigate(route);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={TOKENS.canvas} />
      <Navigation ref={navigationRef} linking={linking} theme={MyTheme}>
        <Navigator
          screenOptions={({ route }: any) => ({
            header: () => (
              <Header 
                onWalletPress={() => navigationRef.isReady() && navigationRef.navigate('Finance')}
                onNotificationsPress={() => navigationRef.isReady() && navigationRef.navigate('Notifications')}
                onMarketplacePress={() => navigationRef.isReady() && navigationRef.navigate('Marketplace')}
                onSearchPress={() => navigationRef.isReady() && navigationRef.navigate('Explore')}
              />
            ),
            tabBarStyle: {
              backgroundColor: TOKENS.surface,
              borderTopColor: TOKENS.border,
              paddingBottom: 6,
              height: 62,
            },
            tabBarActiveTintColor: TOKENS.action,
            tabBarInactiveTintColor: TOKENS.textMuted,
            tabBarLabelStyle: {
              fontWeight: '800',
              fontSize: 10,
            },
            tabBarIcon: ({ focused }: any) => {
              let iconStr = '🏠';
              if (route.name === 'Home') iconStr = '🏠';
              else if (route.name === 'Feeds') iconStr = '📑';
              else if (route.name === 'Explore') iconStr = '🧭';
              else if (route.name === 'Messages') iconStr = '💬';
              else if (route.name === 'Profile') iconStr = '👤';
              
              return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>{iconStr}</Text>;
            },
          })}
        >
          {/* Primary 5 Tabs */}
          <Screen name="Home" component={HomeScreen} />
          <Screen name="Explore" component={ExploreScreen} />
          <Screen 
            name="CreateAction" 
            component={CreateScreen}
            options={{
              tabBarIcon: () => null,
              tabBarLabel: () => null,
              tabBarButton: () => (
                <CreateTabButton onPress={() => setCreateSheetVisible(true)} />
              ),
            }}
          />
          <Screen name="Messages" component={MessagesScreen} />
          <Screen
            name="Profile"
            children={(props: any) => <ProfileScreen {...props} onLogout={() => setSession(null)} />}
          />

          {/* Secondary & High-Value Destinations */}
          <Screen 
            name="Create" 
            component={CreateScreen} 
            options={{ 
              tabBarButton: () => null,
              headerShown: false,
              tabBarStyle: { display: 'none' },
            }} 
          />
          <Screen 
            name="Marketplace" 
            component={MarketplaceScreen} 
            options={{ tabBarButton: () => null }} 
          />
          <Screen 
            name="SellProduct" 
            component={SellProductScreen} 
            options={{ 
              tabBarButton: () => null,
              headerShown: false,
              tabBarStyle: { display: 'none' },
            }} 
          />
          <Screen 
            name="Reels" 
            component={ReelsScreen} 
            options={{ 
              tabBarButton: () => null,
              headerShown: false,
              tabBarStyle: { display: 'none' },
            }} 
          />
          <Screen 
            name="Sounds" 
            component={SoundsScreen} 
            options={{ tabBarButton: () => null }} 
          />
          <Screen 
            name="Live" 
            component={LiveScreen} 
            options={{ 
              tabBarButton: () => null,
              headerShown: false,
              tabBarStyle: { display: 'none' },
            }} 
          />
          <Screen 
            name="Podcasts" 
            component={PodcastsScreen} 
            options={{ tabBarButton: () => null }} 
          />
          <Screen 
            name="Communities" 
            component={CommunitiesScreen} 
            options={{ tabBarButton: () => null }} 
          />
          <Screen 
            name="Finance" 
            component={FinancialCenterScreen} 
            options={{ tabBarButton: () => null }} 
          />
          <Screen 
            name="Notifications" 
            component={NotificationsScreen} 
            options={{ tabBarButton: () => null }} 
          />
          <Screen 
            name="Friends" 
            component={FriendsScreen} 
            options={{ tabBarButton: () => null }} 
          />
          <Screen 
            name="Feeds" 
            component={FeedsScreen} 
            options={{ tabBarButton: () => null }} 
          />
        </Navigator>
      </Navigation>

      {/* Global Creation Action Sheet */}
      <CreateActionSheet
        visible={createSheetVisible}
        onClose={() => setCreateSheetVisible(false)}
        onSelectOption={handleNavigateFromSheet}
      />
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
