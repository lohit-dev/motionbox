import { View } from 'react-native';
import { Text } from '@/components/ui/Text';

/** "motion." wordmark with the white full stop. */
export function Wordmark({ size = 30 }: { size?: number }) {
  return (
    <View className="flex-row items-baseline">
      <Text className="tracking-tighter text-white font-extrabold" style={{ fontSize: size }}>
        motion
      </Text>
      <Text className="text-white font-extrabold" style={{ fontSize: size }}>
        .
      </Text>
    </View>
  );
}
