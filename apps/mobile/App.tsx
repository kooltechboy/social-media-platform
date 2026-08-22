import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar } from 'react-native';
import { TOKENS } from './src/theme/tokens';
import { Header } from './src/components/Header';
import { BottomNav, type MobileTab } from './src/components/BottomNav';
import { HomeScreen } from './src/screens/HomeScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { CommunitiesScreen } from './src/screens/CommunitiesScreen';
import { MessagesScreen } from './src/screens/MessagesScreen';
import { SpotPayScreen } from './src/screens/SpotPayScreen';

export default function App() {
  const [tab, setTab] = useState<MobileTab>('home');

  const renderScreen = () => {
    switch (tab) {
      case 'home':
        return <HomeScreen />;
      case 'explore':
        return <ExploreScreen />;
      case 'communities':
        return <CommunitiesScreen />;
      case 'messages':
        return <MessagesScreen />;
      case 'spotpay':
        return <SpotPayScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={TOKENS.canvas} />
      <Header onWalletPress={() => setTab('spotpay')} />
      <View style={styles.content}>{renderScreen()}</View>
      <BottomNav
        currentTab={tab}
        onSelectTab={setTab}
        onCreatePress={() => setTab('home')}
      />
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
