import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { Pressable } from '@/components/ui/Pressable';

interface SectionHeaderProps {
  title: string;
  action?: string;
  /** Plain grey text on the right, for a count */
  note?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action = 'See all', note, onAction }: SectionHeaderProps) {
  return (
    <View className="flex-row items-end justify-between px-gutter pb-3 pt-7">
      <Text className="text-section text-white font-extrabold">{title}</Text>
      {onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} scale={0.94}>
          <Text className="text-[13px] text-t3 font-medium">{action}</Text>
        </Pressable>
      ) : note ? (
        <Text className="text-[13px] text-t3">{note}</Text>
      ) : null}
    </View>
  );
}
