import React, { useEffect, useState } from 'react';
import { View, Text, StatusBar, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';
import { WebSocketProvider } from '../services/websocketService';
import ErrorBoundary from '../components/ErrorBoundary';
import bugService from '../services/bugService';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    bugService.init();
    setTimeout(() => setReady(true), 600);
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <Feather name="zap" size={48} color={COLORS.accent} />
        <Text style={styles.logo}>REYYY AI</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <WebSocketProvider>
          <ErrorBoundary>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            <Slot />
          </ErrorBoundary>
        </WebSocketProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.accent,
    marginTop: 12,
    letterSpacing: 6,
  },
});