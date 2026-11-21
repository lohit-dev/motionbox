import { Text, View } from 'react-native';

/** "motion." wordmark with the white full stop. */
export function Wordmark({ size = 30 }: { size?: number }) {
  return (
    <View className="flex-row items-baseline">
      <Text className="font-extrabold tracking-tighter text-white" style={{ fontSize: size }}>
        motion
      </Text>
      <Text className="font-extrabold text-white" style={{ fontSize: size }}>
        .
      </Text>
    </View>
  );
}
