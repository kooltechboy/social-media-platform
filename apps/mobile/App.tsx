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
import { FinancialCenterScreen } from './src/screens/FinancialCenterScreen';

const Tab = createBottomTabNavigator();
// Expo 52 and the workspace web app currently resolve different React type majors.
// Keep the navigation boundary typed at runtime while the workspace dependencies converge.
const Navigation = NavigationContainer as React.ComponentType<any>;
const Navigator = Tab.Navigator as React.ComponentType<any>;
const Screen = Tab.Screen as React.ComponentType<any>;

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={TOKENS.canvas} />
      <Navigation>
        <Navigator
          screenOptions={{
            header: () => <Header onWalletPress={() => {}} />,
            tabBarStyle: { backgroundColor: TOKENS.surface, borderTopColor: TOKENS.border },
            tabBarActiveTintColor: TOKENS.action,
            tabBarInactiveTintColor: TOKENS.textMuted,
          }}
        >
          <Screen name="Home" component={HomeScreen} />
          <Screen name="Explore" component={ExploreScreen} />
          <Screen name="Communities" component={CommunitiesScreen} />
          <Screen name="Messages" component={MessagesScreen} />
          <Screen name="Financial Center" component={FinancialCenterScreen} />
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
  content: {
    flex: 1,
  },
});
