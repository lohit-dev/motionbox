import { Text, View } from 'react-native';

import colors from '@/constants/colors';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Pressable } from '@/components/ui/Pressable';
import { Sheet } from '@/components/Sheet';

export interface ActionRow {
  label: string;
  icon?: IconName;
  destructive?: boolean;
  onPress: () => void;
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  rows: ActionRow[];
  onClose: () => void;
}

/** Short list of actions in a bottom sheet. Closes itself after a row is chosen. */
export function ActionSheet({ visible, title, rows, onClose }: ActionSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title} height={96 + rows.length * 60}>
      <View className="px-gutter">
        {rows.map((r) => (
          <Pressable
            key={r.label}
            accessibilityRole="button"
            scale={0.98}
            onPress={() => {
              onClose();
              r.onPress();
            }}
            className="h-[60px] flex-row items-center gap-3.5">
            {r.icon ? (
              <Icon name={r.icon} size={20} color={r.destructive ? colors.danger : colors.white} />
            ) : null}
            <Text
              className={`text-base font-semibold ${r.destructive ? 'text-danger' : 'text-white'}`}>
              {r.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}
