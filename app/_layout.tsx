import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, Platform, TurboModuleRegistry } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import colors from '@/constants/colors';
import { LaunchSplash } from '@/components/LaunchSplash';
import { FlightProvider } from '@/lib/flight';

const AndroidSystemBars =
  Platform.OS === 'android' && TurboModuleRegistry.get('RNEdgeToEdge')
    ? require('react-native-edge-to-edge').SystemBars
    : null;

export const unstable_settings = {
  initialRouteName: '(tabs)',
  anchor: '(tabs)',
};

// NativeWind v4 imports this deprecated component internally; keep that
// third-party warning from triggering the broken React Native dev toast.
LogBox.ignoreLogs(['ImageBackground is deprecated and will be removed in a future release.']);
LogBox.ignoreLogs(['`unstable_settings.initialRouteName` is deprecated. Use `unstable_settings.anchor` instead.']);

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.ink }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          {AndroidSystemBars ? <AndroidSystemBars style="light" /> : <StatusBar style="light" />}
          <FlightProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.ink },
                animation: 'fade',
              }}>
              <Stack.Screen name="(tabs)" />
              {/* Transparent and instant: the card's artwork flies in over Home instead of Home fading out first */}
              <Stack.Screen
                name="title/[id]"
                options={{
                  presentation: 'transparentModal',
                  animation: 'none',
                  contentStyle: { backgroundColor: 'transparent' },
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen name="updates" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="person/[id]" options={{ animation: 'slide_from_right' }} />
            </Stack>
          </FlightProvider>
          <LaunchSplash />
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
