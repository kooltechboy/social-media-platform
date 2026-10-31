import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, View, ActivityIndicator, TouchableOpacity, Image, Text } from 'react-native';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TOKENS } from './src/theme/tokens';
import { Ionicons, type IoniconName } from './src/components/Icon';
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
import { supabase, isSupabaseConfigured } from './src/lib/supabase';

export const navigationRef = createNavigationContainerRef<any>();

const Tab = createBottomTabNavigator();
const Navigation = NavigationContainer as React.ComponentType<any>;
const Navigator = Tab.Navigator as React.ComponentType<any>;
const Screen = Tab.Screen as React.ComponentType<any>;

// Flush-integrated Midnight Reef Create Tab Button
const CreateTabButton = ({ onPress }: any) => (
  <TouchableOpacity
    style={styles.createTabTouch}
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
    <View style={styles.createTabPill}>
      <Ionicons name="add" size={24} color={TOKENS.actionText} />
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
        Explore: 'explore',
        Marketplace: 'marketplace',
        Shorts: 'shorts',
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
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session: currentSession } }) => {
        setSession(currentSession);
        setLoading(false);
      })
      .catch(() => {
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
        <View style={styles.bootBrandStack}>
          <View style={styles.bootIconTile}>
            <Image
              source={require('./assets/icon.png')}
              style={styles.bootIconImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.bootWordmark}>TUKUBI</Text>
          <Text style={styles.bootTagline}>THE CARIBBEAN CONNECTED</Text>
          <ActivityIndicator size="small" color={TOKENS.teal} style={styles.bootSpinner} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <SafeAreaView style={[styles.container, styles.centerBox]}>
        <StatusBar barStyle="light-content" backgroundColor={TOKENS.canvas} />
        <View style={styles.configCard}>
          <View style={styles.bootIconTile}>
            <Image
              source={require('./assets/icon.png')}
              style={styles.bootIconImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.configTitle}>Configuration Required</Text>
          <Text style={styles.configBody}>
            Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to connect TUKUBI Mobile to your live environment.
          </Text>
        </View>
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
      card: TOKENS.canvas,
      border: TOKENS.border,
      primary: TOKENS.teal,
      text: TOKENS.textPrimary,
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
                onMessagesPress={() => navigationRef.isReady() && navigationRef.navigate('Messages')}
                onMarketplacePress={() => navigationRef.isReady() && navigationRef.navigate('Marketplace')}
                onSearchPress={() => navigationRef.isReady() && navigationRef.navigate('Explore')}
              />
            ),
            tabBarStyle: {
              backgroundColor: TOKENS.canvas,
              borderTopColor: TOKENS.border,
              borderTopWidth: 1,
              paddingTop: 6,
              paddingBottom: 8,
              height: 62,
              elevation: 0,
            },
            tabBarActiveTintColor: TOKENS.teal,
            tabBarInactiveTintColor: TOKENS.textMuted,
            tabBarLabelStyle: {
              fontWeight: '600',
              fontSize: 10.5,
              letterSpacing: 0.1,
            },
            tabBarIcon: ({ focused, color }: any) => {
              let iconName: IoniconName = focused ? 'home' : 'home-outline';
              if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
              else if (route.name === 'Explore') iconName = focused ? 'compass' : 'compass-outline';
              else if (route.name === 'Communities') iconName = focused ? 'people' : 'people-outline';
              else if (route.name === 'Messages') iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
              else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

              return <Ionicons name={iconName} size={21} color={color} />;
            },
          })}
        >
          {/* Primary 5 Tabs (Home · Explore · Create · Community · Profile) */}
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
          <Screen
            name="Communities"
            component={CommunitiesScreen}
            options={{ tabBarLabel: 'Communities' }}
          />
          <Screen
            name="Profile"
            children={(props: any) => <ProfileScreen {...props} onLogout={() => setSession(null)} />}
          />

          {/* Secondary & High-Value Destinations */}
          <Screen
            name="Messages"
            component={MessagesScreen}
            options={{ tabBarButton: () => null }}
          />
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
            name="Shorts"
            component={ReelsScreen}
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
          {/* Feeds → redirects to Home (backwards-compat for old deep links / bookmarks referencing FeedsScreen) */}
          <Screen
            name="Feeds"
            options={{ tabBarButton: () => null }}
          >
            {(props: any) => {
              React.useEffect(() => {
                props.navigation.replace('Home');
              }, []);
              return null;
            }}
          </Screen>
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
    paddingHorizontal: 24,
  },
  bootBrandStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bootIconTile: {
    width: 76,
    height: 76,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: TOKENS.oceanDepth,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    marginBottom: 16,
  },
  bootIconImage: {
    width: '100%',
    height: '100%',
  },
  bootWordmark: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2.2,
    color: TOKENS.textPrimary,
    marginBottom: 4,
  },
  bootTagline: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: TOKENS.teal,
  },
  bootSpinner: {
    marginTop: 22,
  },
  configCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: TOKENS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 24,
    alignItems: 'center',
  },
  configTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: TOKENS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  configBody: {
    fontSize: 13,
    lineHeight: 19,
    color: TOKENS.textMuted,
    textAlign: 'center',
  },
  createTabTouch: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 52,
    minHeight: 48,
  },
  createTabPill: {
    width: 44,
    height: 34,
    borderRadius: 12,
    backgroundColor: TOKENS.teal,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: TOKENS.teal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.32,
    shadowRadius: 8,
    elevation: 4,
  },
});
