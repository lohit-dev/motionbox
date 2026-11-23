import 'react-native-url-polyfill/auto';
import '../global.css';

import * as ScreenOrientation from 'expo-screen-orientation';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SystemBars } from 'react-native-edge-to-edge';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import colors from '@/constants/colors';
import { LaunchSplash } from '@/components/LaunchSplash';
import { ShareCardHost } from '@/components/ShareCardHost';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function Layout() {
  // The app is portrait; only the player's fullscreen turns it sideways
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.ink }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          {Platform.OS === 'android' ? <SystemBars style="light" /> : <StatusBar style="light" />}
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.ink },
              animation: 'fade',
            }}>
            <Stack.Screen name="(tabs)" />
            {/* The card's poster flies into the hero: a native shared element transition */}
            <Stack.Screen
              name="title/[id]"
              options={{
                animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'fade',
                animationDuration: Platform.OS === 'android' ? 240 : undefined,
                presentation: 'card',
              }}
            />
            <Stack.Screen name="all" options={{ animation: 'slide_from_right', animationDuration: 260 }} />
            <Stack.Screen name="updates" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="person/[id]" options={{ animation: 'slide_from_right', animationDuration: 260 }} />
            <Stack.Screen
              name="shorts"
              options={{
                presentation: 'fullScreenModal',
                animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'slide_from_bottom',
                animationDuration: Platform.OS === 'android' ? 240 : undefined,
                contentStyle: { backgroundColor: '#000' },
              }}
            />
            <Stack.Screen
              name="player/[key]"
              options={{
                presentation: 'fullScreenModal',
                animation: 'fade',
                contentStyle: { backgroundColor: '#000' },
              }}
            />
          </Stack>
          <ShareCardHost />
          <LaunchSplash />
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
