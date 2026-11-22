import 'react-native-url-polyfill/auto';
import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, TurboModuleRegistry } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import colors from '@/constants/colors';
import { LaunchSplash } from '@/components/LaunchSplash';
import { ShareCardHost } from '@/components/ShareCardHost';

const AndroidSystemBars =
  Platform.OS === 'android' && TurboModuleRegistry.get('RNEdgeToEdge')
    ? require('react-native-edge-to-edge').SystemBars
    : null;

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.ink }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          {AndroidSystemBars ? <AndroidSystemBars style="light" /> : <StatusBar style="light" />}
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.ink },
              animation: 'fade',
            }}>
            <Stack.Screen name="(tabs)" />
            {/* The card's poster flies into the hero: a native shared element transition */}
            <Stack.Screen name="title/[id]" options={{ animation: 'fade' }} />
            <Stack.Screen name="all" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="updates" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="person/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen
              name="shorts"
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_bottom',
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
