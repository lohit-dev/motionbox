import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { Pill } from '@/components/ui/Pill';

interface EmptyStateProps {
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}

export function EmptyState({ title, body, action, onAction }: EmptyStateProps) {
  return (
    <View className="mt-16 items-center px-10">
      <Text className="text-center text-xl text-white font-bold">{title}</Text>
      <Text className="mt-2 text-center text-[14.5px] leading-5 text-t2">{body}</Text>
      {action ? (
        <View className="mt-6">
          <Pill title={action} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
