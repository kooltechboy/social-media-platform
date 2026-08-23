import React from 'react';
import { StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TOKENS } from './src/theme/tokens';
import { Header } from './src/components/Header';
import { HomeScreen } from './src/screens/HomeScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { CommunitiesScreen } from './src/screens/CommunitiesScreen';
import { MessagesScreen } from './src/screens/MessagesScreen';
import { SpotPayScreen } from './src/screens/SpotPayScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={TOKENS.canvas} />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            header: () => <Header onWalletPress={() => {}} />,
            tabBarStyle: { backgroundColor: TOKENS.surface, borderTopColor: TOKENS.border },
            tabBarActiveTintColor: TOKENS.action,
            tabBarInactiveTintColor: TOKENS.textMuted,
          }}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Explore" component={ExploreScreen} />
          <Tab.Screen name="Communities" component={CommunitiesScreen} />
          <Tab.Screen name="Messages" component={MessagesScreen} />
          <Tab.Screen name="SpotPay" component={SpotPayScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.canvas,
  },
  content: {
    flex: 1,
  },
});
