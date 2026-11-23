import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';

interface ScreenHeaderProps {
  title: string;
  /** Right-hand control, for example the All / My list segmented control */
  right?: ReactNode;
}

/** Large screen title that respects the top safe area. */
export function ScreenHeader({ title, right }: ScreenHeaderProps) {
  const { top } = useSafeAreaInsets();
  return (
    <View
      className="flex-row items-center justify-between px-gutter pb-4"
      style={{ paddingTop: top + 12 }}>
      <Text className="text-title text-white font-extrabold">{title}</Text>
      {right}
    </View>
  );
}
