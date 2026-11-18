import { Text, View } from 'react-native';

import { Pressable } from '@/components/ui/Pressable';

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action = 'See all', onAction }: SectionHeaderProps) {
  return (
    <View className="flex-row items-end justify-between px-gutter pb-3 pt-7">
      <Text className="text-section font-extrabold text-white">{title}</Text>
      {onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} scale={0.94}>
          <Text className="text-[13px] font-medium text-t3">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
