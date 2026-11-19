import { Text } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import colors from '@/constants/colors';
import { Icon } from '@/components/ui/Icon';
import { Pressable } from '@/components/ui/Pressable';

/** Inline offline notice with a retry. Errors stay inline, never in a modal. */
export function OfflineBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(320)}
      exiting={FadeOutUp.duration(200)}
      style={{
        marginHorizontal: 20,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 18,
        backgroundColor: colors.s1,
      }}>
      <Icon name="wifiOff" size={20} color={colors.t2} />
      <Text className="flex-1 text-[14px] leading-5 text-t2">
        You are offline. Showing what was saved last time.
      </Text>
      <Pressable accessibilityRole="button" onPress={onRetry} scale={0.94}>
        <Text className="text-[14px] font-bold text-white">Retry</Text>
      </Pressable>
    </Animated.View>
  );
}
